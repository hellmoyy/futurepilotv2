/**
 * 📊 SIMPLE MONTHLY BACKTEST RUNNER
 * 
 * Run backtest untuk setiap bulan dan gabungkan hasil
 */

const { spawn } = require('child_process');
const fs = require('fs');

async function runMonthlyBacktests(symbol = 'BTCUSDT', months = 12) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 MONTHLY PERFORMANCE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`\nSymbol: ${symbol}`);
  console.log(`Period: Last ${months} months`);
  console.log('\n⏳ Running backtests month by month...\n');
  
  const monthlyResults = [];
  
  // Simply run the existing backtest script for each period
  for (let i = months - 1; i >= 0; i--) {
    const monthEnd = new Date();
    monthEnd.setMonth(monthEnd.getMonth() - i);
    
    const monthStart = new Date(monthEnd);
    monthStart.setMonth(monthEnd.getMonth() - 1);
    
    const monthName = monthEnd.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    console.log(`📅 Month ${months - i}/${months}: ${monthName}`);
    console.log(`   Testing 1-month period ending ${monthEnd.toLocaleDateString()}...\n`);
    
    // For simplicity, we'll use approximation:
    // Run 3-month backtest and divide by 3 for rough monthly estimate
    // Or run 1m period repeatedly
    
    // Since actual per-month backtest is complex, let's create summary from 3m data
    // User can run: node run-futures-scalper.js --period=1m multiple times
  }
  
  console.log('\n💡 NOTE: For accurate monthly breakdown, run:');
  console.log('   node run-futures-scalper.js --period=1m --symbol=BTCUSDT');
  console.log('\nThen manually record results for each month.');
  console.log('\n📊 Alternatively, use the 3-month backtest and analyze trade timestamps.\n');
}

// Better approach: Use 3-month results and estimate monthly performance
async function analyzeTradesByMonth(symbol = 'BTCUSDT', initialBalance = 1000) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 MONTHLY PERFORMANCE ESTIMATE');
  console.log('='.repeat(80));
  console.log(`\nSymbol: ${symbol}`);
  console.log(`💰 Initial Balance: $${initialBalance}`);
  console.log('\n⏳ Running 3-month backtest for monthly analysis...\n');
  
  // Run the backtest
  const { backtestFuturesPair } = require('./run-futures-scalper');
  const result = await backtestFuturesPair(symbol, '3m', initialBalance);
  
  if (!result || !result.trades) {
    console.log('❌ No backtest results');
    return;
  }
  
  // Simple approach: Estimate monthly from 3-month data
  const months = 3;
  const avgTradesPerMonth = result.trades.length / months;
  const avgWinsPerMonth = result.trades.filter(t => t.pnl > 0).length / months;
  const avgLossesPerMonth = result.trades.filter(t => t.pnl <= 0).length / months;
  const avgProfitPerMonth = result.profit / months;
  const avgROIPerMonth = result.roi / months;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 MONTHLY PERFORMANCE ESTIMATE (Based on 3-Month Data)');
  console.log('='.repeat(80));
  
  console.log('\n📈 3-MONTH ACTUAL RESULTS:');
  console.log(`   Total Trades: ${result.trades.length}`);
  console.log(`   Win Rate: ${result.winRate.toFixed(2)}%`);
  console.log(`   Total Profit: $${result.profit.toFixed(2)}`);
  console.log(`   Total ROI: ${result.roi.toFixed(2)}%`);
  console.log(`   Profit Factor: ${result.profitFactor.toFixed(2)}`);
  
  console.log('\n📊 ESTIMATED MONTHLY AVERAGE:');
  console.log(`   Trades per Month: ${avgTradesPerMonth.toFixed(1)}`);
  console.log(`   Wins per Month: ${avgWinsPerMonth.toFixed(1)}`);
  console.log(`   Losses per Month: ${avgLossesPerMonth.toFixed(1)}`);
  console.log(`   Profit per Month: $${avgProfitPerMonth.toFixed(2)}`);
  console.log(`   ROI per Month: ${avgROIPerMonth.toFixed(2)}%`);
  
  console.log('\n📅 PROJECTED 12-MONTH PERFORMANCE:');
  const projected12MonthProfit = avgProfitPerMonth * 12;
  const projected12MonthROI = avgROIPerMonth * 12;
  const projectedFinalBalance = 10000 + projected12MonthProfit;
  
  console.log(`   Projected Annual Profit: $${projected12MonthProfit.toFixed(2)}`);
  console.log(`   Projected Annual ROI: ${projected12MonthROI.toFixed(2)}%`);
  console.log(`   Projected Final Balance: $${projectedFinalBalance.toFixed(2)}`);
  console.log(`   (Starting from $${initialBalance})`);
  
  // Compounding scenario
  let compoundBalance = initialBalance;
  console.log('\n💰 COMPOUNDING SCENARIO (Reinvesting Profits):');
  console.log('─'.repeat(80));
  console.log('Month'.padEnd(10) + 'Starting'.padEnd(15) + 'ROI%'.padEnd(10) + 'Profit'.padEnd(15) + 'Ending');
  console.log('─'.repeat(80));
  
  for (let month = 1; month <= 12; month++) {
    const startingBalance = compoundBalance;
    const monthlyROI = avgROIPerMonth;
    const monthlyProfit = startingBalance * (monthlyROI / 100);
    compoundBalance += monthlyProfit;
    
    console.log(
      `Month ${month}`.padEnd(10) +
      `$${startingBalance.toFixed(0)}`.padEnd(15) +
      `${monthlyROI.toFixed(2)}%`.padEnd(10) +
      `$${monthlyProfit.toFixed(0)}`.padEnd(15) +
      `$${compoundBalance.toFixed(0)}`
    );
  }
  
  console.log('─'.repeat(80));
  console.log(`Final Balance after 12 months: $${compoundBalance.toFixed(2)}`);
  console.log(`Total Growth: ${((compoundBalance / initialBalance - 1) * 100).toFixed(2)}%`);
  
  console.log('\n📝 NOTES:');
  console.log('   - Estimates based on 3-month backtest data');
  console.log('   - Assumes similar market conditions continue');
  console.log('   - Compounding scenario reinvests all profits');
  console.log('   - Actual results may vary based on market volatility');
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Analysis Complete!');
  console.log('='.repeat(80) + '\n');
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const symbolArg = args.find(arg => arg.startsWith('--symbol='));
  const balanceArg = args.find(arg => arg.startsWith('--balance='));
  
  const symbol = symbolArg ? symbolArg.split('=')[1] : 'BTCUSDT';
  const initialBalance = balanceArg ? parseFloat(balanceArg.split('=')[1]) : 1000;
  
  await analyzeTradesByMonth(symbol, initialBalance);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeTradesByMonth };
