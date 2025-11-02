import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { notificationManager } from '@/lib/notifications/NotificationManager';
import mongoose from 'mongoose';

// Verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { email: string; role: string };
    
    if (decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

// Withdrawal Schema (inline for now)
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  walletAddress: { type: String, required: true },
  network: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  txHash: { type: String },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: String },
  notes: { type: String },
}, { timestamps: true });

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

// PUT - Process withdrawal (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, txHash, notes } = body;

    // Validate action
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Validate txHash for approval
    if (action === 'approve' && !txHash) {
      return NextResponse.json(
        { success: false, message: 'Transaction hash is required for approval' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find withdrawal
    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `Withdrawal is already ${withdrawal.status}` },
        { status: 400 }
      );
    }

    // Update withdrawal
    withdrawal.status = action === 'approve' ? 'approved' : 'rejected';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = admin.email;
    
    if (action === 'approve') {
      withdrawal.txHash = txHash;
    }
    
    if (notes) {
      withdrawal.notes = notes;
    }

    await withdrawal.save();

    // Send notifications
    try {
      if (action === 'approve') {
        await notificationManager.notifyWithdrawalApproved(
          withdrawal.userId.toString(),
          withdrawal.amount,
          withdrawal.network,
          withdrawal.walletAddress,
          txHash
        );
      } else {
        await notificationManager.notifyWithdrawalRejected(
          withdrawal.userId.toString(),
          withdrawal.amount,
          withdrawal.network,
          notes || 'No reason provided'
        );
      }
    } catch (notifError) {
      console.error('Error sending withdrawal notification:', notifError);
      // Don't fail the withdrawal process if notification fails
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${action}d successfully`,
      withdrawal: {
        _id: withdrawal._id,
        status: withdrawal.status,
        processedAt: withdrawal.processedAt,
        processedBy: withdrawal.processedBy,
      },
    });
  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process withdrawal', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete withdrawal (optional, for testing)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Connect to database
    await connectDB();

    // Delete withdrawal
    const deletedWithdrawal = await Withdrawal.findByIdAndDelete(id);

    if (!deletedWithdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting withdrawal:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete withdrawal', error: error.message },
      { status: 500 }
    );
  }
}
