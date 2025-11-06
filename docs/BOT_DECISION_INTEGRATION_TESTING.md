# 🧪 BOT DECISION LAYER - INTEGRATION TESTING GUIDE

## 📋 Overview

Comprehensive integration testing untuk Bot Decision Layer, covering complete flow dari signal generation hingga trade execution simulation.

**Test Coverage:**
- ✅ Signal evaluation dengan AI Decision Engine
- ✅ News sentiment analysis integration
- ✅ Learning pattern detection dan matching
- ✅ End-to-end bot execution flow
- ✅ Gas fee balance validation
- ✅ Trading commission calculation

---

## 🚀 Quick Start

### Prerequisites

```bash
# 1. MongoDB running
# 2. Environment variables configured (.env)
# 3. Next.js dev server running (untuk API endpoints)
npm run dev

# 4. Run integration test (di terminal baru)
node scripts/test-bot-decision-integration.js
```

### Test Configuration

Edit `TESTS` object di script untuk enable/disable test:

```javascript
const TESTS = {
  SIGNAL_EVALUATION: true,   // Test AI decision engine
  NEWS_INTEGRATION: true,     // Test news sentiment analysis
  LEARNING_SYSTEM: true,      // Test learning patterns
  END_TO_END: true,           // Test complete flow
  CLEANUP: false,             // Set true to cleanup test data
};
```

---

## 📊 Test Scenarios

### Test 1: Signal Evaluation

**Purpose:** Verify AI Decision Engine correctly evaluates trading signals

**Steps:**
1. Create test user with $100 gas fee balance
2. Create test bot with AI config (82% confidence threshold)
3. Generate mock signal (BTCUSDT LONG, 78% technical confidence)
4. Call `AIDecisionEngine.evaluate()`
5. Verify decision result (EXECUTE or SKIP)
6. Check confidence breakdown

**Expected Output:**
```json
{
  "decision": "EXECUTE" or "SKIP",
  "confidenceBreakdown": {
    "technical": 0.78,
    "news": 0.02,
    "backtest": 0.01,
    "learning": -0.01,
    "total": 0.80
  },
  "reason": "AI reasoning text...",
  "userId": "...",
  "signal": { ... }
}
```

**Pass Criteria:**
- ✅ Decision is either EXECUTE or SKIP
- ✅ Final confidence between 0 and 1
- ✅ Confidence breakdown adds up correctly
- ✅ AI reasoning text generated

---

### Test 2: News Integration

**Purpose:** Verify news sentiment analysis and database storage

**Steps:**
1. Check NewsEvent database for existing articles
2. If empty, call `/api/admin/bot-decision/news/fetch`
3. Get aggregate sentiment for BTCUSDT (last 24h)
4. Calculate sentiment impact (avgSentiment × 10%)

**Expected Output:**
```json
{
  "count": 15,
  "avgSentiment": 0.24,
  "bullish": 9,
  "bearish": 4,
  "neutral": 2,
  "highImpact": 3,
  "avgImpact": 65
}
```

**Pass Criteria:**
- ✅ News articles found in database
- ✅ Aggregate sentiment calculated
- ✅ Sentiment impact within -10% to +10%
- ✅ Bullish + Bearish + Neutral = Total count

---

### Test 3: Learning System

**Purpose:** Verify learning pattern detection and matching

**Steps:**
1. Get learning pattern statistics from database
2. Find patterns matching mock signal
3. Calculate learning impact based on pattern confidence
4. Display top 3 matching patterns

**Expected Output:**
```javascript
{
  "stats": {
    "totalPatterns": 12,
    "lossPatterns": 8,
    "winPatterns": 4,
    "avgConfidence": 0.76
  },
  "matchingPatterns": [
    {
      "type": "loss",
      "description": "High RSI + Low Volume = Rejection",
      "confidence": 0.85,
      "successRate": 0.78,
      "occurrences": 12
    }
  ],
  "learningImpact": -0.025 // Negative for loss patterns
}
```

**Pass Criteria:**
- ✅ Pattern statistics retrieved
- ✅ Patterns matched correctly
- ✅ Learning impact calculated (-3% to +3%)
- ✅ Loss patterns have negative impact

---

### Test 4: End-to-End Bot Execution

**Purpose:** Test complete bot decision and execution flow

**Flow:**
```
Step 1: Signal Generation (mock BTCUSDT LONG)
         ↓
Step 2: News Sentiment Fetch (last 24h)
         ↓
Step 3: Learning Pattern Matching
         ↓
Step 4: AI Decision Making (DeepSeek)
         ↓
Step 5: Gas Fee Balance Check (≥ $10)
         ↓
Step 6: Trade Execution Simulation
         ↓
Step 7: Commission Deduction (20% of profit)
```

**Mock Trade Parameters:**
- Account Balance: $10,000
- Risk Per Trade: 2% ($200)
- Leverage: 10x
- Position Size: Calculated based on SL distance
- Win Rate: 70% (random simulation)

**Expected Output:**
```
📊 Step 1: Signal Generated
   Symbol: BTCUSDT
   Action: LONG
   Technical Confidence: 78.0%

📰 Step 2: News Sentiment
   News Impact: +2.4%
   
🎓 Step 3: Learning Patterns
   Learning Impact: -1.2%
   Matching Patterns: 3

🤖 Step 4: AI Decision
   Decision: EXECUTE
   Final Confidence: 84.2%

💰 Step 5: Gas Fee Check
   Gas Fee Balance: $100.00
   Can Trade: YES

⚡ Step 6: Trade Execution
   Entry Price: $68,000
   Position Size: 0.0364 BTC
   Leverage: 10x

TRADE RESULT: WIN
   Profit/Loss: $20.00

💸 Step 7: Commission Deduction
   Profit: $20.00
   Commission (20%): $4.00
   New Gas Fee Balance: $96.00

✅ TEST PASSED
```

**Pass Criteria:**
- ✅ All 7 steps execute without error
- ✅ Decision made (EXECUTE or SKIP)
- ✅ Gas fee check validates correctly
- ✅ Position size calculated correctly
- ✅ Commission deducted from gas fee balance
- ✅ Warning if gas fee < $10 after trade

---

## 🎯 Test Results Interpretation

### Passing All Tests

```
📊 Results: 4/4 tests passed
✅ PASSED - signalEvaluation
✅ PASSED - newsIntegration
✅ PASSED - learningSystem
✅ PASSED - endToEnd

🎉 Integration testing complete!
```

**Action:** Ready for production deployment!

### Partial Pass (News Skipped)

```
📊 Results: 3/4 tests passed
✅ PASSED - signalEvaluation
⚠️ SKIPPED - newsIntegration (no news data)
✅ PASSED - learningSystem
✅ PASSED - endToEnd
```

**Action:** Optional - fetch news manually via admin panel first

### Test Failures

```
📊 Results: 2/4 tests passed
✅ PASSED - signalEvaluation
❌ FAILED - newsIntegration
  Error: Failed to connect to DeepSeek API
```

**Action:** Check error logs, verify API keys, retry

---

## 🐛 Troubleshooting

### Issue 1: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check MongoDB is running
mongosh

# Verify MONGODB_URI in .env
cat .env | grep MONGODB_URI

# Restart MongoDB
brew services restart mongodb-community
```

### Issue 2: "DeepSeek API error"

**Solution:**
```bash
# Verify API key in .env
cat .env | grep DEEPSEEK_API_KEY

# Check API balance
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.deepseek.com/v1/balance

# Test API connection
node scripts/test-deepseek-connection.js
```

### Issue 3: "Test user already exists"

**Solution:**
```bash
# Cleanup test data
node scripts/test-bot-decision-integration.js
# Set CLEANUP: true in script

# Or manual cleanup via MongoDB
mongosh
use futurepilotv2
db.futurepilotcols.deleteOne({ email: 'test-bot@futurepilot.com' })
db.userbots.deleteMany({ userId: ObjectId('...') })
```

### Issue 4: "No news data available"

**Solution:**
```bash
# Fetch news via admin panel first:
# 1. Open http://localhost:3000/administrator/signal-center
# 2. Go to News tab
# 3. Click "Fetch from CryptoNews"

# Or call API directly (need admin token):
curl -X POST http://localhost:3000/api/admin/bot-decision/news/fetch \
  -H "Cookie: admin_token=YOUR_TOKEN"
```

---

## 📝 Test Data

### Mock Signal

```javascript
{
  symbol: 'BTCUSDT',
  action: 'LONG',
  entryPrice: 68000,
  stopLoss: 67450,
  takeProfit: 68550,
  technicalConfidence: 0.78,
  indicators: {
    rsi: 62,
    macd: 0.00045,
    adx: 35,
    ema9: 67980,
    ema21: 67850,
    volume: 1.2
  }
}
```

### Test User

```javascript
{
  email: 'test-bot@futurepilot.com',
  username: 'testbot',
  walletData: {
    gasFeeBalance: 100 // $100 for testing
  }
}
```

### Test Bot Config

```javascript
{
  status: 'active',
  aiConfig: {
    enabled: true,
    confidenceThreshold: 0.82,
    newsWeight: 0.10,
    backtestWeight: 0.05,
    learningWeight: 0.03
  },
  tradingConfig: {
    riskPercent: 0.02,
    maxLeverage: 10,
    allowedPairs: ['BTCUSDT', 'ETHUSDT']
  }
}
```

---

## 🔄 Continuous Integration

### CI/CD Pipeline Integration

```yaml
# .github/workflows/integration-test.yml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run integration tests
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
        run: node scripts/test-bot-decision-integration.js
```

---

## 📈 Performance Benchmarks

**Expected Execution Times:**

| Test | Duration | API Calls |
|------|----------|-----------|
| Signal Evaluation | 2-3s | 1 (DeepSeek) |
| News Integration | 1-2s | 0 (database only) |
| Learning System | 0.5-1s | 0 (database only) |
| End-to-End | 3-5s | 1 (DeepSeek) |
| **Total** | **7-11s** | **2 DeepSeek calls** |

**Cost Analysis:**
- DeepSeek: $0.001 per decision
- 2 API calls per test run = $0.002
- Monthly (30 runs): $0.06

---

## ✅ Checklist Before Production

- [ ] All integration tests passing
- [ ] MongoDB connection stable
- [ ] DeepSeek API key valid and funded
- [ ] Admin authentication working
- [ ] Gas fee balance system tested
- [ ] Trading commission calculation verified
- [ ] News sentiment analysis accurate
- [ ] Learning patterns detected correctly
- [ ] Test data cleaned up
- [ ] Performance benchmarks acceptable

---

## 🆘 Support

**Issues?**
- 📧 Email: support@futurepilot.com
- 📚 Docs: `/docs/BOT_DECISION_LAYER_COMPLETE.md`
- 🐛 Bug Reports: GitHub Issues

**Related Documentation:**
- `/docs/AI_DECISION_ENGINE.md` - Core AI engine
- `/docs/NEWS_INTEGRATION.md` - News sentiment system
- `/docs/LEARNING_SYSTEM.md` - Pattern recognition
- `/docs/TRADING_COMMISSION_SYSTEM.md` - Commission logic

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
