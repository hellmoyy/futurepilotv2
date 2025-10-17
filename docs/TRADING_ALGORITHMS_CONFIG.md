# 🎯 Trading Algorithms Configuration Guide

## 📋 Daftar Isi
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Strategy Presets](#strategy-presets)
- [Technical Indicators](#technical-indicators)
- [Signal Rules](#signal-rules)
- [Safety Limits](#safety-limits)
- [Custom Strategy](#custom-strategy)
- [Advanced Settings](#advanced-settings)

---

## 🎬 Overview

File `src/config/trading-algorithms.ts` adalah **pusat kontrol** untuk semua algoritma trading di FuturePilot. 

**Keuntungan:**
- ✅ Edit algoritma tanpa ubah code logic
- ✅ Ganti strategy dalam hitungan detik
- ✅ Semua settings di satu tempat
- ✅ Built-in validation untuk keamanan
- ✅ Pre-configured presets (Conservative, Balanced, Aggressive)

---

## 🚀 Quick Start

### 1. Pilih Strategy Preset

Edit line **279** di `src/config/trading-algorithms.ts`:

```typescript
// Pilih salah satu:
export const ACTIVE_STRATEGY: StrategyPreset = 'balanced';     // ✅ Recommended
// export const ACTIVE_STRATEGY: StrategyPreset = 'conservative'; // Aman
// export const ACTIVE_STRATEGY: StrategyPreset = 'aggressive';   // Agresif
// export const ACTIVE_STRATEGY: StrategyPreset = 'custom';       // Custom
```

### 2. Save & Restart Bot

```bash
# Bot akan otomatis pakai settings baru
npm run dev
```

✅ **Selesai!** Bot sekarang menggunakan strategy yang dipilih.

---

## 🎯 Strategy Presets

### 🛡️ Conservative (Pemula)

**Karakteristik:**
- Risk rendah, profit stabil
- Max leverage: **2x**
- Stop loss: **1.5%**
- Take profit: **3.0%**
- Hanya LONG positions
- Max 3 trades per hari

**Cocok untuk:**
- Trader pemula
- Modal kecil
- Sleep well at night

**Win Rate Target:** 70-80%

---

### ⚖️ Balanced (Recommended)

**Karakteristik:**
- Risk-reward seimbang
- Max leverage: **3x**
- Stop loss: **2.0%**
- Take profit: **4.0%**
- LONG & SHORT positions
- Max 5 trades per hari

**Cocok untuk:**
- Kebanyakan trader
- Modal menengah
- Growth yang konsisten

**Win Rate Target:** 60-70%

---

### 🔥 Aggressive (Expert)

**Karakteristik:**
- High risk, high reward
- Max leverage: **5x**
- Stop loss: **3.0%**
- Take profit: **6.0%**
- LONG & SHORT positions
- Max 10 trades per hari

**Cocok untuk:**
- Trader berpengalaman
- Modal besar
- Siap ambil risk

**Win Rate Target:** 50-60% (tapi profit per trade lebih besar)

---

## 📊 Technical Indicators

### RSI (Relative Strength Index)

**Lokasi:** Line 13-23

```typescript
rsi: {
  enabled: true,
  period: 14,              // ⚙️ Edit ini: 7-21 (default: 14)
  overbought: 70,          // ⚙️ Edit ini: 60-80 (default: 70)
  oversold: 30,            // ⚙️ Edit ini: 20-40 (default: 30)
  extremeOverbought: 80,   
  extremeOversold: 20,     
},
```

**Cara Kerja:**
- **RSI > 70** = Overbought (harga terlalu tinggi) → Signal SHORT
- **RSI < 30** = Oversold (harga terlalu rendah) → Signal LONG
- **RSI 40-60** = Neutral zone

**Tips:**
- Period kecil (7-10) = Lebih sensitif, banyak signal
- Period besar (14-21) = Lebih smooth, signal lebih akurat

---

### MACD (Moving Average Convergence Divergence)

**Lokasi:** Line 26-35

```typescript
macd: {
  enabled: true,
  fastPeriod: 12,          // ⚙️ Edit ini: EMA cepat
  slowPeriod: 26,          // ⚙️ Edit ini: EMA lambat
  signalPeriod: 9,         // ⚙️ Edit ini: Signal line
  minHistogram: 0.0001,    
},
```

**Cara Kerja:**
- **MACD > Signal** = Bullish → Signal LONG
- **MACD < Signal** = Bearish → Signal SHORT
- **Histogram growing** = Trend menguat

**Tips:**
- Gunakan periode standard (12, 26, 9) untuk Bitcoin/Ethereum
- Untuk altcoin volatile, coba (8, 17, 9)

---

### Bollinger Bands

**Lokasi:** Line 38-47

```typescript
bollingerBands: {
  enabled: true,
  period: 20,              // ⚙️ Edit ini: Periode SMA
  stdDev: 2,               // ⚙️ Edit ini: Standard deviation (1-3)
  upperBreakout: 0.02,     // 2% dari upper band
  lowerBreakout: 0.02,     
},
```

**Cara Kerja:**
- **Price menyentuh lower band** = Oversold → Signal LONG
- **Price menyentuh upper band** = Overbought → Signal SHORT
- **Price breakout upper band** = Strong bullish momentum
- **Price breakout lower band** = Strong bearish momentum

**Tips:**
- stdDev = 2 (default, recommended)
- stdDev = 3 (wider bands, less signals but stronger)
- stdDev = 1 (tight bands, more signals but weaker)

---

### EMA (Exponential Moving Average)

**Lokasi:** Line 50-59

```typescript
ema: {
  enabled: true,
  shortPeriod: 9,          // ⚙️ Edit ini: EMA pendek (5-20)
  longPeriod: 21,          // ⚙️ Edit ini: EMA panjang (20-200)
  minCrossoverGap: 0.001,  // 0.1% gap untuk valid crossover
},
```

**Cara Kerja:**
- **Short EMA crosses above Long EMA** = Golden Cross → Signal LONG
- **Short EMA crosses below Long EMA** = Death Cross → Signal SHORT
- **Price > EMA** = Uptrend
- **Price < EMA** = Downtrend

**Popular Combinations:**
- **Scalping:** 9 EMA × 21 EMA (fast)
- **Day Trading:** 12 EMA × 26 EMA (medium)
- **Swing Trading:** 50 EMA × 200 EMA (slow)

---

## 🎯 Signal Rules

### LONG Signal Requirements

**Lokasi:** Line 321-336

```typescript
long: {
  rsiRange: { min: 30, max: 70 },       // RSI must be in this range
  macdBullish: true,                     // MACD must be bullish
  macdHistogramPositive: true,           // Histogram must be positive
  priceAboveEMA: true,                   // Price must be above EMA
  emaBullishCross: true,                 // Short EMA above Long EMA
  volumeSurge: false,                    // Volume surge required?
  priceBelowUpperBand: true,             // Not overbought
},
```

**Cara Edit:**
1. Set `volumeSurge: true` untuk signal lebih kuat (tapi lebih jarang)
2. Set `priceAboveEMA: false` untuk allow LONG saat downtrend (risky!)
3. Adjust `rsiRange` untuk filter signal lebih ketat

---

### Confidence Score Weights

**Lokasi:** Line 351-359

```typescript
confidenceWeights: {
  rsi: 20,                    // RSI contributes 20%
  macd: 25,                   // MACD contributes 25%
  ema: 20,                    // EMA contributes 20%
  bollingerBands: 15,         // BB contributes 15%
  volume: 10,                 // Volume contributes 10%
  atr: 10,                    // ATR contributes 10%
},
```

**Total harus = 100%**

**Cara Optimize:**
- Naikkan weight indicator yang paling akurat di pair Anda
- Turunkan weight indicator yang sering false signal
- Test & iterate!

---

## 🛡️ Safety Limits (HARD LIMITS)

**Lokasi:** Line 363-388

```typescript
export const SAFETY_LIMITS = {
  maxDailyLossPercent: 5,     // ⚠️ Max 5% loss per hari
  maxWeeklyLossPercent: 10,   // ⚠️ Max 10% loss per minggu
  maxDrawdownPercent: 15,     // ⚠️ Max 15% drawdown
  
  maxOpenPositions: 3,        // Max 3 positions sekaligus
  maxPositionValue: 10000,    // Max $10,000 per position
  
  absoluteMaxLeverage: 10,    // Never exceed 10x
  emergencyStopLossPercent: 10, // Emergency stop at -10%
  
  maxConsecutiveLosses: 3,    // Stop setelah 3 loss berturut-turut
  circuitBreakerCooldown: 240, // 4 jam cooldown
};
```

**⚠️ PENTING:**
- Ini adalah **hard limits** untuk proteksi
- Tidak boleh dilewati bahkan oleh strategy
- Edit dengan hati-hati!

**Recommended Settings:**
- **Small Account (<$1000):** maxDailyLoss = 3%, maxPositionValue = $500
- **Medium Account ($1000-$10k):** maxDailyLoss = 5%, maxPositionValue = $2000
- **Large Account (>$10k):** maxDailyLoss = 5%, maxPositionValue = $10000

---

## 🎨 Custom Strategy

### Step 1: Set ACTIVE_STRATEGY = 'custom'

```typescript
export const ACTIVE_STRATEGY: StrategyPreset = 'custom';
```

### Step 2: Edit CUSTOM_SETTINGS

**Lokasi:** Line 290-318

```typescript
export const CUSTOM_SETTINGS = {
  // Risk Management
  maxPositionSize: 35,        // ⚙️ % dari balance (10-50)
  maxLeverage: 4,             // ⚙️ Max leverage (1-10)
  stopLossPercent: 2.5,       // ⚙️ Stop loss % (0.5-5)
  takeProfitPercent: 5.0,     // ⚙️ Take profit % (1-10)
  trailingStopPercent: 1.8,   // ⚙️ Trailing stop % (0.5-3)
  
  // Signal Generation
  minConfidenceScore: 70,     // ⚙️ Min confidence (50-90)
  requiredIndicators: 2,      // ⚙️ Min indicators (1-4)
  
  // Trading Rules
  allowShortPositions: true,  // ⚙️ Allow SHORT?
  maxDailyTrades: 7,          // ⚙️ Max trades per day (1-20)
  cooldownMinutes: 20,        // ⚙️ Cooldown (5-120 minutes)
  
  // Market Filters
  minMarketVolume: 300000,    // ⚙️ Min 24h volume USD
  avoidHighVolatility: false, // ⚙️ Skip high volatility?
  
  // Advanced
  useTrailingStop: true,      // ⚙️ Enable trailing stop?
  partialTakeProfit: true,    // ⚙️ Take partial profits?
  partialTakeProfitPercent: 50, // ⚙️ % to close (25-75)
};
```

### Step 3: Test & Iterate

1. Start dengan settings conservative
2. Monitor performance selama 1-2 minggu
3. Tweak parameters sedikit demi sedikit
4. Keep what works, discard what doesn't

---

## ⚙️ Advanced Settings

### Trading Pairs

**Lokasi:** Line 393-422

```typescript
enabled: [
  'BTCUSDT',   // ⚙️ Add/remove pairs di sini
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  // ... tambahkan pair lain
],
```

**Pair-Specific Settings:**
```typescript
pairSettings: {
  BTCUSDT: {
    maxLeverage: 5,         // Override leverage untuk BTC
    minVolume: 1000000,     // Min volume untuk BTC
  },
  // Tambahkan override untuk pair lain...
},
```

---

### Trading Hours

**Lokasi:** Line 428-445

```typescript
allowedWindows: [
  { start: '00:00', end: '23:59' }, // 24/7 trading
],

avoidWindows: [
  // Uncomment untuk avoid specific times:
  // { start: '21:30', end: '22:30' }, // US market close
  // { start: '13:00', end: '14:00' }, // Asia lunch
],
```

**Tips:**
- Avoid trading saat major news events
- Avoid trading saat low liquidity (Asia lunch time)
- Consider your sleep schedule!

---

### AI Integration

**Lokasi:** Line 450-467

```typescript
enabled: true,              // ⚙️ Use AI for signal enhancement?
model: 'gpt-4',             // ⚙️ OpenAI model
includeMarketSentiment: true,    // ⚙️ Analyze sentiment?
aiConfidenceMultiplier: 1.2,     // ⚙️ Boost confidence by 20%
maxAICallsPerHour: 60,           // ⚙️ Rate limit
```

**Note:** Requires `OPENAI_API_KEY` in `.env`

---

## 🧪 Testing Your Strategy

### 1. Validate Settings

```typescript
import TradingConfig from '@/config/trading-algorithms';

const validation = TradingConfig.validateSettings();
console.log(validation);
// { valid: true, errors: [] }
```

### 2. Backtest (Coming Soon)

```bash
# Run backtest dengan historical data
npm run backtest -- --strategy=custom --days=30
```

### 3. Paper Trading (Coming Soon)

```bash
# Test dengan paper trading (fake money)
npm run paper-trade -- --strategy=balanced
```

### 4. Live Trading

```bash
# Go live dengan real money (start small!)
npm run live-trade
```

---

## 📊 Performance Optimization Tips

### 1. Start Conservative
- Gunakan `conservative` preset dulu
- Monitor performance minimal 2 minggu
- Catat win rate dan average profit

### 2. Analyze Results
- Indicator mana yang paling akurat?
- Pair mana yang paling profitable?
- Timeframe mana yang paling cocok?

### 3. Tweak Parameters
- Naikkan weight indicator yang akurat
- Turunkan min confidence jika signal terlalu jarang
- Adjust stop loss/take profit based on pair volatility

### 4. Iterate
- Test perubahan 1-1 (jangan banyak sekaligus)
- Track setiap perubahan
- Keep what works!

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Leverage Terlalu Tinggi
```typescript
maxLeverage: 10,  // ❌ Too risky!
```
✅ **Fix:** Start dengan 2-3x, naikkan bertahap

### ❌ Mistake 2: Stop Loss Terlalu Ketat
```typescript
stopLossPercent: 0.5,  // ❌ Too tight, akan kena SL terus
```
✅ **Fix:** Minimum 1.5-2% untuk crypto

### ❌ Mistake 3: Terlalu Banyak Indicators
```typescript
requiredIndicators: 5,  // ❌ Signal akan sangat jarang
```
✅ **Fix:** 2-3 indicators sudah cukup

### ❌ Mistake 4: Confidence Terlalu Tinggi
```typescript
minConfidenceScore: 90,  // ❌ Hampir tidak akan pernah trade
```
✅ **Fix:** 60-70% confidence sudah bagus

### ❌ Mistake 5: Position Size Terlalu Besar
```typescript
maxPositionSize: 100,  // ❌ All-in setiap trade!
```
✅ **Fix:** Max 20-30% per trade

---

## 📚 Resources

### Recommended Reading:
- [Technical Analysis Basics](https://www.investopedia.com/technical-analysis-4689657)
- [Risk Management in Trading](https://www.babypips.com/learn/forex/risk-management)
- [Backtesting Strategies](https://www.quantstart.com/articles/Backtesting-Systematic-Trading-Strategies-in-Python-Considerations-and-Open-Source-Frameworks/)

### Crypto Trading Communities:
- Reddit: r/CryptoTrading
- Discord: Crypto Trading Groups
- TradingView: Follow top traders

---

## 🆘 Support

Jika ada pertanyaan atau butuh bantuan optimize strategy:

1. **Check logs** di `logs/trading.log`
2. **Run validation** dengan `validateSettings()`
3. **Test di paper trading** dulu sebelum live
4. **Start small** dan scale up gradually

---

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Initial release
- ✅ 4 strategy presets (Conservative, Balanced, Aggressive, Custom)
- ✅ 6 technical indicators (RSI, MACD, BB, EMA, Volume, ATR)
- ✅ Comprehensive signal rules
- ✅ Safety limits & circuit breaker
- ✅ AI integration ready
- ✅ Full documentation

### Roadmap
- 🔄 Backtesting module
- 🔄 Paper trading mode
- 🔄 Web UI for editing config (dashboard)
- 🔄 Strategy marketplace
- 🔄 Social trading (copy successful strategies)

---

**Happy Trading! 🚀💰**

*Remember: Trading carries risk. Never invest more than you can afford to lose. Start small, test thoroughly, and scale gradually.*
