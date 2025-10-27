/**
 * 🔍 SIMPLE LOSS ANALYZER
 * Analisa penyebab loss dari backtest results
 */

const { backtestFuturesPair } = require('./run-futures-scalper');

async function analyzeLosses(symbol, period) {
  console.log('\n🔍 Running backtest with detailed loss tracking...\n');
  
  const result = await backtestFuturesPair(symbol, period);
  
  if (!result || !result.trades) {
    console.log('❌ No results');
    return;
  }
  
  const losses = result.trades.filter(t => t.pnl < 0);
  const wins = result.trades.filter(t => t.pnl > 0);
  
  console.log('\n' + '='.repeat(70));
  console.log('📉 LOSS ANALYSIS REPORT');
  console.log('='.repeat(70));
  
  // 1. By Exit Type
  console.log('\n1️⃣  LOSS BY EXIT TYPE:');
  const byExitType = {};
  losses.forEach(l => {
    byExitType[l.exitType] = (byExitType[l.exitType] || 0) + 1;
  });
  Object.entries(byExitType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} losses (${(count/losses.length*100).toFixed(1)}%)`);
  });
  
  // 2. By Direction
  console.log('\n2️⃣  LOSS BY DIRECTION:');
  const buyLosses = losses.filter(l => l.type === 'BUY').length;
  const sellLosses = losses.filter(l => l.type === 'SELL').length;
  console.log(`   BUY: ${buyLosses} losses (${(buyLosses/losses.length*100).toFixed(1)}%)`);
  console.log(`   SELL: ${sellLosses} losses (${(sellLosses/losses.length*100).toFixed(1)}%)`);
  
  // 3. Duration Analysis
  console.log('\n3️⃣  LOSS DURATION:');
  const lossDurations = losses.map(l => {
    return (new Date(l.exitTime) - new Date(l.entryTime)) / 1000 / 60;
  });
  const avgLossDuration = lossDurations.reduce((a,b) => a+b, 0) / lossDurations.length;
  
  const winDurations = wins.map(w => {
    return (new Date(w.exitTime) - new Date(w.entryTime)) / 1000 / 60;
  });
  const avgWinDuration = winDurations.reduce((a,b) => a+b, 0) / winDurations.length;
  
  console.log(`   Average Loss Duration: ${avgLossDuration.toFixed(1)} minutes`);
  console.log(`   Average Win Duration: ${avgWinDuration.toFixed(1)} minutes`);
  
  // 4. Time Pattern
  console.log('\n4️⃣  LOSS TIME PATTERNS (UTC):');
  const hourCounts = {};
  losses.forEach(l => {
    const hour = new Date(l.entryTime).getUTCHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const topHours = Object.entries(hourCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);
  topHours.forEach(([hour, count]) => {
    console.log(`   ${hour}:00 - ${count} losses`);
  });
  
  // 5. Confidence Analysis
  console.log('\n5️⃣  CONFIDENCE LEVELS:');
  const lossConfidence = losses.reduce((sum, l) => sum + l.confidence, 0) / losses.length;
  const winConfidence = wins.reduce((sum, w) => sum + w.confidence, 0) / wins.length;
  console.log(`   Average Loss Confidence: ${lossConfidence.toFixed(1)}`);
  console.log(`   Average Win Confidence: ${winConfidence.toFixed(1)}`);
  
  // 6. Detailed Examples
  console.log('\n6️⃣  DETAILED LOSS EXAMPLES (Random 5):');
  const randomLosses = losses.sort(() => 0.5 - Math.random()).slice(0, 5);
  randomLosses.forEach((loss, i) => {
    const duration = (new Date(loss.exitTime) - new Date(loss.entryTime)) / 1000 / 60;
    const priceChange = ((loss.exitPrice - loss.entryPrice) / loss.entryPrice * 100).toFixed(2);
    console.log(`\n   ${i+1}. ${loss.type} @ $${loss.entryPrice.toFixed(2)} → $${loss.exitPrice.toFixed(2)}`);
    console.log(`      Exit: ${loss.exitType} | Duration: ${duration.toFixed(1)}m | Change: ${priceChange}%`);
    console.log(`      Time: ${new Date(loss.entryTime).toLocaleString()}`);
    console.log(`      Confidence: ${loss.confidence.toFixed(1)}`);
  });
  
  // 7. Key Insights
  console.log('\n' + '='.repeat(70));
  console.log('💡 KEY INSIGHTS & RECOMMENDATIONS:');
  console.log('='.repeat(70));
  
  const emergencyPct = (byExitType['EMERGENCY_EXIT'] || 0) / losses.length * 100;
  const slPct = (byExitType['SL'] || 0) / losses.length * 100;
  
  if (emergencyPct > 30) {
    console.log('\n⚠️  HIGH EMERGENCY EXITS (${emergencyPct.toFixed(1)}%)');
    console.log('   → Losses moving beyond normal SL range');
    console.log('   → Recommendation: Tighten stop loss or add pre-SL trailing');
  }
  
  if (avgLossDuration < 15) {
    console.log('\n⚠️  QUICK LOSSES (avg ${avgLossDuration.toFixed(1)} minutes)');
    console.log('   → Entries being invalidated rapidly');
    console.log('   → Recommendation: Add entry confirmation delay (wait 2-3 candles)');
  }
  
  if (Math.abs(buyLosses - sellLosses) > losses.length * 0.3) {
    const direction = buyLosses > sellLosses ? 'BUY' : 'SELL';
    console.log(`\n⚠️  IMBALANCED LOSSES (${direction} losing more)`);
    console.log('   → One direction consistently underperforming');
    console.log('   → Recommendation: Review market bias or use different params per direction');
  }
  
  if (lossConfidence > winConfidence) {
    console.log('\n⚠️  LOSSES HAVE HIGHER CONFIDENCE');
    console.log('   → False confidence in losing trades');
    console.log('   → Recommendation: Raise confidence threshold or review calculation');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// Run
const args = process.argv.slice(2);
const periodArg = args.find(arg => arg.startsWith('--period='));
const period = periodArg ? periodArg.split('=')[1] : '1m';

const symbolArg = args.find(arg => arg.startsWith('--symbol='));
const symbol = symbolArg ? symbolArg.split('=')[1] : 'BTCUSDT';

analyzeLosses(symbol, period).catch(console.error);
