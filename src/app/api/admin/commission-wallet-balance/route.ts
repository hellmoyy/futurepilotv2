/**
 * Commission Wallet Balance API
 * Fetches ETH and USDT balance for the commission wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getCommissionWalletBalance, getCommissionWalletEthBalance } from '@/lib/blockchain/commissionWallet';

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

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch commission wallet balances (ETH and USDT)
    const [usdtData, ethData] = await Promise.all([
      getCommissionWalletBalance(),
      getCommissionWalletEthBalance(),
    ]);

    return NextResponse.json({
      success: true,
      address: usdtData.address,
      network: usdtData.network,
      ethBalance: ethData.balance.toFixed(6), // ETH balance (for gas)
      usdtBalance: usdtData.balance.toFixed(2), // USDT balance
      rawEthBalance: ethData.balanceWei.toString(),
      rawUsdtBalance: usdtData.balanceWei.toString(),
    });

  } catch (error: any) {
    console.error('Error fetching commission wallet balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch commission wallet balance' 
      },
      { status: 500 }
    );
  }
}
