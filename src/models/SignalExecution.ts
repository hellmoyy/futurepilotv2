/**
 * 📊 SIGNAL EXECUTION MODEL
 * 
 * Per-user execution tracking untuk shared signals
 * Satu signal bisa di-execute oleh multiple users
 * 
 * Purpose:
 * - Track which users executed which signals
 * - Prevent duplicate execution by same user
 * - Allow multiple users to execute same signal
 * - Maintain signal status as ACTIVE until expired
 */

import mongoose from 'mongoose';

export interface ISignalExecution extends mongoose.Document {
  // Signal Info
  signalId: string; // Reference to broadcasted signal
  
  // User Info
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  
  // Execution Status
  status: 'pending' | 'executed' | 'failed';
  
  // Execution Details (if executed)
  executedAt?: Date;
  actualEntryPrice?: number;
  quantity?: number;
  leverage?: number;
  orderId?: string;
  positionId?: mongoose.Types.ObjectId;
  
  // Performance Metrics
  slippage?: number; // Percentage
  latency?: number; // Milliseconds from signal broadcast to execution
  
  // Failure Details (if failed)
  failedAt?: Date;
  failureReason?: string;
  errorDetails?: string;
  
  // AI Decision (if applicable)
  aiDecisionApplied: boolean;
  aiConfidenceAdjustment?: number;
  aiSkipReason?: string;
  
  // Metadata
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interface
interface ISignalExecutionModel extends mongoose.Model<ISignalExecution> {
  hasUserExecuted(signalId: string, userId: string | mongoose.Types.ObjectId): Promise<boolean>;
  recordExecution(
    signalId: string,
    userId: string | mongoose.Types.ObjectId,
    userEmail: string,
    metadata?: { aiDecisionApplied: boolean }
  ): Promise<ISignalExecution>;
  markAsExecuted(
    signalId: string,
    userId: string | mongoose.Types.ObjectId,
    executionData: {
      actualEntryPrice: number;
      quantity: number;
      leverage: number;
      orderId: string;
      positionId: mongoose.Types.ObjectId;
      slippage: number;
      latency: number;
    }
  ): Promise<ISignalExecution | null>;
  markAsFailed(
    signalId: string,
    userId: string | mongoose.Types.ObjectId,
    failureReason: string,
    errorDetails: string
  ): Promise<ISignalExecution | null>;
  getSignalStats(signalId: string): Promise<any[]>;
}

const SignalExecutionSchema = new mongoose.Schema<ISignalExecution>(
  {
    // Signal Info
    signalId: {
      type: String,
      required: true,
      index: true,
    },
    
    // User Info
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    
    // Execution Status
    status: {
      type: String,
      enum: ['pending', 'executed', 'failed'],
      default: 'pending',
      index: true,
    },
    
    // Execution Details
    executedAt: {
      type: Date,
    },
    actualEntryPrice: {
      type: Number,
    },
    quantity: {
      type: Number,
    },
    leverage: {
      type: Number,
    },
    orderId: {
      type: String,
    },
    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
    },
    
    // Performance Metrics
    slippage: {
      type: Number,
    },
    latency: {
      type: Number,
    },
    
    // Failure Details
    failedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    errorDetails: {
      type: String,
    },
    
    // AI Decision
    aiDecisionApplied: {
      type: Boolean,
      default: false,
    },
    aiConfidenceAdjustment: {
      type: Number,
    },
    aiSkipReason: {
      type: String,
    },
    
    // Metadata
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index untuk prevent duplicate execution
SignalExecutionSchema.index({ signalId: 1, userId: 1 }, { unique: true });

// Index untuk query performance
SignalExecutionSchema.index({ status: 1, createdAt: -1 });
SignalExecutionSchema.index({ userId: 1, status: 1 });

// Static method: Check if user already executed signal
SignalExecutionSchema.statics.hasUserExecuted = async function(
  signalId: string,
  userId: mongoose.Types.ObjectId
): Promise<boolean> {
  const execution = await this.findOne({
    signalId,
    userId,
    status: { $in: ['executed', 'pending'] }, // Consider both executed and pending
  });
  
  return !!execution;
};

// Static method: Record execution attempt
SignalExecutionSchema.statics.recordExecution = async function(
  signalId: string,
  userId: mongoose.Types.ObjectId,
  userEmail: string,
  executionData: Partial<ISignalExecution>
): Promise<ISignalExecution> {
  // Try to create new execution (will fail if duplicate)
  try {
    const execution = await this.create({
      signalId,
      userId,
      userEmail,
      status: 'pending',
      ...executionData,
    });
    
    return execution;
  } catch (error: any) {
    // Check if duplicate key error
    if (error.code === 11000) {
      throw new Error('User has already executed this signal');
    }
    throw error;
  }
};

// Static method: Mark as executed
SignalExecutionSchema.statics.markAsExecuted = async function(
  signalId: string,
  userId: mongoose.Types.ObjectId,
  executionDetails: {
    actualEntryPrice: number;
    quantity: number;
    leverage: number;
    orderId: string;
    positionId: mongoose.Types.ObjectId;
    slippage: number;
    latency: number;
  }
): Promise<ISignalExecution | null> {
  const execution = await this.findOneAndUpdate(
    { signalId, userId, status: 'pending' },
    {
      $set: {
        status: 'executed',
        executedAt: new Date(),
        ...executionDetails,
      },
    },
    { new: true }
  );
  
  return execution;
};

// Static method: Mark as failed
SignalExecutionSchema.statics.markAsFailed = async function(
  signalId: string,
  userId: mongoose.Types.ObjectId,
  failureReason: string,
  errorDetails?: string
): Promise<ISignalExecution | null> {
  const execution = await this.findOneAndUpdate(
    { signalId, userId, status: 'pending' },
    {
      $set: {
        status: 'failed',
        failedAt: new Date(),
        failureReason,
        errorDetails,
      },
    },
    { new: true }
  );
  
  return execution;
};

// Static method: Get execution stats for signal
SignalExecutionSchema.statics.getSignalStats = async function(signalId: string) {
  const stats = await this.aggregate([
    { $match: { signalId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgSlippage: { $avg: '$slippage' },
        avgLatency: { $avg: '$latency' },
      },
    },
  ]);
  
  return stats;
};

// Prevent multiple model compilation
const SignalExecution = (
  (mongoose.models.SignalExecution as ISignalExecutionModel) ||
  mongoose.model<ISignalExecution, ISignalExecutionModel>('SignalExecution', SignalExecutionSchema)
) as ISignalExecutionModel;

export default SignalExecution;
