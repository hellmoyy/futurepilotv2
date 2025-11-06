import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * 🧠 LearningPattern Model
 * 
 * Stores identified win/loss patterns for bot learning system.
 * Used for: Pattern-based decision adjustments, learning insights, adaptive trading.
 */

export interface ILearningPattern extends Document {
  userId: mongoose.Types.ObjectId;     // User this pattern belongs to
  userBotId: mongoose.Types.ObjectId;  // Bot instance
  
  // Pattern identification
  pattern: {
    type: 'loss' | 'win';
    description: string;               // "RSI > 65 + High volatility in Asian hours"
    
    // Market conditions
    conditions: {
      // Technical indicators
      rsi?: {
        min?: number;
        max?: number;
      };
      macd?: {
        min?: number;
        max?: number;
      };
      adx?: {
        min?: number;
        max?: number;
      };
      
      // Market state
      volatility?: 'low' | 'medium' | 'high';
      trend?: 'up' | 'down' | 'sideways';
      
      // Time patterns
      timeOfDay?: number[];            // [14, 15, 16] = 2PM-4PM UTC
      dayOfWeek?: number[];            // [1, 2, 3] = Mon, Tue, Wed
      
      // News context
      newsType?: string[];             // ['regulation', 'central_bank']
      newsSentiment?: 'bearish' | 'bullish' | 'neutral';
      
      // Symbol specific
      symbol?: string;                 // 'BTCUSDT'
    };
  };
  
  // Performance metrics
  occurrences: number;                 // Total times this pattern appeared
  successCount: number;                // How many resulted in profit
  failureCount: number;                // How many resulted in loss
  successRate: number;                 // successCount / occurrences
  
  // Financial impact
  totalProfit: number;                 // Sum of all profits
  totalLoss: number;                   // Sum of all losses (absolute)
  netProfitLoss: number;               // totalProfit - totalLoss
  avgProfit: number;                   // Average profit per successful trade
  avgLoss: number;                     // Average loss per failed trade
  
  // Confidence metrics
  confidence: number;                  // 0-1 (how sure we are about this pattern)
  strength: number;                    // 0-100 (how strong this pattern is)
  
  // Usage tracking
  timesMatched: number;                // How many times pattern was detected
  timesAvoided: number;                // How many times bot skipped due to this pattern
  avoidanceSuccessRate: number;        // How many avoided trades would have been losses
  
  // Learning metadata
  firstSeen: Date;
  lastSeen: Date;
  lastUpdated: Date;
  isActive: boolean;                   // Can be disabled if pattern becomes obsolete
  
  // AI analysis
  aiGenerated: boolean;                // Was this pattern discovered by AI?
  aiConfidence?: number;
  aiReasoning?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  recordOccurrence(result: 'WIN' | 'LOSS', profit: number): Promise<ILearningPattern>;
  recordMatch(avoided?: boolean): Promise<ILearningPattern>;
  recordAvoidanceSuccess(): Promise<ILearningPattern>;
  matchesConditions(marketConditions: any): boolean;
}

// Interface for LearningPattern Model (static methods)
export interface ILearningPatternModel extends Model<ILearningPattern> {
  getByUser(userId: mongoose.Types.ObjectId, options?: any): Promise<ILearningPattern[]>;
  getForDecision(userId: mongoose.Types.ObjectId, marketConditions: any): Promise<ILearningPattern[]>;
  getTopLossPatterns(userId: mongoose.Types.ObjectId, limit?: number): Promise<ILearningPattern[]>;
  getTopWinPatterns(userId: mongoose.Types.ObjectId, limit?: number): Promise<ILearningPattern[]>;
  getStats(userId?: mongoose.Types.ObjectId): Promise<any>;
}

const LearningPatternSchema = new Schema<ILearningPattern, ILearningPatternModel>(
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
    
    pattern: {
      type: {
        type: String,
        enum: ['loss', 'win'],
        required: true,
        index: true,
      },
      
      description: {
        type: String,
        required: true,
      },
      
      conditions: {
        rsi: {
          min: Number,
          max: Number,
        },
        macd: {
          min: Number,
          max: Number,
        },
        adx: {
          min: Number,
          max: Number,
        },
        volatility: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
        trend: {
          type: String,
          enum: ['up', 'down', 'sideways'],
        },
        timeOfDay: [Number],
        dayOfWeek: [Number],
        newsType: [String],
        newsSentiment: {
          type: String,
          enum: ['bearish', 'bullish', 'neutral'],
        },
        symbol: String,
      },
    },
    
    occurrences: {
      type: Number,
      required: true,
      default: 0,
    },
    
    successCount: {
      type: Number,
      required: true,
      default: 0,
    },
    
    failureCount: {
      type: Number,
      required: true,
      default: 0,
    },
    
    successRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    
    totalProfit: {
      type: Number,
      default: 0,
    },
    
    totalLoss: {
      type: Number,
      default: 0,
    },
    
    netProfitLoss: {
      type: Number,
      default: 0,
    },
    
    avgProfit: {
      type: Number,
      default: 0,
    },
    
    avgLoss: {
      type: Number,
      default: 0,
    },
    
    confidence: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    
    strength: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    
    timesMatched: {
      type: Number,
      default: 0,
    },
    
    timesAvoided: {
      type: Number,
      default: 0,
    },
    
    avoidanceSuccessRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    
    aiReasoning: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'learningpatterns',
  }
);

// Indexes for performance
LearningPatternSchema.index({ userId: 1, 'pattern.type': 1 });
LearningPatternSchema.index({ userBotId: 1, isActive: 1 });
LearningPatternSchema.index({ confidence: -1, strength: -1 });
LearningPatternSchema.index({ 'pattern.conditions.symbol': 1 });

// Virtual for pattern effectiveness
LearningPatternSchema.virtual('effectiveness').get(function() {
  if (this.pattern.type === 'loss') {
    return this.avoidanceSuccessRate; // Higher is better (more losses avoided)
  } else {
    return this.successRate;          // Higher is better (more wins)
  }
});

// Virtual for age in days
LearningPatternSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.firstSeen.getTime()) / (1000 * 60 * 60 * 24));
});

// Method to record occurrence
LearningPatternSchema.methods.recordOccurrence = async function(
  result: 'WIN' | 'LOSS',
  profit: number
) {
  this.occurrences += 1;
  this.lastSeen = new Date();
  this.lastUpdated = new Date();
  
  if (result === 'WIN') {
    this.successCount += 1;
    this.totalProfit += profit;
    this.avgProfit = this.totalProfit / this.successCount;
  } else {
    this.failureCount += 1;
    this.totalLoss += Math.abs(profit);
    this.avgLoss = this.totalLoss / this.failureCount;
  }
  
  // Recalculate success rate
  this.successRate = this.successCount / this.occurrences;
  this.netProfitLoss = this.totalProfit - this.totalLoss;
  
  // Update confidence (more occurrences = higher confidence)
  // Max confidence at 20+ occurrences
  this.confidence = Math.min(this.occurrences / 20, 1);
  
  // Update strength based on success rate difference from 50%
  // Loss pattern: Lower success rate = higher strength
  // Win pattern: Higher success rate = higher strength
  if (this.pattern.type === 'loss') {
    this.strength = Math.round((0.5 - this.successRate) * 200);
  } else {
    this.strength = Math.round((this.successRate - 0.5) * 200);
  }
  
  this.strength = Math.max(0, Math.min(100, this.strength));
  
  return this.save();
};

// Method to record match (pattern detected)
LearningPatternSchema.methods.recordMatch = async function(avoided: boolean = false) {
  this.timesMatched += 1;
  
  if (avoided) {
    this.timesAvoided += 1;
  }
  
  return this.save();
};

// Method to record avoidance success (avoided trade that would have been loss)
LearningPatternSchema.methods.recordAvoidanceSuccess = async function() {
  // This is called when we later verify avoided trade would have been loss
  if (this.timesAvoided > 0) {
    this.avoidanceSuccessRate = (this.avoidanceSuccessRate * (this.timesAvoided - 1) + 1) / this.timesAvoided;
  }
  
  return this.save();
};

// Method to check if pattern matches conditions
LearningPatternSchema.methods.matchesConditions = function(
  marketConditions: {
    rsi?: number;
    macd?: number;
    adx?: number;
    volatility?: 'low' | 'medium' | 'high';
    trend?: 'up' | 'down' | 'sideways';
    timeOfDay?: number;
    dayOfWeek?: number;
    newsType?: string[];
    newsSentiment?: 'bearish' | 'bullish' | 'neutral';
    symbol?: string;
  }
): boolean {
  const cond = this.pattern.conditions;
  
  // Check RSI range
  if (cond.rsi && marketConditions.rsi !== undefined) {
    if (cond.rsi.min && marketConditions.rsi < cond.rsi.min) return false;
    if (cond.rsi.max && marketConditions.rsi > cond.rsi.max) return false;
  }
  
  // Check MACD range
  if (cond.macd && marketConditions.macd !== undefined) {
    if (cond.macd.min && marketConditions.macd < cond.macd.min) return false;
    if (cond.macd.max && marketConditions.macd > cond.macd.max) return false;
  }
  
  // Check ADX range
  if (cond.adx && marketConditions.adx !== undefined) {
    if (cond.adx.min && marketConditions.adx < cond.adx.min) return false;
    if (cond.adx.max && marketConditions.adx > cond.adx.max) return false;
  }
  
  // Check volatility
  if (cond.volatility && marketConditions.volatility !== cond.volatility) return false;
  
  // Check trend
  if (cond.trend && marketConditions.trend !== cond.trend) return false;
  
  // Check time of day
  if (cond.timeOfDay && cond.timeOfDay.length > 0 && marketConditions.timeOfDay !== undefined) {
    if (!cond.timeOfDay.includes(marketConditions.timeOfDay)) return false;
  }
  
  // Check day of week
  if (cond.dayOfWeek && cond.dayOfWeek.length > 0 && marketConditions.dayOfWeek !== undefined) {
    if (!cond.dayOfWeek.includes(marketConditions.dayOfWeek)) return false;
  }
  
  // Check news type (any match)
  if (cond.newsType && cond.newsType.length > 0 && marketConditions.newsType && marketConditions.newsType.length > 0) {
    const hasMatch = cond.newsType.some((type: string) => marketConditions.newsType!.includes(type));
    if (!hasMatch) return false;
  }
  
  // Check news sentiment
  if (cond.newsSentiment && marketConditions.newsSentiment !== cond.newsSentiment) return false;
  
  // Check symbol
  if (cond.symbol && marketConditions.symbol !== cond.symbol) return false;
  
  return true;
};

// Static method to get patterns for user
LearningPatternSchema.statics.getByUser = async function(
  userId: mongoose.Types.ObjectId,
  options?: {
    type?: 'loss' | 'win';
    isActive?: boolean;
    minConfidence?: number;
  }
) {
  const query: any = { userId };
  
  if (options?.type) query['pattern.type'] = options.type;
  if (options?.isActive !== undefined) query.isActive = options.isActive;
  if (options?.minConfidence) query.confidence = { $gte: options.minConfidence };
  
  return this.find(query)
    .sort({ confidence: -1, strength: -1 })
    .populate('userBotId');
};

// Static method to get patterns for decision
LearningPatternSchema.statics.getForDecision = async function(
  userId: mongoose.Types.ObjectId,
  marketConditions: any
) {
  const patterns = await this.find({
    userId,
    isActive: true,
    confidence: { $gte: 0.3 }, // Only use patterns with 30%+ confidence
  });
  
  // Filter patterns that match current conditions
  return patterns.filter((pattern: any) => pattern.matchesConditions(marketConditions));
};

// Static method to get top loss patterns (most dangerous)
LearningPatternSchema.statics.getTopLossPatterns = async function(
  userId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.find({
    userId,
    'pattern.type': 'loss',
    isActive: true,
  })
    .sort({ strength: -1, confidence: -1 })
    .limit(limit);
};

// Static method to get top win patterns (most profitable)
LearningPatternSchema.statics.getTopWinPatterns = async function(
  userId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.find({
    userId,
    'pattern.type': 'win',
    isActive: true,
  })
    .sort({ strength: -1, confidence: -1 })
    .limit(limit);
};

// Static method to get statistics
LearningPatternSchema.statics.getStats = async function(
  userId?: mongoose.Types.ObjectId
) {
  const query: any = { isActive: true };
  if (userId) query.userId = userId;
  
  const total = await this.countDocuments(query);
  const lossPatterns = await this.countDocuments({ ...query, 'pattern.type': 'loss' });
  const winPatterns = await this.countDocuments({ ...query, 'pattern.type': 'win' });
  
  const avgConfidence = await this.aggregate([
    { $match: query },
    { $group: { _id: null, avg: { $avg: '$confidence' } } },
  ]);
  
  const totalOccurrences = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$occurrences' } } },
  ]);
  
  const totalAvoided = await this.aggregate([
    { $match: { ...query, 'pattern.type': 'loss' } },
    { $group: { _id: null, total: { $sum: '$timesAvoided' } } },
  ]);
  
  return {
    total,
    lossPatterns,
    winPatterns,
    avgConfidence: avgConfidence[0]?.avg || 0,
    totalOccurrences: totalOccurrences[0]?.total || 0,
    totalAvoided: totalAvoided[0]?.total || 0,
  };
};

// Export model with correct typing
const LearningPattern: ILearningPatternModel = (mongoose.models.LearningPattern as ILearningPatternModel) || mongoose.model<ILearningPattern, ILearningPatternModel>('LearningPattern', LearningPatternSchema);

export default LearningPattern;
