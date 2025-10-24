import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

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

    // Fetch all users
    const users = await User.find({})
      .select('-password -verificationToken -binanceApiKey -binanceApiSecret -twoFactorSecret')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      users: users,
      total: users.length,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
