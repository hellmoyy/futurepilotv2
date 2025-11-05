import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Signal Center Configuration Model
 * 
 * Stores strategy configuration that can be edited via admin UI
 * Used by both Signal Generator and Backtest Engine
 */

export interface ISignalCenterConfig extends Document {
  // Identification
  name: string; // "default", "aggressive", "conservative"
  description?: string;
  isActive: boolean; // Only one config can be active at a time
  
  // Symbols to monitor
  symbols: string[];
  
  // Timeframes
  primaryTimeframe: '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
  confirmationTimeframes: string[];
  
  // Risk Parameters
  riskPerTrade: number; // 0.02 = 2%
  leverage: number; // 1-20
  stopLossPercent: number; // 0.008 = 0.8%
  takeProfitPercent: number; // 0.008 = 0.8%
  
  // Trailing Stops
  trailProfitActivate: number; // 0.004 = +0.4%
  trailProfitDistance: number; // 0.003 = 0.3%
  trailLossActivate: number; // -0.003 = -0.3%
  trailLossDistance: number; // 0.002 = 0.2%
  
  // Strategy Filters
  macdMinStrength: number; // 0.00003 = 0.003% of price
  volumeMin: number; // 0.8x average
  volumeMax: number; // 2.0x average
  adxMin: number; // 20
  adxMax: number; // 50
  rsiMin: number; // 35
  rsiMax: number; // 68
  
  // Confirmation
  entryConfirmationCandles: number; // 2
  marketBiasPeriod: number; // 100
  biasThreshold: number; // 0.02 = 2%
  
  // Signal Settings
  signalExpiryMinutes: number; // 5 minutes
  broadcastEnabled: boolean;
  broadcastChannel: string;
  
  // Metadata
  createdBy?: string; // Admin email
  createdAt: Date;
  updatedAt: Date;
}

// Model with static methods
export interface ISignalCenterConfigModel extends Model<ISignalCenterConfig> {
  getActiveConfig(): Promise<ISignalCenterConfig>;
  setActiveConfig(configId: string): Promise<ISignalCenterConfig | null>;
}

const SignalCenterConfigSchema = new Schema<ISignalCenterConfig>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: String,
    isActive: {
      type: Boolean,
      default: false,
    },
    
    // Symbols
    symbols: {
      type: [String],
      default: ['BTCUSDT'],
    },
    
    // Timeframes
    primaryTimeframe: {
      type: String,
      enum: ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'],
      default: '1m',
    },
    confirmationTimeframes: {
      type: [String],
      default: ['3m', '5m'],
    },
    
    // Risk Parameters
    riskPerTrade: {
      type: Number,
      default: 0.02,
      min: 0.001,
      max: 0.1, // Max 10% risk
    },
    leverage: {
      type: Number,
      default: 10,
      min: 1,
      max: 20,
    },
    stopLossPercent: {
      type: Number,
      default: 0.008,
      min: 0.001,
      max: 0.05, // Max 5% SL
    },
    takeProfitPercent: {
      type: Number,
      default: 0.008,
      min: 0.001,
      max: 0.1, // Max 10% TP
    },
    
    // Trailing Stops
    trailProfitActivate: {
      type: Number,
      default: 0.004,
      min: 0,
      max: 0.05,
    },
    trailProfitDistance: {
      type: Number,
      default: 0.003,
      min: 0,
      max: 0.05,
    },
    trailLossActivate: {
      type: Number,
      default: -0.003,
      min: -0.05,
      max: 0,
    },
    trailLossDistance: {
      type: Number,
      default: 0.002,
      min: 0,
      max: 0.05,
    },
    
    // Strategy Filters
    macdMinStrength: {
      type: Number,
      default: 0.00003,
      min: 0,
      max: 0.001,
    },
    volumeMin: {
      type: Number,
      default: 0.8,
      min: 0.1,
      max: 2,
    },
    volumeMax: {
      type: Number,
      default: 2.0,
      min: 1,
      max: 10,
    },
    adxMin: {
      type: Number,
      default: 20,
      min: 0,
      max: 50,
    },
    adxMax: {
      type: Number,
      default: 50,
      min: 20,
      max: 100,
    },
    rsiMin: {
      type: Number,
      default: 35,
      min: 0,
      max: 50,
    },
    rsiMax: {
      type: Number,
      default: 68,
      min: 50,
      max: 100,
    },
    
    // Confirmation
    entryConfirmationCandles: {
      type: Number,
      default: 2,
      min: 0,
      max: 10,
    },
    marketBiasPeriod: {
      type: Number,
      default: 100,
      min: 20,
      max: 200,
    },
    biasThreshold: {
      type: Number,
      default: 0.02,
      min: 0.001,
      max: 0.1,
    },
    
    // Signal Settings
    signalExpiryMinutes: {
      type: Number,
      default: 5,
      min: 1,
      max: 60,
    },
    broadcastEnabled: {
      type: Boolean,
      default: true,
    },
    broadcastChannel: {
      type: String,
      default: 'trading-signals',
    },
    
    // Metadata
    createdBy: String,
  },
  {
    timestamps: true,
  }
);

// Index for finding active config
SignalCenterConfigSchema.index({ isActive: 1 });

// Static method: Get active config
SignalCenterConfigSchema.statics.getActiveConfig = async function () {
  const config = await this.findOne({ isActive: true });
  
  if (!config) {
    // Create default config if none exists
    return this.create({
      name: 'default',
      description: 'Default proven strategy (675% ROI backtest)',
      isActive: true,
    });
  }
  
  return config;
};

// Static method: Set active config
SignalCenterConfigSchema.statics.setActiveConfig = async function (configId: string) {
  // Deactivate all configs
  await this.updateMany({}, { isActive: false });
  
  // Activate specified config
  const config = await this.findByIdAndUpdate(
    configId,
    { isActive: true },
    { new: true }
  );
  
  return config;
};

export const SignalCenterConfig = (mongoose.models.signalcenterconfigs as ISignalCenterConfigModel) ||
  mongoose.model<ISignalCenterConfig, ISignalCenterConfigModel>('signalcenterconfigs', SignalCenterConfigSchema, 'signalcenterconfigs');
