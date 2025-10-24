import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

// GET - Get user's withdrawal wallet addresses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('withdrawalWallets');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      wallets: user.withdrawalWallets || {},
    });
  } catch (error: any) {
    console.error('Get Withdrawal Wallets Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Save or update withdrawal wallet addresses
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { erc20, bep20 } = body;

    // Validate at least one wallet address is provided
    if (!erc20 && !bep20) {
      return NextResponse.json(
        { error: 'At least one wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet address formats
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    
    if (erc20 && !walletRegex.test(erc20)) {
      return NextResponse.json(
        { error: 'Invalid ERC20 wallet address format' },
        { status: 400 }
      );
    }

    if (bep20 && !walletRegex.test(bep20)) {
      return NextResponse.json(
        { error: 'Invalid BEP20 wallet address format' },
        { status: 400 }
      );
    }

    // Update user's withdrawal wallets
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize withdrawalWallets if it doesn't exist
    if (!user.withdrawalWallets) {
      user.withdrawalWallets = {};
    }

    // Update wallet addresses
    if (erc20) user.withdrawalWallets.erc20 = erc20;
    if (bep20) user.withdrawalWallets.bep20 = bep20;
    user.withdrawalWallets.addedAt = new Date();
    user.withdrawalWallets.verified = false; // Reset verification on change

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Withdrawal wallet addresses updated successfully',
      wallets: user.withdrawalWallets,
    });
  } catch (error: any) {
    console.error('Update Withdrawal Wallets Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
