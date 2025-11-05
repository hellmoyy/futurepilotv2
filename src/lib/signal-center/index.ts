/**
 * 📡 SIGNAL CENTER - Main Export
 * 
 * Central export for all Signal Center modules
 * Easy import: import { SignalEngine, signalBroadcaster, BotDecisionEngine } from '@/lib/signal-center'
 */

// Core Engine
export { SignalEngine, DEFAULT_CONFIG } from './SignalEngine';

// Broadcasting
export { SignalBroadcaster, signalBroadcaster } from './SignalBroadcaster';

// Bot Decision
export { BotDecisionEngine } from './BotDecisionEngine';

// Technical Indicators
export {
  calculateEMA,
  calculateSMA,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateATR,
  calculateBollingerBands,
  calculateVolumeRatio,
  detectMarketRegime,
  checkTradingHours,
  calculatePositionSize,
} from './indicators';

// Types
export type {
  TradingSignal,
  SignalAction,
  SignalStrength,
  SignalStatus,
  MarketRegime,
  Timeframe,
  Candle,
  SignalEngineConfig,
  SignalAnalysisResult,
  BotDecisionInput,
  BotDecisionOutput,
  SignalPerformanceStats,
  SignalCenterStatus,
} from './types';
