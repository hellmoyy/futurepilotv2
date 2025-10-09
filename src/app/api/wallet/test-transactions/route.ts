import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Find test user
    const testUser = await User.findOne({ email: 'test@futurepilot.pro' });
    
    if (!testUser) {
      return NextResponse.json({
        success: false,
        error: 'Test user not found. Please create test user first.'
      });
    }

    // Create sample transactions for testing
    const sampleTransactions = [
      {
        userId: testUser._id,
        network: 'ERC20' as const,
        txHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
        amount: 100.50,
        status: 'confirmed' as const,
        blockNumber: 18500000,
        walletAddress: testUser.walletData?.erc20Address || '',
        createdAt: new Date(Date.now() - 86400000 * 3) // 3 days ago
      },
      {
        userId: testUser._id,
        network: 'BEP20' as const,
        txHash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        amount: 250.75,
        status: 'confirmed' as const,
        blockNumber: 32500000,
        walletAddress: testUser.walletData?.bep20Address || '',
        createdAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
      },
      {
        userId: testUser._id,
        network: 'ERC20' as const,
        txHash: '0x9876543210987654321098765432109876543210987654321098765432109876',
        amount: 50.25,
        status: 'pending' as const,
        blockNumber: 18500100,
        walletAddress: testUser.walletData?.erc20Address || '',
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        userId: testUser._id,
        network: 'BEP20' as const,
        txHash: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedcbafedcbafedcbafedcbafedcba',
        amount: 75.00,
        status: 'confirmed' as const,
        blockNumber: 32500200,
        walletAddress: testUser.walletData?.bep20Address || '',
        createdAt: new Date(Date.now() - 3600000 * 12) // 12 hours ago
      },
      {
        userId: testUser._id,
        network: 'ERC20' as const,
        txHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
        amount: 300.00,
        status: 'failed' as const,
        blockNumber: 18500150,
        walletAddress: testUser.walletData?.erc20Address || '',
        createdAt: new Date(Date.now() - 3600000 * 6) // 6 hours ago
      }
    ];

    // Clear existing test transactions first
    await Transaction.deleteMany({ userId: testUser._id });

    // Insert sample transactions
    const insertedTransactions = await Transaction.insertMany(sampleTransactions);

    // Update user balance based on confirmed transactions
    const confirmedAmount = sampleTransactions
      .filter(tx => tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    await User.findByIdAndUpdate(testUser._id, {
      'walletData.balance': confirmedAmount
    });

    return NextResponse.json({
      success: true,
      message: 'Sample transactions created successfully',
      data: {
        transactionsCreated: insertedTransactions.length,
        totalConfirmedAmount: confirmedAmount,
        updatedBalance: confirmedAmount,
        transactions: insertedTransactions.map(tx => ({
          id: tx._id,
          network: tx.network,
          txHash: tx.txHash.substring(0, 10) + '...' + tx.txHash.substring(tx.txHash.length - 8),
          amount: tx.amount,
          status: tx.status,
          createdAt: tx.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error creating sample transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create sample transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}