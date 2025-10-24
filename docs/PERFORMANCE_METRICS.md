# Performance Metrics - Position Page

## 📊 Overview
Sistem Performance Metrics yang komprehensif telah ditambahkan ke halaman `/position` untuk memberikan analisis mendalam tentang performa trading Anda.

## ✅ Fitur yang Ditambahkan

### **Tab Baru: Performance Metrics**
Tab ketiga di halaman position yang fokus pada analisis statistik dan risk-adjusted returns.

---

## 📈 Metrics yang Tersedia

### **1. Risk-Adjusted Returns**

#### **Sharpe Ratio**
- **Definisi**: Mengukur return yang disesuaikan dengan risiko
- **Formula**: (Average Return - Risk Free Rate) / Standard Deviation × √250
- **Interpretasi**:
  - `> 2.0`: 🎯 Excellent (Sangat baik)
  - `> 1.0`: 👍 Good (Baik)
  - `> 0.0`: ⚠️ Fair (Cukup)
  - `< 0.0`: ❌ Poor (Buruk)
- **Catatan**: Risk-free rate diasumsikan 0% untuk crypto, annualized dengan 250 trading days

#### **Maximum Drawdown**
- **Definisi**: Penurunan terbesar dari peak ke trough
- **Formula**: ((Peak - Trough) / Peak) × 100%
- **Interpretasi**:
  - `≤ 10%`: ✅ Excellent (Risiko sangat rendah)
  - `≤ 20%`: 👍 Good (Risiko terkontrol)
  - `≤ 30%`: ⚠️ High (Risiko tinggi)
  - `> 30%`: 🚨 Very High (Risiko sangat tinggi)
- **Pentingnya**: Metric paling penting untuk risk management

#### **Calmar Ratio**
- **Definisi**: Annualized return dibagi max drawdown
- **Formula**: (Annualized Return / Max Drawdown)
- **Interpretasi**:
  - `> 3.0`: 🎯 Excellent
  - `> 1.0`: 👍 Good
  - `< 1.0`: ⚠️ Fair
- **Kegunaan**: Mengukur seberapa efisien strategi menghasilkan profit vs risiko

#### **Recovery Factor**
- **Definisi**: Net profit dibagi max drawdown (dalam %)
- **Formula**: (Net Profit / Max Drawdown) × 100
- **Interpretasi**:
  - `> 2.0`: 🎯 Excellent (Recovery cepat)
  - `> 1.0`: 👍 Good (Recovery stabil)
  - `< 1.0`: ⚠️ Fair (Recovery lambat)
- **Kegunaan**: Mengukur kemampuan recovery dari drawdown

---

### **2. Profitability Metrics**

#### **Profit Factor**
- **Definisi**: Total profit dibagi total loss
- **Formula**: Gross Profit / Absolute(Gross Loss)
- **Interpretasi**:
  - `> 2.0`: Sangat profitable
  - `> 1.5`: Profitable
  - `> 1.0`: Breakeven+
  - `< 1.0`: Losing strategy
- **Threshold**: > 1.5 dianggap good

#### **Win Rate**
- **Definisi**: Persentase trade yang profit
- **Formula**: (Winning Trades / Total Trades) × 100%
- **Interpretasi**:
  - `≥ 60%`: Excellent (Konsisten profit)
  - `≥ 50%`: Good (Seimbang)
  - `< 50%`: Perlu improvement
- **Catatan**: Win rate tinggi tidak selalu = profitable (perlu lihat avg win/loss)

#### **Average Win**
- **Definisi**: Rata-rata profit per trade yang winning
- **Formula**: Sum(All Wins) / Count(Winning Trades)
- **Display**: Dollar amount ($)
- **Warna**: 🟢 Green

#### **Average Loss**
- **Definisi**: Rata-rata loss per trade yang losing
- **Formula**: Abs(Sum(All Losses)) / Count(Losing Trades)
- **Display**: Dollar amount ($)
- **Warna**: 🔴 Red

---

### **3. Additional Metrics**

#### **Expectancy**
- **Definisi**: Expected value per trade
- **Formula**: Total PnL / Total Trades
- **Interpretasi**:
  - `> 0`: Profitable system (positif expectancy)
  - `= 0`: Breakeven
  - `< 0`: Losing system
- **Kegunaan**: Menunjukkan apakah strategi profitable dalam jangka panjang

#### **Total Fees**
- **Definisi**: Akumulasi semua trading fees
- **Display**: Dollar amount ($)
- **Warna**: 🟠 Orange
- **Pentingnya**: Fee bisa menghancurkan profitability, perlu di-monitor

#### **Max Win Streak** 🔥
- **Definisi**: Jumlah trade winning berturut-turut terbanyak
- **Display**: Integer count
- **Emoji**: 🔥 (Fire - representing hot streak)
- **Kegunaan**: Psychological metric, membantu memahami momentum

#### **Max Loss Streak** ❄️
- **Definisi**: Jumlah trade losing berturut-turut terbanyak
- **Display**: Integer count
- **Emoji**: ❄️ (Snowflake - representing cold streak)
- **Kegunaan**: Risk management, perlu stop/adjust strategy saat streak panjang

---

## 🎨 UI/UX Design

### **Layout**
- **3-section grid layout**:
  1. Risk-Adjusted Returns (Purple gradient header)
  2. Profitability Metrics (Green gradient header)
  3. Additional Metrics (Cyan gradient header)

### **Color Coding**
- **Green**: Profitable/Good metrics
- **Yellow/Orange**: Fair/Warning metrics
- **Red**: Poor/Negative metrics
- **Purple/Pink**: Special metrics (Sharpe, Calmar, Recovery)
- **Blue/Cyan**: Neutral/Info metrics

### **Interactive Elements**
- **Tooltip Icons** (ℹ️): Hover untuk melihat penjelasan detail
- **Gradient Cards**: Modern glassmorphism effect
- **Responsive Grid**: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)

### **Empty State**
Jika belum ada trade data:
- Icon chart besar
- "No Trading Data Yet" message
- Call-to-action: "Start trading to see your performance metrics"

---

## 📐 Calculation Details

### **Sharpe Ratio Calculation**
```typescript
1. Get all closed trades returns (PnL %)
2. Calculate average return
3. Calculate standard deviation
4. Sharpe = (avg return - 0) / std dev
5. Annualize: Sharpe × √250
```

### **Max Drawdown Calculation**
```typescript
1. Start with 100% equity
2. For each trade return:
   - Update equity: equity × (1 + return/100)
   - Track peak equity
   - Calculate drawdown: (peak - equity) / peak × 100
3. Return maximum drawdown encountered
```

### **Profit Factor Calculation**
```typescript
1. Sum all positive PnL = Gross Profit
2. Sum absolute value of negative PnL = Gross Loss
3. Profit Factor = Gross Profit / Gross Loss
4. Handle edge case: If loss = 0, return 999 (cap)
```

### **Streaks Calculation**
```typescript
1. Sort trades by entry time
2. Loop through trades:
   - If PnL > 0: increment win streak, reset loss streak
   - If PnL < 0: increment loss streak, reset win streak
   - Track maximum streaks
3. Return max win/loss streaks
```

---

## 🔍 Use Cases

### **For Traders**
1. **Strategy Evaluation**: Apakah strategi profitable secara risk-adjusted?
2. **Risk Assessment**: Berapa besar maximum loss yang mungkin terjadi?
3. **Position Sizing**: Adjust size berdasarkan drawdown & win rate
4. **Psychology**: Understand streak patterns untuk manage emotions

### **For Portfolio Management**
1. **Diversification**: Compare metrics across different bots
2. **Capital Allocation**: Allocate more to high Sharpe ratio strategies
3. **Risk Monitoring**: Stop strategies with excessive drawdown
4. **Performance Review**: Monthly/quarterly performance analysis

### **For System Development**
1. **Backtesting Validation**: Compare live vs backtest metrics
2. **Parameter Optimization**: Tune parameters untuk improve metrics
3. **Strategy Selection**: Choose strategies dengan best risk/return profile
4. **Red Flags Detection**: Identify deteriorating performance early

---

## ⚠️ Important Notes

### **Data Requirements**
- **Minimum**: 2 closed trades untuk Sharpe Ratio
- **Recommended**: 30+ trades untuk statistical significance
- **Ideal**: 100+ trades untuk reliable metrics

### **Limitations**
1. **Past Performance**: Tidak guarantee future results
2. **Sample Size**: Small sample = unreliable statistics
3. **Market Conditions**: Metrics dapat berubah drastis saat market regime change
4. **Fees Impact**: High frequency trading dapat severely impacted by fees

### **Best Practices**
1. **Review Regularly**: Weekly/monthly performance review
2. **Compare Benchmarks**: Compare dengan strategy lain atau market index
3. **Set Thresholds**: Define acceptable levels untuk each metric
4. **Act on Signals**: Stop/pause strategy jika metrics deteriorate
5. **Document Changes**: Track perubahan strategy dan impact ke metrics

---

## 🚀 Technical Implementation

### **Files Modified**
- `/src/app/position/page.tsx` - Main position page

### **Functions Added**
```typescript
calculateReturns()           // Get returns array from trades
calculateSharpeRatio()        // Risk-adjusted return
calculateMaxDrawdown()        // Peak-to-trough decline
calculateProfitFactor()       // Profit vs loss ratio
calculateWinRate()            // Win percentage
calculateAvgWinLoss()         // Average win & loss amounts
calculateExpectancy()         // Expected value per trade
calculateRecoveryFactor()     // Net profit / max DD
calculateCalmarRatio()        // Return / max DD
calculateStreaks()            // Win/loss streak tracking
calculateTotalFees()          // Sum of all fees
```

### **State Management**
```typescript
activeTab: 'positions' | 'history' | 'metrics'  // Added 'metrics'
performanceMetrics: {
  sharpeRatio: number,
  maxDrawdown: number,
  profitFactor: number,
  winRate: number,
  avgWinLoss: { avgWin, avgLoss },
  expectancy: number,
  recoveryFactor: number,
  calmarRatio: number,
  streaks: { maxWinStreak, maxLossStreak },
  totalFees: number
}
```

### **Data Flow**
1. User clicks "Metrics" tab
2. Calculate all performance metrics from `trades` array
3. Render metrics in categorized sections
4. Show tooltips on hover for explanations
5. Color-code based on thresholds

---

## 📊 Benchmark Guidelines

### **Professional Trading Standards**

| Metric | Poor | Fair | Good | Excellent |
|--------|------|------|------|-----------|
| Sharpe Ratio | < 0 | 0-1 | 1-2 | > 2 |
| Max Drawdown | > 30% | 20-30% | 10-20% | < 10% |
| Profit Factor | < 1 | 1-1.5 | 1.5-2 | > 2 |
| Win Rate | < 40% | 40-50% | 50-60% | > 60% |
| Calmar Ratio | < 0.5 | 0.5-1 | 1-3 | > 3 |
| Recovery Factor | < 0.5 | 0.5-1 | 1-2 | > 2 |

### **Crypto Trading Specific**
- **Volatility**: Crypto lebih volatile, accept higher drawdown (20-30%)
- **24/7 Market**: Sharpe ratio bisa lebih volatile
- **Fees**: Watch out for fees > 10% of profit
- **Slippage**: Consider slippage dalam large cap altcoins

---

## 🎯 Next Steps (Future Enhancements)

### **Priority 1: Visualization**
- [ ] Equity curve chart (balance over time)
- [ ] Drawdown chart (visualize DD periods)
- [ ] Monthly returns heatmap
- [ ] Win/loss distribution histogram

### **Priority 2: Advanced Metrics**
- [ ] Sortino Ratio (downside deviation only)
- [ ] Omega Ratio (threshold-based return)
- [ ] Value at Risk (VaR 95%, 99%)
- [ ] Conditional Value at Risk (CVaR)
- [ ] Ulcer Index (pain metric)

### **Priority 3: Comparison Features**
- [ ] Compare multiple bots side-by-side
- [ ] Benchmark against BTC buy-and-hold
- [ ] Time period selector (1M, 3M, 6M, 1Y)
- [ ] Strategy ranking leaderboard

### **Priority 4: Export & Reporting**
- [ ] Export metrics as PDF report
- [ ] Email monthly performance summary
- [ ] Share performance publicly (opt-in)
- [ ] API endpoint for metrics data

---

## 🔗 Related Documentation
- [Position Page Overview](./POSITION_PAGE.md)
- [Trading Metrics Theory](./TRADING_METRICS_THEORY.md)
- [Risk Management Guide](./RISK_MANAGEMENT.md)

---

**Status**: ✅ **COMPLETE & PRODUCTION READY**

**Last Updated**: October 23, 2025

**Access URL**: `http://localhost:3000/position` → Click "Metrics" tab

**Performance Impact**: Minimal - calculations done client-side, no API calls
