import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has wallet data
    if (!user.walletData?.erc20Address) {
      return NextResponse.json(
        { error: 'Wallet not found. Please generate a wallet first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      erc20Address: user.walletData.erc20Address,
      bep20Address: user.walletData.bep20Address,
      balance: user.walletData.balance || 0
    });

  } catch (error) {
    console.error('❌ Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}