# Real Trading Tracking System

## 🎯 Overview

Sistem pelacakan trading real-time yang mencatat setiap trade execution, menghitung statistics, dan menampilkan data real di UI.

## 📊 Architecture

### 1. TradeExecution Model (`/src/models/TradeExecution.ts`)

MongoDB model untuk menyimpan setiap trade:

```typescript
{
  // Identity
  userId, botInstanceId, botId, botName
  
  // Entry
  entryPrice, entryQuantity, entryTime, entryOrderId
  
  // Exit
  exitPrice, exitQuantity, exitTime, exitOrderId, exitReason
  
  // P&L (auto-calculated on save)
  grossPnL, fees, netPnL, pnlPercent
  
  // Risk Management
  stopLoss, takeProfit, leverage
  
  // Status
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
}
```

**Features:**
- ✅ Auto-calculate P&L on close (pre-save hook)
- ✅ Static method: `getStatistics()` - Calculate stats from all trades
- ✅ Static method: `getHistory()` - Get trade history
- ✅ Compound indexes for efficient queries

### 2. Trade Tracking Utilities (`/src/lib/trading/tradeTracking.ts`)

Helper functions untuk tracking:

```typescript
// Create trade when position opens
await createTradeExecution({
  userId, botInstanceId, botId, botName,
  symbol, side, entryPrice, quantity, leverage,
  stopLoss, takeProfit, exchangeConnectionId
});

// Close trade when position closes
await closeTradeExecution(tradeId, {
  exitPrice, exitReason, fees
});

// Update bot statistics (called automatically after close)
await updateBotStatistics(botInstanceId);

// Real-time P&L monitoring
await updatePositionPnL(botInstanceId, currentPrice);
```

**Functions:**
- `createTradeExecution()` - Save new trade to database
- `closeTradeExecution()` - Update trade exit + calculate P&L
- `updateBotStatistics()` - Recalculate bot stats from all trades
- `updatePositionPnL()` - Update real-time P&L for open position
- `calculateTradeFees()` - Estimate Binance fees (0.04% taker)

### 3. TradingEngine Integration

**Constructor Updated:**
```typescript
constructor(
  userId, config, apiKey, apiSecret,
  botInstanceId?,        // For tracking
  exchangeConnectionId?, // For trade records
  botId?,               // For statistics
  botName?              // For display
)
```

**Trade Flow:**

1. **Execute Order** (`executeOrder()`)
   ```typescript
   // Place order on Binance
   const order = await binance.futuresOrder({...});
   
   // Create TradeExecution record
   const tradeId = await createTradeExecution({
     userId, botInstanceId, botId, botName,
     symbol, side: 'LONG', entryPrice, quantity,
     leverage, stopLoss, takeProfit, exchangeConnectionId
   });
   
   this.currentTradeId = tradeId; // Store for later
   ```

2. **Close Position** (`closePosition()`)
   ```typescript
   // Close position on Binance
   await binance.futuresOrder({...});
   
   // Close TradeExecution record
   await closeTradeExecution(this.currentTradeId, {
     exitPrice,
     exitReason: 'MANUAL', // or TAKE_PROFIT, STOP_LOSS, etc
     fees: calculateTradeFees(...)
   });
   
   // Statistics automatically updated via closeTradeExecution()
   ```

3. **Real-time Monitoring** (cron job)
   ```typescript
   if (result.position) {
     // Update position in BotInstance
     bot.currentPosition = { ... };
     
     // Update real-time P&L
     await updatePositionPnL(bot._id, currentPrice);
   }
   ```

### 4. API Endpoints

**Get Trade History:**
```bash
GET /api/bots/[id]/trades?limit=50&status=CLOSED
```

Response:
```json
{
  "success": true,
  "trades": [
    {
      "symbol": "BTCUSDT",
      "side": "LONG",
      "entryPrice": 68000,
      "exitPrice": 68500,
      "netPnL": 197.50,
      "pnlPercent": 2.9,
      "exitReason": "TAKE_PROFIT",
      "status": "CLOSED"
    }
  ],
  "statistics": {
    "totalTrades": 10,
    "winningTrades": 8,
    "losingTrades": 2,
    "winRate": 80,
    "totalProfit": 1500,
    "totalLoss": 300,
    "avgProfit": 120,
    "dailyPnL": 200
  }
}
```

**Refresh Statistics:**
```bash
POST /api/bots/[id]/trades/refresh-stats
```

### 5. Statistics Calculation

**Automatic Calculation** (in `TradeExecution.getStatistics()`):

```typescript
{
  totalTrades: count(status='CLOSED'),
  winningTrades: count(netPnL > 0),
  losingTrades: count(netPnL < 0),
  winRate: (winningTrades / totalTrades) * 100,
  totalProfit: sum(netPnL where netPnL > 0),
  totalLoss: abs(sum(netPnL where netPnL < 0)),
  avgProfit: sum(netPnL) / totalTrades,
  dailyPnL: sum(netPnL where exitTime >= today)
}
```

**Updated in BotInstance:**
- Automatically updated after each trade closes
- Can be manually refreshed via API
- Displayed in real-time on automation page

### 6. UI Display

**Automation Page (`/automation`):**

```tsx
// Win Rate - Real data from bot statistics
{getBotInstance(bot.botId)?.statistics?.winRate 
  ? `${getBotInstance(bot.botId)?.statistics.winRate.toFixed(1)}%` 
  : bot.winRate // Fallback to config default
}

// Total P&L - Real net profit/loss
{active && getBotInstance(bot.botId)?.statistics
  ? `${netPnL >= 0 ? '+' : ''}$${netPnL.toFixed(2)}`
  : bot.avgProfit // Fallback to config default
}

// Active Positions - 0 or 1
{botInstance?.currentPosition ? 1 : 0}

// Wins/Losses - Real counts
<span className="text-green-400">
  {botInstance?.statistics?.winningTrades || 0}
</span> / 
<span className="text-red-400">
  {botInstance?.statistics?.losingTrades || 0}
</span>

// Terminal Stats - Real daily performance
Total Trades: {bot.statistics?.totalTrades || 0}
Win Rate: {bot.statistics?.winRate.toFixed(0)}%
P&L Today: ${bot.statistics?.dailyPnL.toFixed(2)}
```

## 🔄 Data Flow

```
1. User starts bot
   ↓
2. Bot analyzes market → Signal: BUY
   ↓
3. TradingEngine.executeOrder()
   - Place order on Binance
   - Create TradeExecution record (status: OPEN)
   ↓
4. Cron job monitors position (every 1-5 min)
   - Update currentPosition P&L
   - Check TP/SL conditions
   ↓
5. Condition met → TradingEngine.closePosition()
   - Close position on Binance
   - Update TradeExecution (status: CLOSED)
   - Calculate P&L (pre-save hook)
   - Update BotInstance.statistics (auto)
   ↓
6. UI displays real-time stats
   - Win Rate: 82% (from closed trades)
   - Total P&L: +$1,200 (sum of all netPnL)
   - Active Positions: 0 (position closed)
   - Wins/Losses: 8/2 (from statistics)
```

## 📈 Statistics Accuracy

### Before (Dummy Data):
- ❌ Win Rate: 71% (hardcoded in TradingBotConfig)
- ❌ Total P&L: $0.00 (never updated)
- ❌ Active Positions: Shows totalTrades instead of current positions
- ❌ Wins/Losses: Always 0/0

### After (Real Data):
- ✅ Win Rate: Calculated from actual closed trades
- ✅ Total P&L: Sum of all netPnL (profit - loss - fees)
- ✅ Active Positions: 1 if position open, 0 if closed
- ✅ Wins/Losses: Count of profitable/unprofitable trades
- ✅ Daily P&L: Only today's trades (resets daily)

## 🎯 Trading Commission Integration

**Automatic Deduction** (when position closes with profit):

```typescript
if (position.pnl > 0) {
  const commissionResult = await afterTrade(userId, position.pnl, tradeId);
  
  // Deducts 20% commission from gas fee balance
  // Logs commission amount and remaining balance
}
```

**Commission Flow:**
1. Position closes with $100 profit
2. Bot calls `afterTrade(userId, 100, tradeId)`
3. Commission: $100 × 20% = $20 (deducted from gas fee balance)
4. User net profit: $80 (added to trading balance on Binance)
5. Statistics updated with full $100 (before commission)

## 🛠️ Testing

**Manual Test Flow:**

1. Start bot → Check TradeExecution created with status='OPEN'
2. Monitor position → Verify currentPosition.pnL updates
3. Close position → Check TradeExecution status='CLOSED' + P&L calculated
4. Refresh page → Verify statistics display correct values
5. Check trade history → GET /api/bots/[id]/trades

**Expected Results:**
- ✅ Each trade has entry + exit record
- ✅ P&L matches: (exitPrice - entryPrice) × quantity - fees
- ✅ Statistics match sum of all trades
- ✅ Win rate = winningTrades / totalTrades × 100
- ✅ UI shows real data, not dummy data

## 🚀 Deployment

**Database Migration:** None required (new collection created automatically)

**Environment Variables:** None required (uses existing Binance API keys)

**Backward Compatibility:** 
- ✅ Old Trade model still used (for compatibility)
- ✅ New TradeExecution used for statistics
- ✅ Frontend handles both real data and fallback

## 📝 Notes

1. **Fee Calculation:** Uses 0.04% taker fee (conservative estimate)
2. **P&L Accuracy:** Includes leverage in percentage calculation
3. **Daily Reset:** dailyPnL resets at 00:00:00 UTC
4. **Statistics Refresh:** Auto-updates after each trade close
5. **Real-time Updates:** Position P&L updated every cron cycle

## 🔗 Related Files

**Models:**
- `/src/models/TradeExecution.ts` - Trade records
- `/src/models/BotInstance.ts` - Bot statistics

**Libraries:**
- `/src/lib/trading/tradeTracking.ts` - Helper functions
- `/src/lib/trading/TradingEngine.ts` - Trade execution
- `/src/lib/trading/BitcoinProStrategy.ts` - Strategy implementation

**API:**
- `/src/app/api/bots/route.ts` - Bot start/stop
- `/src/app/api/bots/[id]/trades/route.ts` - Trade history
- `/src/app/api/cron/run-bots/route.ts` - Position monitoring

**Frontend:**
- `/src/app/automation/page.tsx` - UI display
