import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    // ✅ MAINNET ONLY - Fetch all users
    const users = await User.find({})
      .select('-password -verificationToken -binanceApiKey -binanceApiSecret -twoFactorSecret')
      .sort({ createdAt: -1 })
      .lean();

    console.log('Sample user from DB:', {
      email: users[0]?.email,
      isBanned: users[0]?.isBanned,
      bannedAt: users[0]?.bannedAt,
    }); // Debug log

    // ✅ MAINNET ONLY - Add mainnet balance field
    const usersWithBalance = users.map((user: any) => ({
      ...user,
      balance: user.walletData?.mainnetBalance || 0
    }));

    console.log('Sample user after mapping:', {
      email: usersWithBalance[0]?.email,
      isBanned: usersWithBalance[0]?.isBanned,
      bannedAt: usersWithBalance[0]?.bannedAt,
    }); // Debug log

    return NextResponse.json({
      success: true,
      users: usersWithBalance,
      total: usersWithBalance.length,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
