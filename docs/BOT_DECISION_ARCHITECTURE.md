# 🧠 Bot Decision Layer Architecture

**Status:** 🚧 In Development  
**Created:** November 6, 2025  
**AI Provider:** DeepSeek API

---

## 🎯 Overview

**Bot Decision Layer** adalah sistem AI yang berada di antara Signal Generator dan User Bot Execution. Setiap user memiliki bot pribadi dengan AI brain yang membuat keputusan execute atau skip signal berdasarkan:

1. **Technical Signal** - From Bot Signal (Signal Generator)
2. **News Sentiment** - Real-time crypto news analysis
3. **Backtest History** - Recent strategy performance
4. **Personal Learning** - User bot's accumulated patterns

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│         📡 Bot Signal (Signal Generator)                   │
│         - Technical analysis only                          │
│         - Generate raw signals                             │
└───────────────────┬────────────────────────────────────────┘
                    │
                    ▼ RAW Signal Broadcast
                    │
        ┌───────────┼───────────────┐
        │           │               │
        ▼           ▼               ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ User A    │ │ User B    │ │ User C    │
│ Bot       │ │ Bot       │ │ Bot       │
│           │ │           │ │           │
│ 🧠 AI     │ │ 🧠 AI     │ │ 🧠 AI     │
│ Decision  │ │ Decision  │ │ Decision  │
│ Layer     │ │ Layer     │ │ Layer     │
│           │ │           │ │           │
│ ✅ or ❌  │ │ ✅ or ❌  │ │ ✅ or ❌  │
└───────────┘ └───────────┘ └───────────┘
```

---

## 🤖 AI Decision Flow

### Per-Signal Evaluation:

```typescript
Signal Received → 
  ↓
Check Balance (gas fee ≥ $10) →
  ↓
Technical Confidence (75-85%) →
  ↓
News Sentiment Check (+/- 10%) →
  ↓
Backtest Performance (+/- 5%) →
  ↓
Personal Learning Patterns (+/- 3%) →
  ↓
TOTAL CONFIDENCE (calculate) →
  ↓
Compare to Threshold (82% default) →
  ↓
✅ EXECUTE (if ≥ 82%) or ❌ SKIP (if < 82%)
```

---

## 🔑 DeepSeek API Integration

### Why DeepSeek?

- ✅ **Cost-effective:** $0.001/decision (10x cheaper than GPT-3.5)
- ✅ **Fast:** 1-2 second response time
- ✅ **OpenAI-compatible:** Easy migration if needed
- ✅ **Good quality:** Comparable to GPT-3.5-turbo

### Cost Estimate:

```
100 users × 50 decisions/day = 5,000 decisions/day
5,000 × $0.001 = $5/day = $150/month

1,000 users = $1,500/month (still affordable)
```

### API Configuration:

```typescript
// Environment variables needed:
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat

// Cost tracking:
DEEPSEEK_COST_PER_DECISION=0.001 (USD)
```

---

## 💾 Database Models

### 1. UserBot

```typescript
interface IUserBot {
  userId: ObjectId;
  status: 'active' | 'paused' | 'stopped';
  
  // Balance tracking
  lastBalanceCheck: {
    timestamp: Date;
    binanceBalance: number;
    gasFeeBalance: number;
  };
  
  // AI Configuration
  aiConfig: {
    confidenceThreshold: number; // Default 82%, adaptive
    newsWeight: number;          // Default 10%
    backtestWeight: number;      // Default 5%
    learningWeight: number;      // Default 3%
  };
  
  // Statistics
  stats: {
    totalSignalsReceived: number;
    signalsExecuted: number;
    signalsRejected: number;
    winRate: number;
    totalProfit: number;
  };
  
  // Learning data
  learningPatterns: Array<{
    pattern: string;
    type: 'loss' | 'win';
    confidence: number;
    occurrences: number;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. AIDecision

```typescript
interface IAIDecision {
  userId: ObjectId;
  signalId: string;
  
  // Signal details
  signal: {
    symbol: string;
    action: 'LONG' | 'SHORT';
    technicalConfidence: number;
    entryPrice: number;
  };
  
  // Confidence breakdown
  confidenceBreakdown: {
    technical: number;        // From signal
    news: number;            // From news sentiment
    backtest: number;        // From recent performance
    learning: number;        // From pattern matching
    total: number;           // Sum of above
  };
  
  // Decision
  decision: 'EXECUTE' | 'SKIP';
  reason: string;            // AI explanation
  
  // News context
  newsContext: {
    sentiment: number;       // -1 to 1
    headlines: string[];
    sources: string[];
  };
  
  // Execution (if executed)
  execution?: {
    executedAt: Date;
    positionId: string;
    result?: 'WIN' | 'LOSS';
    profit?: number;
  };
  
  // Cost tracking
  aiCost: number;            // $0.001 per decision
  
  timestamp: Date;
}
```

### 3. NewsEvent

```typescript
interface INewsEvent {
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  
  // AI-generated sentiment
  sentiment: number;         // -1 (bearish) to 1 (bullish)
  impact: 'low' | 'medium' | 'high';
  
  // Keywords
  keywords: string[];
  categories: string[];      // ['regulation', 'etf', 'adoption']
  
  // Impact tracking
  impactedDecisions: number; // How many decisions affected
  
  createdAt: Date;
}
```

### 4. LearningPattern

```typescript
interface ILearningPattern {
  userId: ObjectId;
  
  // Pattern identification
  pattern: {
    type: 'loss' | 'win';
    description: string;      // "RSI > 65 + High volatility"
    conditions: {
      rsi?: { min?: number, max?: number };
      volatility?: string;
      timeOfDay?: number[];
      dayOfWeek?: number[];
      newsType?: string[];
    };
  };
  
  // Statistics
  occurrences: number;
  successRate: number;
  avgProfit: number;
  avgLoss: number;
  
  // Learning status
  confidence: number;        // How sure AI is about this pattern
  lastSeen: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📡 API Endpoints

### Admin Endpoints:

```
GET  /api/admin/bot-decision/overview
  → Stats: total bots, decisions, win rate, etc.

GET  /api/admin/bot-decision/user-bots?page=1&limit=50
  → List all user bots with status

GET  /api/admin/bot-decision/user-bots/:userId
  → Detailed view of specific user bot

POST /api/admin/bot-decision/user-bots/:userId/pause
  → Pause user's bot

POST /api/admin/bot-decision/user-bots/:userId/resume
  → Resume user's bot

GET  /api/admin/bot-decision/decisions?userId=xxx&page=1
  → Decision history with filters

GET  /api/admin/bot-decision/news-feed?limit=20
  → Recent news with sentiment

GET  /api/admin/bot-decision/learning-insights
  → Top patterns learned

POST /api/admin/bot-decision/config
  → Update global AI config (thresholds, weights)
```

### User Bot Endpoints:

```
POST /api/bot/decision/evaluate
  → Evaluate signal and make decision
  Body: { signalId, userId, signal: {...} }
  Response: { decision: 'EXECUTE' | 'SKIP', confidence, reason }

GET  /api/bot/decision/balance-check/:userId
  → Check Binance + gas fee balance

POST /api/bot/decision/learn
  → Record trade result for learning
  Body: { decisionId, result: 'WIN' | 'LOSS', profit }
```

### News Endpoints:

```
GET  /api/news/latest?limit=10
  → Latest crypto news with sentiment

POST /api/news/analyze
  → Analyze news sentiment (manual trigger)
```

---

## 🎓 Learning System

### Adaptive Threshold:

```typescript
// Start: 80% confidence threshold
// Week 1: Win rate 75% → Keep 80%
// Week 2: Win rate 82% → Increase to 82%
// Week 3: Win rate 85% → Increase to 83%
// Week 4: Win rate 88% → Increase to 84%

// Logic:
if (winRate > confidenceThreshold + 5%) {
  confidenceThreshold += 1%;
  console.log('Bot getting better, raising standards');
}
```

### Pattern Recognition:

```typescript
// Example loss pattern:
{
  pattern: "RSI > 65 + High volatility",
  occurrences: 15,
  losses: 12,
  winRate: 20%, // Very bad!
  action: "Auto-reject signals matching this pattern",
  confidencePenalty: -20% // Reduce confidence by 20%
}

// When new signal arrives:
if (signal.rsi > 65 && volatility === 'high') {
  confidence -= 20%; // Apply pattern penalty
  console.log('Pattern match: High risk, reducing confidence');
}
```

---

## 🚀 Implementation Phases

### Phase 1 (Current): Structure Setup ✅
- [x] Create documentation
- [ ] Rename Signal Center → Bot Signal
- [ ] Create Bot Decision page skeleton
- [ ] Update admin sidebar
- [ ] Add DeepSeek API placeholder

### Phase 2: Core AI Decision Engine
- [ ] Create AIDecisionEngine class
- [ ] Integrate DeepSeek API
- [ ] Implement confidence calculation
- [ ] Create decision evaluation endpoint
- [ ] Build Overview tab UI

### Phase 3: User Bot Management
- [ ] Create UserBot database model
- [ ] Build User Bots list tab
- [ ] Implement bot pause/resume
- [ ] Add bot detail modal
- [ ] Real-time status updates

### Phase 4: News Integration
- [ ] Integrate CryptoPanic API (free tier)
- [ ] Create news sentiment analyzer
- [ ] Build News Monitor tab
- [ ] Add news caching system

### Phase 5: Learning System
- [ ] Implement pattern recognition
- [ ] Create learning engine
- [ ] Build Learning Insights tab
- [ ] Add adaptive threshold logic

### Phase 6: Decision Logging
- [ ] Create decision history storage
- [ ] Build Decision Log tab
- [ ] Add filtering and search
- [ ] Export decisions to CSV

---

## 📊 Success Metrics

### Target Improvements:

```
Baseline (No AI):
- Win rate: 75%
- Avg profit: $150/trade
- Avg loss: $200/trade

With AI Decision Layer (Target):
- Win rate: 85-90% (+10-15%)
- Avg profit: $165/trade (trailing optimization)
- Avg loss: $180/trade (earlier exits)
- Signals filtered: 60-70% rejection rate
```

---

## 💰 Monetization

### Cost Structure:

```
Monthly Costs (100 users):
- DeepSeek API: $150/month
- CryptoPanic News: $0 (free tier, 5,000 calls/month)
- Server costs: $50/month (Railway)
Total: ~$200/month

Revenue Options:
1. Premium tier: $50/month for AI bot (100 users = $5,000/month)
2. Increase gas fee deduction: +0.5% → $300/month extra
3. Freemium: Basic bot free, AI layer paid

ROI: $5,000 revenue - $200 cost = $4,800 profit/month
```

---

## 🔐 Security & Privacy

### Data Protection:

- ✅ User trading data encrypted at rest
- ✅ API keys stored with AES-256 encryption
- ✅ DeepSeek doesn't store trading data (per their policy)
- ✅ News sentiment cached locally (reduce API calls)
- ✅ Decision logs retained for 90 days only

### Rate Limiting:

```typescript
// Prevent API abuse
const rateLimit = {
  decisions: 100 per hour per user,
  newsCheck: 10 per minute (cached),
  balanceCheck: 1 per 30 seconds,
}
```

---

## 📚 References

- **DeepSeek API Docs:** https://platform.deepseek.com/docs
- **CryptoPanic API:** https://cryptopanic.com/developers/api/
- **Current Strategy:** `/backtest/PRODUCTION_BACKTEST.md`
- **Signal Generator:** `/src/lib/signal-center/SignalEngine.ts`

---

**Next Steps:** Rename Signal Center → Bot Signal, create Bot Decision page skeleton
