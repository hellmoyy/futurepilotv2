/**
 * 🎯 SMALL BALANCE FUTURES SCALPER
 * 
 * Wrapper for run-futures-scalper.js with optimized small balance config
 */

// Override CONFIG before requiring the main script
const SMALL_BALANCE_CONFIG = {
  INITIAL_BALANCE: 1000,
  RISK_PER_TRADE: 0.03,             // 3% risk
  LEVERAGE: 20,                      // 20x leverage
  STOP_LOSS_PCT: 0.004,             // 0.4% SL
  TAKE_PROFIT_PCT: 0.02,            // 2% TP (5:1 R:R)
  EMERGENCY_EXIT_PCT: 0.012,        // 1.2% emergency
  TRAILING_PROFIT_ACTIVATE: 0.008,
  TRAILING_PROFIT_DISTANCE: 0.005,
  TRAILING_LOSS_ACTIVATE: 0.005,
  TRAILING_LOSS_DISTANCE: 0.003,
  EMA_FAST: 9,
  EMA_SLOW: 21,
  RSI_PERIOD: 14,
  RSI_OVERSOLD: 35,
  RSI_OVERBOUGHT: 68,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  ADX_PERIOD: 14,
  MIN_VOLUME_MULTIPLIER: 0.8,
  MAX_VOLUME_MULTIPLIER: 2.0,
  MIN_ADX: 20,
  MAX_ADX: 50,
  MIN_MACD_STRENGTH_PCT: 0.003,
  MARKET_BIAS_LOOKBACK: 100,
  MARKET_BIAS_THRESHOLD: 0.02,
  ENTRY_CONFIRMATION_CANDLES: 2,
};

console.log('\n' + '='.repeat(70));
console.log('🎯 SMALL BALANCE FUTURES SCALPER ($1000-$5000)');
console.log('='.repeat(70));
console.log('\n⚙️  OPTIMIZED CONFIGURATION:');
console.log(`   Initial Balance: $${SMALL_BALANCE_CONFIG.INITIAL_BALANCE}`);
console.log(`   Risk per Trade: ${(SMALL_BALANCE_CONFIG.RISK_PER_TRADE * 100).toFixed(1)}%`);
console.log(`   Leverage: ${SMALL_BALANCE_CONFIG.LEVERAGE}x`);
console.log(`   Stop Loss: ${(SMALL_BALANCE_CONFIG.STOP_LOSS_PCT * 100).toFixed(2)}%`);
console.log(`   Take Profit: ${(SMALL_BALANCE_CONFIG.TAKE_PROFIT_PCT * 100).toFixed(1)}%`);
console.log(`   Risk/Reward Ratio: ${(SMALL_BALANCE_CONFIG.TAKE_PROFIT_PCT / SMALL_BALANCE_CONFIG.STOP_LOSS_PCT).toFixed(1)}:1`);
console.log(`   Emergency Exit: ${(SMALL_BALANCE_CONFIG.EMERGENCY_EXIT_PCT * 100).toFixed(1)}%`);
console.log(`   Strategy: Triple TF + Market Bias + Entry Confirmation\n`);

// Temporarily modify the required file's CONFIG
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  const module = originalRequire.apply(this, arguments);
  
  // If this is run-futures-scalper, inject our config
  if (id.includes('run-futures-scalper') || id === './run-futures-scalper') {
    // The module has already been loaded, but we can't easily override its CONFIG
    // So we'll use a different approach below
  }
  
  return module;
};

// Load and modify the main backtest function
const fs = require('fs');
const path = require('path');

// Read the original file
const originalFile = fs.readFileSync(path.join(__dirname, 'run-futures-scalper.js'), 'utf8');

// Replace CONFIG values with our small balance config
let modifiedFile = originalFile;

// Replace each CONFIG value
for (const [key, value] of Object.entries(SMALL_BALANCE_CONFIG)) {
  const regex = new RegExp(`(${key}:\\s*)[\\d.]+`, 'g');
  modifiedFile = modifiedFile.replace(regex, `$1${value}`);
}

// Write to temp file
const tempFile = path.join(__dirname, '.temp-small-balance-scalper.js');
fs.writeFileSync(tempFile, modifiedFile);

// Run the modified version
const { backtestFuturesPair } = require(tempFile);

async function main() {
  const args = process.argv.slice(2);
  
  const symbolArg = args.find(arg => arg.startsWith('--symbol='));
  const periodArg = args.find(arg => arg.startsWith('--period='));
  const balanceArg = args.find(arg => arg.startsWith('--balance='));
  
  const symbol = symbolArg ? symbolArg.split('=')[1] : 'BTCUSDT';
  const period = periodArg ? periodArg.split('=')[1] : '1m';
  const initialBalance = balanceArg ? parseFloat(balanceArg.split('=')[1]) : SMALL_BALANCE_CONFIG.INITIAL_BALANCE;
  
  const result = await backtestFuturesPair(symbol, period, initialBalance);
  
  // Clean up temp file
  fs.unlinkSync(tempFile);
  
  if (result) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ Small Balance Backtest Complete!`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Additional analysis for small balance
    if (result.roi > 0) {
      console.log('💰 SMALL BALANCE PERFORMANCE METRICS:');
      console.log(`   ROI: ${result.roi.toFixed(2)}%`);
      console.log(`   Profit Factor: ${result.profitFactor.toFixed(2)}`);
      console.log(`   Win Rate: ${result.winRate.toFixed(2)}%`);
      console.log(`   Avg Win/Loss Ratio: ${(result.totalWins / result.wins / (result.totalLosses / result.losses)).toFixed(2)}:1`);
      console.log(`\n📈 SCALING POTENTIAL:`);
      console.log(`   With $1000 → $${result.finalBalance.toFixed(0)} in ${period}`);
      console.log(`   With $5000 → $${(5000 * (1 + result.roi / 100)).toFixed(0)} estimated`);
      console.log(`\n`);
    } else {
      console.log('⚠️  STRATEGY UNDERPERFORMING WITH SMALL BALANCE');
      console.log(`   Consider increasing initial balance to $5000+ for better results\n`);
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    // Clean up temp file on error
    const tempFile = path.join(__dirname, '.temp-small-balance-scalper.js');
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });
}
