# Trade Integration - Quick Reference

## 🚀 Quick Start

### Create Trade (Bot Auto)
```typescript
import { TradeManager } from '@/lib/trading/TradeManager';

// Bot automatically creates trade when opening position
const trade = await TradeManager.createTrade({
  userId: '...',
  botInstanceId: '...',
  symbol: 'BTCUSDT',
  type: 'buy',
  side: 'long',
  entryPrice: 65000,
  quantity: 0.1,
  stopLoss: 64000,
  takeProfit: 67000,
  exchange: 'binance',
  leverage: 10,
});
```

### Close Trade (Bot Auto)
```typescript
// Bot automatically closes trade when position exits
await TradeManager.closeTrade(tradeId, {
  exitPrice: 66500,
  exitTime: new Date(),
  notes: 'Take profit hit',
});
```

## 📡 API Endpoints

### Get Stats
```bash
GET /api/trades/stats
Authorization: Bearer {session}

Response:
{
  "openTrades": 2,
  "totalProfit": 1250.50,
  "winRate": 66.67
}
```

### Get Active Trades
```bash
GET /api/trades/active
Authorization: Bearer {session}

Response:
{
  "data": [
    {
      "symbol": "BTCUSDT",
      "side": "long",
      "entryPrice": 65000,
      "pnl": 150.00,
      "status": "open"
    }
  ]
}
```

### Manual Close
```bash
PATCH /api/trades/[id]
{
  "action": "close",
  "exitPrice": 66500
}
```

### Update SL/TP
```bash
PATCH /api/trades/[id]
{
  "action": "update_sl",
  "stopLoss": 64500
}

# OR

{
  "action": "update_tp",
  "takeProfit": 68000
}
```

## 🔧 TradingEngine Integration

### Bot Configuration
```typescript
// In your strategy class
export class BitcoinProStrategy extends TradingEngine {
  constructor(userId: string, config: TradingConfig, apiKey: string, apiSecret: string, botInstanceId: string) {
    super(userId, config, apiKey, apiSecret, botInstanceId);
    // botInstanceId is required for trade tracking
  }
}
```

### Trade Flow
```
1. analyze() → Generate signal
2. executeOrder() → Place order + CREATE TRADE RECORD
3. Monitor position
4. closePosition() → Close order + UPDATE TRADE RECORD
```

## 💡 Helper Functions

### Get Open Trades
```typescript
const openTrades = await TradeManager.getOpenTrades(userId);
```

### Get Statistics
```typescript
const stats = await TradeManager.getTradeStats(userId);
// Returns: openTrades, closedTrades, totalProfit, winRate, etc.
```

### Update Stop Loss
```typescript
await TradeManager.updateStopLoss(tradeId, newStopLoss);
```

### Update Take Profit
```typescript
await TradeManager.updateTakeProfit(tradeId, newTakeProfit);
```

### Cancel Trade
```typescript
await TradeManager.cancelTrade(tradeId, 'Reason for cancel');
```

## 📊 PnL Calculation

### LONG Position
```
PnL = (Exit Price - Entry Price) × Quantity - Fees
Example: (66500 - 65000) × 0.1 = $150
```

### SHORT Position
```
PnL = (Entry Price - Exit Price) × Quantity - Fees
Example: (65000 - 64000) × 0.1 = $100
```

## 🎯 Trade States

| Status | Description |
|--------|-------------|
| `open` | Position active di exchange |
| `closed` | Position ditutup (SL/TP/manual) |
| `cancelled` | Trade cancelled due to error |

## 🔍 Common Queries

### Find Active Trades for Symbol
```typescript
const trades = await Trade.find({
  userId: userId,
  symbol: 'BTCUSDT',
  status: 'open'
});
```

### Calculate Total Profit
```typescript
const closedTrades = await Trade.find({
  userId: userId,
  status: 'closed'
});

const totalProfit = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
```

### Get Win Rate
```typescript
const closedTrades = await Trade.find({ userId, status: 'closed' });
const winning = closedTrades.filter(t => t.pnl > 0);
const winRate = (winning.length / closedTrades.length) * 100;
```

## 🚨 Error Handling

### Trade Creation Failed (Non-Critical)
```typescript
try {
  const trade = await TradeManager.createTrade({...});
  this.currentTradeId = trade._id.toString();
} catch (error) {
  console.error('Trade record creation failed:', error);
  // Order was placed successfully, just logging failed
}
```

### Position Close Failed (Critical)
```typescript
try {
  await this.closePosition();
  await TradeManager.closeTrade(this.currentTradeId, {...});
} catch (error) {
  // Both failed - might need manual intervention
  console.error('Critical: Position close failed:', error);
}
```

## 📝 Trade Record Fields

```typescript
{
  userId: ObjectId,
  strategyId: ObjectId,         // Bot instance ID
  symbol: 'BTCUSDT',
  type: 'buy' | 'sell',
  side: 'long' | 'short',
  entryPrice: 65000,
  exitPrice: 66500,             // null if still open
  quantity: 0.1,
  stopLoss: 64000,
  takeProfit: 67000,
  leverage: 10,
  pnl: 150.00,                  // calculated on close
  pnlPercentage: 2.31,          // % gain/loss
  status: 'open' | 'closed' | 'cancelled',
  exchange: 'binance',
  entryTime: Date,
  exitTime: Date,               // null if still open
  fees: 5.00,                   // optional
  notes: 'Trade notes...',
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 Dashboard Integration

### Get Data for Dashboard
```typescript
// In dashboard page
const [stats, activeTrades] = await Promise.all([
  fetch('/api/trades/stats'),
  fetch('/api/trades/active')
]);

// Display:
// - Active Trades: {stats.openTrades}
// - Total Profit: ${stats.totalProfit}
// - Win Rate: {stats.winRate}%
```

### Real-time Updates (Future)
```typescript
// WebSocket subscription
ws.on('trade.created', (trade) => {
  // Update UI with new trade
});

ws.on('trade.closed', (trade) => {
  // Update stats with closed trade
});
```

## 🎨 Frontend Example

```typescript
'use client';

export default function ActiveTradesWidget() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetch('/api/trades/active')
      .then(res => res.json())
      .then(data => setTrades(data.data));
  }, []);

  return (
    <div>
      {trades.map(trade => (
        <div key={trade._id}>
          <span>{trade.symbol}</span>
          <span>{trade.side.toUpperCase()}</span>
          <span>${trade.entryPrice}</span>
          <span className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Debugging Tips

### Check if Trade Was Created
```typescript
const trade = await Trade.findOne({
  userId: userId,
  symbol: 'BTCUSDT',
  status: 'open'
}).sort({ createdAt: -1 });

console.log('Latest trade:', trade);
```

### View Bot's Trade History
```typescript
const trades = await Trade.find({
  strategyId: botInstanceId
}).sort({ entryTime: -1 });
```

### Monitor PnL Updates
```typescript
const trade = await Trade.findById(tradeId);
console.log('Current PnL:', trade.pnl);
console.log('Status:', trade.status);
console.log('Exit Price:', trade.exitPrice);
```

## 📌 Important Notes

1. **Bot Instance ID Required**: Pass `botInstanceId` ke TradingEngine constructor
2. **currentTradeId Tracking**: Engine stores ID untuk close nanti
3. **Async Operations**: Trade creation tidak block order execution
4. **Authentication**: All API endpoints require valid session
5. **Ownership Checks**: Users only see their own trades

---

**Quick Access:**
- Full docs: `/docs/TRADE_RECORD_INTEGRATION.md`
- TradeManager: `/src/lib/trading/TradeManager.ts`
- TradingEngine: `/src/lib/trading/TradingEngine.ts`
- API: `/src/app/api/trades/`
