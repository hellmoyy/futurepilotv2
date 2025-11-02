import mongoose, { Schema, Document, Model } from 'mongoose';

// Transaction Interface
export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'commission' | 'referral_bonus' | 'trading_profit' | 'trading_loss';
  network: 'ERC20' | 'BEP20';
  txHash: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Schema
const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'futurepilotcol',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'commission', 'referral_bonus', 'trading_profit', 'trading_loss'],
      default: 'deposit',
    },
    network: {
      type: String,
      enum: ['ERC20', 'BEP20'],
      required: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    blockNumber: {
      type: Number,
    },
    walletAddress: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);