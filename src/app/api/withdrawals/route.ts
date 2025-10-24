import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Withdrawal } from '@/models/Withdrawal';
import { User } from '@/models/User';
import mongoose from 'mongoose';

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

    // Get statistics
    const stats = {
      total: withdrawals.length,
      pending: withdrawals.filter(w => w.status === 'pending').length,
      processing: withdrawals.filter(w => w.status === 'processing').length,
      completed: withdrawals.filter(w => w.status === 'completed').length,
      rejected: withdrawals.filter(w => w.status === 'rejected').length,
      totalWithdrawn: withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0),
    };

    return NextResponse.json({
      success: true,
      withdrawals,
      stats,
    });
  } catch (error: any) {
    console.error('Get Withdrawals Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new withdrawal request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { amount, walletAddress, network, type = 'referral' } = body;

    // Validation
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

    // Get user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has sufficient balance
    if ((user.totalEarnings || 0) < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Check for pending withdrawals
    const pendingWithdrawal = await Withdrawal.findOne({
      userId: user._id,
      status: { $in: ['pending', 'processing'] },
    });

    if (pendingWithdrawal) {
      return NextResponse.json(
        { error: 'You already have a pending withdrawal request' },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount,
      walletAddress,
      network,
      type,
      status: 'pending',
      requestedAt: new Date(),
    });

    // Deduct amount from user's balance (reserved for withdrawal)
    user.totalEarnings = (user.totalEarnings || 0) - amount;
    await user.save();

    // TODO: Send notification to admin
    // TODO: Send email confirmation to user

    return NextResponse.json(
      {
        success: true,
        message: 'Withdrawal request submitted successfully',
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          requestedAt: withdrawal.requestedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create Withdrawal Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
