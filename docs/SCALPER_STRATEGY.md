# 🎯 Scalper Strategy - High Frequency Trading

## 📋 Overview

**Scalper Strategy** adalah strategi trading cepat yang dirancang untuk profit kecil tapi **SERING** (20-30+ trades per hari). Perfect untuk trader yang suka aksi cepat! ⚡

### 🆚 Perbandingan: Scalper vs Swing Trading

| Aspek | **Scalper Mode** 🎯 | **Swing Mode** 📊 |
|-------|---------------------|-------------------|
| **Timeframe** | 5m (fast) | 15m (medium) |
| **Take Profit** | 1.5% (quick) | 6% (patient) |
| **Stop Loss** | 0.7% (tight) | 3% (wider) |
| **Position Size** | 8% | 10% |
| **Leverage** | 15x | 10x |
| **Trades/Day** | 20-30+ | 1-5 |
| **Hold Time** | 5-30 mins | 2-6 hours |
| **Style** | Active, Fast | Patient, Medium |
| **Risk** | Lower per trade | Higher per trade |
| **Reward** | Small but frequent | Large but rare |

---

## 🎯 Features Scalper Strategy

### 1. ⚡ Fast Indicators
- **RSI 7** (instead of 14): Lebih sensitif untuk signal cepat
- **MACD 5/13/5** (instead of 12/26/9): Fast crossover detection
- **EMA 5/10/20** (instead of 20/50/200): Ultra responsive trend

### 2. ⏰ Scalping Optimal Hours
```typescript
🔥 PRIME TIME (High Volume):
- London Session: 7-9 UTC (+10% confidence)
- NY Session: 13-16 UTC (+10% confidence)
- Best overlap: High liquidity, tight spreads

✅ GOOD TIME:
- Regular hours: 3-7 UTC, 9-13 UTC, 16-24 UTC

🚫 AVOID:
- Overnight: 0-3 UTC (low liquidity, wide spreads)
- Weekend: Saturday/Sunday (lower volume)
```

### 3. 📊 Volume Spike Detection
Scalping membutuhkan **VOLUME TINGGI** untuk minimize slippage:
```typescript
🚀 MASSIVE SPIKE (2x+ avg): +15% confidence
📊 High Volume (1.5-2x): +10% confidence
⚠️ Low Volume (< 0.7x): -20% confidence (DANGER!)
```

### 4. 🎯 Market Regime Filter
Hanya trade di **TRENDING markets** (ADX-based):
```typescript
✅ TRENDING_UP (ADX > 25): Trade LONG
✅ TRENDING_DOWN (ADX > 25): Trade SHORT
✅ ADX 25-50: Best for scalping (+15% confidence)

🚫 RANGING (ADX < 20): HOLD (choppy, no clear direction)
🚫 CHOPPY: HOLD (erratic price action)
```

### 5. 📈 Spread Check
Spread = bid-ask difference. High spread = profit loss!
```typescript
✅ Spread < 0.02%: OK to scalp
⚠️ Spread > 0.02%: -10% confidence (fee too high)
```

---

## 🚀 Signal Logic

### 📊 BUY Signals (Scalp Long)
```typescript
MUST HAVE:
- MACD bullish cross OR MACD > signal with RSI < 60
- Price above EMA5 OR fresh EMA5 cross above EMA10
- Trend = UPTREND or STRONG_UPTREND

BONUS (+5% each):
- Fresh EMA cross
- Volume spike (1.5x+)
- STRONG_UPTREND
```

### 📉 SELL Signals (Scalp Short)
```typescript
MUST HAVE:
- MACD bearish cross OR MACD < signal with RSI > 40
- Price below EMA5 OR fresh EMA5 cross below EMA10
- Trend = DOWNTREND or STRONG_DOWNTREND

BONUS (+5% each):
- Fresh EMA cross
- Volume spike
- STRONG_DOWNTREND
```

### ⚡ Quick Momentum Scalps
```typescript
BUY: MACD bullish + RSI < 55 + price > EMAs + not in DOWNTREND
SELL: MACD bearish + RSI > 45 + price < EMAs + not in UPTREND

Confidence: 65% (lower threshold for quick trades)
```

---

## 📊 Confidence System

### Minimum Confidence: **70%** (higher than swing!)
Scalping butuh signal **SANGAT KUAT** karena:
- Take profit kecil (1.5%)
- Fee impact lebih besar (multiple trades)
- Slippage risk

### Confidence Boosts:
```typescript
+10%: Prime scalping hours (London/NY)
+15%: Market regime TRENDING (ADX 25-50)
+15%: Massive volume spike (2x+)
+10%: High volume (1.5x+)
+5%: Fresh EMA cross
+5%: Strong trend (STRONG_UPTREND/DOWNTREND)
```

### Confidence Penalties:
```typescript
-10%: High spread (> 0.02%)
-20%: Low volume (< 0.7x avg)
-100%: Ranging/Choppy market (ADX < 20)
-100%: Off-hours (0-3 UTC, weekends)
```

---

## 💰 Risk Management

### 1. Position Sizing
- **8% per trade** (lower than swing 10%)
- Why? More trades = more risk exposure
- Max 3 positions concurrent

### 2. Stop Loss (Dynamic ATR-based)
```typescript
Base: 0.7% (tight!)
Dynamic: 2x ATR (adaptive)
Range: 0.5% - 1.2%

Example:
- High volatility (ATR 1%): SL = 1.2%
- Low volatility (ATR 0.3%): SL = 0.6%
```

### 3. Take Profit
```typescript
Fixed: 1.5% (quick profit target)
Risk/Reward: 2.14:1 (1.5% / 0.7%)

Better than typical scalper (1.5:1)!
```

### 4. Max Daily Loss
```typescript
$100 max per day
After hitting: Bot stops trading
Resets: Next day 00:00 UTC
```

---

## 🎯 When to Use Scalper vs Swing?

### Use **SCALPER** when:
✅ Market is **VOLATILE** (high ATR)
✅ You're **ACTIVE** (can monitor frequently)
✅ You want **FREQUENT** small profits
✅ During **HIGH VOLUME** hours (London/NY)
✅ Strong **TRENDING** markets (ADX 25-50)

### Use **SWING** when:
✅ Market is **STABLE** (lower volatility)
✅ You're **PASSIVE** (check 1-2x per day)
✅ You want **LARGER** profits (patient)
✅ During **ALL HOURS** (less time-sensitive)
✅ Any market condition

---

## 📈 Expected Performance

### Backtest Target (3 months):
```typescript
✅ Trades: 1800-2700 (vs swing 90-150)
✅ Win Rate: 55-65% (vs swing 40-50%)
✅ Avg Profit/Trade: $15-25 (vs swing $50-100)
✅ Total Profit: $27k-67k (vs swing $4.5k-15k)
✅ Max Drawdown: 8-12% (vs swing 10-15%)
```

### Daily Expectations:
```typescript
Trades: 20-30 per day
Winners: 12-18 (55-60% win rate)
Losers: 8-12
Profit: $300-$750 per day (avg $500)
Time: Active monitoring recommended
```

---

## 🚀 Quick Start

### 1. Import Strategy
```typescript
import { ScalperStrategy } from '@/lib/trading/ScalperStrategy';
```

### 2. Initialize
```typescript
const strategy = new ScalperStrategy(
  userId,
  apiKey,
  apiSecret,
  botInstanceId
);
```

### 3. Analyze
```typescript
const signal = await strategy.analyze();

if (signal.action !== 'HOLD' && signal.confidence >= 70) {
  // Execute scalp trade!
  await strategy.executeTrade(signal);
}
```

### 4. Monitor
```typescript
// Scalper needs frequent checks (every 5 mins)
setInterval(async () => {
  const signal = await strategy.analyze();
  // Execute if signal
}, 5 * 60 * 1000); // 5 minutes
```

---

## ⚠️ Important Notes

### 1. Trading Fees
Binance Futures fees: **0.02% maker, 0.04% taker**

For 25 trades/day:
- Daily fees: ~$100-200 (on $10k capital)
- Monthly fees: ~$3k-6k

**MUST** factor in fees! Use limit orders (maker) when possible.

### 2. Slippage Risk
Scalping sensitive to slippage:
- **High volume hours**: 0.01-0.03% slippage ✅
- **Low volume hours**: 0.05-0.15% slippage ⚠️

That's why we **AVOID** low volume periods!

### 3. Emotional Discipline
25+ trades/day = 25 decisions
- Don't revenge trade after loss
- Stick to 70%+ confidence threshold
- Stop after daily loss limit

### 4. Capital Requirements
Minimum recommended: **$5,000**
- Why? Trading fees won't eat all profits
- $1k capital = $20 profit/day - $100 fees = -$80 ❌
- $5k capital = $100 profit/day - $100 fees = breakeven
- $10k capital = $200 profit/day - $100 fees = +$100 ✅

---

## 🔧 Configuration

### Default Config (ScalperStrategy.ts):
```typescript
{
  symbol: 'BTCUSDT',
  leverage: 15,            // Higher than swing (10x)
  stopLossPercent: 0.7,    // Tighter than swing (3%)
  takeProfitPercent: 1.5,  // Smaller than swing (6%)
  positionSizePercent: 8,  // Smaller than swing (10%)
  maxDailyLoss: 100,       // Same as swing
}
```

### Adjustable Parameters:
```typescript
// More aggressive (higher risk/reward)
{
  leverage: 20,
  stopLossPercent: 0.5,
  takeProfitPercent: 2.0,
  positionSizePercent: 10,
}

// More conservative (lower risk)
{
  leverage: 10,
  stopLossPercent: 1.0,
  takeProfitPercent: 1.2,
  positionSizePercent: 5,
}
```

---

## 📊 Indicators Explained

### 1. Fast RSI (7 period)
```typescript
< 35: Oversold (potential buy)
> 65: Overbought (potential sell)
45-55: Neutral (wait for clear signal)
```

### 2. Fast MACD (5/13/5)
```typescript
MACD > Signal: Bullish momentum
MACD < Signal: Bearish momentum
Histogram > 0: Buy pressure
Histogram < 0: Sell pressure
Fresh cross (|histogram| < 5): Strong signal
```

### 3. Fast EMAs (5/10/20)
```typescript
EMA5 > EMA10 > EMA20: Strong uptrend
EMA5 < EMA10 < EMA20: Strong downtrend
EMA5 > EMA10: Uptrend
EMA5 < EMA10: Downtrend
Fresh cross: Entry signal
```

---

## 🎯 Next Steps

### Phase 1: Backtest (RECOMMENDED!)
```bash
# Create backtest for scalper
cd backtest
node run-scalper-backtest.js --period 1w --compare
```

### Phase 2: Paper Trade
- Test scalper in demo mode
- Validate 20-30 trades/day
- Check win rate (target 55%+)
- Monitor fees impact

### Phase 3: Live Trade (Small Capital)
- Start with $1k-2k
- Run for 1 week
- Analyze results
- Scale up if profitable

---

## 📚 Related Docs
- [Quick Wins Implementation](./QUICK_WINS_IMPLEMENTATION.md) - Time/Volume filters
- [Market Regime Filter](./MARKET_REGIME_FILTER_COMPLETE.md) - ADX-based filtering
- [Backtest System](../backtest/README.md) - How to validate strategies

---

## ✅ Checklist

Sebelum live trading:

- [ ] Backtest 1 week data (validate performance)
- [ ] Test on multiple symbols (BTC, ETH, BNB)
- [ ] Check fees impact (must be < 30% of profit)
- [ ] Validate win rate (target 55%+)
- [ ] Paper trade 3 days (real-time validation)
- [ ] Set max daily loss limit
- [ ] Prepare for active monitoring (5min checks)
- [ ] Have $5k+ capital (minimum recommended)

---

**Status:** ✅ READY TO BACKTEST

**Created:** October 27, 2025  
**Strategy:** ScalperStrategy.ts  
**Author:** FuturePilot v2 Team  
**Risk Level:** MEDIUM-HIGH (active trading required)
