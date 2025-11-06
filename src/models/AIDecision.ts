import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * 🧠 AIDecision Model
 * 
 * Records every AI decision made for signal evaluation.
 * Used for: Audit trail, learning, analytics, debugging.
 */

export interface IAIDecision extends Document {
  userId: mongoose.Types.ObjectId;
  userBotId: mongoose.Types.ObjectId;
  signalId: string;                    // ID from signal generator
  
  // Signal details
  signal: {
    symbol: string;
    action: 'LONG' | 'SHORT';
    technicalConfidence: number;       // 0-1 (e.g., 0.80 = 80%)
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    indicators: {
      rsi?: number;
      macd?: number;
      adx?: number;
      volume?: number;
    };
  };
  
  // Confidence breakdown (how AI calculated final score)
  confidenceBreakdown: {
    technical: number;                 // From signal (base)
    news: number;                      // News sentiment boost/penalty
    backtest: number;                  // Recent performance boost/penalty
    learning: number;                  // Pattern-based boost/penalty
    total: number;                     // Sum of all (technical + news + backtest + learning)
  };
  
  // Decision made by AI
  decision: 'EXECUTE' | 'SKIP';
  reason: string;                      // Human-readable explanation
  
  // News context (if available)
  newsContext?: {
    sentiment: number;                 // -1 (bearish) to 1 (bullish)
    headlines: string[];
    sources: string[];
    impactScore: number;               // How much news affected decision
  };
  
  // Backtest context (recent performance)
  backtestContext?: {
    recentWinRate: number;
    recentTrades: number;
    avgProfit: number;
    avgLoss: number;
    performanceScore: number;          // How much backtest affected decision
  };
  
  // Learning context (pattern matching)
  learningContext?: {
    patternsMatched: string[];         // List of pattern IDs matched
    patternsAvoided: string[];         // Loss patterns detected
    confidenceAdjustment: number;      // How much patterns affected decision
  };
  
  // Execution details (if executed)
  execution?: {
    executedAt: Date;
    positionId: string;                // Binance order ID
    entryPrice: number;
    size: number;
    leverage: number;
    marginUsed: number;
    
    // Result (filled after position closes)
    result?: 'WIN' | 'LOSS';
    exitPrice?: number;
    exitTime?: Date;
    profit?: number;
    profitPercent?: number;
    duration?: number;                 // Minutes
    exitType?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_PROFIT' | 'TRAILING_LOSS' | 'EMERGENCY_EXIT' | 'MANUAL';
  };
  
  // AI cost tracking
  aiCost: number;                      // Cost in USD for this decision (e.g., $0.001)
  provider: string;                    // 'deepseek' | 'openai' | 'claude'
  aiModel: string;                     // 'deepseek-chat' | 'gpt-3.5-turbo' (renamed from 'model' to avoid conflict)
  
  // Balance at decision time
  balanceSnapshot: {
    binanceBalance: number;
    gasFeeBalance: number;
    availableMargin: number;
  };
  
  // Timestamps
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  recordExecution(positionId: string, entryPrice: number, size: number, leverage: number, marginUsed: number): Promise<IAIDecision>;
  recordResult(result: 'WIN' | 'LOSS', exitPrice: number, profit: number, exitType: string): Promise<IAIDecision>;
}

// Interface for AIDecision Model (static methods)
export interface IAIDecisionModel extends Model<IAIDecision> {
  getByUser(userId: mongoose.Types.ObjectId, options?: any): Promise<IAIDecision[]>;
  getTodayDecisions(): Promise<IAIDecision[]>;
  getStats(userId?: mongoose.Types.ObjectId, period?: { start: Date; end: Date }): Promise<any>;
}

const AIDecisionSchema = new Schema<IAIDecision, IAIDecisionModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    userBotId: {
      type: Schema.Types.ObjectId,
      ref: 'UserBot',
      required: true,
      index: true,
    },
    
    signalId: {
      type: String,
      required: true,
      index: true,
    },
    
    signal: {
      symbol: { type: String, required: true, index: true },
      action: { type: String, enum: ['LONG', 'SHORT'], required: true },
      technicalConfidence: { type: Number, required: true, min: 0, max: 1 },
      entryPrice: { type: Number, required: true },
      stopLoss: { type: Number, required: true },
      takeProfit: { type: Number, required: true },
      indicators: {
        rsi: Number,
        macd: Number,
        adx: Number,
        volume: Number,
      },
    },
    
    confidenceBreakdown: {
      technical: { type: Number, required: true },
      news: { type: Number, default: 0 },
      backtest: { type: Number, default: 0 },
      learning: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    
    decision: {
      type: String,
      enum: ['EXECUTE', 'SKIP'],
      required: true,
      index: true,
    },
    
    reason: {
      type: String,
      required: true,
    },
    
    newsContext: {
      sentiment: { type: Number, min: -1, max: 1 },
      headlines: [String],
      sources: [String],
      impactScore: Number,
    },
    
    backtestContext: {
      recentWinRate: Number,
      recentTrades: Number,
      avgProfit: Number,
      avgLoss: Number,
      performanceScore: Number,
    },
    
    learningContext: {
      patternsMatched: [String],
      patternsAvoided: [String],
      confidenceAdjustment: Number,
    },
    
    execution: {
      executedAt: Date,
      positionId: String,
      entryPrice: Number,
      size: Number,
      leverage: Number,
      marginUsed: Number,
      
      result: { type: String, enum: ['WIN', 'LOSS'] },
      exitPrice: Number,
      exitTime: Date,
      profit: Number,
      profitPercent: Number,
      duration: Number,
      exitType: {
        type: String,
        enum: ['TAKE_PROFIT', 'STOP_LOSS', 'TRAILING_PROFIT', 'TRAILING_LOSS', 'EMERGENCY_EXIT', 'MANUAL'],
      },
    },
    
    aiCost: {
      type: Number,
      required: true,
      default: 0.001, // DeepSeek default cost
    },
    
    provider: {
      type: String,
      default: 'deepseek',
      enum: ['deepseek', 'openai', 'claude', 'local'],
    },
    
    aiModel: {
      type: String,
      default: 'deepseek-chat',
    },
    
    balanceSnapshot: {
      binanceBalance: { type: Number, required: true },
      gasFeeBalance: { type: Number, required: true },
      availableMargin: { type: Number, required: true },
    },
    
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'aidecisions',
  }
);

// Indexes for performance
AIDecisionSchema.index({ userId: 1, timestamp: -1 });
AIDecisionSchema.index({ decision: 1, timestamp: -1 });
AIDecisionSchema.index({ 'signal.symbol': 1, timestamp: -1 });
AIDecisionSchema.index({ 'execution.result': 1 });

// Virtual for execution rate
AIDecisionSchema.virtual('wasExecuted').get(function() {
  return this.decision === 'EXECUTE';
});

// Virtual for had result
AIDecisionSchema.virtual('hasResult').get(function() {
  return !!this.execution?.result;
});

// Method to record execution
AIDecisionSchema.methods.recordExecution = async function(
  positionId: string,
  entryPrice: number,
  size: number,
  leverage: number,
  marginUsed: number
) {
  this.execution = {
    executedAt: new Date(),
    positionId,
    entryPrice,
    size,
    leverage,
    marginUsed,
  };
  return this.save();
};

// Method to record result
AIDecisionSchema.methods.recordResult = async function(
  result: 'WIN' | 'LOSS',
  exitPrice: number,
  profit: number,
  exitType: string
) {
  if (!this.execution) {
    throw new Error('Cannot record result for non-executed decision');
  }
  
  const duration = Math.floor(
    (new Date().getTime() - this.execution.executedAt.getTime()) / 60000
  );
  
  const profitPercent = ((exitPrice - this.execution.entryPrice) / this.execution.entryPrice) * 100;
  
  this.execution.result = result;
  this.execution.exitPrice = exitPrice;
  this.execution.exitTime = new Date();
  this.execution.profit = profit;
  this.execution.profitPercent = profitPercent;
  this.execution.duration = duration;
  this.execution.exitType = exitType as any;
  
  return this.save();
};

// Static method to get decisions by user
AIDecisionSchema.statics.getByUser = async function(
  userId: mongoose.Types.ObjectId,
  options?: { limit?: number; decision?: 'EXECUTE' | 'SKIP' }
) {
  const query: any = { userId };
  if (options?.decision) {
    query.decision = options.decision;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options?.limit || 50);
};

// Static method to get today's decisions
AIDecisionSchema.statics.getTodayDecisions = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.find({
    timestamp: { $gte: today },
  }).sort({ timestamp: -1 });
};

// Static method to get statistics
AIDecisionSchema.statics.getStats = async function(
  userId?: mongoose.Types.ObjectId,
  period?: { start: Date; end: Date }
) {
  const query: any = {};
  if (userId) query.userId = userId;
  if (period) {
    query.timestamp = { $gte: period.start, $lte: period.end };
  }
  
  const total = await this.countDocuments(query);
  const executed = await this.countDocuments({ ...query, decision: 'EXECUTE' });
  const skipped = await this.countDocuments({ ...query, decision: 'SKIP' });
  
  const withResults = await this.find({
    ...query,
    'execution.result': { $exists: true },
  });
  
  const wins = withResults.filter((d: any) => d.execution?.result === 'WIN').length;
  const losses = withResults.filter((d: any) => d.execution?.result === 'LOSS').length;
  const winRate = withResults.length > 0 ? wins / withResults.length : 0;
  
  const totalCost = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$aiCost' } } },
  ]);
  
  return {
    total,
    executed,
    skipped,
    executionRate: total > 0 ? executed / total : 0,
    wins,
    losses,
    winRate,
    totalAICost: totalCost[0]?.total || 0,
  };
};

// Export model with correct typing
const AIDecision: IAIDecisionModel = (mongoose.models.AIDecision as IAIDecisionModel) || mongoose.model<IAIDecision, IAIDecisionModel>('AIDecision', AIDecisionSchema);

export default AIDecision;
