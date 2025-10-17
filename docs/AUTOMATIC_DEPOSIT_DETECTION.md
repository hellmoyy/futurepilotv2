# 🤖 Automatic USDT Deposit Detection System

## 📋 Overview
Sistem ini secara otomatis mendeteksi deposit USDT yang masuk ke wallet users dan langsung mengupdate balance mereka.

## 🚀 How It Works

### 1. **Cron Job Schedule**
- Berjalan setiap **5 menit** via Upstash Cron
- Monitoring blockchain untuk transaksi baru
- Otomatis update balance user

### 2. **Detection Process**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Upstash Cron  │    │  Blockchain RPC │    │   User Balance  │
│   (Every 5min)  │────▶│  Monitor last   │────▶│    Auto Update  │
│                 │    │   100 blocks    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3. **Networks Monitored**
- ✅ **Ethereum (ERC-20 USDT)**
- ✅ **BSC (BEP-20 USDT)**

## 🔧 Setup Instructions

### Step 1: Environment Variables 
Pastikan sudah ada di `.env`:
```bash
# Blockchain RPC URLs (✅ Already configured)
ETHEREUM_RPC_URL=https://ethereum.publicnode.com
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# USDT Contracts (✅ Already configured)  
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955

# Cron Security (✅ Already configured)
CRON_SECRET=your-super-secret-key
```

### Step 2: Upstash Cron Configuration

#### 🎯 **Method A: GET with Query Parameter (Easiest)**

**Destination URL:**
```
https://futurepilot.pro/api/cron/monitor-deposits?token=YOUR_CRON_SECRET
```

**Method:** `GET`
**Headers:** Not required
**Body:** Not required

#### 🔒 **Method B: POST with Authorization Header (More Secure)**

**Destination URL:**
```
https://futurepilot.pro/api/cron/monitor-deposits
```

**Method:** `POST`
**Headers:**
```json
{
  "Authorization": "Bearer YOUR_CRON_SECRET"
}
```
**Body:** Not required

#### ⚙️ **Common Settings (Both Methods)**

**Schedule:**
- **Every 5 minutes:** `*/5 * * * *` (Recommended)
- **Every 2 minutes:** `*/2 * * * *` (Aggressive)
- **Every 10 minutes:** `*/10 * * * *` (Conservative)

**Timeout:** `300` seconds
**Retries:** `3`

## 🧪 Testing

### Method A: GET with Query Parameter
```bash
curl "https://futurepilot.pro/api/cron/monitor-deposits?token=YOUR_CRON_SECRET"
```

### Method B: POST with Authorization Header
```bash
curl -X POST https://futurepilot.pro/api/cron/monitor-deposits \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Local Testing:
```bash
# GET method
curl "http://localhost:3000/api/cron/monitor-deposits?token=amu5KjBHoh31QIB5AyoXKB8wDSEPgJ3U"

# POST method  
curl -X POST http://localhost:3000/api/cron/monitor-deposits \
  -H "Authorization: Bearer amu5KjBHoh31QIB5AyoXKB8wDSEPgJ3U"
```

### Expected Response:
```json
{
  "success": true,
  "message": "Deposit monitoring completed",
  "results": {
    "timestamp": "2025-10-09T10:00:00.000Z",
    "networksChecked": 2,
    "totalDepositsFound": 3,
    "newDepositsProcessed": 1,
    "errors": [],
    "details": [
      {
        "user": "user@example.com",
        "network": "ERC20",
        "amount": 100,
        "txHash": "0xabc123...",
        "processed": true
      }
    ]
  }
}
```

## 📊 Monitoring Dashboard

### What Gets Tracked:
- ✅ **New deposits detected**
- ✅ **User balances updated** 
- ✅ **Transaction records created**
- ✅ **Error reporting**
- ✅ **Performance metrics**

### Database Updates:
1. **Transaction Collection**: New records for each deposit
2. **User Collection**: Balance auto-increment 
3. **Logs**: All activities tracked

## 🚨 Safety Features

### Duplicate Prevention:
- ✅ Check existing transactions by `txHash`
- ✅ Prevent double-processing deposits

### Error Handling:
- ✅ Individual address error isolation
- ✅ Network-level error reporting
- ✅ Comprehensive logging

### Rate Limiting:
- ✅ Only checks last 100 blocks (~20 minutes)
- ✅ Efficient bulk processing
- ✅ RPC-friendly intervals

## 📈 Performance Metrics

### Block Range: 
- **100 blocks per check** (~20 minutes)
- **Ethereum**: ~20 seconds per block
- **BSC**: ~3 seconds per block

### Cost Estimation:
- **Upstash QStash**: 288 requests/day (free tier)
- **RPC Calls**: ~576 calls/day (free public RPCs)

## 🔧 Troubleshooting

### Common Issues:

1. **No deposits detected**: 
   - Check if users have generated wallets
   - Verify RPC URLs are working
   - Check if blocks are being scanned

2. **RPC Errors**:
   - Switch to alternative RPC URLs
   - Check rate limits
   - Verify contract addresses

3. **Database Errors**:
   - Check MongoDB connection
   - Verify User/Transaction models
   - Check index performance

## 🎯 Next Steps

### Phase 1 (Immediate):
- ✅ Deploy deposit monitoring endpoint
- ✅ Setup Upstash cron job
- ✅ Monitor first few cycles

### Phase 2 (Enhancement):
- 🔄 Webhook notifications
- 🔄 Email alerts for large deposits  
- 🔄 Admin dashboard for monitoring
- 🔄 Multi-token support (USDC, etc)

### Phase 3 (Advanced):
- 📋 Real-time WebSocket updates
- 📋 Push notifications
- 📋 Advanced analytics
- 📋 Fraud detection


URL: https://futurepilot.pro/api/cron/monitor-deposits?token=amu5KjBHoh31QIB5AyoXKB8wDSEPgJ3U
Schedule: */5 * * * * (every 5 minutes)
Method: GET
Timeout: 300 seconds