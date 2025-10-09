import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get test user wallet data
    const testUser = await User.findOne({ email: 'test@futurepilot.pro' });
    
    if (!testUser || !testUser.walletData) {
      return NextResponse.json({
        success: false,
        error: 'Test user not found or no wallet. Please generate wallet first via /api/wallet/test-generate',
        redirectUrl: '/api/wallet/test-generate'
      });
    }

    // Return data in same format as main /api/wallet/get
    return NextResponse.json({
      success: true,
      erc20Address: testUser.walletData.erc20Address,
      bep20Address: testUser.walletData.bep20Address,
      balance: testUser.walletData.balance || 0
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