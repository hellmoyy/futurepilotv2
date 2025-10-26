/**
 * 📄 Report Generator
 * 
 * Generate beautiful console and file reports
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  /**
   * Print console report
   */
  static printConsole(metrics, config) {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 BACKTEST RESULTS - Bitcoin Pro Strategy');
    console.log('='.repeat(70));

    console.log('\n📅 TEST CONFIGURATION:');
    console.log(`   Period: ${config.startDate} to ${config.endDate}`);
    console.log(`   Timeframe: ${config.interval}`);
    console.log(`   Initial Capital: $${metrics.initialCapital}`);
    console.log(`   Position Size: ${config.positionSize}% (${config.leverage}x leverage)`);

    console.log('\n📊 OVERALL PERFORMANCE:');
    console.log(`   Total Trades: ${metrics.totalTrades}`);
    console.log(`   Win Rate: ${metrics.winRate}% (${metrics.wins} wins / ${metrics.losses} losses)`);
    console.log(`   Final Capital: $${metrics.finalCapital}`);
    console.log(`   Total Profit: $${metrics.totalProfit} (${metrics.roi}% ROI)`);

    console.log('\n💰 PROFIT STATISTICS:');
    console.log(`   Average Trade: $${metrics.avgTrade}`);
    console.log(`   Average Win: $${metrics.avgWin}`);
    console.log(`   Average Loss: $${metrics.avgLoss}`);
    console.log(`   Best Trade: $${metrics.bestTrade}`);
    console.log(`   Worst Trade: $${metrics.worstTrade}`);
    console.log(`   Profit Factor: ${metrics.profitFactor}`);

    console.log('\n📈 RISK METRICS:');
    console.log(`   Max Drawdown: ${metrics.maxDrawdown}%`);
    console.log(`   Sharpe Ratio: ${metrics.sharpeRatio}`);
    console.log(`   Stop Loss Hits: ${metrics.stopLossHits} (${(metrics.stopLossHits / metrics.totalTrades * 100).toFixed(1)}%)`);
    console.log(`   Take Profit Hits: ${metrics.takeProfitHits} (${(metrics.takeProfitHits / metrics.totalTrades * 100).toFixed(1)}%)`);

    console.log('\n📊 TRADE DISTRIBUTION:');
    console.log(`   LONG Trades: ${metrics.longTrades} (${metrics.longWinRate}% win rate)`);
    console.log(`   SHORT Trades: ${metrics.shortTrades} (${metrics.shortWinRate}% win rate)`);

    if (Object.keys(metrics.regimeStats).length > 0) {
      console.log('\n🎯 MARKET REGIME ANALYSIS:');
      for (const [regime, stats] of Object.entries(metrics.regimeStats)) {
        const icon = regime === 'TRENDING_UP' ? '🚀'
          : regime === 'TRENDING_DOWN' ? '🔻'
          : regime === 'RANGING' ? '📊'
          : regime === 'CHOPPY' ? '⚠️'
          : '❓';
        
        console.log(`   ${icon} ${regime}: ${stats.count} trades, ${stats.winRate}% win rate, avg $${stats.avgProfit}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Backtest Complete!');
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Print comparison report
   */
  static printComparison(baseline, improved, baselineLabel, improvedLabel) {
    console.log('\n' + '='.repeat(70));
    console.log('🔄 STRATEGY COMPARISON');
    console.log('='.repeat(70));

    console.log(`\n📊 ${baselineLabel} vs ${improvedLabel}\n`);

    const metrics = [
      { label: 'Win Rate', key: 'winRate', suffix: '%' },
      { label: 'Total Profit', key: 'totalProfit', prefix: '$' },
      { label: 'ROI', key: 'roi', suffix: '%' },
      { label: 'Sharpe Ratio', key: 'sharpeRatio', suffix: '' },
      { label: 'Max Drawdown', key: 'maxDrawdown', suffix: '%' },
      { label: 'Avg Trade', key: 'avgTrade', prefix: '$' }
    ];

    console.log('   Metric              | ' + baselineLabel.padEnd(20) + ' | ' + improvedLabel.padEnd(20) + ' | Improvement');
    console.log('   ' + '-'.repeat(90));

    metrics.forEach(({ label, key, prefix = '', suffix = '' }) => {
      const val1 = baseline[key];
      const val2 = improved[key];
      const diff = (parseFloat(val2) - parseFloat(val1)).toFixed(2);
      const diffIcon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      
      console.log(
        '   ' + label.padEnd(18) + ' | ' +
        `${prefix}${val1}${suffix}`.padEnd(20) + ' | ' +
        `${prefix}${val2}${suffix}`.padEnd(20) + ' | ' +
        `${diffIcon} ${prefix}${diff}${suffix}`
      );
    });

    const winRateImprovement = parseFloat(improved.winRate) - parseFloat(baseline.winRate);
    const profitImprovement = parseFloat(improved.totalProfit) - parseFloat(baseline.totalProfit);

    console.log('\n🚀 IMPROVEMENT SUMMARY:');
    console.log(`   Win Rate: ${winRateImprovement > 0 ? '+' : ''}${winRateImprovement.toFixed(2)}%`);
    console.log(`   Profit: ${profitImprovement > 0 ? '+$' : '$'}${profitImprovement.toFixed(2)}`);

    console.log('\n' + '='.repeat(70) + '\n');
  }

  /**
   * Save results to JSON file
   */
  static saveToFile(data, filename) {
    const resultsDir = path.join(__dirname, 'results');
    
    // Create results directory if not exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filepath = path.join(resultsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log(`💾 Results saved to: ${filepath}\n`);
    return filepath;
  }

  /**
   * Generate HTML report (optional)
   */
  static generateHTML(metrics, trades, config, filename = 'report.html') {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Backtest Report - FuturePilot v2</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
    .metric-card .value { font-size: 32px; font-weight: bold; color: #333; }
    .metric-card .value.positive { color: #10b981; }
    .metric-card .value.negative { color: #ef4444; }
    .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section h2 { margin-top: 0; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f9fafb; font-weight: 600; }
    .win { color: #10b981; }
    .loss { color: #ef4444; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Backtest Report - Bitcoin Pro Strategy</h1>
    <p>Period: ${config.startDate} to ${config.endDate} | Timeframe: ${config.interval}</p>
  </div>

  <div class="metrics">
    <div class="metric-card">
      <h3>Win Rate</h3>
      <div class="value positive">${metrics.winRate}%</div>
      <small>${metrics.wins} wins / ${metrics.losses} losses</small>
    </div>
    <div class="metric-card">
      <h3>Total Profit</h3>
      <div class="value ${parseFloat(metrics.totalProfit) > 0 ? 'positive' : 'negative'}">$${metrics.totalProfit}</div>
      <small>ROI: ${metrics.roi}%</small>
    </div>
    <div class="metric-card">
      <h3>Total Trades</h3>
      <div class="value">${metrics.totalTrades}</div>
      <small>Avg: $${metrics.avgTrade}/trade</small>
    </div>
    <div class="metric-card">
      <h3>Max Drawdown</h3>
      <div class="value negative">${metrics.maxDrawdown}%</div>
      <small>Sharpe: ${metrics.sharpeRatio}</small>
    </div>
  </div>

  <div class="section">
    <h2>📊 Regime Analysis</h2>
    <table>
      <tr>
        <th>Regime</th>
        <th>Trades</th>
        <th>Win Rate</th>
        <th>Avg Profit</th>
      </tr>
      ${Object.entries(metrics.regimeStats).map(([regime, stats]) => `
        <tr>
          <td>${regime}</td>
          <td>${stats.count}</td>
          <td class="${parseFloat(stats.winRate) > 70 ? 'win' : ''}">${stats.winRate}%</td>
          <td class="${parseFloat(stats.avgProfit) > 0 ? 'win' : 'loss'}">$${stats.avgProfit}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  <div class="section">
    <h2>💼 Recent Trades (Last 20)</h2>
    <table>
      <tr>
        <th>Time</th>
        <th>Side</th>
        <th>Entry</th>
        <th>Exit</th>
        <th>P&L</th>
        <th>Reason</th>
      </tr>
      ${trades.slice(-20).reverse().map(trade => `
        <tr>
          <td>${new Date(trade.entryTime).toLocaleString()}</td>
          <td>${trade.side}</td>
          <td>$${trade.entryPrice.toFixed(2)}</td>
          <td>$${trade.exitPrice.toFixed(2)}</td>
          <td class="${trade.win ? 'win' : 'loss'}">$${trade.dollarPnL.toFixed(2)}</td>
          <td>${trade.exitReason}</td>
        </tr>
      `).join('')}
    </table>
  </div>
</body>
</html>
    `;

    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filepath = path.join(resultsDir, filename);
    fs.writeFileSync(filepath, html);

    console.log(`📄 HTML report saved to: ${filepath}\n`);
    return filepath;
  }
}

module.exports = ReportGenerator;
