import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { Withdrawal } from '@/models/Withdrawal';

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

// PUT - Process withdrawal (approve/reject/complete)
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

    // Map frontend action to withdrawal status
    const actionMapping: { [key: string]: string } = {
      'approve': 'processing',
      'reject': 'rejected',
      'pay': 'completed',
    };

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

    // Find withdrawal
    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    // Check status transitions
    if (action === 'approve' && withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only pending withdrawals can be approved' },
        { status: 400 }
      );
    }

    if (action === 'pay' && withdrawal.status !== 'processing') {
      return NextResponse.json(
        { success: false, message: 'Only processing withdrawals can be marked as completed' },
        { status: 400 }
      );
    }

    // Update withdrawal
    withdrawal.status = actionMapping[action] as any;
    
    if (action === 'pay') {
      withdrawal.transactionHash = txHash;
      withdrawal.completedAt = new Date();
    }

    if (action === 'reject') {
      withdrawal.rejectionReason = notes || 'Rejected by admin';
    }

    withdrawal.processedAt = new Date();
    
    if (notes) {
      withdrawal.notes = notes;
    }

    await withdrawal.save();

    // Transform response to match Commission interface
    const commission = {
      _id: withdrawal._id.toString(),
      status: withdrawal.status === 'completed' ? 'paid' : withdrawal.status === 'processing' ? 'approved' : withdrawal.status,
      processedAt: withdrawal.processedAt,
      txHash: withdrawal.transactionHash,
    };

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${action}ed successfully`,
      commission,
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
