import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import mongoose from 'mongoose';

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

// GET - Fetch all referrals and top referrers
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

    // Fetch all users who have a referredBy field (they were referred)
    const referredUsers = await User.find({ referredBy: { $exists: true, $ne: null } })
      .select('name email membershipLevel totalEarnings createdAt referredBy')
      .lean();
    
    // Manually fetch referrer info to avoid populate error
    const referrerIds = referredUsers.map((u: any) => u.referredBy).filter(Boolean);
    const referrers = await User.find({ _id: { $in: referrerIds } })
      .select('name email referralCode')
      .lean();
    
    // Create referrer map for quick lookup
    const referrerMapLookup = new Map(
      referrers.map((r: any) => [r._id.toString(), r])
    );

    // Build referrals array
    const referrals = referredUsers.map((user: any) => {
      const referrerInfo = referrerMapLookup.get(user.referredBy?.toString()) || {};
      return {
        _id: new mongoose.Types.ObjectId().toString(),
        referrer: referrerInfo,
        referred: {
          _id: user._id,
          name: user.name,
          email: user.email,
          membershipLevel: user.membershipLevel,
          createdAt: user.createdAt,
        },
        totalEarnings: user.totalEarnings || 0,
        commissionsPaid: user.totalEarnings ? user.totalEarnings * 0.1 : 0, // 10% commission example
        status: user.totalEarnings > 0 ? 'active' : 'inactive',
        createdAt: user.createdAt,
      };
    });

    // Calculate top referrers
    const referrerMap = new Map();
    
    referredUsers.forEach((user: any) => {
      if (user.referredBy && user.referredBy._id) {
        const referrerId = user.referredBy._id.toString();
        
        if (!referrerMap.has(referrerId)) {
          referrerMap.set(referrerId, {
            userId: referrerId,
            userName: user.referredBy.name,
            userEmail: user.referredBy.email,
            totalReferrals: 0,
            activeReferrals: 0,
            totalEarnings: 0,
          });
        }
        
        const stats = referrerMap.get(referrerId);
        stats.totalReferrals++;
        
        if (user.totalEarnings > 0) {
          stats.activeReferrals++;
          stats.totalEarnings += user.totalEarnings * 0.1; // 10% commission
        }
      }
    });

    // Convert to array and calculate averages
    const topReferrers = Array.from(referrerMap.values())
      .map(stats => ({
        ...stats,
        averagePerReferral: stats.totalReferrals > 0 ? stats.totalEarnings / stats.totalReferrals : 0,
      }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10); // Top 10

    return NextResponse.json({
      success: true,
      referrals,
      topReferrers,
      total: referrals.length,
    });
  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch referrals', error: error.message },
      { status: 500 }
    );
  }
}
