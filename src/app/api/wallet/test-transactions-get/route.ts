import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

export async function GET(req: NextRequest) {
  // 🔒 PRODUCTION PROTECTION: Disable test endpoints in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: 'Test endpoints are disabled in production',
      message: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }

  try {
    await connectDB();

    // Get test user
    const testUser = await User.findOne({ email: 'test@futurepilot.pro' });
    
    if (!testUser) {
      return NextResponse.json({
        success: false,
        error: 'Test user not found'
      });
    }

    // Get transactions for test user (mimics the real transactions endpoint)
    const transactions = await Transaction.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      network: tx.network,
      txHash: tx.txHash,
      amount: tx.amount,
      status: tx.status,
      createdAt: tx.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      message: 'Test transactions retrieved successfully',
      data: {
        user: {
          email: testUser.email,
          balance: testUser.walletData?.balance || 0
        },
        transactions: formattedTransactions,
        summary: {
          total: transactions.length,
          confirmed: transactions.filter(tx => tx.status === 'confirmed').length,
          pending: transactions.filter(tx => tx.status === 'pending').length,
          failed: transactions.filter(tx => tx.status === 'failed').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching test transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch test transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}