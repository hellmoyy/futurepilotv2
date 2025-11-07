import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * 🤖 UserBot Model
 * 
 * Represents a user's personal trading bot instance with AI decision layer.
 * Each user has ONE bot that manages their trading execution.
 */

export interface IUserBot extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'stopped';
  
  // Instance methods
  updateBalance(binanceBalance: number, gasFeeBalance: number, availableMargin: number, usedMargin: number): Promise<IUserBot>;
  recordSignalReceived(): Promise<IUserBot>;
  recordSignalExecuted(): Promise<IUserBot>;
  recordSignalRejected(): Promise<IUserBot>;
  recordTradeResult(result: 'WIN' | 'LOSS', profit: number): Promise<IUserBot>;
  canTrade(): { allowed: boolean; reason?: string };
  
  // Balance tracking (updated periodically)
  lastBalanceCheck: {
    timestamp: Date;
    binanceBalance: number;        // From Binance Futures API
    gasFeeBalance: number;         // From our database
    availableMargin: number;       // Free margin for trading
    usedMargin: number;            // Already used in positions
  };
  
  // AI Configuration (per-user customization)
  aiConfig: {
    enabled: boolean;              // Can disable AI layer
    confidenceThreshold: number;   // Default 82%, adaptive
    newsWeight: number;            // Default 10% (how much news affects decision)
    backtestWeight: number;        // Default 5% (how much history affects)
    learningWeight: number;        // Default 3% (how much patterns affect)
    minGasFeeBalance: number;      // Default 10 USDT
  };
  
  // Trading Configuration
  tradingConfig: {
    riskPercent: number;           // Default 2% per trade
    maxLeverage: number;           // Default 10x
    maxDailyTrades: number;        // Default 50
    allowedPairs: string[];        // ['BTCUSDT', 'ETHUSDT', ...]
    blacklistPairs: string[];      // Pairs to never trade
  };
  
  // Risk Management (Advanced Protection)
  riskManagement: {
    // Adaptive Daily Trade Limits
    maxDailyTradesHighWinRate: number;    // Default 4 (when win rate >= 85%)
    maxDailyTradesLowWinRate: number;     // Default 2 (when win rate < 85%)
    winRateThreshold: number;             // Default 0.85 (85%)
    
    // Consecutive Loss Protection
    maxConsecutiveLosses: number;         // Default 2
    cooldownPeriodHours: number;          // Default 24 hours
    cooldownStartTime: Date | null;       // When cooldown started (null = not in cooldown)
    
    // Protection Status
    isInCooldown: boolean;                // Currently in cooldown?
    cooldownReason: string;               // Why in cooldown?
  };
  
  // Statistics (accumulated over time)
  stats: {
    totalSignalsReceived: number;
    signalsExecuted: number;
    signalsRejected: number;
    
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;               // Calculated: wins / total
    
    totalProfit: number;
    totalLoss: number;
    netProfit: number;             // Calculated: profit - loss
    
    bestTrade: number;
    worstTrade: number;
    avgProfit: number;
    avgLoss: number;
    
    // Learning metrics
    patternsLearned: number;
    patternsAvoided: number;       // How many times pattern-based rejection saved from loss
    learningImprovementPct: number; // Win rate improvement from learning
  };
  
  // Activity tracking
  lastActive: Date;
  lastTradeTime: Date;
  consecutiveWins: number;
  consecutiveLosses: number;
  dailyTradeCount: number;         // Reset daily
  weeklyProfitLoss: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Interface for UserBot Model (static methods)
export interface IUserBotModel extends Model<IUserBot> {
  getActiveBots(): Promise<IUserBot[]>;
  getBotsWithLowBalance(threshold?: number): Promise<IUserBot[]>;
  getTopPerformers(limit?: number): Promise<IUserBot[]>;
}

const UserBotSchema = new Schema<IUserBot, IUserBotModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // User model is registered in User.ts
      required: true,
      unique: true,
      index: true,
    },
    
    status: {
      type: String,
      enum: ['active', 'paused', 'stopped'],
      default: 'active',
      index: true,
    },
    
    lastBalanceCheck: {
      timestamp: { type: Date, default: Date.now },
      binanceBalance: { type: Number, default: 0 },
      gasFeeBalance: { type: Number, default: 0 },
      availableMargin: { type: Number, default: 0 },
      usedMargin: { type: Number, default: 0 },
    },
    
    aiConfig: {
      enabled: { type: Boolean, default: true },
      confidenceThreshold: { type: Number, default: 0.82, min: 0.5, max: 0.99 },
      newsWeight: { type: Number, default: 0.10, min: 0, max: 0.5 },
      backtestWeight: { type: Number, default: 0.05, min: 0, max: 0.5 },
      learningWeight: { type: Number, default: 0.03, min: 0, max: 0.5 },
      minGasFeeBalance: { type: Number, default: 10, min: 1 },
    },
    
    tradingConfig: {
      riskPercent: { type: Number, default: 0.02, min: 0.001, max: 0.1 },
      maxLeverage: { type: Number, default: 10, min: 1, max: 20 },
      maxDailyTrades: { type: Number, default: 50, min: 1, max: 200 },
      allowedPairs: { type: [String], default: ['BTCUSDT'] },
      blacklistPairs: { type: [String], default: [] },
    },
    
    riskManagement: {
      // Adaptive Daily Trade Limits
      maxDailyTradesHighWinRate: { type: Number, default: 4, min: 1, max: 20 },
      maxDailyTradesLowWinRate: { type: Number, default: 2, min: 1, max: 10 },
      winRateThreshold: { type: Number, default: 0.85, min: 0.5, max: 0.99 },
      
      // Consecutive Loss Protection
      maxConsecutiveLosses: { type: Number, default: 2, min: 1, max: 10 },
      cooldownPeriodHours: { type: Number, default: 24, min: 1, max: 168 }, // Max 1 week
      cooldownStartTime: { type: Date, default: null },
      
      // Protection Status
      isInCooldown: { type: Boolean, default: false },
      cooldownReason: { type: String, default: '' },
    },
    
    stats: {
      totalSignalsReceived: { type: Number, default: 0 },
      signalsExecuted: { type: Number, default: 0 },
      signalsRejected: { type: Number, default: 0 },
      
      totalTrades: { type: Number, default: 0 },
      winningTrades: { type: Number, default: 0 },
      losingTrades: { type: Number, default: 0 },
      winRate: { type: Number, default: 0, min: 0, max: 1 },
      
      totalProfit: { type: Number, default: 0 },
      totalLoss: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
      
      bestTrade: { type: Number, default: 0 },
      worstTrade: { type: Number, default: 0 },
      avgProfit: { type: Number, default: 0 },
      avgLoss: { type: Number, default: 0 },
      
      patternsLearned: { type: Number, default: 0 },
      patternsAvoided: { type: Number, default: 0 },
      learningImprovementPct: { type: Number, default: 0 },
    },
    
    lastActive: { type: Date, default: Date.now },
    lastTradeTime: { type: Date },
    consecutiveWins: { type: Number, default: 0 },
    consecutiveLosses: { type: Number, default: 0 },
    dailyTradeCount: { type: Number, default: 0 },
    weeklyProfitLoss: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'userbots',
  }
);

// Indexes for performance
UserBotSchema.index({ status: 1, lastActive: -1 });
UserBotSchema.index({ 'stats.winRate': -1 });
UserBotSchema.index({ 'stats.netProfit': -1 });

// Virtual for execution rate
UserBotSchema.virtual('executionRate').get(function() {
  if (this.stats.totalSignalsReceived === 0) return 0;
  return this.stats.signalsExecuted / this.stats.totalSignalsReceived;
});

// Virtual for rejection rate
UserBotSchema.virtual('rejectionRate').get(function() {
  if (this.stats.totalSignalsReceived === 0) return 0;
  return this.stats.signalsRejected / this.stats.totalSignalsReceived;
});

// Method to update balance
UserBotSchema.methods.updateBalance = async function(
  binanceBalance: number,
  gasFeeBalance: number,
  availableMargin: number,
  usedMargin: number
) {
  this.lastBalanceCheck = {
    timestamp: new Date(),
    binanceBalance,
    gasFeeBalance,
    availableMargin,
    usedMargin,
  };
  this.lastActive = new Date();
  return this.save();
};

// Method to record signal received
UserBotSchema.methods.recordSignalReceived = async function() {
  this.stats.totalSignalsReceived += 1;
  this.lastActive = new Date();
  return this.save();
};

// Method to record signal executed
UserBotSchema.methods.recordSignalExecuted = async function() {
  this.stats.signalsExecuted += 1;
  this.dailyTradeCount += 1;
  this.lastActive = new Date();
  return this.save();
};

// Method to record signal rejected
UserBotSchema.methods.recordSignalRejected = async function() {
  this.stats.signalsRejected += 1;
  this.lastActive = new Date();
  return this.save();
};

// Method to record trade result
UserBotSchema.methods.recordTradeResult = async function(
  result: 'WIN' | 'LOSS',
  profit: number
) {
  this.stats.totalTrades += 1;
  
  if (result === 'WIN') {
    this.stats.winningTrades += 1;
    this.stats.totalProfit += profit;
    this.consecutiveWins += 1;
    this.consecutiveLosses = 0; // Reset consecutive losses on win
    if (profit > this.stats.bestTrade) {
      this.stats.bestTrade = profit;
    }
  } else {
    this.stats.losingTrades += 1;
    this.stats.totalLoss += Math.abs(profit);
    this.consecutiveLosses += 1;
    this.consecutiveWins = 0;
    if (profit < this.stats.worstTrade) {
      this.stats.worstTrade = profit;
    }
    
    // ✨ NEW: Trigger cooldown if consecutive losses reached
    if (this.consecutiveLosses >= this.riskManagement.maxConsecutiveLosses) {
      this.riskManagement.isInCooldown = true;
      this.riskManagement.cooldownStartTime = new Date();
      this.riskManagement.cooldownReason = `${this.consecutiveLosses}x consecutive losses detected`;
      
      console.log(`🛑 COOLDOWN TRIGGERED for user ${this.userId}: ${this.riskManagement.cooldownReason}`);
      console.log(`   Cooldown period: ${this.riskManagement.cooldownPeriodHours} hours`);
    }
  }
  
  // Update calculated stats
  this.stats.winRate = this.stats.winningTrades / this.stats.totalTrades;
  this.stats.netProfit = this.stats.totalProfit - this.stats.totalLoss;
  this.stats.avgProfit = this.stats.totalProfit / (this.stats.winningTrades || 1);
  this.stats.avgLoss = this.stats.totalLoss / (this.stats.losingTrades || 1);
  
  this.weeklyProfitLoss += profit;
  this.lastTradeTime = new Date();
  this.lastActive = new Date();
  
  return this.save();
};

// Method to check if bot can trade
UserBotSchema.methods.canTrade = function(): { allowed: boolean; reason?: string } {
  if (this.status !== 'active') {
    return { allowed: false, reason: 'Bot is not active' };
  }
  
  if (this.lastBalanceCheck.gasFeeBalance < this.aiConfig.minGasFeeBalance) {
    return { allowed: false, reason: `Gas fee balance below minimum ($${this.aiConfig.minGasFeeBalance})` };
  }
  
  // ✨ NEW: Check cooldown status
  if (this.riskManagement.isInCooldown) {
    const cooldownEnd = new Date(this.riskManagement.cooldownStartTime!.getTime() + this.riskManagement.cooldownPeriodHours * 60 * 60 * 1000);
    const now = new Date();
    
    if (now < cooldownEnd) {
      const remainingHours = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
      return { 
        allowed: false, 
        reason: `🛑 COOLDOWN MODE: ${this.riskManagement.cooldownReason} | Remaining: ${remainingHours}h` 
      };
    } else {
      // Cooldown expired, reset
      this.riskManagement.isInCooldown = false;
      this.riskManagement.cooldownStartTime = null;
      this.riskManagement.cooldownReason = '';
      this.consecutiveLosses = 0;
      this.save(); // Auto-save to persist cooldown reset
    }
  }
  
  // ✨ NEW: Adaptive daily trade limit based on win rate
  const currentWinRate = this.stats.winRate || 0;
  const adaptiveLimit = currentWinRate >= this.riskManagement.winRateThreshold
    ? this.riskManagement.maxDailyTradesHighWinRate
    : this.riskManagement.maxDailyTradesLowWinRate;
  
  if (this.dailyTradeCount >= adaptiveLimit) {
    const limitType = currentWinRate >= this.riskManagement.winRateThreshold ? 'High Win Rate' : 'Low Win Rate';
    return { 
      allowed: false, 
      reason: `Daily trade limit reached (${adaptiveLimit} trades) | ${limitType} Mode (${(currentWinRate * 100).toFixed(1)}% win rate)` 
    };
  }
  
  // Legacy check (fallback)
  if (this.dailyTradeCount >= this.tradingConfig.maxDailyTrades) {
    return { allowed: false, reason: 'Daily trade limit reached' };
  }
  
  return { allowed: true };
};

// Static method to get active bots
UserBotSchema.statics.getActiveBots = async function() {
  return this.find({ status: 'active' })
    .populate('userId', 'email username')
    .sort({ lastActive: -1 });
};

// Static method to get bots with low balance
UserBotSchema.statics.getBotsWithLowBalance = async function(threshold: number = 10) {
  return this.find({
    status: 'active',
    'lastBalanceCheck.gasFeeBalance': { $lt: threshold },
  }).populate('userId', 'email username');
};

// Static method to get top performers
UserBotSchema.statics.getTopPerformers = async function(limit: number = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.winRate': -1, 'stats.netProfit': -1 })
    .limit(limit)
    .populate('userId', 'email username');
};

// Export model with correct typing
const UserBot: IUserBotModel = (mongoose.models.UserBot as IUserBotModel) || mongoose.model<IUserBot, IUserBotModel>('UserBot', UserBotSchema);

export default UserBot;
