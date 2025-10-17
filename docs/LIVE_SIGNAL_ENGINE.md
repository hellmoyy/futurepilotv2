# 🚀 LIVE SIGNAL ENGINE - Complete Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Signal Format](#signal-format)
7. [Configuration](#configuration)
8. [Monitoring & Performance](#monitoring--performance)

---

## 🎯 Overview

**Live Signal Engine** adalah sistem real-time trading signal generation untuk cryptocurrency futures trading. System ini menggunakan 6 technical indicators dan menghasilkan BUY/SELL/HOLD signals dengan confidence scores.

### ✨ Key Features

- ✅ **6 Technical Indicators**: RSI, MACD, EMA, Bollinger Bands, Volume, ATR
- ✅ **Real-time Signal Generation**: Generate signals on-demand atau scheduled
- ✅ **Confidence Scoring**: 0-100% confidence dengan strength levels (weak/moderate/strong)
- ✅ **Entry/TP/SL Calculation**: Automatic price level calculation
- ✅ **Risk Management**: Position sizing & leverage recommendations
- ✅ **Performance Tracking**: MongoDB storage untuk analysis & backtesting
- ✅ **Beautiful UI**: Framer Motion animations, color-coded signals
- ✅ **Auto-refresh**: Real-time updates setiap 15-60 seconds

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  LIVE SIGNAL ENGINE                      │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼───────┐                  ┌─────────▼─────────┐
│ TECHNICAL     │                  │ LIVE SIGNAL       │
│ ANALYZER      │──────────────────>│ ENGINE            │
│               │                  │                   │
│ - RSI         │                  │ - Signal Gen      │
│ - MACD        │                  │ - Confidence      │
│ - EMA         │                  │ - Entry/TP/SL     │
│ - Bollinger   │                  │ - Position Size   │
│ - Volume      │                  │                   │
│ - ATR         │                  └─────────┬─────────┘
└───────────────┘                            │
                                             │
                          ┌──────────────────┴────────────────┐
                          │                                   │
                  ┌───────▼────────┐               ┌──────────▼─────────┐
                  │ API ROUTES     │               │ MONGODB            │
                  │                │               │                    │
                  │ /generate      │───────────────>│ Signal Model       │
                  │ /latest        │<───────────────│                    │
                  └────────────────┘               └────────────────────┘
                          │
                          │
                  ┌───────▼────────┐
                  │ UI DASHBOARD   │
                  │                │
                  │ /live-signal   │
                  └────────────────┘
```

### 📦 Components

1. **TechnicalAnalyzer** (`src/lib/trading/engines/TechnicalAnalyzer.ts`)
   - Calculate all technical indicators
   - Analyze market conditions
   - Format indicator results

2. **LiveSignalEngine** (`src/lib/trading/engines/LiveSignalEngine.ts`)
   - Generate trading signals
   - Calculate confidence scores
   - Determine entry/TP/SL levels
   - Position sizing recommendations

3. **CandleFetcher** (`src/lib/trading/engines/CandleFetcher.ts`)
   - Fetch historical candles dari Binance
   - Support multiple pairs
   - Rate limiting

4. **Signal Model** (`src/models/Signal.ts`)
   - MongoDB schema untuk signal storage
   - Performance tracking
   - TTL index (auto-delete after 30 days)

5. **API Routes**
   - `POST /api/signals/generate` - Generate new signals
   - `GET /api/signals/latest` - Fetch stored signals

6. **Live Signal Page** (`/dashboard/live-signal`)
   - Real-time signal display
   - Filters & sorting
   - Auto-refresh

---

## ⚡ Quick Start

### 1️⃣ Generate Signals (Manual)

Visit: **http://localhost:3000/dashboard/live-signal**

Click **"⚡ Generate Signals"** button.

### 2️⃣ Generate Signals (API)

```bash
# Generate signals for all enabled pairs
curl -X POST http://localhost:3000/api/signals/generate \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "balanced",
    "timeframe": "15m",
    "minConfidence": 50,
    "saveToDb": true
  }'
```

### 3️⃣ Generate Signal for Single Pair

```bash
# Generate signal for BTCUSDT
curl "http://localhost:3000/api/signals/generate?symbol=BTCUSDT&strategy=balanced"
```

### 4️⃣ Fetch Latest Signals

```bash
# Get latest 20 signals
curl "http://localhost:3000/api/signals/latest?limit=20&sortBy=confidence&sortOrder=desc"

# Filter by action
curl "http://localhost:3000/api/signals/latest?action=LONG&minConfidence=70"

# Filter by symbol
curl "http://localhost:3000/api/signals/latest?symbol=BTCUSDT&limit=10"
```

---

## 📡 API Reference

### POST `/api/signals/generate`

Generate trading signals untuk multiple pairs.

**Request Body:**
```typescript
{
  symbols?: string[];        // Optional: specific symbols
  strategy?: string;         // 'conservative' | 'balanced' | 'aggressive'
  timeframe?: string;        // '15m', '1h', '4h', etc
  minConfidence?: number;    // 0-100
  saveToDb?: boolean;        // Save to MongoDB
}
```

**Response:**
```typescript
{
  success: true,
  count: 15,
  strategy: "balanced",
  timeframe: "15m",
  signals: [...],
  generatedAt: "2024-01-01T12:00:00Z"
}
```

### GET `/api/signals/generate`

Generate signal untuk single pair.

**Query Parameters:**
- `symbol` (required): Trading pair (e.g., BTCUSDT)
- `strategy` (optional): Strategy name
- `timeframe` (optional): Timeframe
- `save` (optional): Save to DB (default: true)

**Response:**
```typescript
{
  success: true,
  signal: {
    id: "...",
    symbol: "BTCUSDT",
    action: "LONG",
    confidence: 75.5,
    strength: "strong",
    entryPrice: 50000,
    takeProfitLevels: [51000, 52000, 53000],
    stopLoss: 49000,
    ...
  }
}
```

### GET `/api/signals/latest`

Fetch latest signals from database.

**Query Parameters:**
- `symbol` (optional): Filter by symbol
- `action` (optional): LONG | SHORT | HOLD
- `status` (optional): active | executed | expired | cancelled
- `strategy` (optional): Strategy name
- `minConfidence` (optional): Minimum confidence
- `limit` (optional): Max results (default: 20, max: 100)
- `page` (optional): Page number (default: 1)
- `sortBy` (optional): confidence | timestamp | symbol
- `sortOrder` (optional): asc | desc

**Response:**
```typescript
{
  success: true,
  data: [...],
  pagination: {
    currentPage: 1,
    totalPages: 5,
    totalCount: 100,
    limit: 20,
    hasNextPage: true,
    hasPrevPage: false
  },
  filters: {...},
  sort: {...}
}
```

---

## 💡 Usage Examples

### Example 1: Generate Signals for Specific Pairs

```typescript
const response = await fetch('/api/signals/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    strategy: 'aggressive',
    timeframe: '1h',
    minConfidence: 60,
    saveToDb: true,
  }),
});

const data = await response.json();
console.log(`Generated ${data.count} signals`);
```

### Example 2: Fetch High-Confidence LONG Signals

```typescript
const params = new URLSearchParams({
  action: 'LONG',
  minConfidence: '75',
  sortBy: 'confidence',
  sortOrder: 'desc',
  limit: '10',
});

const response = await fetch(`/api/signals/latest?${params}`);
const data = await response.json();

data.data.forEach(signal => {
  console.log(`${signal.symbol}: ${signal.action} @ $${signal.entryPrice}`);
  console.log(`Confidence: ${signal.confidence}%`);
  console.log(`TP: $${signal.takeProfitLevels[1]}`);
  console.log(`SL: $${signal.stopLoss}`);
  console.log('---');
});
```

### Example 3: Monitor Signals in React Component

```typescript
function SignalMonitor() {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    const fetchSignals = async () => {
      const response = await fetch('/api/signals/latest?limit=20');
      const data = await response.json();
      setSignals(data.data);
    };

    fetchSignals();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSignals, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {signals.map(signal => (
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
```

---

## 📊 Signal Format

### Complete Signal Object

```typescript
{
  // Basic Info
  id: "65f1234567890abcdef12345",
  symbol: "BTCUSDT",
  action: "LONG",              // LONG | SHORT | HOLD
  confidence: 75.5,            // 0-100%
  strength: "strong",          // weak | moderate | strong
  status: "active",            // active | executed | expired | cancelled
  
  // Price Levels
  entryPrice: 50000,
  currentPrice: 49950,
  takeProfitLevels: [
    51000,  // TP1 (Conservative)
    52000,  // TP2 (Moderate)
    53000   // TP3 (Aggressive)
  ],
  stopLoss: 49000,
  
  // Risk/Reward
  riskRewardRatio: 2.5,
  maxLeverage: 20,
  recommendedPositionSize: 15,  // % of portfolio
  
  // Analysis
  reasons: [
    "🟢 RSI oversold (32.5)",
    "🟢 MACD bullish crossover",
    "🟢 Strong uptrend (EMA gap: 2.3%)",
    "🟢 Volume surge confirming uptrend (2.5x)"
  ],
  warnings: [
    "⚠️ High volatility (ATR: 3.5%)",
    "⚠️ Moderate confidence (75.5%) - use tight stop loss"
  ],
  indicatorSummary: [
    "RSI: 32.50 (oversold)",
    "MACD: Bullish (0.0125)",
    "EMA: bullish trend (2.30% gap)",
    "BB: Price at_lower (BW: 4.50%)",
    "Volume: 📈 SURGE (2.50x avg)",
    "ATR: high volatility (3.50%)"
  ],
  
  // Metadata
  strategy: "balanced",
  timeframe: "15m",
  generatedAt: "2024-01-01T12:00:00Z",
  expiresAt: "2024-01-01T13:00:00Z"
}
```

---

## ⚙️ Configuration

### Trading Algorithm Config

Edit `src/config/trading-algorithms.ts`:

```typescript
// Change active strategy
export const ACTIVE_STRATEGY: keyof typeof STRATEGY_PRESETS = 'balanced';

// Adjust indicator settings
export const INDICATORS = {
  rsi: {
    period: 14,
    overbought: 70,
    oversold: 30,
  },
  macd: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  },
  // ... other indicators
};

// Modify signal rules
export const SIGNAL_RULES = {
  minConfidence: 50,
  requireMultipleConfirmations: true,
  minIndicatorsAgreement: 3,
};
```

### Trading Pairs Config

Edit `src/config/trading-pairs.ts`:

```typescript
// Enable/disable pairs
BTCUSDT: {
  symbol: 'BTCUSDT',
  // ...
  settings: {
    enabled: true,  // Set to false to disable
    maxLeverage: 20,
    // ...
  },
}
```

---

## 📈 Monitoring & Performance

### View Signals Dashboard

**http://localhost:3000/dashboard/live-signal**

Features:
- ✅ Real-time signal cards dengan animations
- ✅ Filter by action (ALL/LONG/SHORT/HOLD)
- ✅ Min confidence slider
- ✅ Auto-refresh settings (15s - 5min)
- ✅ Color-coded: GREEN (LONG), RED (SHORT), GRAY (HOLD)
- ✅ Expandable details dengan indicators
- ✅ Entry/TP/SL levels
- ✅ Risk/Reward ratio

### MongoDB Queries

```javascript
// Get all active signals
db.signals.find({ status: 'active', expiresAt: { $gt: new Date() } })

// Get high confidence signals
db.signals.find({ confidence: { $gte: 80 }, action: { $ne: 'HOLD' } })

// Performance stats
db.signals.aggregate([
  { $match: { performance: { $exists: true } } },
  {
    $group: {
      _id: null,
      avgROI: { $avg: '$performance.roi' },
      winRate: { $avg: { $cond: [{ $gt: ['$performance.profitLoss', 0] }, 1, 0] } },
      totalSignals: { $sum: 1 }
    }
  }
])
```

---

## 🎯 Next Steps

### Phase 1: Signal Generation ✅ COMPLETE
- ✅ TechnicalAnalyzer
- ✅ LiveSignalEngine
- ✅ Signal Model
- ✅ API Routes
- ✅ Live Signal UI

### Phase 2: Automated Trading (TODO)
- [ ] Auto-execute signals
- [ ] Order management system
- [ ] Position tracking
- [ ] P&L calculation
- [ ] Performance analytics

### Phase 3: Advanced Features (TODO)
- [ ] WebSocket real-time updates
- [ ] Custom indicator builder
- [ ] Backtesting engine
- [ ] Strategy optimizer
- [ ] Risk management dashboard

---

## 📞 Support

Issues atau questions? Check:
- Trading Algorithms Config: `TRADING_ALGORITHMS_CONFIG.md`
- Trading Pairs Config: `TRADING_PAIRS_CONFIG.md`
- Quick Start: `TRADING_CONFIG_QUICKSTART.md`

---

**🎉 Congratulations! Live Signal Engine is ready to use!**

Visit: http://localhost:3000/dashboard/live-signal
