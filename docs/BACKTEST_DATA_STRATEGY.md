# 📊 Backtest Data Strategy

## Overview

Strategy untuk data collection, storage, dan testing yang optimal untuk FuturePilot trading bot.

---

## 🎯 Current System (As-Is)

### Data Storage
```
backtest/data/
  BTCUSDT/
    1w_1m.json    (1 week, 1-minute candles)
    1m_1m.json    (1 month)
    3m_1m.json    (3 months - PROVEN: 675% ROI)
    6m_1m.json    (6 months)
```

### Database Storage (MongoDB)
```typescript
BacktestResult {
  configId: ObjectId
  symbol: "BTCUSDT"
  period: "3m"
  roi: 675
  winRate: 80.5
  sampleTrades: {...}  // 6 trades only
  createdAt: Date
}
```

**Key Limitation:**
- ❌ Fixed periods only (1w, 1m, 3m, 6m)
- ❌ No random sampling
- ❌ Historical data limited to cache

---

## 💡 Recommended Strategy: 3-Tier Testing

### **Tier 1: Daily Baseline (Production Monitoring)**

**Purpose:** Monitor strategy health dengan data konsisten

```javascript
const DAILY_BASELINE = {
  period: '3m',              // 3 months (proven period)
  schedule: 'daily 00:00 UTC',
  data: 'rolling window',    // Always last 90 days
  frequency: '1x per day',
  
  storage: {
    cache: true,             // Download sekali, update harian
    database: true,          // Save all results
  },
  
  alert_thresholds: {
    roi: 500,                // Alert if ROI < 500% (degradation)
    winRate: 75,             // Alert if win rate < 75%
    profitFactor: 8          // Alert if PF < 8
  }
};
```

**Implementation:**
```bash
# Cron: Daily 00:00 UTC
0 0 * * * cd /app && node backtest/run-daily-baseline.js

# Script: backtest/run-daily-baseline.js
// 1. Download last 90 days data (if not cached)
// 2. Run backtest with active config
// 3. Save to BacktestResult database
// 4. Compare with baseline thresholds
// 5. Send alert if degradation detected
```

**Benefits:**
- ✅ Consistent comparison (same 90-day window)
- ✅ Detect strategy degradation early
- ✅ Rolling data (always fresh)
- ✅ Low overhead (1 backtest per day)

---

### **Tier 2: Weekly Rolling Windows (Recent Performance)**

**Purpose:** Track performance across different timeframes

```javascript
const WEEKLY_ROLLING = {
  periods: [
    { name: '1w',  days: 7,   label: 'Last Week' },
    { name: '2w',  days: 14,  label: 'Last 2 Weeks' },
    { name: '1m',  days: 30,  label: 'Last Month' },
    { name: '3m',  days: 90,  label: 'Last Quarter' }
  ],
  schedule: 'weekly Sunday 02:00 UTC',
  frequency: '1x per week',
  
  analysis: [
    'ROI trend (increasing/decreasing)',
    'Win rate stability',
    'Profit factor changes',
    'Compare vs baseline'
  ]
};
```

**Implementation:**
```bash
# Cron: Weekly Sunday 02:00 UTC
0 2 * * 0 cd /app && node backtest/run-weekly-rolling.js

# Script: backtest/run-weekly-rolling.js
// 1. Run backtest for 1w, 2w, 1m, 3m periods
// 2. Calculate trend metrics
// 3. Generate comparison report
// 4. Save to database with tag 'weekly_rolling'
```

**Benefits:**
- ✅ Detect short-term vs long-term performance
- ✅ Identify optimal timeframe for strategy
- ✅ Track performance consistency
- ✅ Compare recent vs proven period

---

### **Tier 3: Random Historical Stress Test (Validation)**

**Purpose:** Validate strategy in diverse market conditions

```javascript
const STRESS_TEST = {
  sampling: 'random historical periods',
  pool: '5 years history (2020-2025)',
  sampleSize: '1 week per test',
  frequency: '1x per week',
  schedule: 'weekly Saturday 03:00 UTC',
  
  marketConditions: [
    { type: 'bull',     example: 'Nov 2023 - Mar 2024' },
    { type: 'bear',     example: 'May 2022 - Nov 2022' },
    { type: 'sideways', example: 'Jul 2023 - Sep 2023' },
    { type: 'crash',    example: 'Mar 2020, May 2022' },
    { type: 'recovery', example: 'Apr 2020, Jan 2023' }
  ],
  
  algorithm: {
    step1: 'Pick random date from 5 years ago',
    step2: 'Download 1 week data from that date',
    step3: 'Run backtest with active config',
    step4: 'Classify market condition (bull/bear/sideways)',
    step5: 'Save with metadata: { marketType, volatility, avgVolume }',
    step6: 'Compare ROI across market types'
  }
};
```

**Implementation:**
```javascript
// backtest/run-stress-test.js

const STRESS_TEST_PERIODS = [
  // Bear Markets
  { start: '2022-05-01', end: '2022-05-07', label: 'Luna Crash', type: 'crash' },
  { start: '2022-06-15', end: '2022-06-22', label: 'Capitulation', type: 'bear' },
  { start: '2022-11-10', end: '2022-11-17', label: 'FTX Collapse', type: 'crash' },
  
  // Bull Markets
  { start: '2023-11-01', end: '2023-11-08', label: 'ETF Hype Start', type: 'bull' },
  { start: '2024-01-10', end: '2024-01-17', label: 'ETF Approval', type: 'bull' },
  { start: '2024-03-01', end: '2024-03-08', label: 'ATH Rally', type: 'bull' },
  
  // Sideways
  { start: '2023-07-15', end: '2023-07-22', label: 'Summer Doldrums', type: 'sideways' },
  { start: '2023-08-20', end: '2023-08-27', label: 'Range Bound', type: 'sideways' },
  
  // Volatile
  { start: '2020-03-12', end: '2020-03-19', label: 'COVID Crash', type: 'crash' },
  { start: '2021-01-05', end: '2021-01-12', label: 'Bull Peak', type: 'volatile' }
];

async function runStressTest() {
  // Pick 1 random period per week
  const randomPeriod = STRESS_TEST_PERIODS[
    Math.floor(Math.random() * STRESS_TEST_PERIODS.length)
  ];
  
  console.log(`🧪 Stress Test: ${randomPeriod.label} (${randomPeriod.type})`);
  
  // Download data for that period
  const data = await downloadHistoricalData(
    'BTCUSDT',
    randomPeriod.start,
    randomPeriod.end
  );
  
  // Run backtest
  const result = await runBacktest(data);
  
  // Save with metadata
  await BacktestResult.create({
    ...result,
    testType: 'stress_test',
    marketType: randomPeriod.type,
    period: randomPeriod.label,
    historicalDate: randomPeriod.start
  });
  
  console.log(`✅ ROI: ${result.roi}% in ${randomPeriod.type} market`);
}
```

**Benefits:**
- ✅ Test in extreme conditions (crash, mania)
- ✅ Find strategy weaknesses
- ✅ Validate robustness
- ✅ Compare performance across market types
- ✅ Build confidence in strategy

---

## 📊 Data Storage Strategy

### **1. Cache System (Efficient)**

```javascript
const CACHE_STRATEGY = {
  // Hot Cache (Daily access)
  hot: {
    periods: ['3m rolling'],        // Last 90 days
    retention: 'permanent',
    update: 'daily',
    size: '~500MB per symbol'
  },
  
  // Warm Cache (Weekly access)
  warm: {
    periods: ['1w', '2w', '1m'],    // Rolling windows
    retention: '30 days',
    update: 'weekly',
    size: '~200MB per symbol'
  },
  
  // Cold Cache (Stress test)
  cold: {
    periods: 'random historical',
    retention: '7 days',            // Delete after use
    update: 'on-demand',
    size: '~50MB per test'
  }
};
```

**Directory Structure:**
```
backtest/data/
  hot/
    BTCUSDT/
      3m_rolling_1m.json    (Always last 90 days)
      3m_rolling_3m.json
      3m_rolling_5m.json
  warm/
    BTCUSDT/
      1w_rolling_1m.json    (Last 7 days)
      1m_rolling_1m.json    (Last 30 days)
  cold/
    stress_test_2022-05-01/
      BTCUSDT_1w_1m.json    (Historical period)
```

### **2. Database Storage (BacktestResult)**

```javascript
const DATABASE_STRATEGY = {
  retention: {
    daily_baseline: 'permanent',     // Keep all daily baselines
    weekly_rolling: '90 days',       // Keep last 90 days only
    stress_test: '180 days',         // Keep last 180 days
  },
  
  indexes: [
    { field: 'createdAt', order: -1 },
    { field: 'testType', order: 1 },
    { field: 'roi', order: -1 },
    { field: 'configId', order: 1 }
  ],
  
  aggregations: [
    'Daily ROI trend (7d, 30d, 90d)',
    'Win rate by market type',
    'Best/worst periods',
    'Config comparison'
  ]
};
```

---

## 🚀 Implementation Steps

### **Phase 1: Daily Baseline (Week 1)**

**Files to Create:**
1. `backtest/run-daily-baseline.js` - Daily backtest script
2. `backtest/lib/CacheManager.js` - Handle hot/warm/cold cache
3. `backtest/lib/RollingDataFetcher.js` - Download rolling window data
4. `/api/cron/daily-backtest` - API endpoint for Railway cron

**Cron Job (Railway):**
```bash
# railway.toml
[cron]
schedule = "0 0 * * *"  # Daily 00:00 UTC
command = "node backtest/run-daily-baseline.js"
```

**Expected Output:**
```
🎯 Daily Baseline Backtest (2025-11-06)
📊 Period: Last 90 days (2025-08-08 to 2025-11-06)
💰 ROI: 628% | Win Rate: 79.2% | Profit Factor: 9.8

📈 Trend Analysis:
- 7d avg:  580% ROI ⚠️ (slight degradation)
- 30d avg: 615% ROI ✅
- 90d avg: 675% ROI ✅ (baseline)

✅ Saved to database: backtest_result_67xxx
```

### **Phase 2: Weekly Rolling (Week 2)**

**Files to Create:**
1. `backtest/run-weekly-rolling.js` - Multi-period backtest
2. `backtest/lib/TrendAnalyzer.js` - Calculate trends
3. `/api/backtest/trend` - API untuk dashboard chart

**Expected Output:**
```
📊 Weekly Rolling Windows (2025-11-06)

Period | ROI    | Win Rate | Profit Factor | Trend
-------|--------|----------|---------------|-------
1w     | 520%   | 77%      | 8.2x          | ⚠️ (short-term dip)
2w     | 585%   | 78%      | 9.1x          | ✅
1m     | 615%   | 79%      | 9.8x          | ✅
3m     | 675%   | 80.5%    | 10.3x         | ✅ (baseline)

💡 Insight: Short-term performance slightly below baseline
   Possible cause: Recent market volatility (check BTC volatility index)
```

### **Phase 3: Stress Testing (Week 3)**

**Files to Create:**
1. `backtest/run-stress-test.js` - Random historical test
2. `backtest/data/stress-test-periods.json` - Curated historical periods
3. `/api/backtest/stress-test` - Manual trigger from admin

**Expected Output:**
```
🧪 Stress Test: Luna Crash (2022-05-01 to 2022-05-07)
Market Type: CRASH
Volatility: EXTREME (ATR: 4500)

Results:
💰 ROI: -12% ⚠️ (strategy failed in crash)
📊 Win Rate: 42% (below 75% threshold)
📉 Max Drawdown: -18% (exceeded -20% limit)

⚠️ ALERT: Strategy not suitable for extreme bear markets
💡 Recommendation: Implement crash detection + pause trading
```

---

## 📈 Analytics Dashboard Integration

### **New Tabs for Signal Center:**

**1. Performance Trends (Line Chart)**
```
ROI over time (7d, 30d, 90d rolling)
├── Daily baseline results
├── Smoothed trend line
└── Threshold indicator (500% baseline)
```

**2. Market Condition Breakdown (Bar Chart)**
```
ROI by market type:
├── Bull:     680% avg (10 tests)
├── Bear:     420% avg (5 tests)
├── Sideways: 550% avg (8 tests)
├── Crash:    -12% avg (2 tests) ⚠️
└── Volatile: 580% avg (6 tests)
```

**3. Config Comparison (Table)**
```
Compare performance across different configs:
├── Default config: 675% ROI (baseline)
├── Aggressive:     820% ROI (+21%) ⚠️ (higher risk)
├── Conservative:   480% ROI (-29%) ✅ (safer)
└── Custom_v2:      710% ROI (+5%) ✅
```

---

## 🎯 Recommendation Summary

### **What to Implement:**

✅ **DO THIS (Priority):**
1. **Daily Baseline** - 3m rolling window, daily 00:00 UTC
   - Purpose: Production monitoring
   - Benefit: Detect degradation early
   - Overhead: Low (1 backtest/day)

2. **Weekly Rolling** - 1w, 2w, 1m, 3m windows, weekly Sunday
   - Purpose: Performance trends
   - Benefit: Track consistency
   - Overhead: Medium (4 backtests/week)

3. **Database Analytics** - Aggregate and visualize results
   - Purpose: Insights and comparisons
   - Benefit: Data-driven decisions
   - Overhead: Low (query existing data)

❌ **DON'T DO (Not Recommended):**
1. **Fully Random Sampling** - Random date setiap hari
   - Problem: Inconsistent, hard to compare
   - Alternative: Use curated stress test periods

2. **Minute-by-minute Testing** - Test every 1 minute
   - Problem: Huge overhead, unnecessary
   - Alternative: Daily is sufficient

3. **Store Full Trade List** - Save all 200+ trades per backtest
   - Problem: Database bloat (10MB per backtest)
   - Alternative: Keep 6 sample trades only

### **Best Balance:**

```
Daily:    1x baseline test (3m rolling)       = 1 backtest
Weekly:   4x rolling windows (1w,2w,1m,3m)   = 4 backtests
Weekly:   1x random stress test              = 1 backtest
------------------------------------------------------
Total:    ~10 backtests per week             = Manageable load
```

**Storage:**
```
Cache:    ~500MB per symbol (hot cache)
Database: ~50KB per backtest result
Total:    ~500MB + (50KB × 10 × 52 weeks) = ~525MB per year
```

**Benefits:**
- ✅ Comprehensive coverage (recent + historical)
- ✅ Low overhead (10 tests/week vs 100s with random)
- ✅ Consistent comparisons (same rolling windows)
- ✅ Validated in extreme conditions (stress tests)
- ✅ Actionable insights (trends, degradation alerts)

---

## 🔧 Quick Start

### **Step 1: Setup Daily Baseline**
```bash
# Create script
node scripts/setup-daily-backtest.js

# Add to Railway cron
railway cron add "0 0 * * *" "node backtest/run-daily-baseline.js"

# Test manually
node backtest/run-daily-baseline.js
```

### **Step 2: Setup Weekly Rolling**
```bash
# Create script
node scripts/setup-weekly-backtest.js

# Add to Railway cron
railway cron add "0 2 * * 0" "node backtest/run-weekly-rolling.js"

# Test manually
node backtest/run-weekly-rolling.js
```

### **Step 3: Setup Stress Testing**
```bash
# Create historical periods database
node scripts/create-stress-test-periods.js

# Add to Railway cron
railway cron add "0 3 * * 6" "node backtest/run-stress-test.js"

# Test manually (random period)
node backtest/run-stress-test.js --random

# Test specific period
node backtest/run-stress-test.js --period luna-crash
```

---

## 📚 Related Documentation

- `/backtest/PRODUCTION_BACKTEST.md` - Current backtest system
- `/backtest/CACHE_SYSTEM.md` - Data caching strategy
- `/docs/SIGNAL_CENTER_CONFIG_DATABASE.md` - Config management
- `/docs/WEEK2_LEARNING_SYSTEM.md` - Analytics & learning

---

**Status:** 📋 **PLANNING PHASE** - Ready for implementation

**Next Steps:**
1. Review and approve this strategy
2. Implement Phase 1 (Daily Baseline)
3. Test for 1 week
4. Implement Phase 2 & 3
5. Deploy to production

**Estimated Timeline:**
- Phase 1: 2-3 days
- Phase 2: 2-3 days
- Phase 3: 2-3 days
- Testing: 1 week
- **Total: 2 weeks**
