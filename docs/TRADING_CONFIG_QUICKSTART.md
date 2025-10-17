# 🚀 Quick Start: Trading Algorithm Config

## 📝 TL;DR (Too Long Didn't Read)

Edit 1 file untuk kontrol semua algoritma trading:
```
src/config/trading-algorithms.ts
```

## ⚡ 3 Steps untuk Mulai

### Step 1: Pilih Strategy (30 detik)

Buka `src/config/trading-algorithms.ts` line **279**:

```typescript
// Pilih salah satu (uncomment yang mau dipakai):
export const ACTIVE_STRATEGY: StrategyPreset = 'balanced';     // ✅ RECOMMENDED
// export const ACTIVE_STRATEGY: StrategyPreset = 'conservative'; // Aman
// export const ACTIVE_STRATEGY: StrategyPreset = 'aggressive';   // Berani
// export const ACTIVE_STRATEGY: StrategyPreset = 'custom';       // DIY
```

### Step 2: Save File

Press `Ctrl+S` atau `Cmd+S`

### Step 3: Restart Bot

```bash
npm run dev
```

✅ **DONE!** Bot sekarang pakai strategy yang kamu pilih.

---

## 🎯 Strategy Presets Cheat Sheet

### 🛡️ Conservative (Pemula)
```typescript
export const ACTIVE_STRATEGY = 'conservative';
```
- ✅ Risk rendah
- ✅ Max leverage 2x
- ✅ Stop loss 1.5%
- ✅ Hanya LONG
- ✅ Max 3 trades/hari
- 🎯 **Win rate target: 70-80%**

**Cocok untuk:** Modal kecil, baru belajar, mau tidur nyenyak

---

### ⚖️ Balanced (Recommended)
```typescript
export const ACTIVE_STRATEGY = 'balanced';
```
- ✅ Risk sedang
- ✅ Max leverage 3x
- ✅ Stop loss 2.0%
- ✅ LONG & SHORT
- ✅ Max 5 trades/hari
- 🎯 **Win rate target: 60-70%**

**Cocok untuk:** Kebanyakan trader, growth konsisten

---

### 🔥 Aggressive (Expert)
```typescript
export const ACTIVE_STRATEGY = 'aggressive';
```
- ⚠️ Risk tinggi
- ⚠️ Max leverage 5x
- ⚠️ Stop loss 3.0%
- ⚠️ LONG & SHORT
- ⚠️ Max 10 trades/hari
- 🎯 **Win rate target: 50-60%** (profit per trade lebih besar)

**Cocok untuk:** Trader berpengalaman, modal besar

---

## 🎨 Custom Strategy (Advanced)

### Step 1: Set Strategy = Custom
```typescript
export const ACTIVE_STRATEGY = 'custom';
```

### Step 2: Edit Settings (Line 290-318)

```typescript
export const CUSTOM_SETTINGS = {
  // Edit parameters di sini:
  maxPositionSize: 35,        // ⚙️ % dari balance (10-50)
  maxLeverage: 4,             // ⚙️ Max leverage (1-10)
  stopLossPercent: 2.5,       // ⚙️ Stop loss % (0.5-5)
  takeProfitPercent: 5.0,     // ⚙️ Take profit % (1-10)
  
  minConfidenceScore: 70,     // ⚙️ Min confidence (50-90)
  allowShortPositions: true,  // ⚙️ Allow SHORT?
  maxDailyTrades: 7,          // ⚙️ Max trades per day
  
  // ... dan banyak lagi!
};
```

### Step 3: Save & Test
```bash
npm run dev
```

---

## 🔧 Common Tweaks

### Tweak 1: Naikkan Profit Target
```typescript
// Lokasi: Line 294 (atau sesuai strategy preset)
takeProfitPercent: 5.0,  // Ubah dari 4.0 ke 5.0
```

### Tweak 2: Ketatkan Stop Loss
```typescript
// Lokasi: Line 293
stopLossPercent: 1.5,  // Ubah dari 2.0 ke 1.5
```

### Tweak 3: Lebih Banyak Trades
```typescript
// Lokasi: Line 303
maxDailyTrades: 10,  // Ubah dari 5 ke 10
```

### Tweak 4: Lebih Selektif
```typescript
// Lokasi: Line 299
minConfidenceScore: 75,  // Ubah dari 65 ke 75 (signal lebih jarang tapi lebih akurat)
```

---

## 📊 Indicator Settings

### RSI (Line 15-23)
```typescript
rsi: {
  period: 14,         // ⚙️ 7-21 (default: 14)
  overbought: 70,     // ⚙️ 60-80 (default: 70)
  oversold: 30,       // ⚙️ 20-40 (default: 30)
},
```

**Quick Tips:**
- Period kecil = lebih sensitif
- Period besar = lebih smooth
- Overbought/Oversold adjust sesuai pair

### MACD (Line 26-33)
```typescript
macd: {
  fastPeriod: 12,     // ⚙️ Default: 12
  slowPeriod: 26,     // ⚙️ Default: 26
  signalPeriod: 9,    // ⚙️ Default: 9
},
```

**Quick Tips:**
- Gunakan default (12, 26, 9) untuk BTC/ETH
- Untuk altcoin volatile: (8, 17, 9)

### EMA (Line 50-57)
```typescript
ema: {
  shortPeriod: 9,     // ⚙️ 5-20
  longPeriod: 21,     // ⚙️ 20-200
},
```

**Popular Combinations:**
- **Scalping:** 9 × 21 (fast)
- **Day Trading:** 12 × 26 (medium)
- **Swing Trading:** 50 × 200 (slow)

---

## 🛡️ Safety Limits (Hard Limits)

**Lokasi:** Line 366-386

```typescript
export const SAFETY_LIMITS = {
  maxDailyLossPercent: 5,     // ⚠️ Max 5% loss per hari
  maxDrawdownPercent: 15,     // ⚠️ Max 15% drawdown
  maxOpenPositions: 3,        // ⚠️ Max 3 positions at once
  absoluteMaxLeverage: 10,    // ⚠️ Never exceed 10x
  maxConsecutiveLosses: 3,    // ⚠️ Stop after 3 losses
};
```

**⚠️ IMPORTANT:** 
- Jangan edit kecuali Anda tahu yang Anda lakukan!
- Ini adalah hard limits untuk proteksi
- Edit dengan sangat hati-hati

---

## 🌐 Trading Pairs

**Lokasi:** Line 393-420

```typescript
enabled: [
  'BTCUSDT',   // ✅ Enabled
  'ETHUSDT',   // ✅ Enabled
  'BNBUSDT',   // ✅ Enabled
  // 'DOGEUSDT', // ❌ Disabled (comment out)
],
```

**Add New Pair:**
1. Uncomment atau tambah pair baru
2. Save file
3. Restart bot

**Remove Pair:**
1. Comment out dengan `//`
2. Save file
3. Restart bot

---

## 🧪 Testing Your Settings

### 1. Validate Settings
```typescript
import TradingConfig from '@/config/trading-algorithms';

const validation = TradingConfig.validateSettings();
console.log(validation);
// Output: { valid: true, errors: [] }
```

### 2. Check Active Strategy
```typescript
const strategy = TradingConfig.getActiveStrategy();
console.log('Active Strategy:', strategy.name);
console.log('Max Leverage:', strategy.maxLeverage);
```

### 3. Test Indicator Calculation
```typescript
const indicators = TradingConfig.getIndicators();
console.log('RSI Period:', indicators.rsi.period);
console.log('MACD Settings:', indicators.macd);
```

---

## ⚠️ Common Mistakes

### ❌ Mistake 1: Leverage Terlalu Tinggi
```typescript
maxLeverage: 10,  // ❌ Bahaya!
```
✅ **Fix:** Start dengan 2-3x

### ❌ Mistake 2: Stop Loss Terlalu Ketat
```typescript
stopLossPercent: 0.5,  // ❌ Akan kena SL terus
```
✅ **Fix:** Minimum 1.5-2% untuk crypto

### ❌ Mistake 3: Confidence Terlalu Tinggi
```typescript
minConfidenceScore: 90,  // ❌ Signal sangat jarang
```
✅ **Fix:** 60-70% sudah bagus

### ❌ Mistake 4: Position Size Terlalu Besar
```typescript
maxPositionSize: 100,  // ❌ All-in!
```
✅ **Fix:** Max 20-30% per trade

---

## 📖 Full Documentation

Untuk penjelasan lengkap setiap parameter:
```
TRADING_ALGORITHMS_CONFIG.md
```

Untuk contoh implementasi:
```
src/config/trading-algorithms.example.ts
```

---

## 🆘 Need Help?

1. **Read full documentation**: `TRADING_ALGORITHMS_CONFIG.md`
2. **Check example code**: `trading-algorithms.example.ts`
3. **Test dengan paper trading** sebelum live
4. **Start small** dan scale gradually

---

## 🎯 Recommended Starting Point

```typescript
// File: src/config/trading-algorithms.ts
// Line: 279

// Start dengan ini:
export const ACTIVE_STRATEGY: StrategyPreset = 'balanced';

// Monitor performance selama 1-2 minggu
// Adjust parameters based on results
// Scale up gradually
```

---

**Happy Trading! 🚀💰**

*Remember: Trading carries risk. Never invest more than you can afford to lose.*
