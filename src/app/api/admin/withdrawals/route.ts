import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
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

// Withdrawal Schema (inline for now)
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  walletAddress: { type: String, required: true },
  network: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  txHash: { type: String },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: String },
  notes: { type: String },
}, { timestamps: true });

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

// GET - Fetch all withdrawals
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

    // Fetch withdrawals with user details
    const withdrawals = await Withdrawal.find()
      .populate('userId', 'name email')
      .sort({ requestedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      withdrawals,
      total: withdrawals.length,
    });
  } catch (error: any) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch withdrawals', error: error.message },
      { status: 500 }
    );
  }
}
