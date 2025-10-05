import mongoose, { Schema, Document, Model } from 'mongoose';

// Trading Strategy Interface
export interface ITradingStrategy extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  symbol: string;
  timeframe: string;
  type: 'long' | 'short' | 'both';
  indicators: {
    name: string;
    params: Record<string, any>;
  }[];
  entryConditions: string;
  exitConditions: string;
  riskPercentage: number;
  stopLoss: number;
  takeProfit: number;
  isActive: boolean;
  performance: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
    lastExecuted?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Trading Strategy Schema
const TradingStrategySchema = new Schema<ITradingStrategy>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Strategy name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, 'Trading symbol is required'],
      uppercase: true,
    },
    timeframe: {
      type: String,
      required: true,
      enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'],
      default: '1h',
    },
    type: {
      type: String,
      enum: ['long', 'short', 'both'],
      default: 'both',
    },
    indicators: [
      {
        name: String,
        params: Schema.Types.Mixed,
      },
    ],
    entryConditions: {
      type: String,
      required: true,
    },
    exitConditions: {
      type: String,
      required: true,
    },
    riskPercentage: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 10,
    },
    stopLoss: {
      type: Number,
      required: true,
      min: 0.1,
    },
    takeProfit: {
      type: Number,
      required: true,
      min: 0.1,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    performance: {
      totalTrades: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      profitLoss: { type: Number, default: 0 },
      lastExecuted: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TradingStrategySchema.index({ userId: 1, symbol: 1 });
TradingStrategySchema.index({ isActive: 1 });

export const TradingStrategy: Model<ITradingStrategy> =
  mongoose.models.TradingStrategy ||
  mongoose.model<ITradingStrategy>('TradingStrategy', TradingStrategySchema);
