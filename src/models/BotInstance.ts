import mongoose from 'mongoose';

const botInstanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    symbol: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'STOPPED', 'ERROR', 'PAUSED'],
      default: 'STOPPED',
      index: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed, // Accept any config structure
      default: {},
    },
    exchangeConnectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExchangeConnection',
      required: true,
    },
    currentPosition: {
      symbol: String,
      side: String,
      entryPrice: Number,
      quantity: Number,
      leverage: Number,
      stopLoss: Number,
      takeProfit: Number,
      pnl: Number,
      pnlPercent: Number,
      openTime: Date,
    },
    statistics: {
      totalTrades: { type: Number, default: 0 },
      winningTrades: { type: Number, default: 0 },
      losingTrades: { type: Number, default: 0 },
      totalProfit: { type: Number, default: 0 },
      totalLoss: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      avgProfit: { type: Number, default: 0 },
      dailyPnL: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
    },
    lastAnalysis: {
      timestamp: Date,
      signal: {
        action: String,
        confidence: Number,
        reason: String,
        indicators: mongoose.Schema.Types.Mixed,
      },
    },
    lastError: {
      timestamp: Date,
      message: String,
      stack: String,
    },
    startedAt: Date,
    stoppedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for querying active bots
botInstanceSchema.index({ userId: 1, status: 1 });
botInstanceSchema.index({ userId: 1, botId: 1 });

// Unique index to prevent multiple ACTIVE bots for same user+botId
// This prevents race condition when 2 requests come at the same time
botInstanceSchema.index(
  { userId: 1, botId: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'ACTIVE' } // Only enforce uniqueness for ACTIVE status
  }
);

export const BotInstance =
  mongoose.models.BotInstance ||
  mongoose.model('BotInstance', botInstanceSchema);

export type IBotInstance = mongoose.InferSchemaType<typeof botInstanceSchema> & {
  _id: mongoose.Types.ObjectId;
};
