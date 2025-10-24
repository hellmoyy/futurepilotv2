/**
 * 🎯 TRADING ALGORITHMS CONFIGURATION
 * 
 * File ini adalah pusat kontrol untuk semua algoritma trading.
 * Edit file ini untuk mengubah behavior trading bot tanpa perlu ubah code logic.
 * 
 * ⚠️ PENTING: Backup file ini sebelum melakukan perubahan!
 */

// ============================================================================
// 📊 TECHNICAL INDICATORS SETTINGS
// ============================================================================

export const INDICATORS = {
  // RSI (Relative Strength Index)
  rsi: {
    enabled: true,
    period: 14,              // Periode RSI (default: 14)
    overbought: 70,          // Level overbought (> 70 = overbought)
    oversold: 30,            // Level oversold (< 30 = oversold)
    
    // Signal strength levels
    extremeOverbought: 80,   // Level extreme overbought
    extremeOversold: 20,     // Level extreme oversold
  },

  // MACD (Moving Average Convergence Divergence)
  macd: {
    enabled: true,
    fastPeriod: 12,          // EMA cepat (default: 12)
    slowPeriod: 26,          // EMA lambat (default: 26)
    signalPeriod: 9,         // Signal line (default: 9)
    
    // Minimum histogram untuk signal
    minHistogram: 0.0001,    // Minimum histogram value untuk generate signal
  },

  // Bollinger Bands
  bollingerBands: {
    enabled: true,
    period: 20,              // Periode SMA (default: 20)
    stdDev: 2,               // Standard deviation multiplier (default: 2)
    
    // Breakout settings
    upperBreakout: 0.02,     // % dari upper band untuk breakout signal (2%)
    lowerBreakout: 0.02,     // % dari lower band untuk breakout signal (2%)
  },

  // EMA (Exponential Moving Average)
  ema: {
    enabled: true,
    shortPeriod: 9,          // EMA pendek (default: 9)
    longPeriod: 21,          // EMA panjang (default: 21)
    
    // Crossover settings
    minCrossoverGap: 0.001,  // Minimum gap untuk valid crossover (0.1%)
  },

  // Volume Analysis
  volume: {
    enabled: true,
    period: 20,              // Periode untuk average volume
    surgeMultiplier: 2.0,    // Volume surge = avg volume * multiplier
    
    // Volume confirmation
    requireVolumeConfirmation: true, // Require volume surge untuk signal
  },

  // ATR (Average True Range) - untuk volatility
  atr: {
    enabled: true,
    period: 14,              // Periode ATR (default: 14)
    
    // Volatility levels
    lowVolatility: 0.5,      // % threshold untuk low volatility
    highVolatility: 2.0,     // % threshold untuk high volatility
  },
};

// ============================================================================
// ⚙️ TRADING STRATEGY PRESETS
// ============================================================================

export type StrategyPreset = 'conservative' | 'balanced' | 'aggressive' | 'custom';

export const STRATEGY_PRESETS = {
  // 🛡️ CONSERVATIVE - Aman, profit stabil, risk rendah
  conservative: {
    name: 'Conservative Strategy',
    description: 'Low risk, stable profits, ideal for beginners',
    
    // Risk Management
    maxPositionSize: 20,     // Max 20% dari balance per trade
    maxLeverage: 2,          // Max leverage 2x
    stopLossPercent: 1.5,    // Stop loss 1.5%
    takeProfitPercent: 3.0,  // Take profit 3.0%
    trailingStopPercent: 1.0, // Trailing stop 1.0%
    
    // Signal Requirements
    minConfidenceScore: 75,  // Minimum confidence 75%
    requiredIndicators: 3,   // Minimum 3 indicators harus agree
    
    // Trading Rules
    allowShortPositions: false, // Hanya LONG positions
    maxDailyTrades: 3,          // Max 3 trades per hari
    cooldownMinutes: 60,        // Cooldown 60 menit antar trades
    
    // Market Conditions
    minMarketVolume: 1000000,   // Min $1M volume untuk trade
    avoidHighVolatility: true,  // Skip trade saat volatility tinggi
  },

  // ⚖️ BALANCED - Balance antara risk dan profit
  balanced: {
    name: 'Balanced Strategy',
    description: 'Moderate risk, good returns, recommended for most users',
    
    maxPositionSize: 30,
    maxLeverage: 3,
    stopLossPercent: 2.0,
    takeProfitPercent: 4.0,
    trailingStopPercent: 1.5,
    
    minConfidenceScore: 65,
    requiredIndicators: 2,
    
    allowShortPositions: true,
    maxDailyTrades: 5,
    cooldownMinutes: 30,
    
    minMarketVolume: 500000,
    avoidHighVolatility: false,
  },

  // 🔥 AGGRESSIVE - High risk, high reward
  aggressive: {
    name: 'Aggressive Strategy',
    description: 'High risk, maximum profits, for experienced traders',
    
    maxPositionSize: 50,
    maxLeverage: 5,
    stopLossPercent: 3.0,
    takeProfitPercent: 6.0,
    trailingStopPercent: 2.0,
    
    minConfidenceScore: 55,
    requiredIndicators: 2,
    
    allowShortPositions: true,
    maxDailyTrades: 10,
    cooldownMinutes: 15,
    
    minMarketVolume: 100000,
    avoidHighVolatility: false,
  },

  // 🎨 CUSTOM - User-defined settings
  custom: {
    name: 'Custom Strategy',
    description: 'Fully customizable, edit as needed',
    
    maxPositionSize: 30,
    maxLeverage: 3,
    stopLossPercent: 2.0,
    takeProfitPercent: 4.0,
    trailingStopPercent: 1.5,
    
    minConfidenceScore: 65,
    requiredIndicators: 2,
    
    allowShortPositions: true,
    maxDailyTrades: 5,
    cooldownMinutes: 30,
    
    minMarketVolume: 500000,
    avoidHighVolatility: false,
  },
};

// ============================================================================
// 🎯 ACTIVE STRATEGY (PILIH DI SINI!)
// ============================================================================

/**
 * Pilih strategy yang ingin digunakan:
 * - 'conservative' = Aman, cocok untuk pemula
 * - 'balanced'     = Seimbang, recommended
 * - 'aggressive'   = Agresif, high risk high reward
 * - 'custom'       = Custom settings (edit di bawah)
 */
export const ACTIVE_STRATEGY: StrategyPreset = 'balanced';

// ============================================================================
// 🔧 CUSTOM STRATEGY SETTINGS
// ============================================================================

/**
 * Jika menggunakan ACTIVE_STRATEGY = 'custom', edit settings di sini
 */
export const CUSTOM_SETTINGS = {
  // Risk Management
  maxPositionSize: 35,        // % dari balance
  maxLeverage: 4,             // Max leverage
  stopLossPercent: 2.5,       // Stop loss %
  takeProfitPercent: 5.0,     // Take profit %
  trailingStopPercent: 1.8,   // Trailing stop %
  
  // Signal Generation
  minConfidenceScore: 70,     // Min confidence score (0-100)
  requiredIndicators: 2,      // Min indicators yang harus agree
  
  // Trading Rules
  allowShortPositions: true,  // Allow SHORT positions?
  maxDailyTrades: 7,          // Max trades per day
  cooldownMinutes: 20,        // Cooldown between trades (minutes)
  
  // Market Filters
  minMarketVolume: 300000,    // Min 24h volume in USD
  avoidHighVolatility: false, // Skip high volatility periods?
  
  // Advanced Settings
  useTrailingStop: true,      // Enable trailing stop?
  partialTakeProfit: true,    // Take partial profits?
  partialTakeProfitPercent: 50, // % to close at 50% profit target
};

// ============================================================================
// 📈 SIGNAL GENERATION RULES
// ============================================================================

export const SIGNAL_RULES = {
  // LONG Signal Requirements
  long: {
    // RSI must be in this range
    rsiRange: { min: 30, max: 70 },
    
    // MACD requirements
    macdBullish: true,          // MACD must be bullish
    macdHistogramPositive: true, // Histogram must be positive
    
    // Price action
    priceAboveEMA: true,        // Price must be above EMA
    emaBullishCross: true,      // Short EMA above Long EMA
    
    // Volume
    volumeSurge: false,         // Volume surge required? (set false untuk relaxed)
    
    // Bollinger Bands
    priceBelowUpperBand: true,  // Price should not be at upper band (overbought)
  },

  // SHORT Signal Requirements
  short: {
    rsiRange: { min: 30, max: 70 },
    
    macdBearish: true,
    macdHistogramNegative: true,
    
    priceBelowEMA: true,
    emaBearishCross: true,
    
    volumeSurge: false,
    
    priceAboveLowerBand: true,  // Price should not be at lower band (oversold)
  },

  // Signal Confidence Weights
  confidenceWeights: {
    rsi: 20,                    // RSI contributes 20% to confidence
    macd: 25,                   // MACD contributes 25%
    ema: 20,                    // EMA contributes 20%
    bollingerBands: 15,         // BB contributes 15%
    volume: 10,                 // Volume contributes 10%
    atr: 10,                    // ATR contributes 10%
  },
};

// ============================================================================
// 🛡️ SAFETY LIMITS (HARD LIMITS - TIDAK BOLEH DILEWATI!)
// ============================================================================

export const SAFETY_LIMITS = {
  // Maximum losses
  maxDailyLossPercent: 5,     // Max 5% loss per day (hard stop)
  maxWeeklyLossPercent: 10,   // Max 10% loss per week
  maxDrawdownPercent: 15,     // Max 15% drawdown from peak
  
  // Position limits
  maxOpenPositions: 3,        // Max 3 positions at once
  maxPositionValue: 10000,    // Max $10,000 per position (USD)
  
  // Leverage limits
  absoluteMaxLeverage: 10,    // Never exceed 10x leverage
  
  // Emergency stop
  emergencyStopLossPercent: 10, // Emergency stop at -10% total loss
  
  // Cooldown after loss
  cooldownAfterLossMinutes: 120, // 2 hours cooldown after stop loss hit
  
  // Circuit breaker
  maxConsecutiveLosses: 3,    // Stop after 3 consecutive losses
  circuitBreakerCooldown: 240, // 4 hours cooldown after circuit breaker
};

// ============================================================================
// 🌐 SUPPORTED TRADING PAIRS
// ============================================================================

export const TRADING_PAIRS = {
  enabled: [
    'BTCUSDT',   // Bitcoin
    'ETHUSDT',   // Ethereum
    'BNBUSDT',   // Binance Coin
    'SOLUSDT',   // Solana
    'ADAUSDT',   // Cardano
    'XRPUSDT',   // Ripple
    'DOGEUSDT',  // Dogecoin
    'DOTUSDT',   // Polkadot
    'MATICUSDT', // Polygon
    'LINKUSDT',  // Chainlink
  ],
  
  // Pair-specific settings (optional overrides)
  pairSettings: {
    BTCUSDT: {
      maxLeverage: 5,         // Bitcoin can use higher leverage
      minVolume: 1000000,     // $1M minimum volume
    },
    ETHUSDT: {
      maxLeverage: 5,
      minVolume: 500000,
    },
    DOGEUSDT: {
      maxLeverage: 2,         // Meme coins = lower leverage
      minVolume: 100000,
    },
  },
};

// ============================================================================
// ⏰ TRADING TIME WINDOWS
// ============================================================================

interface TimeWindow {
  start: string;
  end: string;
}

export const TRADING_HOURS = {
  enabled: true,              // Enable time-based trading?
  
  // Trading allowed time windows (UTC)
  allowedWindows: [
    { start: '00:00', end: '23:59' }, // 24/7 trading
  ] as TimeWindow[],
  
  // Avoid trading during these times (high volatility)
  avoidWindows: [
    // { start: '21:30', end: '22:30' }, // US Stock Market close
    // { start: '13:00', end: '14:00' }, // Asia lunch time
  ] as TimeWindow[],
  
  // Timezone
  timezone: 'UTC',
};

// ============================================================================
// 🤖 AI INTEGRATION SETTINGS
// ============================================================================

export const AI_SETTINGS = {
  enabled: true,              // Use AI for signal enhancement?
  
  // AI model
  model: 'gpt-4',             // OpenAI model to use
  
  // AI analysis
  includeMarketSentiment: true,    // Analyze market sentiment?
  includeNewsAnalysis: false,      // Analyze news? (requires news API)
  includeSocialMedia: false,       // Analyze social media? (requires Twitter API)
  
  // AI confidence boost
  aiConfidenceMultiplier: 1.2,     // Boost confidence by 20% if AI agrees
  
  // Rate limiting
  maxAICallsPerHour: 60,           // Max 60 AI calls per hour
};

// ============================================================================
// 📝 LOGGING & MONITORING
// ============================================================================

export const LOGGING = {
  // Log levels
  logLevel: 'info',           // 'debug' | 'info' | 'warn' | 'error'
  
  // What to log
  logTrades: true,            // Log all trades
  logSignals: true,           // Log all signals (even if not traded)
  logIndicators: false,       // Log indicator values (verbose)
  logErrors: true,            // Log errors
  
  // Performance tracking
  trackPerformance: true,     // Track win rate, profit, etc
  performanceInterval: 'daily', // 'hourly' | 'daily' | 'weekly'
};

// ============================================================================
// 🔄 HELPER FUNCTIONS
// ============================================================================

/**
 * Get active strategy settings
 */
export function getActiveStrategy() {
  if (ACTIVE_STRATEGY === 'custom') {
    return {
      ...STRATEGY_PRESETS.custom,
      ...CUSTOM_SETTINGS,
    };
  }
  return STRATEGY_PRESETS[ACTIVE_STRATEGY];
}

/**
 * Get indicator settings
 */
export function getIndicators() {
  return INDICATORS;
}

/**
 * Get signal rules
 */
export function getSignalRules() {
  return SIGNAL_RULES;
}

/**
 * Get safety limits
 */
export function getSafetyLimits() {
  return SAFETY_LIMITS;
}

/**
 * Check if trading is allowed at current time
 */
export function isTradingAllowed(): boolean {
  if (!TRADING_HOURS.enabled) return true;
  
  const now = new Date();
  const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
  
  // Check if current time is in allowed windows
  const isInAllowedWindow = TRADING_HOURS.allowedWindows.some(window => {
    return currentTime >= window.start && currentTime <= window.end;
  });
  
  if (!isInAllowedWindow) return false;
  
  // Check if current time is in avoid windows
  const isInAvoidWindow = TRADING_HOURS.avoidWindows.some(window => {
    return currentTime >= window.start && currentTime <= window.end;
  });
  
  return !isInAvoidWindow;
}

/**
 * Validate strategy settings
 */
export function validateSettings(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const strategy = getActiveStrategy();
  
  // Validate against safety limits
  if (strategy.maxLeverage > SAFETY_LIMITS.absoluteMaxLeverage) {
    errors.push(`Max leverage (${strategy.maxLeverage}) exceeds safety limit (${SAFETY_LIMITS.absoluteMaxLeverage})`);
  }
  
  if (strategy.stopLossPercent > SAFETY_LIMITS.maxDailyLossPercent) {
    errors.push(`Stop loss (${strategy.stopLossPercent}%) exceeds daily loss limit (${SAFETY_LIMITS.maxDailyLossPercent}%)`);
  }
  
  if (strategy.maxPositionSize > 100) {
    errors.push(`Position size cannot exceed 100%`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// 📊 EXPORT ALL
// ============================================================================

const tradingAlgorithmsConfig = {
  INDICATORS,
  STRATEGY_PRESETS,
  ACTIVE_STRATEGY,
  CUSTOM_SETTINGS,
  SIGNAL_RULES,
  SAFETY_LIMITS,
  TRADING_PAIRS,
  TRADING_HOURS,
  AI_SETTINGS,
  LOGGING,
  
  // Helper functions
  getActiveStrategy,
  getStrategy: getActiveStrategy, // Alias for compatibility
  getIndicators,
  getSignalRules,
  getSafetyLimits,
  isTradingAllowed,
  validateSettings,
};

export default tradingAlgorithmsConfig;
