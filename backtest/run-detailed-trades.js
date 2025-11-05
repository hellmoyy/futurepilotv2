const BinanceDataFetcher = require('./BinanceDataFetcher');
const BitcoinProStrategy = require('../src/lib/trading/BitcoinProStrategy');

// Configuration
const SYMBOL = 'BTCUSDT';
const INITIAL_BALANCE = 10000;
const RISK_PER_TRADE = 0.02; // 2%
const LEVERAGE = 10;
const STOP_LOSS_PCT = 0.008; // 0.8%
const TAKE_PROFIT_PCT = 0.008; // 0.8%
const EMERGENCY_EXIT_PCT = 0.02; // -2% hard cap

// Dual Trailing System
const TRAIL_PROFIT_ACTIVATE = 0.004; // +0.4% profit activates trailing
const TRAIL_PROFIT_DISTANCE = 0.003; // Trail 0.3% below peak
const TRAIL_LOSS_ACTIVATE = -0.003; // -0.3% loss activates trailing
const TRAIL_LOSS_DISTANCE = 0.002; // Trail 0.2% above lowest

// Get period from command line
const args = process.argv.slice(2);
const periodArg = args.find(arg => arg.startsWith('--period='));
const period = periodArg ? periodArg.split('=')[1] : '1m';

// Convert period to days
const periodMap = {
  '1m': 30,
  '2m': 60,
  '3m': 90,
};
const days = periodMap[period] || 30;

console.log('\n' + '='.repeat(70));
console.log('🚀 DETAILED TRADE LOG - FUTURES SCALPER');
console.log('='.repeat(70));
console.log(`\n⚙️  CONFIGURATION:`);
console.log(`   Symbol: ${SYMBOL}`);
console.log(`   Period: ${period} (${days} days)`);
console.log(`   Initial Balance: $${INITIAL_BALANCE}`);
console.log(`   Risk per Trade: ${RISK_PER_TRADE * 100}%`);
console.log(`   Leverage: ${LEVERAGE}x`);
console.log(`   Stop Loss: ${STOP_LOSS_PCT * 100}%`);
console.log(`   Take Profit: ${TAKE_PROFIT_PCT * 100}%`);
console.log(`   Emergency Exit: ${EMERGENCY_EXIT_PCT * 100}%`);
console.log(`\n📊 Dual Trailing System:`);
console.log(`   Profit Activation: +${TRAIL_PROFIT_ACTIVATE * 100}%`);
console.log(`   Profit Distance: ${TRAIL_PROFIT_DISTANCE * 100}%`);
console.log(`   Loss Activation: ${TRAIL_LOSS_ACTIVATE * 100}%`);
console.log(`   Loss Distance: ${TRAIL_LOSS_DISTANCE * 100}%`);

async function runDetailedBacktest() {
  try {
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 FETCHING MARKET DATA');
    console.log('='.repeat(70));

    const fetcher = new BinanceDataFetcher();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch all timeframes
    console.log(`\n📊 Fetching ${SYMBOL} data...`);
    const data1m = await fetcher.fetchCandles(SYMBOL, '1m', startDate, endDate);
    const data3m = await fetcher.fetchCandles(SYMBOL, '3m', startDate, endDate);
    const data5m = await fetcher.fetchCandles(SYMBOL, '5m', startDate, endDate);

    console.log(`\n✅ Data fetched:`);
    console.log(`   1m: ${data1m.length} candles`);
    console.log(`   3m: ${data3m.length} candles`);
    console.log(`   5m: ${data5m.length} candles`);

    // Initialize strategy
    const strategy = new BitcoinProStrategy();

    // Prepare market data structure
    const marketData = {
      '1m': data1m,
      '3m': data3m,
      '5m': data5m,
    };

    // Backtesting variables
    let balance = INITIAL_BALANCE;
    let position = null;
    let tradeNumber = 0;
    const trades = [];

    console.log('\n\n' + '='.repeat(70));
    console.log('📈 TRADE EXECUTION LOG');
    console.log('='.repeat(70));

    // Run backtest
    for (let i = 200; i < data1m.length; i++) {
      const currentCandle = data1m[i];
      const currentTime = new Date(currentCandle.timestamp);

      // Skip if we have an open position
      if (position) {
        const entry = position.entry;
        const currentPrice = currentCandle.close;
        const profitPct = position.side === 'LONG'
          ? (currentPrice - entry) / entry
          : (entry - currentPrice) / entry;

        // Update trailing profit
        if (profitPct >= TRAIL_PROFIT_ACTIVATE) {
          if (!position.trailingProfitActive) {
            position.trailingProfitActive = true;
            position.highestProfit = profitPct;
          } else if (profitPct > position.highestProfit) {
            position.highestProfit = profitPct;
          }

          // Check trailing profit exit
          if (profitPct <= position.highestProfit - TRAIL_PROFIT_DISTANCE) {
            const pnl = profitPct * position.size * LEVERAGE;
            balance += pnl;
            tradeNumber++;

            console.log(`\n${tradeNumber}. 🎯 ${position.side} TRAILING PROFIT`);
            console.log(`   Time: ${currentTime.toISOString()}`);
            console.log(`   Entry: $${entry.toFixed(2)}`);
            console.log(`   Exit: $${currentPrice.toFixed(2)}`);
            console.log(`   Position: $${position.size.toFixed(2)}`);
            console.log(`   PnL: $${pnl.toFixed(2)} (${(profitPct * 100).toFixed(2)}%)`);
            console.log(`   Balance: $${balance.toFixed(2)}`);

            trades.push({
              number: tradeNumber,
              side: position.side,
              entry,
              exit: currentPrice,
              pnl,
              pnlPct: profitPct,
              reason: 'TRAILING_PROFIT',
              balance,
              time: currentTime.toISOString(),
            });

            position = null;
            continue;
          }
        }

        // Update trailing loss
        if (profitPct <= TRAIL_LOSS_ACTIVATE) {
          if (!position.trailingLossActive) {
            position.trailingLossActive = true;
            position.lowestLoss = profitPct;
          } else if (profitPct < position.lowestLoss) {
            position.lowestLoss = profitPct;
          }

          // Check trailing loss exit
          if (profitPct >= position.lowestLoss + TRAIL_LOSS_DISTANCE) {
            const pnl = profitPct * position.size * LEVERAGE;
            balance += pnl;
            tradeNumber++;

            console.log(`\n${tradeNumber}. 📉 ${position.side} TRAILING LOSS`);
            console.log(`   Time: ${currentTime.toISOString()}`);
            console.log(`   Entry: $${entry.toFixed(2)}`);
            console.log(`   Exit: $${currentPrice.toFixed(2)}`);
            console.log(`   Position: $${position.size.toFixed(2)}`);
            console.log(`   PnL: $${pnl.toFixed(2)} (${(profitPct * 100).toFixed(2)}%)`);
            console.log(`   Balance: $${balance.toFixed(2)}`);

            trades.push({
              number: tradeNumber,
              side: position.side,
              entry,
              exit: currentPrice,
              pnl,
              pnlPct: profitPct,
              reason: 'TRAILING_LOSS',
              balance,
              time: currentTime.toISOString(),
            });

            position = null;
            continue;
          }
        }

        // Check emergency exit (-2%)
        if (profitPct <= -EMERGENCY_EXIT_PCT) {
          const pnl = -EMERGENCY_EXIT_PCT * position.size * LEVERAGE;
          balance += pnl;
          tradeNumber++;

          console.log(`\n${tradeNumber}. 🚨 ${position.side} EMERGENCY EXIT`);
          console.log(`   Time: ${currentTime.toISOString()}`);
          console.log(`   Entry: $${entry.toFixed(2)}`);
          console.log(`   Exit: $${currentPrice.toFixed(2)}`);
          console.log(`   Position: $${position.size.toFixed(2)}`);
          console.log(`   PnL: $${pnl.toFixed(2)} (${(profitPct * 100).toFixed(2)}%)`);
          console.log(`   Balance: $${balance.toFixed(2)}`);

          trades.push({
            number: tradeNumber,
            side: position.side,
            entry,
            exit: currentPrice,
            pnl,
            pnlPct: profitPct,
            reason: 'EMERGENCY_EXIT',
            balance,
            time: currentTime.toISOString(),
          });

          position = null;
          continue;
        }

        // Check normal TP/SL
        if (profitPct >= TAKE_PROFIT_PCT) {
          const pnl = profitPct * position.size * LEVERAGE;
          balance += pnl;
          tradeNumber++;

          console.log(`\n${tradeNumber}. ✅ ${position.side} TAKE PROFIT`);
          console.log(`   Time: ${currentTime.toISOString()}`);
          console.log(`   Entry: $${entry.toFixed(2)}`);
          console.log(`   Exit: $${currentPrice.toFixed(2)}`);
          console.log(`   Position: $${position.size.toFixed(2)}`);
          console.log(`   PnL: $${pnl.toFixed(2)} (${(profitPct * 100).toFixed(2)}%)`);
          console.log(`   Balance: $${balance.toFixed(2)}`);

          trades.push({
            number: tradeNumber,
            side: position.side,
            entry,
            exit: currentPrice,
            pnl,
            pnlPct: profitPct,
            reason: 'TP',
            balance,
            time: currentTime.toISOString(),
          });

          position = null;
          continue;
        }

        if (profitPct <= -STOP_LOSS_PCT) {
          const pnl = profitPct * position.size * LEVERAGE;
          balance += pnl;
          tradeNumber++;

          console.log(`\n${tradeNumber}. ❌ ${position.side} STOP LOSS`);
          console.log(`   Time: ${currentTime.toISOString()}`);
          console.log(`   Entry: $${entry.toFixed(2)}`);
          console.log(`   Exit: $${currentPrice.toFixed(2)}`);
          console.log(`   Position: $${position.size.toFixed(2)}`);
          console.log(`   PnL: $${pnl.toFixed(2)} (${(profitPct * 100).toFixed(2)}%)`);
          console.log(`   Balance: $${balance.toFixed(2)}`);

          trades.push({
            number: tradeNumber,
            side: position.side,
            entry,
            exit: currentPrice,
            pnl,
            pnlPct: profitPct,
            reason: 'SL',
            balance,
            time: currentTime.toISOString(),
          });

          position = null;
          continue;
        }

        continue;
      }

      // Check for entry signal
      const signal = await strategy.analyze(marketData, SYMBOL, '1m', i);

      if (signal && signal.signal !== 'NEUTRAL') {
        const riskAmount = balance * RISK_PER_TRADE;
        const positionSize = riskAmount;

        position = {
          side: signal.signal === 'BUY' ? 'LONG' : 'SHORT',
          entry: currentCandle.close,
          size: positionSize,
          trailingProfitActive: false,
          trailingLossActive: false,
          highestProfit: -Infinity,
          lowestLoss: Infinity,
        };

        console.log(`\n🔔 NEW POSITION OPENED`);
        console.log(`   Time: ${currentTime.toISOString()}`);
        console.log(`   Side: ${position.side}`);
        console.log(`   Entry: $${position.entry.toFixed(2)}`);
        console.log(`   Size: $${position.size.toFixed(2)}`);
        console.log(`   Leverage: ${LEVERAGE}x`);
      }
    }

    // Print summary
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 BACKTEST SUMMARY');
    console.log('='.repeat(70));

    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = losses.reduce((sum, t) => sum + t.pnl, 0);

    console.log(`\n💰 ACCOUNT:`);
    console.log(`   Initial: $${INITIAL_BALANCE.toFixed(2)}`);
    console.log(`   Final: $${balance.toFixed(2)}`);
    console.log(`   Profit: $${totalPnl.toFixed(2)}`);
    console.log(`   ROI: ${((balance - INITIAL_BALANCE) / INITIAL_BALANCE * 100).toFixed(2)}%`);

    console.log(`\n📈 TRADES:`);
    console.log(`   Total: ${trades.length}`);
    console.log(`   Wins: ${wins.length} (${(wins.length / trades.length * 100).toFixed(2)}%)`);
    console.log(`   Losses: ${losses.length} (${(losses.length / trades.length * 100).toFixed(2)}%)`);

    console.log(`\n💵 PnL:`);
    console.log(`   Total Wins: $${totalWins.toFixed(2)}`);
    console.log(`   Avg Win: $${(totalWins / wins.length).toFixed(2)}`);
    console.log(`   Total Losses: $${totalLosses.toFixed(2)}`);
    console.log(`   Avg Loss: $${(totalLosses / losses.length).toFixed(2)}`);
    console.log(`   Profit Factor: ${(Math.abs(totalWins / totalLosses)).toFixed(2)}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ Detailed backtest completed!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runDetailedBacktest();
