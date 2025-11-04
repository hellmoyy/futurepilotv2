import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { Withdrawal } from '@/models/Withdrawal';
import { User } from '@/models/User';

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

// GET - Fetch all withdrawal requests (referral commissions)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Use aggregation to join with users collection (avoids populate issues)
    const withdrawals = await Withdrawal.aggregate([
      { $match: { type: 'referral' } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'futurepilotcols', // User collection name
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    // Transform to match Commission interface expected by frontend
    const commissions = withdrawals.map((w: any) => ({
      _id: w._id.toString(),
      userId: {
        _id: w.user._id.toString(),
        name: w.user.name,
        email: w.user.email,
      },
      type: 'referral',
      amount: w.amount,
      status: w.status === 'completed' ? 'paid' : w.status === 'processing' ? 'approved' : w.status,
      description: `Withdrawal to ${w.network} - ${w.walletAddress}`,
      paymentMethod: w.network,
      walletAddress: w.walletAddress,
      txHash: w.transactionHash,
      requestedAt: w.requestedAt || w.createdAt,
      processedAt: w.processedAt,
      processedBy: w.notes,
      notes: w.notes,
    }));

    return NextResponse.json({
      success: true,
      commissions,
      total: commissions.length,
    });
  } catch (error: any) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch withdrawals', error: error.message },
      { status: 500 }
    );
  }
}