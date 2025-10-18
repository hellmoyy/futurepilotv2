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
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one setting per user per bot
botSettingsSchema.index({ userId: 1, botId: 1 }, { unique: true });

export default mongoose.models.BotSettings || mongoose.model('BotSettings', botSettingsSchema);
