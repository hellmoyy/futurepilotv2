# 🎯 Scalper Strategy - Quick Reference

## ⚡ Quick Start (5 Minutes)

### 1. Run Backtest
```bash
cd backtest
node run-scalper-backtest.js --period 1w --compare
```

### 2. Check Results
- Win rate: Target **55-65%**
- Trades: Target **20-30 per day**
- ROI: Target **2-5% per week**

### 3. If Good → Deploy!
```typescript
import { ScalperStrategy } from '@/lib/trading/ScalperStrategy';

const scalper = new ScalperStrategy(userId, apiKey, apiSecret);
const signal = await scalper.analyze();

if (signal.confidence >= 70) {
  // Execute trade!
}
```

---

## 📊 Key Parameters

| Parameter | Scalper | Swing | Why Different? |
|-----------|---------|-------|----------------|
| **Timeframe** | 5m | 15m | Faster signals |
| **Take Profit** | 1.5% | 6% | Quick exits |
| **Stop Loss** | 0.7% | 3% | Tight risk |
| **Position** | 8% | 10% | More trades = smaller size |
| **Leverage** | 15x | 10x | Compensate small TP |
| **Min Confidence** | 70% | 65% | Need stronger signals |

---

## 🎯 When to Trade (Scalper Mode)

### ✅ TRADE
- **Prime Time**: 7-9 UTC, 13-16 UTC (London/NY)
- **High Volume**: 1.5x+ average volume
- **Trending**: ADX > 25
- **Clear Signal**: MACD cross + EMA aligned

### 🚫 HOLD
- **Off Hours**: 0-3 UTC (overnight)
- **Weekend**: Saturday/Sunday
- **Low Volume**: < 0.7x average
- **Ranging**: ADX < 20 (choppy market)
- **Weak Signal**: Confidence < 70%

---

## 📈 Indicators (Fast Settings)

### RSI (7 period)
```
< 35  → Oversold (buy setup)
> 65  → Overbought (sell setup)
45-55 → Neutral (wait)
```

### MACD (5/13/5)
```
Cross Up   → BUY signal
Cross Down → SELL signal
|Histogram| < 5 → Fresh cross (strong!)
```

### EMA (5/10/20)
```
5 > 10 > 20 → STRONG_UPTREND (buy)
5 < 10 < 20 → STRONG_DOWNTREND (sell)
Fresh cross → Entry point
```

### ADX (14 period)
```
< 20    → RANGING (HOLD)
20-25   → Weak trend (careful)
25-50   → IDEAL for scalping (+15% conf)
> 50    → Exhaustion (careful)
```

---

## 💰 Risk Management

### Position Sizing
```
Balance: $10,000
Position: 8% = $800
Leverage: 15x
Exposure: $12,000 (manageable)
```

### Stop Loss (Dynamic)
```
Base: 0.7% (tight!)
With ATR: 0.5% - 1.2%

High volatility (ATR 1%) → SL 1.2%
Low volatility (ATR 0.3%) → SL 0.6%
```

### Take Profit
```
Fixed: 1.5%
Risk/Reward: 2.14:1 (excellent!)

Example:
Entry: $50,000
TP: $50,750 (+1.5%)
SL: $49,650 (-0.7%)
```

---

## 📊 Expected Performance

### Daily (20-30 trades)
```
Trades: 25
Winners: 15 (60% win rate)
Losers: 10
Profit: $375 - $625
Fees: ~$100-150
Net: $225 - $475 per day
```

### Weekly
```
Trades: 150
Profit: $1,575 - $3,325
ROI: 1.5% - 3.3% per week
Drawdown: 5-8%
```

### Monthly
```
Trades: 600
Profit: $6,750 - $14,250
ROI: 67% - 142% per month 🚀
Drawdown: 8-12%
```

---

## ⚠️ Important Notes

### 1. Fees Matter!
```
Binance: 0.04% per trade
25 trades/day = 50 fee events
Daily fees: $100-200 (on $10k capital)

MUST have $5k+ to be profitable!
```

### 2. Active Monitoring
```
Check every: 5 minutes
Why: Scalper needs fast action
Can't be: Set & forget
Best for: Active traders
```

### 3. Capital Requirements
```
Minimum: $5,000
Recommended: $10,000+
Why: Fees won't eat profits
```

### 4. Discipline
```
✅ Only trade 70%+ confidence
✅ Stop at daily loss limit ($100)
✅ Don't revenge trade
✅ Stick to prime hours
```

---

## 🚀 Commands Cheat Sheet

### Backtest
```bash
# 1 week test
node run-scalper-backtest.js --period 1w

# Different symbol
node run-scalper-backtest.js --symbol ETHUSDT --period 2w

# Compare with swing
node run-scalper-backtest.js --compare --period 1m
```

### Files
```
Strategy: src/lib/trading/ScalperStrategy.ts
Backtest: backtest/run-scalper-backtest.js
Docs: docs/SCALPER_STRATEGY.md
Reports: backtest/results/scalper_*.html
```

---

## 🎯 Confidence Checklist

Before opening trade, ensure:

- [ ] **70%+ confidence** (minimum!)
- [ ] **Prime hours** (7-9 or 13-16 UTC)
- [ ] **High volume** (1.5x+ average)
- [ ] **Trending market** (ADX > 25)
- [ ] **Clear signal** (MACD + EMA aligned)
- [ ] **Low spread** (< 0.02%)
- [ ] **Not weekend** (liquidity matters!)

---

## 📞 Quick Help

### "Too few trades?"
- Lower confidence threshold (65% instead of 70%)
- Trade more hours (not just prime time)
- Add more symbols (ETH, BNB, SOL)

### "Too many losses?"
- Increase confidence threshold (75%)
- Only trade prime hours
- Check ADX > 25 before trade

### "Fees eating profit?"
- Need more capital ($10k+)
- Use limit orders (maker fee 0.02%)
- Reduce trade frequency

### "Missing signals?"
- Check every 5 minutes
- Enable notifications
- Consider automated execution

---

## 📚 Related Docs

- [Full Documentation](./SCALPER_STRATEGY.md) - Complete guide
- [Market Regime Filter](./MARKET_REGIME_FILTER_COMPLETE.md) - ADX system
- [Quick Wins](./QUICK_WINS_IMPLEMENTATION.md) - Time/Volume filters

---

**Status:** ✅ READY TO TEST  
**Risk:** MEDIUM-HIGH (active trading)  
**Capital:** $5,000 minimum  
**Time:** Active monitoring required
