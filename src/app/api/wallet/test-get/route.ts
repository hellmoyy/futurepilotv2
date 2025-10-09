import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get test user wallet data
    const testUser = await User.findOne({ email: 'test@futurepilot.pro' });
    
    if (!testUser) {
      return NextResponse.json({
        success: false,
        error: 'Test user not found. Please create test user first via /api/wallet/test-generate'
      });
    }

    // Test the actual wallet/get endpoint logic without session
    const walletData = testUser.walletData;
    
    if (!walletData) {
      return NextResponse.json({
        success: false,
        error: 'No wallet found for test user'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test user wallet data retrieved successfully',
      data: {
        userId: testUser._id,
        email: testUser.email,
        erc20Address: walletData.erc20Address,
        bep20Address: walletData.bep20Address,
        balance: walletData.balance,
        gasFeeBalance: testUser.gasFeeBalance,
        createdAt: walletData.createdAt,
        membershipLevel: testUser.membershipLevel,
        totalEarnings: testUser.totalEarnings
      }
    });

  } catch (error) {
    console.error('❌ Test wallet get error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get test wallet data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}