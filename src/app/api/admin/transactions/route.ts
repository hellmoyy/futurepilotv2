import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
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

// Transaction Schema (inline for now)
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'commission', 'referral_bonus', 'trading_profit', 'trading_loss'],
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  description: { type: String },
  txHash: { type: String },
  network: { type: String },
  walletAddress: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

// GET - Fetch all transactions
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

    // Fetch transactions without populate to avoid schema error
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(1000) // Limit to last 1000 transactions
      .lean();
    
    // Manually fetch user info for all transactions
    const userIds = transactions.map((t: any) => t.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email')
      .lean();
    
    // Create user map for quick lookup
    const userMap = new Map(
      users.map((u: any) => [u._id.toString(), { name: u.name, email: u.email }])
    );
    
    // Attach user info to transactions
    const transactionsWithUsers = transactions.map((tx: any) => ({
      ...tx,
      userId: tx.userId ? {
        _id: tx.userId,
        ...userMap.get(tx.userId.toString())
      } : null
    }));

    return NextResponse.json({
      success: true,
      transactions: transactionsWithUsers,
      total: transactionsWithUsers.length,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transactions', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new transaction (for testing purposes)
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
    const { userId, type, amount, status, description, txHash, network, walletAddress } = body;

    // Validate required fields
    if (!userId || !type || amount === undefined) {
      return NextResponse.json(
        { success: false, message: 'userId, type, and amount are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      type,
      amount,
      status: status || 'completed',
      description,
      txHash,
      network,
      walletAddress,
    });

    return NextResponse.json({
      success: true,
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create transaction', error: error.message },
      { status: 500 }
    );
  }
}
