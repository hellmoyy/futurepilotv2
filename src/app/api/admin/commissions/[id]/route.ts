import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { Withdrawal } from '@/models/Withdrawal';
import { processAutoWithdrawal } from '@/lib/withdrawal/autoWithdrawal';

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

    // Validate action
    if (!action || !['approve', 'reject', 'pay'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "approve", "reject", or "pay"' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // APPROVE ACTION - AUTO WITHDRAWAL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (action === 'approve') {
      console.log(`🚀 Starting auto-withdrawal for withdrawal ID: ${id}`);
      
      const result = await processAutoWithdrawal(id, admin.email);
      
      if (!result.success) {
        return NextResponse.json({
          success: false,
          message: result.message,
          error: result.error,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Withdrawal processed successfully and funds sent to user',
        txHash: result.txHash,
        commission: {
          _id: result.withdrawal._id.toString(),
          status: 'paid',
          processedAt: result.withdrawal.processedAt,
          txHash: result.txHash,
        },
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // REJECT ACTION - MANUAL REJECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (action === 'reject') {
      const withdrawal = await Withdrawal.findById(id);
      
      if (!withdrawal) {
        return NextResponse.json(
          { success: false, message: 'Withdrawal not found' },
          { status: 404 }
        );
      }

      if (withdrawal.status !== 'pending') {
        return NextResponse.json(
          { success: false, message: 'Only pending withdrawals can be rejected' },
          { status: 400 }
        );
      }

      withdrawal.status = 'rejected';
      withdrawal.rejectionReason = notes || 'Rejected by admin';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = admin.email;
      if (notes) withdrawal.notes = notes;
      
      await withdrawal.save();

      return NextResponse.json({
        success: true,
        message: 'Withdrawal rejected successfully',
        commission: {
          _id: withdrawal._id.toString(),
          status: 'rejected',
          processedAt: withdrawal.processedAt,
        },
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PAY ACTION - MANUAL PAYMENT CONFIRMATION
    // (Legacy support, not used in auto-withdrawal flow)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (action === 'pay') {
      // Validate txHash
      if (!txHash) {
        return NextResponse.json(
          { success: false, message: 'Transaction hash is required for payment' },
          { status: 400 }
        );
      }

      const withdrawal = await Withdrawal.findById(id);
      
      if (!withdrawal) {
        return NextResponse.json(
          { success: false, message: 'Withdrawal not found' },
          { status: 404 }
        );
      }

      if (withdrawal.status !== 'processing' && withdrawal.status !== 'pending') {
        return NextResponse.json(
          { success: false, message: 'Only pending or processing withdrawals can be marked as completed' },
          { status: 400 }
        );
      }

      withdrawal.status = 'completed';
      withdrawal.transactionHash = txHash;
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = admin.email;
      if (notes) withdrawal.notes = notes;
      
      await withdrawal.save();

      return NextResponse.json({
        success: true,
        message: 'Withdrawal marked as completed',
        commission: {
          _id: withdrawal._id.toString(),
          status: 'paid',
          processedAt: withdrawal.processedAt,
          txHash: withdrawal.transactionHash,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
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
