# 🚀 Backtest Quick Start Guide

## ⚡ Run Backtest Sekarang!

### 🎯 Production Mode (RECOMMENDED - Uses Actual Bot Code!)

```bash
# Basic backtest (3 bulan, BTC, 15m) - Uses PRODUCTION strategy!
node backtest/run-production.js

# Custom period
node backtest/run-production.js --period 1w
node backtest/run-production.js --period 6m

# Generate HTML report
node backtest/run-production.js --period 3m --html

# Different symbol
node backtest/run-production.js --symbol ETHUSDT --period 3m
```

**✨ What Makes This Special:**
- Uses **ACTUAL production code** from `src/lib/trading/BitcoinProStrategy.ts`
- Same logic as live bot (Time Filter, Volume, ATR, Market Regime)
- Most accurate backtest results!

---

### 📊 Simple Mode (Quick Tests)

```bash
# Fast JS simulator (good for quick tests)
node backtest/run-backtest.js

# Compare strategies
node backtest/run-backtest.js --compare
```

---

## 📊 Available Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `--period` | 1w, 1m, 3m, 6m, 1y | 3m | Period untuk backtest |
| `--symbol` | BTCUSDT, ETHUSDT, dll | BTCUSDT | Trading pair |
| `--interval` | 1m, 5m, 15m, 1h, 4h, 1d | 15m | Timeframe |
| `--capital` | number | 10000 | Initial capital (USD) |
| `--compare` | flag | false | Compare original vs improved |
| `--html` | flag | false | Generate HTML report |

---

## 📁 Output Files

Semua hasil disimpan di `backtest/results/`:

### JSON Report
```json
{
  "config": {
    "startDate": "2024-07-27",
    "endDate": "2024-10-27",
    "interval": "15m",
    "initialCapital": 10000
  },
  "metrics": {
    "winRate": "84.30",
    "totalProfit": "4521.50",
    "roi": "45.22",
    "sharpeRatio": "2.34",
    "maxDrawdown": "6.80"
  },
  "trades": [...]
}
```

### HTML Report
Beautiful visual report dengan:
- Win rate chart
- Profit/loss graph
- Regime analysis table
- Trade history

---

## 🎯 Example Output

```
🎯 BACKTEST RESULTS - Bitcoin Pro Strategy
======================================================================

📅 TEST CONFIGURATION:
   Period: 2024-07-27 to 2024-10-27
   Timeframe: 15m
   Initial Capital: $10000
   Position Size: 10% (10x leverage)

📊 OVERALL PERFORMANCE:
   Total Trades: 173
   Win Rate: 84.30% (146 wins / 27 losses)
   Final Capital: $14521.50
   Total Profit: $4521.50 (45.22% ROI)

💰 PROFIT STATISTICS:
   Average Trade: $26.13
   Average Win: $48.25
   Average Loss: -$65.33
   Best Trade: $245.50
   Worst Trade: -$185.20
   Profit Factor: 2.65

📈 RISK METRICS:
   Max Drawdown: 6.80%
   Sharpe Ratio: 2.34
   Stop Loss Hits: 27 (15.6%)
   Take Profit Hits: 146 (84.4%)

🎯 MARKET REGIME ANALYSIS:
   🚀 TRENDING_UP: 78 trades, 92.30% win rate, avg $52.15
   🔻 TRENDING_DOWN: 68 trades, 88.24% win rate, avg $45.80
   📊 RANGING: 0 trades (blocked) ❌
   ⚠️ CHOPPY: 0 trades (blocked) ❌
```

---

## 🔄 Comparison Mode

```bash
node backtest/run-backtest.js --compare
```

**Output:**
```
🔄 STRATEGY COMPARISON
======================================================================

📊 Original (71% baseline) vs Improved (All features)

   Metric              | Original            | Improved            | Improvement
   ------------------------------------------------------------------------------------------
   Win Rate            | 71.00%              | 84.30%              | 📈 +13.30%
   Total Profit        | $1250.00            | $4521.50            | 📈 +$3271.50
   ROI                 | 12.50%              | 45.22%              | 📈 +32.72%
   Sharpe Ratio        | 1.45                | 2.34                | 📈 +0.89
   Max Drawdown        | 12.30%              | 6.80%               | 📈 -5.50%

🚀 IMPROVEMENT SUMMARY:
   Win Rate: +13.30%
   Profit: +$3271.50
```

---

## 💡 Tips

### 1. Start Small
```bash
# Test dengan 1 minggu dulu (cepat!)
node backtest/run-backtest.js --period 1w
```

### 2. Compare Always
```bash
# Always compare untuk lihat improvement
node backtest/run-backtest.js --compare
```

### 3. Use HTML for Analysis
```bash
# HTML report lebih mudah dibaca
node backtest/run-backtest.js --compare --html
```

### 4. Test Multiple Timeframes
```bash
# 15m (scalping)
node backtest/run-backtest.js --interval 15m --compare

# 1h (swing)
node backtest/run-backtest.js --interval 1h --compare

# 4h (position)
node backtest/run-backtest.js --interval 4h --compare
```

### 5. Test Different Pairs
```bash
# Bitcoin
node backtest/run-backtest.js --symbol BTCUSDT --compare

# Ethereum
node backtest/run-backtest.js --symbol ETHUSDT --compare

# Other alts
node backtest/run-backtest.js --symbol BNBUSDT --compare
```

---

## ⚠️ Important Notes

1. **Data Source:** Binance Futures API (gratis, no API key needed)
2. **Realistic Simulation:** Includes slippage, leverage, SL/TP
3. **Market Regime Filter:** Automatically blocks RANGING/CHOPPY markets
4. **Time Filter:** Blocks overnight hours (0-3 UTC)
5. **Volume Filter:** Adjusts confidence based on volume
6. **Dynamic Stop Loss:** ATR-based (2-5% range)

---

## 🎯 What to Look For

### Good Results ✅
- Win rate > 80%
- Sharpe ratio > 2.0
- Max drawdown < 10%
- Profit factor > 2.0
- Most trades in TRENDING regime

### Red Flags ❌
- Win rate < 65%
- Sharpe ratio < 1.0
- Max drawdown > 20%
- Trades in RANGING/CHOPPY (should be 0!)

---

## 🚀 Ready to Test!

```bash
# Recommended: Full comparison with HTML
node backtest/run-backtest.js --period 3m --compare --html
```

Hasil akan tersimpan di `backtest/results/` 📊

Good luck! 🎯
