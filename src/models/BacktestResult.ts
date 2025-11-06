import mongoose, { Schema, Document } from 'mongoose';

// Trade sample for educational purposes
export interface ITradeSample {
  id: number;
  time: string;
  type: 'LONG' | 'SHORT' | 'BUY' | 'SELL';
  entry: number;
  exit: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  exitType: string;
  duration?: string;
  icon?: string;
}

export interface IBacktestResult extends Document {
  // Configuration Reference
  configId: mongoose.Types.ObjectId;
  configName: string;
  
  // Backtest Parameters
  symbol: string;
  period: '1m' | '2m' | '3m' | string;
  initialBalance: number;
  
  // Performance Metrics
  finalBalance: number;
  totalProfit: number;
  roi: number;
  totalTrades: number;
  
  // Win/Loss Stats
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  
  // Trade Statistics
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
  avgWinPercent: number;
  avgLossPercent: number;
  
  // Sample Trades for Learning (6 trades only)
  sampleTrades: {
    bestWin?: ITradeSample;      // Highest profit trade
    avgWin?: ITradeSample;       // Median winning trade
    worstLoss?: ITradeSample;    // Largest loss trade
    avgLoss?: ITradeSample;      // Median losing trade
    firstTrade?: ITradeSample;   // Strategy entry
    lastTrade?: ITradeSample;    // Strategy exit
  };
  
  // Execution Info
  executionTime: number; // milliseconds
  status: 'completed' | 'failed' | 'running';
  errorMessage?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const TradeSampleSchema = new Schema<ITradeSample>({
  id: { type: Number, required: true },
  time: { type: String, required: true },
  type: { type: String, required: true, enum: ['LONG', 'SHORT', 'BUY', 'SELL'] },
  entry: { type: Number, required: true },
  exit: { type: Number, required: true },
  size: { type: Number, required: true },
  pnl: { type: Number, required: true },
  pnlPercent: { type: Number, required: true },
  exitType: { type: String, required: true },
  duration: { type: String },
  icon: { type: String }
}, { _id: false });

const BacktestResultSchema = new Schema<IBacktestResult>({
  // Configuration Reference
  configId: { 
    type: Schema.Types.ObjectId, 
    ref: 'SignalCenterConfig',
    required: true,
    index: true
  },
  configName: { type: String, required: true },
  
  // Backtest Parameters
  symbol: { 
    type: String, 
    required: true,
    index: true
  },
  period: { 
    type: String, 
    required: true,
    enum: ['1m', '2m', '3m', '1w', '1M', '3M', '6M', '1Y'],
    default: '1m'
  },
  initialBalance: { type: Number, required: true, default: 10000 },
  
  // Performance Metrics
  finalBalance: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
  roi: { type: Number, required: true, index: true }, // Index for sorting by performance
  totalTrades: { type: Number, required: true },
  
  // Win/Loss Stats
  winningTrades: { type: Number, required: true, default: 0 },
  losingTrades: { type: Number, required: true, default: 0 },
  winRate: { type: Number, required: true, default: 0 },
  profitFactor: { type: Number, required: true, default: 0 },
  
  // Trade Statistics
  largestWin: { type: Number, default: 0 },
  largestLoss: { type: Number, default: 0 },
  avgWin: { type: Number, default: 0 },
  avgLoss: { type: Number, default: 0 },
  avgWinPercent: { type: Number, default: 0 },
  avgLossPercent: { type: Number, default: 0 },
  
  // Sample Trades for Learning
  sampleTrades: {
    bestWin: { type: TradeSampleSchema },
    avgWin: { type: TradeSampleSchema },
    worstLoss: { type: TradeSampleSchema },
    avgLoss: { type: TradeSampleSchema },
    firstTrade: { type: TradeSampleSchema },
    lastTrade: { type: TradeSampleSchema }
  },
  
  // Execution Info
  executionTime: { type: Number, required: true }, // milliseconds
  status: { 
    type: String, 
    required: true,
    enum: ['completed', 'failed', 'running'],
    default: 'running'
  },
  errorMessage: { type: String },
  
}, {
  timestamps: true, // Auto-creates createdAt and updatedAt
  collection: 'backtest_results'
});

// Indexes for performance
BacktestResultSchema.index({ createdAt: -1 }); // Sort by newest
BacktestResultSchema.index({ symbol: 1, createdAt: -1 }); // Per-symbol history
BacktestResultSchema.index({ configId: 1, createdAt: -1 }); // Per-config history

// Static method: Get recent results
BacktestResultSchema.statics.getRecentResults = async function(
  limit: number = 30,
  symbol?: string
) {
  const query: any = { status: 'completed' };
  if (symbol) query.symbol = symbol;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('configId', 'name description');
};

// Static method: Get performance summary
BacktestResultSchema.statics.getPerformanceSummary = async function(
  days: number = 7
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const results = await this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$symbol',
        avgROI: { $avg: '$roi' },
        totalRuns: { $sum: 1 },
        avgWinRate: { $avg: '$winRate' },
        bestROI: { $max: '$roi' },
        worstROI: { $min: '$roi' }
      }
    },
    {
      $sort: { avgROI: -1 }
    }
  ]);
  
  return results;
};

// Static method: Cleanup old results (keep last 100 per symbol)
BacktestResultSchema.statics.cleanupOldResults = async function() {
  const symbols = await this.distinct('symbol');
  
  for (const symbol of symbols) {
    const results = await this.find({ symbol })
      .sort({ createdAt: -1 })
      .skip(100)
      .select('_id')
      .lean();
    
    const idsToDelete = results.map((r: { _id: mongoose.Types.ObjectId }) => r._id);
    
    if (idsToDelete.length > 0) {
      await this.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`🧹 Cleaned up ${idsToDelete.length} old backtest results for ${symbol}`);
    }
  }
};

export default mongoose.models.BacktestResult || 
  mongoose.model<IBacktestResult>('BacktestResult', BacktestResultSchema);
