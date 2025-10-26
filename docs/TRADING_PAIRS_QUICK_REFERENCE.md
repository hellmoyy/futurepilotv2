# 🔄 Trading Pairs - Quick Reference

## ⚡ TL;DR

| Bot | Pairs | Strategy |
|-----|-------|----------|
| **Bitcoin Pro** | `BTC` | Bitcoin specialist |
| **Ethereum Master** | `ETH` | Ethereum specialist |
| **Safe Trader** | `BTC, ETH, BNB, SOL, ADA, XRP, LINK, LTC` (8) | Stable majors only |
| **Aggressive Trader** | `BTC, ETH, BNB, SOL, ADA, XRP, DOGE, MATIC, AVAX, DOT, ARB, OP, ATOM, FTM, NEAR` (15) | Stable + Volatile mix |

---

## 📊 Full List

### 1. Bitcoin Pro (1 pair)
```
BTC → BTCUSDT
```

### 2. Ethereum Master (1 pair)
```
ETH → ETHUSDT
```

### 3. Safe Trader (8 pairs)
```
BTC  → BTCUSDT     (Bitcoin)
ETH  → ETHUSDT     (Ethereum)
BNB  → BNBUSDT     (Binance Coin)
SOL  → SOLUSDT     (Solana)
ADA  → ADAUSDT     (Cardano)
XRP  → XRPUSDT     (Ripple)
LINK → LINKUSDT    (Chainlink)
LTC  → LTCUSDT     (Litecoin)
```

### 4. Aggressive Trader (15 pairs)

**Stable Majors (7):**
```
BTC → BTCUSDT
ETH → ETHUSDT
BNB → BNBUSDT
SOL → SOLUSDT
ADA → ADAUSDT
XRP → XRPUSDT
DOT → DOTUSDT
```

**Volatile/Emerging (8):**
```
DOGE  → DOGEUSDT    (Meme coin)
MATIC → MATICUSDT   (Polygon)
AVAX  → AVAXUSDT    (Avalanche)
ARB   → ARBUSDT     (Arbitrum L2)
OP    → OPUSDT      (Optimism L2)
ATOM  → ATOMUSDT    (Cosmos)
FTM   → FTMUSDT     (Fantom)
NEAR  → NEARUSDT    (NEAR Protocol)
```

---

## 🎯 Strategy Focus

**Bitcoin Pro:** Single-asset mastery  
**Ethereum Master:** ETH ecosystem specialist  
**Safe Trader:** Conservative diversification  
**Aggressive Trader:** Maximum opportunity

---

## 🔧 Update Database

```bash
node scripts/seed-trading-bots.js
```

**Expected Output:**
```
✅ Successfully seeded trading bot configurations!
📊 Total bots configured: 4
   - Bitcoin Pro (ID: 1) - 1 currencies
   - Ethereum Master (ID: 2) - 1 currencies
   - Safe Trader (ID: 3) - 8 currencies
   - Aggressive Trader (ID: 4) - 15 currencies
```

---

## ✅ Status: Complete

All bots configured with appropriate trading pairs! 🚀
