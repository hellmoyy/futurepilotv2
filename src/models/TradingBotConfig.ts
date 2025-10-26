import mongoose from 'mongoose';

const TradingBotConfigSchema = new mongoose.Schema({
  // Bot identification
  botId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  
  // Risk and performance metrics
  risk: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true,
  },
  riskColor: {
    type: String,
    enum: ['green', 'blue', 'orange', 'red'],
    required: true,
  },
  winRate: {
    type: String,
    required: true,
  },
  avgProfit: {
    type: String,
    required: true,
  },
  
  // Bot flags
  recommended: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true, // Bot config is active and available for users
  },
  
  // Default trading settings
  defaultSettings: {
    leverage: {
      type: Number,
      required: true,
      min: 1,
      max: 125,
    },
    stopLoss: {
      type: Number,
      required: true,
      min: 0.1,
      max: 100,
    },
    takeProfit: {
      type: Number,
      required: true,
      min: 0.1,
      max: 1000,
    },
  },
  
  // Supported currencies
  supportedCurrencies: [{
    type: String,
    required: true,
  }],
  
  // Advanced features configuration
  features: {
    // Tier 1 - Critical Features
    trailingStopLoss: {
      available: { type: Boolean, default: true },
      defaultEnabled: { type: Boolean, default: false },
      defaultDistance: { type: Number, default: 2 }, // % trailing distance
    },
    maxPositionSize: {
      available: { type: Boolean, default: true },
      defaultValue: { type: Number, default: 100 }, // USDT
    },
    maxConcurrentPositions: {
      available: { type: Boolean, default: true },
      defaultValue: { type: Number, default: 3 },
    },
    maxDailyTrades: {
      available: { type: Boolean, default: true },
      defaultValue: { type: Number, default: 10 },
    },
    
    // Tier 2 - Important Features
    breakEvenStop: {
      available: { type: Boolean, default: true },
      defaultEnabled: { type: Boolean, default: false },
      defaultTriggerProfit: { type: Number, default: 2 }, // % profit to trigger
    },
    partialTakeProfit: {
      available: { type: Boolean, default: true },
      defaultEnabled: { type: Boolean, default: false },
      defaultLevels: [{
        profit: { type: Number },
        closePercent: { type: Number },
      }],
    },
    maxDailyLoss: {
      available: { type: Boolean, default: true },
      defaultEnabled: { type: Boolean, default: false },
      defaultAmount: { type: Number, default: 100 }, // USDT
    },
  },
  
  // Metadata
  version: {
    type: String,
    default: '1.0.0',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
TradingBotConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
TradingBotConfigSchema.index({ botId: 1 });
TradingBotConfigSchema.index({ isActive: 1 });
TradingBotConfigSchema.index({ risk: 1 });

export const TradingBotConfig = mongoose.models.TradingBotConfig || mongoose.model('TradingBotConfig', TradingBotConfigSchema);
