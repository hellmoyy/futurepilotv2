import mongoose from 'mongoose';

const botSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    botId: {
      type: Number,
      required: true,
    },
    leverage: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    stopLoss: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    takeProfit: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    // Tier 1 - Critical Features
    trailingStopLoss: {
      enabled: {
        type: Boolean,
        default: false,
      },
      distance: {
        type: Number,
        default: 2,
        min: 0.5,
        max: 10,
      },
    },
    maxPositionSize: {
      type: Number,
      default: 100,
      min: 10,
      max: 10000,
    },
    maxConcurrentPositions: {
      type: Number,
      default: 3,
      min: 1,
      max: 20,
    },
    maxDailyTrades: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },
    // Tier 2 - Important Features
    breakEvenStop: {
      enabled: {
        type: Boolean,
        default: false,
      },
      triggerProfit: {
        type: Number,
        default: 2,
        min: 0.5,
        max: 10,
      },
    },
    partialTakeProfit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      levels: {
        type: [{
          profit: {
            type: Number,
            required: true,
            min: 0.5,
            max: 30,
          },
          closePercent: {
            type: Number,
            required: true,
            min: 10,
            max: 100,
          },
        }],
        default: [
          { profit: 3, closePercent: 50 },
          { profit: 6, closePercent: 50 }
        ],
      },
    },
    maxDailyLoss: {
      enabled: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        default: 100,
        min: 10,
        max: 5000,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one setting per user per bot
botSettingsSchema.index({ userId: 1, botId: 1 }, { unique: true });

export default mongoose.models.BotSettings || mongoose.model('BotSettings', botSettingsSchema);
