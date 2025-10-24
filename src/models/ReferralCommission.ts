import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReferralCommission extends Document {
  userId: mongoose.Types.ObjectId; // User yang menerima commission
  referralUserId: mongoose.Types.ObjectId; // User yang melakukan aktivitas (trading, deposit, dll)
  referralLevel: 1 | 2 | 3; // Level dalam referral tree
  amount: number; // Jumlah commission dalam USD
  commissionRate: number; // Percentage rate yang digunakan (10, 20, 30, 50)
  source: 'trading_fee' | 'deposit_fee' | 'withdrawal_fee' | 'subscription'; // Sumber commission
  sourceTransactionId?: mongoose.Types.ObjectId; // Reference ke transaction asli
  status: 'pending' | 'paid' | 'cancelled'; // Status pembayaran
  paidAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const referralCommissionSchema = new Schema<IReferralCommission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'futurepilotcol',
      required: true,
      index: true,
    },
    referralUserId: {
      type: Schema.Types.ObjectId,
      ref: 'futurepilotcol',
      required: true,
      index: true,
    },
    referralLevel: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Commission amount cannot be negative'],
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    source: {
      type: String,
      required: true,
      enum: ['trading_fee', 'deposit_fee', 'withdrawal_fee', 'subscription'],
      index: true,
    },
    sourceTransactionId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paidAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes untuk query optimization
referralCommissionSchema.index({ userId: 1, status: 1, createdAt: -1 });
referralCommissionSchema.index({ referralUserId: 1, createdAt: -1 });
referralCommissionSchema.index({ createdAt: -1 });

// Virtual untuk calculated fields
referralCommissionSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

referralCommissionSchema.virtual('isPaid').get(function() {
  return this.status === 'paid';
});

export const ReferralCommission: Model<IReferralCommission> =
  mongoose.models.ReferralCommission || 
  mongoose.model<IReferralCommission>('ReferralCommission', referralCommissionSchema);
