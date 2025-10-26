#!/usr/bin/env node

/**
 * 🚀 Run Backtest - Main Script
 * 
 * Usage:
 *   node backtest/run-backtest.js [options]
 * 
 * Options:
 *   --period <1w|1m|3m|6m>  Period to backtest (default: 3m)
 *   --symbol <symbol>        Trading pair (default: BTCUSDT)
 *   --interval <interval>    Timeframe (default: 15m)
 *   --capital <amount>       Initial capital (default: 10000)
 *   --compare                Compare original vs improved
 *   --html                   Generate HTML report
 */

const BinanceDataFetcher = require('./BinanceDataFetcher');
const StrategySimulator = require('./StrategySimulator');
const BacktestEngine = require('./BacktestEngine');
const MetricsCalculator = require('./MetricsCalculator');
const ReportGenerator = require('./ReportGenerator');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const config = {
  period: getArg('--period', '3m'),
  symbol: getArg('--symbol', 'BTCUSDT'),
  interval: getArg('--interval', '15m'),
  initialCapital: parseInt(getArg('--capital', '10000')),
  compare: args.includes('--compare'),
  html: args.includes('--html')
};

console.log('\n🎯 FuturePilot v2 - Backtest System');
console.log('=' .repeat(70));
console.log(`\n📊 Configuration:`);
console.log(`   Symbol: ${config.symbol}`);
console.log(`   Period: ${config.period}`);
console.log(`   Timeframe: ${config.interval}`);
console.log(`   Initial Capital: $${config.initialCapital}`);
console.log(`   Compare Mode: ${config.compare ? 'Yes' : 'No'}`);
console.log(`   HTML Report: ${config.html ? 'Yes' : 'No'}`);
console.log('');

async function runBacktest() {
  try {
    // 1. Fetch historical data
    const fetcher = new BinanceDataFetcher();
    const dateRange = BinanceDataFetcher.getDateRange(config.period);
    
    const candles = await fetcher.fetchPeriod(
      config.symbol,
      config.interval,
      dateRange.start,
      dateRange.end
    );

    if (candles.length === 0) {
      console.error('❌ No data fetched! Check symbol and dates.');
      return;
    }

    const testConfig = {
      startDate: dateRange.start.toISOString().split('T')[0],
      endDate: dateRange.end.toISOString().split('T')[0],
      interval: config.interval,
      initialCapital: config.initialCapital,
      positionSize: 10,
      leverage: 10
    };

    if (config.compare) {
      // COMPARISON MODE: Test original vs improved
      console.log('\n🔄 COMPARISON MODE: Testing both strategies...\n');

      // Original strategy (no improvements)
      console.log('📊 Running ORIGINAL strategy (baseline)...');
      const originalStrategy = new StrategySimulator({
        useTimeFilter: false,
        useVolumeFilter: false,
        useDynamicStopLoss: false,
        useMarketRegimeFilter: false
      });

      const originalEngine = new BacktestEngine(originalStrategy, {
        initialCapital: config.initialCapital
      });

      const originalResults = originalEngine.run(candles);
      const originalMetrics = MetricsCalculator.calculate(
        originalResults.trades,
        config.initialCapital,
        originalResults.finalCapital,
        originalResults.equity
      );

      // Improved strategy (all improvements)
      console.log('\n📊 Running IMPROVED strategy (Quick Wins + Market Regime)...');
      const improvedStrategy = new StrategySimulator({
        useTimeFilter: true,
        useVolumeFilter: true,
        useDynamicStopLoss: true,
        useMarketRegimeFilter: true
      });

      const improvedEngine = new BacktestEngine(improvedStrategy, {
        initialCapital: config.initialCapital
      });

      const improvedResults = improvedEngine.run(candles);
      const improvedMetrics = MetricsCalculator.calculate(
        improvedResults.trades,
        config.initialCapital,
        improvedResults.finalCapital,
        improvedResults.equity
      );

      // Print comparison
      ReportGenerator.printComparison(
        originalMetrics,
        improvedMetrics,
        'Original (71% baseline)',
        'Improved (All features)'
      );

      // Save comparison results
      const comparisonData = {
        config: testConfig,
        original: {
          metrics: originalMetrics,
          trades: originalResults.trades
        },
        improved: {
          metrics: improvedMetrics,
          trades: improvedResults.trades
        },
        improvement: {
          winRate: `+${(parseFloat(improvedMetrics.winRate) - parseFloat(originalMetrics.winRate)).toFixed(2)}%`,
          profit: `+$${(parseFloat(improvedMetrics.totalProfit) - parseFloat(originalMetrics.totalProfit)).toFixed(2)}`,
          roi: `+${(parseFloat(improvedMetrics.roi) - parseFloat(originalMetrics.roi)).toFixed(2)}%`
        }
      };

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      ReportGenerator.saveToFile(
        comparisonData,
        `comparison_${config.symbol}_${config.period}_${timestamp}.json`
      );

      if (config.html) {
        ReportGenerator.generateHTML(
          improvedMetrics,
          improvedResults.trades,
          testConfig,
          `comparison_${config.symbol}_${config.period}_${timestamp}.html`
        );
      }

    } else {
      // SINGLE MODE: Test improved strategy only
      console.log('\n📊 Running IMPROVED strategy (all features enabled)...\n');

      const strategy = new StrategySimulator({
        useTimeFilter: true,
        useVolumeFilter: true,
        useDynamicStopLoss: true,
        useMarketRegimeFilter: true
      });

      const engine = new BacktestEngine(strategy, {
        initialCapital: config.initialCapital
      });

      const results = engine.run(candles);
      const metrics = MetricsCalculator.calculate(
        results.trades,
        config.initialCapital,
        results.finalCapital,
        results.equity
      );

      // Print results
      ReportGenerator.printConsole(metrics, testConfig);

      // Save results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      ReportGenerator.saveToFile(
        { config: testConfig, metrics, trades: results.trades },
        `backtest_${config.symbol}_${config.period}_${timestamp}.json`
      );

      if (config.html) {
        ReportGenerator.generateHTML(
          metrics,
          results.trades,
          testConfig,
          `backtest_${config.symbol}_${config.period}_${timestamp}.html`
        );
      }
    }

  } catch (error) {
    console.error('\n❌ Error running backtest:', error.message);
    console.error(error.stack);
  }
}

// Run the backtest
runBacktest();
