# Trade Record Integration - Bot Trading Activity Tracking

## 📋 Overview
Sistem otomatis untuk mencatat aktivitas trading bot ke database. Setiap kali bot membuka atau menutup posisi, akan tercatat di Trade model untuk tracking profit, statistik, dan history.

## 🎯 What Was Implemented

### 1. TradeManager Service (`/src/lib/trading/TradeManager.ts`)
Service helper untuk manage trade records dengan fungsi:

#### Core Functions:
- ✅ **createTrade()** - Buat trade record saat posisi dibuka
- ✅ **closeTrade()** - Update trade record saat posisi ditutup
- ✅ **cancelTrade()** - Cancel trade jika ada error
- ✅ **getOpenTrades()** - Ambil semua open positions user
- ✅ **getTradeStats()** - Hitung statistik trading (win rate, profit, dll)
- ✅ **updateStopLoss()** - Update stop loss untuk trade
- ✅ **updateTakeProfit()** - Update take profit untuk trade
- ✅ **calculatePnL()** - Hitung profit/loss otomatis (support long & short)

#### Features:
```typescript
interface TradeParams {
  userId: string;
  botInstanceId?: string;
  symbol: string;
  type: 'buy' | 'sell';
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  exchange: string;
  leverage?: number;
  notes?: string;
}
```

### 2. TradingEngine Integration (`/src/lib/trading/TradingEngine.ts`)
Bot engine sekarang otomatis create dan update trades:

#### Modified Methods:

**executeOrder()** - CREATE TRADE RECORD
```typescript
// After Binance order sukses, create trade record
const trade = await TradeManager.createTrade({
  userId: this.userId,
  botInstanceId: this.botInstanceId,
  symbol: this.config.symbol,
  type: side === 'BUY' ? 'buy' : 'sell',
  side: side === 'BUY' ? 'long' : 'short',
  entryPrice,
  quantity,
  stopLoss: stopLossPrice,
  takeProfit: takeProfitPrice,
  exchange: 'binance',
  leverage: this.config.leverage,
  notes: `Order ID: ${order.orderId}`,
});

this.currentTradeId = trade._id.toString(); // Track untuk close nanti
```

**closePosition()** - UPDATE TRADE RECORD
```typescript
// Get exit price dan update trade
const exitPrice = await this.getCurrentPrice();

await TradeManager.closeTrade(this.currentTradeId, {
  exitPrice,
  exitTime: new Date(),
  notes: `Position closed at $${exitPrice}, P&L: $${position.pnl.toFixed(2)}`,
});

this.currentTradeId = null; // Clear after close
```

#### New Property:
```typescript
private currentTradeId: string | null = null; // Track current trade record ID
```

### 3. API Endpoints

#### GET `/api/trades/stats`
**Get trade statistics for current user**

Response:
```json
{
  "success": true,
  "data": {
    "openTrades": 2,
    "closedTrades": 15,
    "totalProfit": 1250.50,
    "winningTrades": 10,
    "losingTrades": 5,
    "winRate": 66.67,
    "avgProfit": 83.37
  }
}
```

#### GET `/api/trades/active`
**Get all open trades for current user**

Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "strategyId": "...",
      "symbol": "BTCUSDT",
      "side": "long",
      "entryPrice": 65000,
      "quantity": 0.1,
      "stopLoss": 64000,
      "takeProfit": 67000,
      "status": "open",
      "pnl": 0,
      "entryTime": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### PATCH `/api/trades/[id]`
**Advanced trade operations**

Request Body:
```json
// Close trade
{
  "action": "close",
  "exitPrice": 66500,
  "notes": "Manual close"
}

// Update stop loss
{
  "action": "update_sl",
  "stopLoss": 64500
}

// Update take profit
{
  "action": "update_tp",
  "takeProfit": 68000
}

// Cancel trade
{
  "action": "cancel",
  "notes": "Error detected"
}
```

Response:
```json
{
  "success": true,
  "message": "Trade closed successfully",
  "data": {
    "_id": "...",
    "status": "closed",
    "exitPrice": 66500,
    "pnl": 150.00,
    "pnlPercentage": 2.31,
    "exitTime": "2024-01-15T14:30:00Z"
  }
}
```

## 🔄 Flow Diagram

```
BOT START
    ↓
[TradingEngine.executeTradingCycle()]
    ↓
[analyze()] → Generate signal
    ↓
Signal = BUY/SELL?
    ↓ YES
[executeOrder()]
    ↓
Place Binance order ✅
    ↓
[TradeManager.createTrade()] ← CREATE RECORD IN DATABASE
    ↓
Store currentTradeId
    ↓
Continue monitoring...
    ↓
Position hits SL/TP or manual close
    ↓
[closePosition()]
    ↓
Close Binance position ✅
    ↓
[TradeManager.closeTrade()] ← UPDATE RECORD WITH EXIT PRICE & PNL
    ↓
Clear currentTradeId
    ↓
Dashboard shows updated stats ✅
```

## 📊 Dashboard Integration

### Before Integration:
```
Total Balance: $10,000 (from exchange)
Active Trades: 0 ❌ (tidak ada data)
Total Profit: $0.00 ❌ (tidak ada data)
```

### After Integration:
```
Total Balance: $10,000 (from exchange)
Active Trades: 2 ✅ (dari Trade.find({status: 'open'}))
Total Profit: +$1,250.50 ✅ (dari Trade.aggregate PnL)
Win Rate: 66.67% ✅
```

## 🧪 Testing Guide

### 1. Test Trade Creation
```bash
# Start a bot
POST /api/bots
{
  "strategyName": "BitcoinProStrategy",
  "exchangeConnectionId": "...",
  "config": {
    "symbol": "BTCUSDT",
    "leverage": 10,
    "stopLossPercent": 2,
    "takeProfitPercent": 5
  }
}

# Wait for bot to open position
# Check trade was created
GET /api/trades/active
```

### 2. Test Trade Stats
```bash
# Get statistics
GET /api/trades/stats

# Should return:
# - openTrades count
# - closedTrades count
# - totalProfit
# - winRate
```

### 3. Test Manual Close
```bash
# Close a trade manually
PATCH /api/trades/[trade_id]
{
  "action": "close",
  "exitPrice": 66500,
  "notes": "Manual exit"
}

# Verify trade status changed to 'closed'
# Verify PnL calculated correctly
```

## 🔍 Key Features

### Automatic PnL Calculation
```typescript
// For LONG positions
pnl = (exitPrice - entryPrice) * quantity - fees

// For SHORT positions  
pnl = (entryPrice - exitPrice) * quantity - fees

// Example LONG:
// Entry: $65,000, Exit: $66,500, Qty: 0.1
// PnL = (66500 - 65000) * 0.1 = $150
```

### Status Tracking
- **open**: Position active di exchange
- **closed**: Position sudah ditutup (manual atau SL/TP hit)
- **cancelled**: Trade cancelled karena error

### Error Handling
```typescript
// Jika trade creation gagal, order tetap jalan
try {
  const trade = await TradeManager.createTrade({...});
  this.currentTradeId = trade._id.toString();
} catch (tradeError) {
  console.error('❌ Failed to create trade record:', tradeError);
  // Don't throw - order was placed successfully
}
```

## 📈 Statistics Available

### Per User:
- Total open trades
- Total closed trades
- Total profit/loss (all time)
- Winning trades count
- Losing trades count
- Win rate percentage
- Average profit per trade

### Per Trade:
- Entry price, exit price
- Quantity, leverage
- Stop loss, take profit
- PnL in USD
- PnL percentage
- Entry time, exit time
- Status, exchange
- Bot instance that created it

## 🚨 Important Notes

1. **Trade ID Tracking**: Bot stores `currentTradeId` untuk track trade yang sedang berjalan
2. **Async Creation**: Trade creation tidak block order execution (fire and log)
3. **Authentication**: Semua endpoints require NextAuth session
4. **Ownership Check**: Users hanya bisa access trades mereka sendiri
5. **Soft Delete**: DELETE endpoint bisa digunakan untuk cleanup test data
6. **PnL Precision**: Semua kalkulasi rounded ke 2 decimal places

## 🎯 Next Steps

### Recommended Enhancements:
1. **WebSocket Updates**: Real-time trade updates di dashboard
2. **Trade Notifications**: Email/Push notifications saat trade closed
3. **Advanced Analytics**: Charts, heatmaps, performance over time
4. **Risk Management**: Max drawdown alerts, position size limits
5. **Trade Journal**: Notes, screenshots, manual analysis

### Database Optimization:
```javascript
// Add indexes for better query performance
Trade.index({ userId: 1, status: 1 });
Trade.index({ userId: 1, entryTime: -1 });
Trade.index({ strategyId: 1, status: 1 });
```

## ✅ Verification Checklist

- [x] TradeManager service created
- [x] TradingEngine integrated with TradeManager
- [x] Trade creation on position open
- [x] Trade update on position close
- [x] API endpoints for stats (/api/trades/stats)
- [x] API endpoints for active trades (/api/trades/active)
- [x] API endpoints for trade operations (/api/trades/[id])
- [x] PnL calculation (long & short support)
- [x] Authentication & authorization
- [x] Error handling & logging
- [x] TypeScript types & interfaces
- [x] No compile errors

## 🎉 Result

Bot sekarang otomatis mencatat semua trading activity ke database. Dashboard bisa menampilkan:
- Real active trades dari bot
- Total profit/loss dari semua trades
- Win rate & statistik lengkap
- Trade history untuk analysis

**Status: ✅ INTEGRATION COMPLETE**
