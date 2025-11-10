import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * TradeExecution Model
 * 
 * Tracks every single trade executed by bot instances
 * Used for calculating statistics and providing trade history
 */

export interface ITradeExecution extends Document {
  userId: mongoose.Types.ObjectId;
  botInstanceId: mongoose.Types.ObjectId;
  botId: number;
  botName: string;
  
  // Trade details
  symbol: string;
  side: 'LONG' | 'SHORT';
  type: 'MARKET' | 'LIMIT';
  
  // Entry
  entryPrice: number;
  entryQuantity: number;
  entryTime: Date;
  entryOrderId?: string; // Binance order ID
  
  // Exit
  exitPrice?: number;
  exitQuantity?: number;
  exitTime?: Date;
  exitOrderId?: string;
  exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'MANUAL' | 'EMERGENCY' | 'DAILY_LIMIT';
  
  // P&L
  leverage: number;
  grossPnL?: number; // Before fees
  fees: number;
  netPnL?: number; // After fees
  pnlPercent?: number;
  
  // Status
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  
  // Risk management
  stopLoss: number;
  takeProfit: number;
  
  // Metadata
  exchange: string;
  exchangeConnectionId: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const tradeExecutionSchema = new Schema<ITradeExecution>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    botInstanceId: {
      type: Schema.Types.ObjectId,
      ref: 'BotInstance',
      required: true,
      index: true,
    },
    botId: {
      type: Number,
      required: true,
    },
    botName: {
      type: String,
      required: true,
    },
    
    // Trade details
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    side: {
      type: String,
      enum: ['LONG', 'SHORT'],
      required: true,
    },
    type: {
      type: String,
      enum: ['MARKET', 'LIMIT'],
      default: 'MARKET',
    },
    
    // Entry
    entryPrice: {
      type: Number,
      required: true,
    },
    entryQuantity: {
      type: Number,
      required: true,
    },
    entryTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    entryOrderId: String,
    
    // Exit
    exitPrice: Number,
    exitQuantity: Number,
    exitTime: Date,
    exitOrderId: String,
    exitReason: {
      type: String,
      enum: ['TAKE_PROFIT', 'STOP_LOSS', 'TRAILING_STOP', 'MANUAL', 'EMERGENCY', 'DAILY_LIMIT'],
    },
    
    // P&L
    leverage: {
      type: Number,
      required: true,
    },
    grossPnL: Number,
    fees: {
      type: Number,
      default: 0,
    },
    netPnL: Number,
    pnlPercent: Number,
    
    // Status
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    
    // Risk management
    stopLoss: {
      type: Number,
      required: true,
    },
    takeProfit: {
      type: Number,
      required: true,
    },
    
    // Metadata
    exchange: {
      type: String,
      default: 'binance',
    },
    exchangeConnectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ExchangeConnection',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
tradeExecutionSchema.index({ userId: 1, status: 1, createdAt: -1 });
tradeExecutionSchema.index({ botInstanceId: 1, status: 1, createdAt: -1 });
tradeExecutionSchema.index({ userId: 1, botId: 1, status: 1 });

// Calculate P&L before saving (when trade closes)
tradeExecutionSchema.pre('save', function (next) {
  if (this.status === 'CLOSED' && this.exitPrice && this.exitQuantity) {
    // Calculate gross P&L
    const priceDiff = this.side === 'LONG' 
      ? (this.exitPrice - this.entryPrice) 
      : (this.entryPrice - this.exitPrice);
    
    this.grossPnL = priceDiff * this.exitQuantity;
    
    // Calculate net P&L (after fees)
    this.netPnL = this.grossPnL - this.fees;
    
    // Calculate P&L percentage
    const entryValue = this.entryPrice * this.entryQuantity;
    this.pnlPercent = (this.netPnL / entryValue) * 100 * this.leverage;
  }
  next();
});

// Static method: Get statistics for bot instance
tradeExecutionSchema.statics.getStatistics = async function(botInstanceId: string) {
  const trades = await this.find({
    botInstanceId,
    status: 'CLOSED',
  });

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t: any) => (t.netPnL || 0) > 0).length;
  const losingTrades = trades.filter((t: any) => (t.netPnL || 0) < 0).length;
  
  const totalProfit = trades
    .filter((t: any) => (t.netPnL || 0) > 0)
    .reduce((sum: number, t: any) => sum + (t.netPnL || 0), 0);
  
  const totalLoss = Math.abs(
    trades
      .filter((t: any) => (t.netPnL || 0) < 0)
      .reduce((sum: number, t: any) => sum + (t.netPnL || 0), 0)
  );
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgProfit = totalTrades > 0 
    ? trades.reduce((sum: number, t: any) => sum + (t.netPnL || 0), 0) / totalTrades 
    : 0;

  // Calculate daily P&L (today only)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTrades = trades.filter((t: any) => 
    t.exitTime && new Date(t.exitTime) >= today
  );
  
  const dailyPnL = todayTrades.reduce((sum: number, t: any) => sum + (t.netPnL || 0), 0);

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    totalProfit,
    totalLoss,
    winRate,
    avgProfit,
    dailyPnL,
    lastResetDate: today,
  };
};

// Static method: Get trade history for bot instance
tradeExecutionSchema.statics.getHistory = async function(
  botInstanceId: string, 
  limit: number = 50
) {
  return this.find({ botInstanceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const TradeExecution: Model<ITradeExecution> =
  mongoose.models.TradeExecution || mongoose.model<ITradeExecution>('TradeExecution', tradeExecutionSchema);
