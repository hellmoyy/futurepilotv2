/**
 * 🎯 SIGNAL CENTER SIGNAL MODEL
 * 
 * MongoDB model untuk Signal Center signals
 * Simplified schema for automated signal generation
 * Berbeda dengan Signal model (Bot Decision) yang lebih complex
 */

import mongoose, { Schema, Document } from 'mongoose';

export type SignalAction = 'LONG' | 'SHORT';
export type SignalStrength = 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
export type SignalStatus = 'ACTIVE' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';
export type MarketRegime = 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'VOLATILE' | 'TESTING' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface ISignalCenterSignal extends Document {
  // Identification
  signalId: string; // UUID from SignalEngine
  
  // Basic Info
  symbol: string;
  action: SignalAction;
  strength: SignalStrength;
  confidence: number; // 0-1 (not 0-100)
  
  // Price Levels
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  
  // Risk Management
  leverage: number;
  riskPercent: number;
  
  // Timeframe
  timeframe: string;
  
  // Technical Indicators (simplified)
  indicators: {
    rsi: number;
    macdHistogram: number;
    ema9: number;
    ema21: number;
    adx: number;
    atr: number;
    volumeRatio: number;
  };
  
  // Metadata
  metadata: {
    marketRegime: MarketRegime;
    volumeConfirmation: boolean;
    multiTimeframeConfirmed: boolean;
    entryConfirmedCandles: number;
    expectedDuration: number; // minutes
  };
  
  // Signal reasoning
  reason?: string;
  strategy?: string;
  
  // Status
  status: SignalStatus;
  
  // Timestamps
  createdAt: Date;
  expiresAt: Date;
  executedAt?: Date;
  
  // Execution tracking
  executionCount: number; // How many users executed this signal
  
  // Bot execution statistics
  connectedBotsCount: number; // Total connected bots when signal was broadcast
  executedBotsCount: number; // Bots that executed the signal
  skippedBotsCount: number; // Bots that skipped the signal
  
  // Performance (if all executions closed)
  avgProfitLoss?: number;
  avgROI?: number;
}

// Static methods interface
interface ISignalCenterSignalModel extends mongoose.Model<ISignalCenterSignal> {
  getActiveSignals(): Promise<ISignalCenterSignal[]>;
  getSignalHistory(limit?: number): Promise<ISignalCenterSignal[]>;
  expireOldSignals(): Promise<number>;
  incrementExecuted(signalId: string): Promise<ISignalCenterSignal | null>;
  incrementSkipped(signalId: string): Promise<ISignalCenterSignal | null>;
}

const SignalCenterSignalSchema = new Schema<ISignalCenterSignal>(
  {
    signalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
    },
    action: {
      type: String,
      enum: ['LONG', 'SHORT'],
      required: true,
    },
    strength: {
      type: String,
      enum: ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
      required: true,
    },
    takeProfit: {
      type: Number,
      required: true,
    },
    leverage: {
      type: Number,
      required: true,
      min: 1,
      max: 125,
    },
    riskPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    timeframe: {
      type: String,
      required: true,
    },
    indicators: {
      rsi: { type: Number, required: true },
      macdHistogram: { type: Number, required: true },
      ema9: { type: Number, required: true },
      ema21: { type: Number, required: true },
      adx: { type: Number, required: true },
      atr: { type: Number, required: true },
      volumeRatio: { type: Number, required: true },
    },
    metadata: {
      marketRegime: {
        type: String,
        enum: ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'VOLATILE', 'TESTING', 'BULLISH', 'BEARISH', 'NEUTRAL'],
        required: true,
      },
      volumeConfirmation: { type: Boolean, required: true },
      multiTimeframeConfirmed: { type: Boolean, required: true },
      entryConfirmedCandles: { type: Number, required: true },
      expectedDuration: { type: Number, required: true },
    },
    reason: {
      type: String,
    },
    strategy: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXECUTED', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    createdAt: {
      type: Date,
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
    },
    executionCount: {
      type: Number,
      default: 0,
    },
    // Bot execution tracking
    connectedBotsCount: {
      type: Number,
      default: 0,
    },
    executedBotsCount: {
      type: Number,
      default: 0,
    },
    skippedBotsCount: {
      type: Number,
      default: 0,
    },
    avgProfitLoss: {
      type: Number,
    },
    avgROI: {
      type: Number,
    },
  },
  {
    timestamps: true,
    collection: 'signalcenter_signals',
  }
);

// Indexes
SignalCenterSignalSchema.index({ status: 1, expiresAt: 1 });
SignalCenterSignalSchema.index({ symbol: 1, createdAt: -1 });
SignalCenterSignalSchema.index({ createdAt: -1 });

// Auto-expire signals
SignalCenterSignalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static Methods
SignalCenterSignalSchema.statics.getActiveSignals = async function() {
  return this.find({
    status: 'ACTIVE',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

SignalCenterSignalSchema.statics.getSignalHistory = async function(limit = 50) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit);
};

SignalCenterSignalSchema.statics.expireOldSignals = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: 'ACTIVE',
      expiresAt: { $lt: now },
    },
    {
      $set: { status: 'EXPIRED' },
    }
  );
  return result.modifiedCount;
};

// Increment executed bots count
SignalCenterSignalSchema.statics.incrementExecuted = async function(signalId: string) {
  return this.findOneAndUpdate(
    { signalId },
    { 
      $inc: { 
        executedBotsCount: 1,
        executionCount: 1
      } 
    },
    { new: true }
  );
};

// Increment skipped bots count
SignalCenterSignalSchema.statics.incrementSkipped = async function(signalId: string) {
  return this.findOneAndUpdate(
    { signalId },
    { $inc: { skippedBotsCount: 1 } },
    { new: true }
  );
};

// Export
const SignalCenterSignal = (mongoose.models.SignalCenterSignal || 
  mongoose.model<ISignalCenterSignal, ISignalCenterSignalModel>('SignalCenterSignal', SignalCenterSignalSchema)) as ISignalCenterSignalModel;

export default SignalCenterSignal;
