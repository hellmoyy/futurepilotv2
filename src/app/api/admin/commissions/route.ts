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

// Commission Schema (inline for now)
const commissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['referral', 'trading', 'bonus', 'other'],
    default: 'referral' 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'paid', 'rejected'], 
    default: 'pending' 
  },
  description: { type: String },
  sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String },
  walletAddress: { type: String },
  txHash: { type: String },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: String },
  notes: { type: String },
}, { timestamps: true });

const Commission = mongoose.models.Commission || mongoose.model('Commission', commissionSchema);

// GET - Fetch all commissions
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

    // Fetch commissions with user details
    const commissions = await Commission.find()
      .populate('userId', 'name email')
      .populate('sourceUserId', 'name email')
      .sort({ requestedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      commissions,
      total: commissions.length,
    });
  } catch (error: any) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch commissions', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new commission (for testing purposes)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, type, amount, description, sourceUserId } = body;

    // Validate required fields
    if (!userId || !amount) {
      return NextResponse.json(
        { success: false, message: 'userId and amount are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Create commission
    const commission = await Commission.create({
      userId,
      type: type || 'referral',
      amount,
      description,
      sourceUserId,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: 'Commission created successfully',
      commission,
    });
  } catch (error: any) {
    console.error('Error creating commission:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create commission', error: error.message },
      { status: 500 }
    );
  }
}
