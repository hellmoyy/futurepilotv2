# 📊 Backtest Data Cache System

Sistem caching untuk menyimpan data historical agar tidak perlu download berulang-ulang.

## 🚀 Quick Start

### 1. Download Data

**Download satu coin, satu periode:**
```bash
node download-data.js --coin BTC --period 1w
node download-data.js --coin ETH --period 3m
```

**Download semua periode untuk satu coin:**
```bash
node download-data.js --coin BTC --all
```

**Download SEMUA coin dan SEMUA periode:**
```bash
node download-data.js --all-coins
```

### 2. List Cache

```bash
node download-data.js --list
```

### 3. Check Cache Status

```bash
node download-data.js --coin BTC --period 1w --check
```

### 4. Run Backtest (SUPER CEPAT!)

```bash
# Single coin
node run-cached-backtest.js --period 3m --coins BTC

# Multiple coins
node run-cached-backtest.js --period 1w --coins BTC,ETH,BNB,XRP

# Default: BTC, ETH, BNB, XRP
node run-cached-backtest.js --period 1w
```

## 📂 Struktur Folder

```
backtest/
  data/
    BTCUSDT/
      1w_1m.json    (1 week, 1 minute timeframe)
      1w_3m.json
      1w_5m.json
      1m_1m.json    (1 month, 1 minute timeframe)
      1m_3m.json
      1m_5m.json
      3m_1m.json    (3 months)
      ...
      6m_1m.json    (6 months)
      ...
    ETHUSDT/
      1w_1m.json
      ...
    BNBUSDT/
    XRPUSDT/
    ...
```

## 💾 Available Coins

- BTCUSDT
- ETHUSDT
- BNBUSDT
- XRPUSDT
- ADAUSDT
- DOGEUSDT
- MATICUSDT
- LINKUSDT
- LTCUSDT
- AVAXUSDT

## 📅 Available Periods

| Period | Days | Description |
|--------|------|-------------|
| 1w     | 7    | 1 week      |
| 1m     | 30   | 1 month     |
| 3m     | 90   | 3 months    |
| 6m     | 180  | 6 months    |

## ⚡ Keuntungan Sistem Cache

### ❌ Tanpa Cache (run-multi-pair.js)
```bash
node run-multi-pair.js --period 3m
# ⏳ Download 5 pairs × 3 timeframes = 15 requests
# ⏳ Time: ~5-10 minutes
# ⏳ Harus download ulang setiap kali test
```

### ✅ Dengan Cache (run-cached-backtest.js)
```bash
# First time - download once
node download-data.js --coin BTC --period 3m
# ⏳ Time: ~2 minutes

# Then run backtest - INSTANT!
node run-cached-backtest.js --period 3m --coins BTC
# ⚡ Time: ~5-10 seconds!
# ⚡ Bisa test berkali-kali tanpa download ulang
# ⚡ Bisa test dengan parameter berbeda
```

## 📊 Workflow Recommended

### Setup (Sekali saja)
```bash
# Download semua coin yang mau ditest, semua periode
node download-data.js --all-coins

# Atau download per coin
node download-data.js --coin BTC --all
node download-data.js --coin ETH --all
node download-data.js --coin BNB --all
node download-data.js --coin XRP --all
```

### Testing (Unlimited!)
```bash
# Test berbagai periode
node run-cached-backtest.js --period 1w --coins BTC,ETH
node run-cached-backtest.js --period 1m --coins BTC,ETH
node run-cached-backtest.js --period 3m --coins BTC,ETH

# Test berbagai kombinasi coin
node run-cached-backtest.js --period 1w --coins BTC
node run-cached-backtest.js --period 1w --coins ETH
node run-cached-backtest.js --period 1w --coins BTC,ETH,BNB,XRP

# Test dengan parameter strategy berbeda (edit script)
# Tidak perlu download ulang!
```

## 🔄 Update Data

Data akan kadaluarsa setelah 1 hari. Untuk update:

```bash
# Re-download coin tertentu
node download-data.js --coin BTC --period 1w

# Atau download ulang semua
node download-data.js --all-coins
```

## 💡 Tips

1. **Download di malam hari**: Download semua data sekali saja, biarkan jalan overnight
2. **Test pagi hari**: Pagi langsung test dengan berbagai parameter, super cepat!
3. **Backup data/**: Folder data/ bisa di-backup, total size ~1-2 GB untuk 10 coins
4. **Git ignore**: Folder data/ sudah ada di .gitignore (jangan commit data mentah)

## 🎯 Use Cases

### Case 1: Optimize Parameters
```bash
# Download once
node download-data.js --coin BTC --period 3m

# Test different RSI ranges
# Edit run-cached-backtest.js, change RSI 30-70 → 35-65
node run-cached-backtest.js --period 3m --coins BTC

# Test different MACD threshold
# Edit run-cached-backtest.js, change MACD 0.003 → 0.004
node run-cached-backtest.js --period 3m --coins BTC

# Instant results! No re-download!
```

### Case 2: Compare Coins
```bash
# Download all coins once
node download-data.js --coin BTC --period 1w
node download-data.js --coin ETH --period 1w
node download-data.js --coin BNB --period 1w
node download-data.js --coin XRP --period 1w

# Test each coin individually
node run-cached-backtest.js --period 1w --coins BTC
node run-cached-backtest.js --period 1w --coins ETH
node run-cached-backtest.js --period 1w --coins BNB
node run-cached-backtest.js --period 1w --coins XRP

# Find best performer!
```

### Case 3: Long-term Validation
```bash
# Download 6 months data
node download-data.js --coin BTC --period 6m
node download-data.js --coin ETH --period 6m

# Test strategy sustainability
node run-cached-backtest.js --period 6m --coins BTC,ETH

# Validate if 80% WR holds over 6 months!
```

## 🚨 Troubleshooting

**Error: Missing cache data**
```bash
# Download the missing data
node download-data.js --coin BTC --period 1w
```

**Cache outdated (>24h old)**
```bash
# Re-download
node download-data.js --coin BTC --period 1w
```

**Want fresh data**
```bash
# Delete and re-download
rm -rf data/BTCUSDT
node download-data.js --coin BTC --all
```

## 📈 Next Steps

1. Download data untuk 4-5 coin favorit
2. Test strategy dengan cached data
3. Optimize parameters (RSI, MACD, Volume, etc)
4. Compare results across different periods
5. Find optimal coin + parameter combination
6. Deploy winning strategy! 🚀
