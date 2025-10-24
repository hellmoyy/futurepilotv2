import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
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

// Commission Schema (inline for now)
const commissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['referral', 'trading', 'bonus', 'other'],
    default: 'referral' 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'paid', 'rejected'], 
    default: 'pending' 
  },
  description: { type: String },
  sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String },
  walletAddress: { type: String },
  txHash: { type: String },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: String },
  notes: { type: String },
}, { timestamps: true });

const Commission = mongoose.models.Commission || mongoose.model('Commission', commissionSchema);

// PUT - Process commission (approve/reject/pay)
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
    if (!action || !['approve', 'reject', 'pay'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "approve", "reject", or "pay"' },
        { status: 400 }
      );
    }

    // Validate txHash for payment
    if (action === 'pay' && !txHash) {
      return NextResponse.json(
        { success: false, message: 'Transaction hash is required for payment' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find commission
    const commission = await Commission.findById(id);
    if (!commission) {
      return NextResponse.json(
        { success: false, message: 'Commission not found' },
        { status: 404 }
      );
    }

    // Check status transitions
    if (action === 'approve' && commission.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only pending commissions can be approved' },
        { status: 400 }
      );
    }

    if (action === 'pay' && commission.status !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Only approved commissions can be marked as paid' },
        { status: 400 }
      );
    }

    // Update commission
    if (action === 'approve') {
      commission.status = 'approved';
    } else if (action === 'reject') {
      commission.status = 'rejected';
    } else if (action === 'pay') {
      commission.status = 'paid';
      commission.txHash = txHash;
    }

    commission.processedAt = new Date();
    commission.processedBy = admin.email;
    
    if (notes) {
      commission.notes = notes;
    }

    await commission.save();

    return NextResponse.json({
      success: true,
      message: `Commission ${action}ed successfully`,
      commission: {
        _id: commission._id,
        status: commission.status,
        processedAt: commission.processedAt,
        processedBy: commission.processedBy,
      },
    });
  } catch (error: any) {
    console.error('Error processing commission:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process commission', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete commission (optional, for testing)
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

    // Delete commission
    const deletedCommission = await Commission.findByIdAndDelete(id);

    if (!deletedCommission) {
      return NextResponse.json(
        { success: false, message: 'Commission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Commission deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting commission:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete commission', error: error.message },
      { status: 500 }
    );
  }
}
