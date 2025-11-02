import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * WebhookRetry Model
 * 
 * Tracks failed webhook processing attempts for automatic retry with exponential backoff
 * 
 * Retry Strategy:
 * - Attempt 1: Immediate (0s delay)
 * - Attempt 2: 1 second delay
 * - Attempt 3: 2 seconds delay
 * - Attempt 4: 4 seconds delay
 * - Attempt 5: 8 seconds delay
 * - Attempt 6: 16 seconds delay (max)
 * 
 * After max attempts, webhook moves to Dead Letter Queue (DLQ)
 */

export interface IWebhookRetry extends Document {
  // Webhook Details
  webhookType: 'moralis' | 'binance' | 'other';
  payload: any; // Original webhook payload
  headers: Record<string, string>; // Original request headers
  
  // Retry Tracking
  retryCount: number; // Current retry attempt (0-based)
  maxRetries: number; // Maximum retry attempts before DLQ
  nextRetryAt: Date; // When to attempt next retry
  
  // Status
  status: 'pending' | 'retrying' | 'success' | 'failed' | 'dead_letter';
  
  // Error Tracking
  errorHistory: Array<{
    attempt: number;
    error: string;
    stackTrace?: string;
    timestamp: Date;
  }>;
  
  // Success Info
  successAt?: Date;
  
  // Dead Letter Queue
  movedToDLQAt?: Date;
  dlqReason?: string;
  adminNotified?: boolean;
  
  // Metadata
  sourceIP?: string;
  userAgent?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateNextRetry(): Date;
  addError(error: Error | string): void;
  shouldMoveToDLQ(): boolean;
  moveToDLQ(reason: string): void;
  markSuccess(): void;
}

// Static methods interface
export interface IWebhookRetryModel extends Model<IWebhookRetry> {
  getPendingRetries(limit?: number): Promise<IWebhookRetry[]>;
  getDLQItems(limit?: number): Promise<IWebhookRetry[]>;
  getStatistics(): Promise<Record<string, number>>;
}

const webhookRetrySchema = new Schema<IWebhookRetry>({
  // Webhook Details
  webhookType: {
    type: String,
    enum: ['moralis', 'binance', 'other'],
    required: true,
    index: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  
  // Retry Tracking
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxRetries: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  nextRetryAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'retrying', 'success', 'failed', 'dead_letter'],
    default: 'pending',
    index: true
  },
  
  // Error Tracking
  errorHistory: [{
    attempt: {
      type: Number,
      required: true
    },
    error: {
      type: String,
      required: true
    },
    stackTrace: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Success Info
  successAt: Date,
  
  // Dead Letter Queue
  movedToDLQAt: Date,
  dlqReason: String,
  adminNotified: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  sourceIP: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes for efficient queries
webhookRetrySchema.index({ status: 1, nextRetryAt: 1 }); // For cron job
webhookRetrySchema.index({ webhookType: 1, status: 1 }); // For admin dashboard
webhookRetrySchema.index({ createdAt: -1 }); // For sorting
webhookRetrySchema.index({ 'payload.transactionHash': 1 }); // For Moralis webhooks

// Virtual for human-readable retry delay
webhookRetrySchema.virtual('retryDelaySeconds').get(function() {
  if (this.retryCount === 0) return 0;
  return Math.pow(2, this.retryCount - 1); // 1, 2, 4, 8, 16...
});

// Method: Calculate next retry time
webhookRetrySchema.methods.calculateNextRetry = function(): Date {
  if (this.retryCount === 0) {
    // First retry: immediate
    return new Date();
  }
  
  // Exponential backoff: 2^(attempt-1) seconds
  const delaySeconds = Math.pow(2, this.retryCount);
  const nextRetry = new Date();
  nextRetry.setSeconds(nextRetry.getSeconds() + delaySeconds);
  
  return nextRetry;
};

// Method: Add error to history
webhookRetrySchema.methods.addError = function(error: Error | string): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const stackTrace = error instanceof Error ? error.stack : undefined;
  
  this.errorHistory.push({
    attempt: this.retryCount,
    error: errorMessage,
    stackTrace,
    timestamp: new Date()
  });
};

// Method: Check if should move to DLQ
webhookRetrySchema.methods.shouldMoveToDLQ = function(): boolean {
  return this.retryCount >= this.maxRetries;
};

// Method: Move to Dead Letter Queue
webhookRetrySchema.methods.moveToDLQ = function(reason: string): void {
  this.status = 'dead_letter';
  this.movedToDLQAt = new Date();
  this.dlqReason = reason;
};

// Method: Mark as success
webhookRetrySchema.methods.markSuccess = function(): void {
  this.status = 'success';
  this.successAt = new Date();
};

// Static method: Get pending retries (for cron job)
webhookRetrySchema.statics.getPendingRetries = async function(limit: number = 100) {
  return this.find({
    status: { $in: ['pending', 'retrying'] },
    nextRetryAt: { $lte: new Date() }
  })
  .sort({ nextRetryAt: 1 })
  .limit(limit);
};

// Static method: Get DLQ items (for admin dashboard)
webhookRetrySchema.statics.getDLQItems = async function(limit: number = 50) {
  return this.find({
    status: 'dead_letter'
  })
  .sort({ movedToDLQAt: -1 })
  .limit(limit);
};

// Static method: Get retry statistics
webhookRetrySchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result: Record<string, number> = {
    pending: 0,
    retrying: 0,
    success: 0,
    failed: 0,
    dead_letter: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
  });
  
  return result;
};

// Prevent duplicate processing (optimistic locking)
webhookRetrySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'retrying') {
    // Add timestamp to prevent race conditions
    this.set('lastAttemptAt', new Date());
  }
  next();
});

// Create and export model
const WebhookRetry = (mongoose.models.WebhookRetry || 
  mongoose.model<IWebhookRetry, IWebhookRetryModel>('WebhookRetry', webhookRetrySchema)) as IWebhookRetryModel;

export { WebhookRetry };
