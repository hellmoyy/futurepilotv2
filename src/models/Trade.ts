import mongoose, { Schema, Document, Model } from 'mongoose';

// Trade Interface
export interface ITrade extends Document {
  userId: mongoose.Types.ObjectId;
  strategyId?: mongoose.Types.ObjectId;
  symbol: string;
  type: 'buy' | 'sell';
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  status: 'open' | 'closed' | 'cancelled';
  pnl?: number;
  pnlPercentage?: number;
  entryTime: Date;
  exitTime?: Date;
  notes?: string;
  exchange?: string;
  fees?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Trade Schema
const TradeSchema = new Schema<ITrade>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    strategyId: {
      type: Schema.Types.ObjectId,
      ref: 'TradingStrategy',
    },
    symbol: {
      type: String,
      required: [true, 'Trading symbol is required'],
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    side: {
      type: String,
      enum: ['long', 'short'],
      required: true,
    },
    entryPrice: {
      type: Number,
      required: [true, 'Entry price is required'],
      min: 0,
    },
    exitPrice: {
      type: Number,
      min: 0,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    stopLoss: {
      type: Number,
      required: true,
      min: 0,
    },
    takeProfit: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'cancelled'],
      default: 'open',
    },
    pnl: Number,
    pnlPercentage: Number,
    entryTime: {
      type: Date,
      default: Date.now,
    },
    exitTime: Date,
    notes: String,
    exchange: {
      type: String,
      default: 'binance',
    },
    fees: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TradeSchema.index({ userId: 1, status: 1 });
TradeSchema.index({ symbol: 1, entryTime: -1 });
TradeSchema.index({ strategyId: 1 });

// Calculate PnL before saving
TradeSchema.pre('save', function (next) {
  if (this.exitPrice && this.status === 'closed') {
    const priceDiff = this.exitPrice - this.entryPrice;
    const rawPnl = priceDiff * this.quantity;
    this.pnl = rawPnl - (this.fees || 0);
    this.pnlPercentage = (priceDiff / this.entryPrice) * 100;
  }
  next();
});

export const Trade: Model<ITrade> =
  mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);
