import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Position Model
 * 
 * Tracks open trading positions from Signal Center bot execution
 */

export interface IPosition extends Document {
  userId: mongoose.Types.ObjectId;
  signalId: string; // Reference to signal that triggered this position
  symbol: string; // BTCUSDT, ETHUSDT, etc
  side: 'LONG' | 'SHORT'; // BUY = LONG, SELL = SHORT
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED' | 'CANCELLED';
  
  // Entry details
  entryPrice: number;
  entryTime: Date;
  quantity: number; // Position size in base asset (BTC, ETH, etc)
  leverage: number; // 1-20x
  
  // Risk management
  stopLoss: number;
  takeProfit: number;
  initialStopLoss: number; // Original SL (for tracking)
  initialTakeProfit: number; // Original TP (for tracking)
  
  // Trailing stops
  trailingProfitActive: boolean;
  trailingLossActive: boolean;
  highestProfit: number; // Track peak profit for trailing
  lowestLoss: number; // Track lowest point for trailing
  
  // Exit details
  exitPrice?: number;
  exitTime?: Date;
  exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_PROFIT' | 'TRAILING_LOSS' | 'EMERGENCY_EXIT' | 'MANUAL' | 'SIGNAL_EXPIRED';
  
  // PnL tracking
  realizedPnL?: number; // Profit/Loss in USDT
  realizedPnLPercentage?: number; // % return
  commission?: number; // 20% of profit (if positive)
  
  // Binance order IDs
  entryOrderId?: string;
  stopLossOrderId?: string;
  takeProfitOrderId?: string;
  exitOrderId?: string;
  
  // Metadata
  gasFeeBalanceBefore: number; // Gas fee balance before trade
  gasFeeBalanceAfter?: number; // Gas fee balance after trade + commission
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PositionSchema = new Schema<IPosition>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'futurepilotcols',
      required: true,
      index: true,
    },
    signalId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    side: {
      type: String,
      enum: ['LONG', 'SHORT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'LIQUIDATED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    
    // Entry details
    entryPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    entryTime: {
      type: Date,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    leverage: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    
    // Risk management
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
    initialStopLoss: {
      type: Number,
      required: true,
      min: 0,
    },
    initialTakeProfit: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Trailing stops
    trailingProfitActive: {
      type: Boolean,
      default: false,
    },
    trailingLossActive: {
      type: Boolean,
      default: false,
    },
    highestProfit: {
      type: Number,
      default: 0,
    },
    lowestLoss: {
      type: Number,
      default: 0,
    },
    
    // Exit details
    exitPrice: Number,
    exitTime: Date,
    exitReason: {
      type: String,
      enum: ['TAKE_PROFIT', 'STOP_LOSS', 'TRAILING_PROFIT', 'TRAILING_LOSS', 'EMERGENCY_EXIT', 'MANUAL', 'SIGNAL_EXPIRED'],
    },
    
    // PnL tracking
    realizedPnL: Number,
    realizedPnLPercentage: Number,
    commission: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Binance order IDs
    entryOrderId: String,
    stopLossOrderId: String,
    takeProfitOrderId: String,
    exitOrderId: String,
    
    // Metadata
    gasFeeBalanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    gasFeeBalanceAfter: Number,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
PositionSchema.index({ userId: 1, status: 1 });
PositionSchema.index({ userId: 1, createdAt: -1 });
PositionSchema.index({ signalId: 1 });
PositionSchema.index({ symbol: 1, status: 1 });

export const Position: Model<IPosition> =
  mongoose.models.positions || mongoose.model<IPosition>('positions', PositionSchema, 'positions');
