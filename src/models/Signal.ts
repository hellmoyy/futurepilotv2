/**
 * 📊 SIGNAL MODEL
 * 
 * MongoDB model untuk menyimpan trading signals
 * Includes indicator snapshots, performance tracking, dan execution results
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// 📊 INTERFACES
// ============================================================================

export type SignalAction = 'LONG' | 'SHORT' | 'HOLD';
export type SignalStrength = 'weak' | 'moderate' | 'strong';
export type SignalStatus = 'active' | 'executed' | 'expired' | 'cancelled';
export type StrategyName = 'conservative' | 'balanced' | 'aggressive' | 'custom';

export interface ISignal extends Document {
  // Basic Info
  symbol: string;
  action: SignalAction;
  confidence: number;
  strength: SignalStrength;
  status: SignalStatus;
  
  // Price Levels
  entryPrice: number;
  currentPrice: number;
  takeProfitLevels: number[];
  stopLoss: number;
  
  // Technical Indicators Snapshot
  indicators: {
    rsi: {
      value: number;
      signal: 'overbought' | 'oversold' | 'neutral';
      extremeOverbought: boolean;
      extremeOversold: boolean;
    };
    macd: {
      macd: number;
      signal: number;
      histogram: number;
      bullish: boolean;
      bearish: boolean;
      crossover: 'bullish' | 'bearish' | 'none';
    };
    ema: {
      short: number;
      long: number;
      trend: 'bullish' | 'bearish' | 'neutral';
      crossover: 'golden' | 'death' | 'none';
      distance: number;
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
      position: string;
      bandwidth: number;
      squeeze: boolean;
    };
    volume: {
      current: number;
      average: number;
      surge: boolean;
      ratio: number;
    };
    atr: {
      value: number;
      volatility: 'low' | 'normal' | 'high';
      percentOfPrice: number;
    };
  };
  
  // Signal Reasoning
  reasons: string[];
  warnings: string[];
  indicatorSummary: string[];
  
  // Strategy & Settings
  strategy: StrategyName;
  timeframe: string;
  maxLeverage: number;
  recommendedPositionSize: number;
  riskRewardRatio: number;
  
  // Timestamps
  generatedAt: Date;
  expiresAt: Date;
  executedAt?: Date;
  closedAt?: Date;
  
  // Execution Results (if executed)
  execution?: {
    executedPrice: number;
    executedAt: Date;
    positionSize: number;
    leverage: number;
    orderId?: string;
  };
  
  // Performance Tracking (if closed)
  performance?: {
    exitPrice: number;
    exitReason: 'take_profit' | 'stop_loss' | 'manual' | 'expired';
    profitLoss: number;
    profitLossPercent: number;
    roi: number;
    duration: number; // milliseconds
    hitTP1: boolean;
    hitTP2: boolean;
    hitTP3: boolean;
  };
  
  // Metadata
  userId?: string;
  botId?: string;
  notes?: string;
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 📊 SCHEMA
// ============================================================================

const SignalSchema = new Schema<ISignal>(
  {
    // Basic Info
    symbol: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
    },
    action: {
      type: String,
      enum: ['LONG', 'SHORT', 'HOLD'],
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    strength: {
      type: String,
      enum: ['weak', 'moderate', 'strong'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'executed', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    
    // Price Levels
    entryPrice: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    takeProfitLevels: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length >= 1 && v.length <= 5,
        message: 'Must have 1-5 take profit levels',
      },
    },
    stopLoss: {
      type: Number,
      required: true,
    },
    
    // Technical Indicators
    indicators: {
      rsi: {
        value: Number,
        signal: String,
        extremeOverbought: Boolean,
        extremeOversold: Boolean,
      },
      macd: {
        macd: Number,
        signal: Number,
        histogram: Number,
        bullish: Boolean,
        bearish: Boolean,
        crossover: String,
      },
      ema: {
        short: Number,
        long: Number,
        trend: String,
        crossover: String,
        distance: Number,
      },
      bollingerBands: {
        upper: Number,
        middle: Number,
        lower: Number,
        position: String,
        bandwidth: Number,
        squeeze: Boolean,
      },
      volume: {
        current: Number,
        average: Number,
        surge: Boolean,
        ratio: Number,
      },
      atr: {
        value: Number,
        volatility: String,
        percentOfPrice: Number,
      },
    },
    
    // Signal Reasoning
    reasons: {
      type: [String],
      default: [],
    },
    warnings: {
      type: [String],
      default: [],
    },
    indicatorSummary: {
      type: [String],
      default: [],
    },
    
    // Strategy & Settings
    strategy: {
      type: String,
      enum: ['conservative', 'balanced', 'aggressive', 'custom'],
      required: true,
      index: true,
    },
    timeframe: {
      type: String,
      required: true,
    },
    maxLeverage: {
      type: Number,
      required: true,
      min: 1,
      max: 125,
    },
    recommendedPositionSize: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskRewardRatio: {
      type: Number,
      required: true,
    },
    
    // Timestamps
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    executedAt: {
      type: Date,
      index: true,
    },
    closedAt: {
      type: Date,
      index: true,
    },
    
    // Execution Results
    execution: {
      executedPrice: Number,
      executedAt: Date,
      positionSize: Number,
      leverage: Number,
      orderId: String,
    },
    
    // Performance Tracking
    performance: {
      exitPrice: Number,
      exitReason: {
        type: String,
        enum: ['take_profit', 'stop_loss', 'manual', 'expired'],
      },
      profitLoss: Number,
      profitLossPercent: Number,
      roi: Number,
      duration: Number,
      hitTP1: Boolean,
      hitTP2: Boolean,
      hitTP3: Boolean,
    },
    
    // Metadata
    userId: {
      type: String,
      index: true,
    },
    botId: {
      type: String,
      index: true,
    },
    notes: String,
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'signals',
  }
);

// ============================================================================
// 📊 INDEXES
// ============================================================================

// Compound indexes for common queries
SignalSchema.index({ symbol: 1, generatedAt: -1 });
SignalSchema.index({ action: 1, confidence: -1 });
SignalSchema.index({ status: 1, expiresAt: 1 });
SignalSchema.index({ userId: 1, generatedAt: -1 });
SignalSchema.index({ strategy: 1, confidence: -1 });

// TTL index - auto-delete signals after 30 days
SignalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// ============================================================================
// 📊 METHODS
// ============================================================================

SignalSchema.methods.isActive = function(this: ISignal): boolean {
  return this.status === 'active' && this.expiresAt > new Date();
};

SignalSchema.methods.isExpired = function(this: ISignal): boolean {
  return this.expiresAt <= new Date();
};

SignalSchema.methods.execute = function(
  this: ISignal,
  executedPrice: number,
  positionSize: number,
  leverage: number,
  orderId?: string
): void {
  this.status = 'executed';
  this.executedAt = new Date();
  this.execution = {
    executedPrice,
    executedAt: new Date(),
    positionSize,
    leverage,
    orderId,
  };
};

SignalSchema.methods.close = function(
  this: ISignal,
  exitPrice: number,
  exitReason: 'take_profit' | 'stop_loss' | 'manual' | 'expired'
): void {
  if (!this.execution) {
    throw new Error('Cannot close signal that was not executed');
  }
  
  this.closedAt = new Date();
  
  // Calculate performance
  const entryPrice = this.execution.executedPrice;
  const leverage = this.execution.leverage;
  const isLong = this.action === 'LONG';
  
  // Calculate P&L
  const priceChange = isLong 
    ? (exitPrice - entryPrice) / entryPrice 
    : (entryPrice - exitPrice) / entryPrice;
  
  const profitLossPercent = priceChange * 100;
  const roi = profitLossPercent * leverage;
  const profitLoss = (this.execution.positionSize * roi) / 100;
  
  // Check if TPs were hit
  const hitTP1 = isLong ? exitPrice >= this.takeProfitLevels[0] : exitPrice <= this.takeProfitLevels[0];
  const hitTP2 = this.takeProfitLevels[1] ? (isLong ? exitPrice >= this.takeProfitLevels[1] : exitPrice <= this.takeProfitLevels[1]) : false;
  const hitTP3 = this.takeProfitLevels[2] ? (isLong ? exitPrice >= this.takeProfitLevels[2] : exitPrice <= this.takeProfitLevels[2]) : false;
  
  this.performance = {
    exitPrice,
    exitReason,
    profitLoss,
    profitLossPercent,
    roi,
    duration: this.closedAt.getTime() - this.executedAt!.getTime(),
    hitTP1,
    hitTP2,
    hitTP3,
  };
};

SignalSchema.methods.cancel = function(this: ISignal, reason?: string): void {
  this.status = 'cancelled';
  if (reason) {
    this.notes = reason;
  }
};

SignalSchema.methods.toSummary = function(this: ISignal): string {
  const emoji = this.action === 'LONG' ? '🟢' : this.action === 'SHORT' ? '🔴' : '⚪';
  const arrow = this.action === 'LONG' ? '↗️' : this.action === 'SHORT' ? '↘️' : '➡️';
  
  return `${emoji} ${this.symbol} ${arrow} ${this.action} | ` +
         `${this.confidence.toFixed(1)}% (${this.strength}) | ` +
         `Entry: $${this.entryPrice.toFixed(2)} | ` +
         `TP: $${this.takeProfitLevels[1]?.toFixed(2) || this.takeProfitLevels[0]?.toFixed(2)} | ` +
         `SL: $${this.stopLoss.toFixed(2)}`;
};

// ============================================================================
// 📊 STATICS
// ============================================================================

SignalSchema.statics.getActiveSignals = async function(
  this: Model<ISignal>,
  userId?: string
): Promise<ISignal[]> {
  const query: any = {
    status: 'active',
    expiresAt: { $gt: new Date() },
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query)
    .sort({ confidence: -1, generatedAt: -1 })
    .exec();
};

SignalSchema.statics.getLatestSignals = async function(
  this: Model<ISignal>,
  limit: number = 20
): Promise<ISignal[]> {
  return this.find()
    .sort({ generatedAt: -1 })
    .limit(limit)
    .exec();
};

SignalSchema.statics.getSignalsBySymbol = async function(
  this: Model<ISignal>,
  symbol: string,
  limit: number = 10
): Promise<ISignal[]> {
  return this.find({ symbol })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .exec();
};

SignalSchema.statics.getPerformanceStats = async function(
  this: Model<ISignal>,
  userId?: string
): Promise<any> {
  const matchStage: any = {
    status: { $in: ['executed', 'expired'] },
    performance: { $exists: true },
  };
  
  if (userId) {
    matchStage.userId = userId;
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSignals: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        avgROI: { $avg: '$performance.roi' },
        totalProfitLoss: { $sum: '$performance.profitLoss' },
        winRate: {
          $avg: {
            $cond: [{ $gt: ['$performance.profitLoss', 0] }, 1, 0],
          },
        },
        avgDuration: { $avg: '$performance.duration' },
      },
    },
  ]);
  
  return stats[0] || {
    totalSignals: 0,
    avgConfidence: 0,
    avgROI: 0,
    totalProfitLoss: 0,
    winRate: 0,
    avgDuration: 0,
  };
};

SignalSchema.statics.expireOldSignals = async function(
  this: Model<ISignal>
): Promise<number> {
  const result = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $lte: new Date() },
    },
    {
      $set: { status: 'expired' },
    }
  );
  
  return result.modifiedCount;
};

// ============================================================================
// 📊 EXPORT MODEL
// ============================================================================

const Signal = mongoose.models.Signal || mongoose.model<ISignal>('Signal', SignalSchema);

export default Signal;
