/**
 * 📡 SIGNAL CENTER TYPES
 * 
 * Type definitions for Signal Center system
 * - Signal structure
 * - Market data types
 * - Configuration types
 */

export type SignalAction = 'BUY' | 'SELL' | 'HOLD' | 'CLOSE_LONG' | 'CLOSE_SHORT';
export type SignalStrength = 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
export type SignalStatus = 'ACTIVE' | 'EXPIRED' | 'EXECUTED' | 'CANCELLED';
export type MarketRegime = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'RANGING' | 'VOLATILE';
export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

/**
 * Core Signal Structure
 */
export interface TradingSignal {
  // Identification
  id: string;
  symbol: string;
  timestamp: number;
  expiresAt: number;
  
  // Signal Details
  action: SignalAction;
  strength: SignalStrength;
  confidence: number; // 0-100
  
  // Entry/Exit Levels
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  
  // Risk Management
  riskRewardRatio: number; // e.g., 1:1, 1:2
  maxLossPercent: number; // 0.8% default
  maxProfitPercent: number; // 0.8% default
  
  // Market Context
  marketRegime: MarketRegime;
  trend: string;
  volatility: number; // ATR %
  
  // Technical Indicators
  indicators: {
    rsi: number;
    macd: {
      value: number;
      signal: number;
      histogram: number;
    };
    ema: {
      fast: number; // EMA 9
      slow: number; // EMA 21
    };
    adx: number;
    volume: {
      current: number;
      average: number;
      ratio: number; // current/average
    };
  };
  
  // Multi-Timeframe Analysis
  timeframes: {
    [key in Timeframe]?: {
      signal: SignalAction;
      confidence: number;
      trend: string;
    };
  };
  
  // Trailing Stops
  trailingStop?: {
    profitActivate: number; // +0.4%
    profitDistance: number; // 0.3%
    lossActivate: number;   // -0.3%
    lossDistance: number;   // 0.2%
  };
  
  // Metadata
  reason: string;
  strategy: string; // 'futures-scalper', 'bitcoin-pro', etc.
  status: SignalStatus;
  
  // Performance Tracking (if executed)
  executedAt?: number;
  executedPrice?: number;
  closedAt?: number;
  closedPrice?: number;
  realizedPnL?: number;
}

/**
 * Market Data (Candlestick)
 */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Signal Engine Configuration
 */
export interface SignalEngineConfig {
  // Symbols to monitor
  symbols: string[];
  
  // Timeframes
  primaryTimeframe: Timeframe;
  confirmationTimeframes: Timeframe[];
  
  // Risk Parameters (matching backtest)
  riskPerTrade: number; // 0.02 = 2%
  leverage: number; // 10
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
  
  // Signal Expiry
  signalExpiryMinutes: number; // 5 minutes default
  
  // Broadcasting
  broadcastEnabled: boolean;
  broadcastChannel: string; // 'trading-signals'
}

/**
 * Signal Analysis Result
 */
export interface SignalAnalysisResult {
  signal: TradingSignal | null;
  passed: boolean;
  filters: {
    timeCheck: { passed: boolean; reason: string };
    volumeCheck: { passed: boolean; reason: string };
    marketRegime: { passed: boolean; reason: string };
    multiTimeframe: { passed: boolean; reason: string };
    indicators: { passed: boolean; reason: string };
  };
  marketData: {
    symbol: string;
    price: number;
    volume: number;
    change24h: number;
  };
}

/**
 * Bot Decision Input (what user bot receives)
 */
export interface BotDecisionInput {
  // Signal from Signal Center
  signal: TradingSignal;
  
  // User Bot Settings
  userSettings: {
    userId: string;
    botEnabled: boolean;
    symbols: string[]; // User's allowed symbols
    maxPositions: number;
    riskMultiplier: number; // 0.5-2.0, adjust risk per user
    minConfidence: number; // Minimum signal confidence to execute
    followStrength: SignalStrength[]; // Only execute ['STRONG', 'VERY_STRONG']
    
    // Override filters
    customStopLoss?: number;
    customTakeProfit?: number;
    useTrailingStops: boolean;
  };
  
  // User Account State
  accountState: {
    balance: number;
    gasFeeBalance: number;
    activePositions: number;
    usedMargin: number;
    dailyPnL: number;
    dailyLoss: number;
  };
}

/**
 * Bot Decision Output (what user bot decides)
 */
export interface BotDecisionOutput {
  shouldExecute: boolean;
  reason: string;
  
  // If executing
  adjustedPosition?: {
    size: number;
    stopLoss: number;
    takeProfit: number;
    leverage: number;
  };
  
  // Rejection reasons
  rejectionReasons?: string[];
}

/**
 * Signal Performance Stats
 */
export interface SignalPerformanceStats {
  totalSignals: number;
  executedSignals: number;
  winningSignals: number;
  losingSignals: number;
  winRate: number; // %
  averagePnL: number;
  totalPnL: number;
  bestSignal: {
    id: string;
    pnl: number;
    timestamp: number;
  };
  worstSignal: {
    id: string;
    pnl: number;
    timestamp: number;
  };
  bySymbol: Record<string, {
    signals: number;
    winRate: number;
    totalPnL: number;
  }>;
}

/**
 * Signal Center Status
 */
export interface SignalCenterStatus {
  running: boolean;
  startedAt: number | null;
  lastSignal: number | null;
  activeSignals: number;
  totalSignalsToday: number;
  connectedBots: number;
  performance: SignalPerformanceStats;
  config: SignalEngineConfig;
}
