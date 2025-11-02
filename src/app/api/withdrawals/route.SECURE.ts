import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Withdrawal } from '@/models/Withdrawal';
import { User } from '@/models/User';
import { notificationManager } from '@/lib/notifications/NotificationManager';
import mongoose from 'mongoose';

/**
 * SECURE WITHDRAWAL API (with Race Condition Protection)
 * 
 * Security Features:
 * 1. MongoDB Transactions (ACID guarantees)
 * 2. Atomic balance deduction ($inc operation)
 * 3. Optimistic concurrency control
 * 4. Duplicate request detection
 * 5. Reserved balance calculation
 * 
 * This implementation prevents:
 * - Race condition attacks
 * - Double withdrawal
 * - Negative balances
 * - Data inconsistency
 */

// GET - Get user's withdrawal history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = { userId: new mongoose.Types.ObjectId(session.user.id) };
    if (status) query.status = status;

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Calculate statistics
    const statistics = {
      total: withdrawals.length,
      pending: withdrawals.filter(w => w.status === 'pending').length,
      processing: withdrawals.filter(w => w.status === 'processing').length,
      completed: withdrawals.filter(w => w.status === 'completed').length,
      rejected: withdrawals.filter(w => w.status === 'rejected').length,
      totalWithdrawn: withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0),
      totalPending: withdrawals
        .filter(w => w.status === 'pending' || w.status === 'processing')
        .reduce((sum, w) => sum + w.amount, 0),
    };

    return NextResponse.json({
      success: true,
      withdrawals,
      statistics,
    });
  } catch (error: any) {
    console.error('Get Withdrawals Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new withdrawal request (SECURE VERSION)
export async function POST(request: NextRequest) {
  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { amount, walletAddress, network, type = 'referral' } = body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VALIDATION PHASE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Validate required fields
    if (!amount || !walletAddress || !network) {
      return NextResponse.json(
        { error: 'Amount, wallet address, and network are required' },
        { status: 400 }
      );
    }

    // Validate minimum amount
    const MIN_WITHDRAWAL = 10;
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}` },
        { status: 400 }
      );
    }

    // Validate network
    if (!['ERC20', 'BEP20'].includes(network)) {
      return NextResponse.json(
        { error: 'Invalid network. Must be ERC20 or BEP20' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!walletRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate amount is positive and reasonable
    if (amount <= 0 || amount > 1000000) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TRANSACTION PHASE (ATOMIC OPERATIONS)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await session.startTransaction();

    // Step 1: Check for duplicate recent requests (within last 60 seconds)
    const duplicateCheck = await Withdrawal.findOne({
      userId: new mongoose.Types.ObjectId(authSession.user.id),
      amount,
      walletAddress,
      status: { $in: ['pending', 'processing'] },
      createdAt: { $gte: new Date(Date.now() - 60000) },
    }).session(session);

    if (duplicateCheck) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Duplicate withdrawal request detected. Please wait before retrying.' },
        { status: 429 } // Too Many Requests
      );
    }

    // Step 2: Calculate reserved balance (pending + processing withdrawals)
    const reservedAmountResult = await Withdrawal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(authSession.user.id),
          status: { $in: ['pending', 'processing'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).session(session);

    const reservedAmount = reservedAmountResult[0]?.total || 0;

    // Step 3: ATOMIC BALANCE CHECK AND DEDUCTION
    // This operation is atomic at MongoDB level (prevents race condition)
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(authSession.user.id),
        totalEarnings: { $gte: amount }, // Ensure sufficient balance
      },
      {
        $inc: { totalEarnings: -amount }, // Atomic decrement
      },
      {
        new: true, // Return updated document
        session, // Use transaction session
      }
    );

    // If user not found or insufficient balance
    if (!updatedUser) {
      await session.abortTransaction();
      
      // Check if user exists to provide better error message
      const user = await User.findById(authSession.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const availableBalance = (user.totalEarnings || 0) - reservedAmount;
      
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          details: {
            totalBalance: user.totalEarnings || 0,
            reservedAmount: reservedAmount,
            availableBalance: availableBalance,
            requestedAmount: amount,
            shortfall: amount - availableBalance,
          },
        },
        { status: 400 }
      );
    }

    // Step 4: Create withdrawal record (within same transaction)
    const [withdrawal] = await Withdrawal.create(
      [
        {
          userId: updatedUser._id,
          amount,
          walletAddress,
          network,
          type,
          status: 'pending',
          requestedAt: new Date(),
        },
      ],
      { session } // Important: Create within transaction
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // COMMIT TRANSACTION (All or Nothing)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await session.commitTransaction();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // POST-TRANSACTION ACTIONS (Non-critical)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Send notifications (don't fail if this errors)
    try {
      await notificationManager.send({
        userId: (updatedUser._id as any).toString(),
        type: 'withdrawal_requested',
        priority: 'info',
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of $${amount.toFixed(2)} to ${network} has been submitted and is pending admin approval.`,
        channels: ['database', 'email'],
        actionUrl: '/referral?tab=withdraw',
        metadata: {
          withdrawalId: (withdrawal._id as any).toString(),
          amount,
          network,
          walletAddress: walletAddress.substring(0, 6) + '...' + walletAddress.substring(38),
          remainingBalance: updatedUser.totalEarnings,
        },
      });

      console.log(
        `[Withdrawal] ✅ New request from ${updatedUser.email}: $${amount} (${network}), ` +
        `Balance: $${updatedUser.totalEarnings + amount} → $${updatedUser.totalEarnings}`
      );
    } catch (notifError) {
      console.error('Error sending withdrawal notification:', notifError);
      // Don't fail the withdrawal if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Withdrawal request submitted successfully',
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          network: withdrawal.network,
          requestedAt: withdrawal.requestedAt,
        },
        newBalance: updatedUser.totalEarnings,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Rollback transaction on any error
    await session.abortTransaction();
    
    console.error('Create Withdrawal Error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      if (error.code === 11000) {
        return NextResponse.json(
          { error: 'Duplicate withdrawal request' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process withdrawal request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    // Always end session
    session.endSession();
  }
}
