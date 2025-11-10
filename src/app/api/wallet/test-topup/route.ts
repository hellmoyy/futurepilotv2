import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

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
      mainnetBalance: testUser.walletData.mainnetBalance || 0
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