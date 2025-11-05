import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * BotExecution Model
 * 
 * Tracks signal execution attempts and results
 */

export interface IBotExecution extends Document {
  userId: mongoose.Types.ObjectId;
  signalId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  
  // Execution details
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
  executionTime?: Date;
  
  // Validation results
  validationPassed: boolean;
  validationErrors?: string[];
  
  // Signal timing
  signalReceivedAt: Date;
  signalPrice: number; // Entry price from signal
  actualEntryPrice?: number; // Actual execution price (slippage)
  slippage?: number; // Difference in percentage
  
  // Execution metrics
  latency?: number; // Time from signal to execution (milliseconds)
  gasFeeBalanceAtExecution?: number;
  positionId?: mongoose.Types.ObjectId; // Reference to Position if executed
  
  // Failure reasons
  failureReason?: string;
  errorDetails?: string;
  
  // Metadata
  botSettings?: {
    riskPerTrade: number;
    maxPositions: number;
    leverage: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const BotExecutionSchema = new Schema<IBotExecution>(
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
    action: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    strength: {
      type: String,
      enum: ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'],
      required: true,
    },
    
    // Execution details
    status: {
      type: String,
      enum: ['PENDING', 'EXECUTED', 'FAILED', 'SKIPPED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    executionTime: Date,
    
    // Validation results
    validationPassed: {
      type: Boolean,
      required: true,
    },
    validationErrors: [String],
    
    // Signal timing
    signalReceivedAt: {
      type: Date,
      default: Date.now,
    },
    signalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    actualEntryPrice: Number,
    slippage: Number,
    
    // Execution metrics
    latency: Number,
    gasFeeBalanceAtExecution: Number,
    positionId: {
      type: Schema.Types.ObjectId,
      ref: 'positions',
    },
    
    // Failure reasons
    failureReason: String,
    errorDetails: String,
    
    // Metadata
    botSettings: {
      riskPerTrade: Number,
      maxPositions: Number,
      leverage: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
BotExecutionSchema.index({ userId: 1, status: 1 });
BotExecutionSchema.index({ userId: 1, createdAt: -1 });
BotExecutionSchema.index({ signalId: 1 });
BotExecutionSchema.index({ symbol: 1, status: 1 });

export const BotExecution: Model<IBotExecution> =
  mongoose.models.botexecutions || mongoose.model<IBotExecution>('botexecutions', BotExecutionSchema, 'botexecutions');
