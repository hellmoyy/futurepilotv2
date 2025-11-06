import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * 📰 NewsEvent Model
 * 
 * Stores crypto news with AI sentiment analysis.
 * Used for: Decision-making context, News Monitor tab, sentiment tracking.
 */

export interface INewsEvent extends Document {
  // News content
  title: string;
  description?: string;
  content?: string;
  url: string;
  imageUrl?: string;
  
  // Source information
  source: string;                      // 'CoinDesk', 'CoinTelegraph', 'Reuters'
  author?: string;
  publishedAt: Date;
  
  // AI Sentiment analysis
  sentiment: number;                   // -1 (very bearish) to 1 (very bullish)
  sentimentLabel: 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish';
  confidence: number;                  // 0-1 (how confident AI is about sentiment)
  
  // Impact assessment
  impact: 'low' | 'medium' | 'high';   // How impactful this news is
  impactScore: number;                 // 0-100 numeric impact score
  
  // Categorization
  keywords: string[];                  // ['bitcoin', 'etf', 'sec']
  categories: string[];                // ['regulation', 'adoption', 'technology']
  mentionedSymbols: string[];          // ['BTCUSDT', 'ETHUSDT']
  
  // Metrics
  impactedDecisions: number;           // How many decisions considered this news
  relevanceScore: number;              // 0-1 (how relevant to trading)
  
  // AI processing
  aiProcessedAt?: Date;
  aiProvider?: string;                 // 'deepseek' | 'openai'
  aiCost?: number;
  
  // Metadata
  language: string;                    // 'en', 'id'
  region?: string;                     // 'global', 'us', 'asia'
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementImpact(): Promise<INewsEvent>;
}

// Interface for NewsEvent Model (static methods)
export interface INewsEventModel extends Model<INewsEvent> {
  calculateSentimentLabel(sentiment: number): string;
  getRecentNews(options?: any): Promise<INewsEvent[]>;
  getForDecision(symbol: string, hoursBack?: number): Promise<INewsEvent[]>;
  getAggregateSentiment(symbol?: string, hoursBack?: number): Promise<any>;
  getStats(period?: { start: Date; end: Date }): Promise<any>;
}

const NewsEventSchema = new Schema<INewsEvent, INewsEventModel>(
  {
    title: {
      type: String,
      required: true,
      index: 'text',                   // Text search index
    },
    
    description: {
      type: String,
      index: 'text',
    },
    
    content: {
      type: String,
    },
    
    url: {
      type: String,
      required: true,
      unique: true,                    // Prevent duplicates
      index: true,
    },
    
    imageUrl: {
      type: String,
    },
    
    source: {
      type: String,
      required: true,
      index: true,
    },
    
    author: {
      type: String,
    },
    
    publishedAt: {
      type: Date,
      required: true,
      index: true,
    },
    
    sentiment: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
      index: true,
    },
    
    sentimentLabel: {
      type: String,
      enum: ['very_bearish', 'bearish', 'neutral', 'bullish', 'very_bullish'],
      required: true,
      index: true,
    },
    
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      index: true,
    },
    
    impactScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
    
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    
    mentionedSymbols: {
      type: [String],
      default: [],
      index: true,
    },
    
    impactedDecisions: {
      type: Number,
      default: 0,
    },
    
    relevanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    
    aiProcessedAt: {
      type: Date,
    },
    
    aiProvider: {
      type: String,
      enum: ['deepseek', 'openai', 'claude'],
    },
    
    aiCost: {
      type: Number,
      default: 0,
    },
    
    language: {
      type: String,
      default: 'en',
    },
    
    region: {
      type: String,
      enum: ['global', 'us', 'asia', 'europe'],
    },
  },
  {
    timestamps: true,
    collection: 'newsevents',
  }
);

// Compound indexes for performance
NewsEventSchema.index({ publishedAt: -1, sentiment: 1 });
NewsEventSchema.index({ impact: 1, publishedAt: -1 });
NewsEventSchema.index({ categories: 1, publishedAt: -1 });
NewsEventSchema.index({ mentionedSymbols: 1, publishedAt: -1 });

// Virtual for sentiment emoji
NewsEventSchema.virtual('sentimentEmoji').get(function() {
  switch (this.sentimentLabel) {
    case 'very_bearish': return '🔴';
    case 'bearish': return '🟠';
    case 'neutral': return '⚪';
    case 'bullish': return '🟢';
    case 'very_bullish': return '🟢🟢';
    default: return '⚪';
  }
});

// Virtual for impact emoji
NewsEventSchema.virtual('impactEmoji').get(function() {
  switch (this.impact) {
    case 'low': return '🔵';
    case 'medium': return '🟡';
    case 'high': return '🔴';
    default: return '⚪';
  }
});

// Method to increment impact counter
NewsEventSchema.methods.incrementImpact = async function() {
  this.impactedDecisions += 1;
  return this.save();
};

// Method to calculate sentiment label from score
NewsEventSchema.statics.calculateSentimentLabel = function(sentiment: number): string {
  if (sentiment <= -0.6) return 'very_bearish';
  if (sentiment <= -0.2) return 'bearish';
  if (sentiment <= 0.2) return 'neutral';
  if (sentiment <= 0.6) return 'bullish';
  return 'very_bullish';
};

// Static method to get recent news
NewsEventSchema.statics.getRecentNews = async function(
  options?: {
    limit?: number;
    sentiment?: 'bearish' | 'bullish' | 'neutral';
    impact?: 'low' | 'medium' | 'high';
    symbol?: string;
    categories?: string[];
  }
) {
  const query: any = {};
  
  if (options?.sentiment) {
    if (options.sentiment === 'bearish') {
      query.sentiment = { $lt: -0.2 };
    } else if (options.sentiment === 'bullish') {
      query.sentiment = { $gt: 0.2 };
    } else {
      query.sentiment = { $gte: -0.2, $lte: 0.2 };
    }
  }
  
  if (options?.impact) {
    query.impact = options.impact;
  }
  
  if (options?.symbol) {
    query.mentionedSymbols = options.symbol;
  }
  
  if (options?.categories && options.categories.length > 0) {
    query.categories = { $in: options.categories };
  }
  
  return this.find(query)
    .sort({ publishedAt: -1 })
    .limit(options?.limit || 50);
};

// Static method to get news for decision context
NewsEventSchema.statics.getForDecision = async function(
  symbol: string,
  hoursBack: number = 24
) {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  
  return this.find({
    publishedAt: { $gte: cutoffTime },
    $or: [
      { mentionedSymbols: symbol },
      { keywords: { $in: ['bitcoin', 'btc', 'crypto', 'cryptocurrency'] } },
      { impact: 'high' }, // Always include high-impact news
    ],
  }).sort({ publishedAt: -1 });
};

// Static method to calculate aggregate sentiment
NewsEventSchema.statics.getAggregateSentiment = async function(
  symbol?: string,
  hoursBack: number = 24
) {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  
  const query: any = {
    publishedAt: { $gte: cutoffTime },
  };
  
  if (symbol) {
    query.$or = [
      { mentionedSymbols: symbol },
      { impact: 'high' },
    ];
  }
  
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgSentiment: { $avg: '$sentiment' },
        count: { $sum: 1 },
        bullish: {
          $sum: { $cond: [{ $gt: ['$sentiment', 0.2] }, 1, 0] },
        },
        bearish: {
          $sum: { $cond: [{ $lt: ['$sentiment', -0.2] }, 1, 0] },
        },
        neutral: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$sentiment', -0.2] },
                  { $lte: ['$sentiment', 0.2] },
                ],
              },
              1,
              0,
            ],
          },
        },
        highImpact: {
          $sum: { $cond: [{ $eq: ['$impact', 'high'] }, 1, 0] },
        },
      },
    },
  ]);
  
  if (result.length === 0) {
    return {
      avgSentiment: 0,
      count: 0,
      bullish: 0,
      bearish: 0,
      neutral: 0,
      highImpact: 0,
      label: 'neutral',
    };
  }
  
  const data = result[0];
  
  // Calculate sentiment label
  let label = 'neutral';
  if (data.avgSentiment <= -0.6) label = 'very_bearish';
  else if (data.avgSentiment <= -0.2) label = 'bearish';
  else if (data.avgSentiment <= 0.2) label = 'neutral';
  else if (data.avgSentiment <= 0.6) label = 'bullish';
  else label = 'very_bullish';
  
  return {
    ...data,
    label,
  };
};

// Static method to get statistics
NewsEventSchema.statics.getStats = async function(period?: { start: Date; end: Date }) {
  const query: any = {};
  if (period) {
    query.publishedAt = { $gte: period.start, $lte: period.end };
  }
  
  const total = await this.countDocuments(query);
  const byImpact = await this.aggregate([
    { $match: query },
    { $group: { _id: '$impact', count: { $sum: 1 } } },
  ]);
  
  const bySentiment = await this.aggregate([
    { $match: query },
    { $group: { _id: '$sentimentLabel', count: { $sum: 1 } } },
  ]);
  
  const totalImpactedDecisions = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$impactedDecisions' } } },
  ]);
  
  return {
    total,
    byImpact: byImpact.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    bySentiment: bySentiment.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    totalImpactedDecisions: totalImpactedDecisions[0]?.total || 0,
  };
};

// Export model with correct typing
const NewsEvent: INewsEventModel = (mongoose.models.NewsEvent as INewsEventModel) || mongoose.model<INewsEvent, INewsEventModel>('NewsEvent', NewsEventSchema);

export default NewsEvent;
