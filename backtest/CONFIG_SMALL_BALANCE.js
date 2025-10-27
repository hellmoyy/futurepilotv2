/**
 * 🎯 SMALL BALANCE CONFIG - Optimized for $1000-$5000
 * 
 * Copy this and use with run-futures-scalper.js
 */

module.exports = {
  // Account settings - ADJUSTED FOR SMALL BALANCE
  INITIAL_BALANCE: 1000,
  RISK_PER_TRADE: 0.03,            // 3% risk ($30 on $1000) - higher to get meaningful position sizes
  LEVERAGE: 20,                     // 20x leverage (vs 10x) - necessary for adequate exposure
  
  // Exit parameters - WIDER TP, TIGHTER SL
  STOP_LOSS_PCT: 0.004,            // 0.4% stop loss (tighter to minimize losses)
  TAKE_PROFIT_PCT: 0.02,           // 2% take profit (wider for better risk/reward - 5:1 R:R)
  EMERGENCY_EXIT_PCT: 0.012,       // 1.2% emergency exit (3x stop loss)
  
  // Trailing stops
  TRAILING_PROFIT_ACTIVATE: 0.008,  // Activate at +0.8%
  TRAILING_PROFIT_DISTANCE: 0.005,  // Trail 0.5% below peak
  TRAILING_LOSS_ACTIVATE: 0.005,    // Activate at -0.5%
  TRAILING_LOSS_DISTANCE: 0.003,    // Trail 0.3% above low
  
  // Technical indicators
  EMA_FAST: 9,
  EMA_SLOW: 21,
  RSI_PERIOD: 14,
  RSI_OVERSOLD: 35,
  RSI_OVERBOUGHT: 68,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  ADX_PERIOD: 14,
  
  // Filters
  MIN_VOLUME_MULTIPLIER: 0.8,
  MAX_VOLUME_MULTIPLIER: 2.0,
  MIN_ADX: 20,
  MAX_ADX: 50,
  MIN_MACD_STRENGTH_PCT: 0.003,
  
  // Market bias
  MARKET_BIAS_LOOKBACK: 100,
  MARKET_BIAS_THRESHOLD: 0.02,
  
  // Entry confirmation
  ENTRY_CONFIRMATION_CANDLES: 2,
};

/**
 * HOW TO USE:
 * 
 * 1. Edit run-futures-scalper.js
 * 2. Change CONFIG values at top of file to match above
 * 3. Run: node run-futures-scalper.js --balance=1000 --period=1m
 * 
 * KEY DIFFERENCES VS STANDARD:
 * - Risk: 3% vs 2% (need larger positions)
 * - Leverage: 20x vs 10x (multiply exposure)
 * - Stop Loss: 0.4% vs 0.8% (cut losses faster)
 * - Take Profit: 2% vs 0.8% (aim for bigger wins)
 * - Risk/Reward: 5:1 vs 1:1 (much better ratio)
 * 
 * EXPECTED RESULTS:
 * - Fewer trades (tighter SL = less signals)
 * - Higher win rate (wider TP gives more breathing room)
 * - Better profit factor (5:1 R:R)
 * - More stable with small balance
 */
