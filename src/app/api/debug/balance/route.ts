import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const networkMode = process.env.NETWORK_MODE || 'testnet';
    
    // Get all users
    const allUsers = await User.find({}).lean();
    
    const usersWithBalance = allUsers.filter((u: any) => 
      (u.walletData?.balance && u.walletData.balance > 0) ||
      (u.walletData?.mainnetBalance && u.walletData.mainnetBalance > 0)
    ).map((u: any) => ({
      email: u.email,
      walletBalance: u.walletData?.balance || 0,
      mainnetBalance: u.walletData?.mainnetBalance || 0
    }));
    
    // Test aggregation
    const balanceAggregate = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { 
            $sum: networkMode === 'mainnet' ? '$walletData.mainnetBalance' : '$walletData.balance'
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    return NextResponse.json({
      networkMode,
      totalUsers: allUsers.length,
      usersWithBalance,
      aggregationResult: balanceAggregate,
      totalFromAggregation: balanceAggregate.length > 0 ? balanceAggregate[0].totalBalance : 0
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
