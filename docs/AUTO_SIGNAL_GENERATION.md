# ⏰ Auto Signal Generation dengan Cron/Polling

## 🎯 Goal
Generate trading signals secara otomatis setiap **X detik/menit** tanpa perlu klik manual.

---

## ⚠️ **PENTING: Limitation Upstash Cron**

**Upstash Cron TIDAK support interval < 1 menit!**

Minimum interval: **1 menit**  
Requested: **5 detik** ❌ 

---

## 🚀 **Solution Options**

### **Option 1: Next.js Custom Cron (Internal)** ⭐ Best for 5-second interval

**Implementasi menggunakan setInterval di Node.js**

#### 📁 Create: `src/lib/cron/signal-generator.ts`

```typescript
/**
 * Internal Cron Job - Generate signals every 5 seconds
 * Runs in background when server starts
 */

import { LiveSignalEngine } from '@/lib/trading/engines/LiveSignalEngine';
import { fetchBinanceCandles } from '@/lib/trading/engines/CandleFetcher';
import TradingPairs from '@/config/trading-pairs';
import connectDB from '@/lib/mongodb';
import Signal from '@/models/Signal';

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

export async function startSignalGenerator(intervalSeconds: number = 5) {
  if (isRunning) {
    console.log('⚠️ Signal generator already running');
    return;
  }

  isRunning = true;
  console.log(`🤖 Starting signal generator (every ${intervalSeconds} seconds)...`);

  // Initial run
  await generateSignals();

  // Schedule recurring runs
  intervalId = setInterval(async () => {
    await generateSignals();
  }, intervalSeconds * 1000);
}

export function stopSignalGenerator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    console.log('🛑 Signal generator stopped');
  }
}

async function generateSignals() {
  const startTime = Date.now();
  
  try {
    console.log('🔄 [AUTO-GEN] Generating signals...');

    await connectDB();

    const enabledPairs = TradingPairs.getEnabledPairs();
    const engine = new LiveSignalEngine();

    const results = await Promise.allSettled(
      enabledPairs.map(async (pair) => {
        try {
          const candles = await fetchBinanceCandles(pair.symbol, '15m', 100);
          
          if (candles.length < 50) {
            throw new Error('Insufficient data');
          }

          const signalData = await engine.generateSignal(
            pair.symbol,
            candles,
            {
              strategy: 'balanced',
              timeframe: '15m',
              minConfidence: 80,
            }
          );

          // Save to database
          const signal = new Signal({
            symbol: signalData.symbol,
            action: signalData.action,
            confidence: signalData.confidence,
            strength: signalData.strength,
            status: 'active',
            entryPrice: signalData.entryPrice,
            currentPrice: signalData.currentPrice,
            takeProfitLevels: signalData.takeProfitLevels,
            stopLoss: signalData.stopLoss,
            indicators: signalData.indicators,
            reasons: signalData.reasons,
            warnings: signalData.warnings,
            indicatorSummary: signalData.indicatorSummary,
            strategy: signalData.strategy,
            timeframe: signalData.timeframe,
            maxLeverage: signalData.maxLeverage,
            recommendedPositionSize: signalData.recommendedPositionSize,
            riskRewardRatio: signalData.riskRewardRatio,
            generatedAt: new Date(signalData.timestamp),
            expiresAt: new Date(signalData.expiresAt),
          });

          await signal.save();

          return { symbol: pair.symbol, saved: true };
        } catch (error: any) {
          console.error(`❌ [AUTO-GEN] ${pair.symbol}: ${error.message}`);
          return { symbol: pair.symbol, saved: false };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.saved).length;
    const duration = Date.now() - startTime;

    console.log(`✅ [AUTO-GEN] Generated ${successful} signals in ${duration}ms`);
  } catch (error: any) {
    console.error('❌ [AUTO-GEN] Fatal error:', error.message);
  }
}
```

#### 📁 Update: `src/app/layout.tsx` or create `src/app/api/cron/start/route.ts`

**Option A: Auto-start on server startup (Recommended)**

```typescript
// src/instrumentation.ts (Next.js 14+)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startSignalGenerator } = await import('@/lib/cron/signal-generator');
    
    // Start generator with 5-second interval
    await startSignalGenerator(5);
  }
}
```

**Option B: Manual start via API**

```typescript
// src/app/api/cron/start/route.ts
import { NextResponse } from 'next/server';
import { startSignalGenerator } from '@/lib/cron/signal-generator';

export async function POST(req: Request) {
  try {
    const { intervalSeconds = 5 } = await req.json();
    
    await startSignalGenerator(intervalSeconds);
    
    return NextResponse.json({
      success: true,
      message: `Signal generator started (every ${intervalSeconds} seconds)`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

### **Option 2: Upstash Cron (Cloud)** ⭐ Best for production (but 1-minute minimum)

**Limitations:**
- ❌ Cannot run every 5 seconds
- ✅ Can run every 1 minute (minimum)
- ✅ Reliable & scalable
- ✅ No server management

**Setup:**

1. Go to https://console.upstash.com/qstash
2. Create new scheduled request:
   - URL: `https://yourdomain.com/api/cron/generate-signals`
   - Method: `POST`
   - Cron expression: `* * * * *` (every minute)
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

3. Get CRON_SECRET from `.env`:
```env
CRON_SECRET=amu5KjBHoh31QIB5AyoXKB8wDSEPgJ3U
```

---

### **Option 3: Vercel Cron** ⭐ If deployed on Vercel

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-signals",
      "schedule": "* * * * *"
    }
  ]
}
```

**Limitations:**
- ❌ Cannot run every 5 seconds
- ✅ Can run every 1 minute (minimum)
- ✅ Free tier: 100 executions/day
- ✅ Auto-secured with Vercel signature

---

### **Option 4: Railway Cron** ⭐ If deployed on Railway

Railway also only supports minute-level cron jobs.

---

## 📊 **Comparison Table**

| Feature | Internal (setInterval) | Upstash Cron | Vercel Cron |
|---------|------------------------|--------------|-------------|
| **Min Interval** | ✅ 1 second | ❌ 1 minute | ❌ 1 minute |
| **5-second support** | ✅ Yes | ❌ No | ❌ No |
| **Reliability** | ⚠️ Dies on restart | ✅ Very reliable | ✅ Very reliable |
| **Scaling** | ⚠️ Single instance | ✅ Cloud-native | ✅ Cloud-native |
| **Cost** | ✅ Free | ✅ Free tier | ✅ Free tier |
| **Setup** | 🟢 Easy | 🟡 Moderate | 🟢 Easy |
| **Best For** | 🔥 5-sec interval | 📊 Production | 📊 Vercel deploys |

---

## 🎯 **Recommendation untuk "5 detik"**

### **Development:**
```typescript
// Use internal setInterval
startSignalGenerator(5); // Every 5 seconds
```

### **Production:**
```typescript
// Compromise: Use 1-minute cron + cache
// 60 seconds / 5 seconds = 12 signals can be generated per minute
// Generate all at once, then serve from cache
```

---

## ⚙️ **Alternative: Client-Side Polling (Current)**

Yang sekarang sudah jalan:
```typescript
// Every 30 seconds, fetch latest signals
useEffect(() => {
  const interval = setInterval(() => {
    fetchSignals();
  }, 30 * 1000);
  return () => clearInterval(interval);
}, []);
```

**Pros:**
- ✅ Simple
- ✅ Works immediately
- ✅ No server config needed

**Cons:**
- ❌ Not truly "real-time"
- ❌ Each user makes separate requests
- ❌ No signals generated when no users online

---

## 🚀 **Recommended Architecture**

### **Best of Both Worlds:**

```
┌────────────────────────────────────────────┐
│  SERVER-SIDE (Background Job)              │
│  - Internal setInterval every 5 seconds    │
│  - Generate signals automatically          │
│  - Save to MongoDB                         │
└────────────────────────────────────────────┘
                ↓
┌────────────────────────────────────────────┐
│  DATABASE (MongoDB)                        │
│  - Stores all signals                      │
│  - TTL index: 30 days                      │
└────────────────────────────────────────────┘
                ↓
┌────────────────────────────────────────────┐
│  CLIENT-SIDE (Dashboard)                   │
│  - Fetch latest signals every 10 seconds   │
│  - Display with animations                 │
│  - No need to generate (already in DB)    │
└────────────────────────────────────────────┘
```

---

## 📝 **Implementation Steps**

1. ✅ Create cron endpoint (already done)
2. ⬜ Choose option (Internal vs Cloud cron)
3. ⬜ Test locally
4. ⬜ Deploy & configure
5. ⬜ Monitor logs

---

## 🔍 **Testing**

```bash
# Test cron endpoint manually
curl -X POST http://localhost:3000/api/cron/generate-signals \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check generated signals
curl http://localhost:3000/api/signals/latest?limit=10 | jq
```

---

## 🎓 **Conclusion**

**For 5-second interval:**
- Use **Internal setInterval** (Option 1)

**For production reliability:**
- Use **1-minute Upstash Cron** (Option 2)
- Compromise: Generate signals every minute instead of 5 seconds

**Current setup:**
- Client-side polling every 30 seconds (good enough for MVP)

---

Mau saya implementasikan yang mana? 🚀
