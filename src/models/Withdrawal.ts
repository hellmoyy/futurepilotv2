import mongoose from 'mongoose';

export interface IWithdrawal extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  walletAddress: string;
  network: 'ERC20' | 'BEP20';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  transactionHash?: string;
  rejectionReason?: string;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  type: 'referral' | 'trading';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new mongoose.Schema<IWithdrawal>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [10, 'Minimum withdrawal amount is $10'],
    },
    walletAddress: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          // Validate Ethereum/BSC address format (0x followed by 40 hex characters)
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid wallet address format'
      }
    },
    network: {
      type: String,
      enum: ['ERC20', 'BEP20'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    transactionHash: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return /^0x[a-fA-F0-9]{64}$/.test(v);
        },
        message: 'Invalid transaction hash format'
      }
    },
    rejectionReason: String,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: Date,
    completedAt: Date,
    type: {
      type: String,
      enum: ['referral', 'trading'],
      default: 'referral',
      required: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for querying user withdrawals
withdrawalSchema.index({ userId: 1, status: 1 });
withdrawalSchema.index({ userId: 1, createdAt: -1 });

// Virtual for checking if withdrawal is pending for more than 24 hours
withdrawalSchema.virtual('isPendingTooLong').get(function() {
  if (this.status === 'pending') {
    const hoursSinceRequest = (Date.now() - this.requestedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceRequest > 24;
  }
  return false;
});

export const Withdrawal =
  mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
