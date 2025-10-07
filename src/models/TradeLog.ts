import mongoose from 'mongoose';

const tradeLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    botInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BotInstance',
      required: true,
      index: true,
    },
    botName: {
      type: String,
      required: true,
    },
    logType: {
      type: String,
      enum: ['TRADE', 'ERROR', 'ANALYSIS', 'SAFETY', 'SYSTEM'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
      default: 'INFO',
    },
    action: {
      type: String, // BUY, SELL, CLOSE, STOP_LOSS_HIT, TAKE_PROFIT_HIT, DAILY_LIMIT_REACHED, etc.
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      // Can contain: price, quantity, pnl, indicators, error details, etc.
    },
    tradeDetails: {
      symbol: String,
      side: String, // BUY/SELL, LONG/SHORT
      entryPrice: Number,
      exitPrice: Number,
      quantity: Number,
      leverage: Number,
      pnl: Number,
      pnlPercent: Number,
      fees: Number,
      orderId: String,
    },
    safetyTrigger: {
      triggered: { type: Boolean, default: false },
      reason: String, // DAILY_LOSS_LIMIT, POSITION_SIZE_EXCEEDED, EMERGENCY_STOP, etc.
      threshold: Number,
      currentValue: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
tradeLogSchema.index({ userId: 1, createdAt: -1 });
tradeLogSchema.index({ botInstanceId: 1, createdAt: -1 });
tradeLogSchema.index({ logType: 1, severity: 1, createdAt: -1 });
tradeLogSchema.index({ createdAt: -1 });

export const TradeLog =
  mongoose.models.TradeLog || mongoose.model('TradeLog', tradeLogSchema);

export type ITradeLog = mongoose.InferSchemaType<typeof tradeLogSchema> & {
  _id: mongoose.Types.ObjectId;
};
