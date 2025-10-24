# Performance Metrics - Quick Reference

## 📊 Akses Cepat
```
URL: http://localhost:3000/position
Tab: Metrics (tab ketiga)
```

---

## 🎯 Metrics Cheat Sheet

### **Risk-Adjusted Returns**

| Metric | Formula | Good Value | Meaning |
|--------|---------|------------|---------|
| **Sharpe Ratio** | Return / StdDev × √250 | > 1 | Risk-adjusted return |
| **Max Drawdown** | (Peak-Trough)/Peak × 100 | < 20% | Worst loss from peak |
| **Calmar Ratio** | Return / Max DD | > 1 | Return per unit DD |
| **Recovery Factor** | Profit / Max DD | > 1 | Recovery speed |

### **Profitability Metrics**

| Metric | Formula | Good Value | Meaning |
|--------|---------|------------|---------|
| **Profit Factor** | Gross Profit / Gross Loss | > 1.5 | Profit vs loss ratio |
| **Win Rate** | Wins / Total × 100 | > 50% | Winning percentage |
| **Avg Win** | Sum(Wins) / Count(Wins) | Higher | Average profit |
| **Avg Loss** | Sum(Losses) / Count(Losses) | Lower | Average loss |

### **Additional Metrics**

| Metric | Formula | Good Value | Meaning |
|--------|---------|------------|---------|
| **Expectancy** | Total PnL / Total Trades | > 0 | Expected $ per trade |
| **Total Fees** | Sum(All Fees) | Lower | Cost of trading |
| **Win Streak** | Max consecutive wins | - | Best streak |
| **Loss Streak** | Max consecutive losses | - | Worst streak |

---

## 🚦 Traffic Light System

### Sharpe Ratio
- 🟢 **> 2.0**: Excellent
- 🟡 **1.0 - 2.0**: Good
- 🟠 **0 - 1.0**: Fair
- 🔴 **< 0**: Poor

### Max Drawdown
- 🟢 **< 10%**: Excellent
- 🟡 **10-20%**: Good
- 🟠 **20-30%**: High
- 🔴 **> 30%**: Very High

### Profit Factor
- 🟢 **> 2.0**: Excellent
- 🟡 **1.5-2.0**: Good
- 🟠 **1.0-1.5**: Fair
- 🔴 **< 1.0**: Losing

### Win Rate
- 🟢 **> 60%**: Excellent
- 🟡 **50-60%**: Good
- 🔴 **< 50%**: Need improvement

---

## 💡 Interpretation Guide

### **What's Good?**
✅ High Sharpe Ratio (> 1)  
✅ Low Max Drawdown (< 20%)  
✅ High Profit Factor (> 1.5)  
✅ Positive Expectancy (> 0)  
✅ Win Rate > 50%  

### **Red Flags 🚩**
❌ Sharpe Ratio < 0 (losing after risk adjustment)  
❌ Max Drawdown > 30% (excessive risk)  
❌ Profit Factor < 1 (losing strategy)  
❌ Negative Expectancy (losing on average)  
❌ High loss streak without recovery  

### **Action Items**

#### If Sharpe < 0:
- Review strategy logic
- Check if market conditions changed
- Consider reducing position size

#### If Max DD > 30%:
- Implement stricter stop losses
- Reduce leverage
- Diversify across multiple pairs

#### If Profit Factor < 1:
- Strategy is losing money
- Stop trading immediately
- Backtest with different parameters

#### If Win Rate < 40%:
- Review entry conditions
- Check if wins are big enough to compensate losses
- Improve signal quality

---

## 🎓 Learning Path

### Beginner
1. Focus on: **Win Rate**, **Avg Win/Loss**, **Total Fees**
2. Goal: Understand basic profitability

### Intermediate
3. Study: **Profit Factor**, **Expectancy**, **Max Drawdown**
4. Goal: Risk management basics

### Advanced
5. Master: **Sharpe Ratio**, **Calmar Ratio**, **Recovery Factor**
6. Goal: Risk-adjusted performance optimization

---

## 📈 Example Analysis

### **Good Strategy Example**
```
Sharpe Ratio: 2.5      ✅ Excellent
Max Drawdown: 12%      ✅ Low risk
Profit Factor: 2.8     ✅ Very profitable
Win Rate: 58%          ✅ Consistent
Expectancy: $45        ✅ Positive expected value
```
**Verdict**: Keep running, consider increasing capital allocation

### **Problematic Strategy Example**
```
Sharpe Ratio: 0.3      ⚠️ Poor risk-adjusted return
Max Drawdown: 35%      🚨 Excessive risk
Profit Factor: 1.1     ⚠️ Barely profitable
Win Rate: 42%          ⚠️ Below 50%
Expectancy: $5         ⚠️ Low expected value
```
**Verdict**: Stop/pause, needs optimization or replacement

---

## 🛠️ Troubleshooting

### Q: Why is Sharpe Ratio 0?
**A**: Less than 2 closed trades, or standard deviation is 0 (all trades same PnL %)

### Q: Profit Factor shows 999?
**A**: No losing trades yet (gross loss = 0), which caps at 999

### Q: Max Drawdown is 0?
**A**: No trades yet, or equity never dropped from peak

### Q: Win Rate doesn't match my feeling?
**A**: Based on closed trades only, open positions not counted

### Q: Metrics seem wrong?
**A**: Check if you have enough trades (min 10-20 for reliable stats)

---

## 🎯 Goal Setting

### **Conservative Trader**
- Target Sharpe: > 1.5
- Max Drawdown: < 15%
- Profit Factor: > 2.0
- Win Rate: > 55%

### **Moderate Trader**
- Target Sharpe: > 1.0
- Max Drawdown: < 25%
- Profit Factor: > 1.5
- Win Rate: > 50%

### **Aggressive Trader**
- Target Sharpe: > 0.5
- Max Drawdown: < 35%
- Profit Factor: > 1.2
- Win Rate: > 45%

---

## 📱 Mobile Quick View

**Most Important 4 Metrics** (prioritize on small screens):
1. **Sharpe Ratio** - Overall quality
2. **Max Drawdown** - Risk level
3. **Profit Factor** - Profitability
4. **Win Rate** - Consistency

---

## 🔔 Alerts Setup (Coming Soon)

Recommended alert thresholds:
- Sharpe drops below 0.5 → ⚠️ Warning
- Max DD exceeds 25% → 🚨 Critical
- Profit Factor below 1.0 → 🛑 Stop
- Loss streak > 5 → ⚠️ Review

---

## 💻 Developer Notes

### Calculations Run On:
- **Client-side** (no API call needed)
- **Real-time** (updates with new trades)
- **Cached** (recalculated only when trades change)

### Data Source:
- Trades array from `/api/trades`
- Filters: `status === 'closed'`
- Minimum: 1 trade (some metrics need 2+)

### Performance:
- Calculation time: < 10ms for 1000 trades
- Memory: Negligible (~1KB for metrics object)
- No impact on page load speed

---

## 📚 Further Reading

### Academic Papers
- Sharpe, W. (1966) - "Mutual Fund Performance"
- Sortino & Price (1994) - "Performance Measurement"
- Young (1991) - "Calmar Ratio"

### Books
- "Evidence-Based Technical Analysis" - David Aronson
- "The Evaluation and Optimization of Trading Strategies" - Robert Pardo
- "Algorithmic Trading" - Ernest Chan

### Online Resources
- Investopedia: Trading Performance Metrics
- QuantStart: Backtesting Metrics Guide
- Reddit r/algotrading: Performance Analysis

---

**Quick Access**: `/position` → Click "Metrics" tab 🚀

**Last Updated**: October 23, 2025
