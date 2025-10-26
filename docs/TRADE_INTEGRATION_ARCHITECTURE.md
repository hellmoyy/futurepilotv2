# Trade Integration - Visual Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER DASHBOARD                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Active Trades│  │ Total Profit │  │   Win Rate   │             │
│  │      2       │  │  $1,250.50   │  │    66.67%    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────┬────────────────────────────────────────┘
                             │ GET /api/trades/stats
                             │ GET /api/trades/active
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  /api/trades/stats          → TradeManager.getTradeStats() │    │
│  │  /api/trades/active         → TradeManager.getOpenTrades() │    │
│  │  /api/trades/[id] PATCH     → TradeManager.closeTrade()    │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TRADE MANAGER SERVICE                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ • createTrade()        → Create new trade record           │    │
│  │ • closeTrade()         → Update with exit price & PnL      │    │
│  │ • getOpenTrades()      → Query open positions              │    │
│  │ • getTradeStats()      → Calculate statistics              │    │
│  │ • calculatePnL()       → Compute profit/loss               │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
    ┌────────────────────┐   ┌────────────────────┐
    │  TRADING ENGINE    │   │   MONGODB          │
    │  (Bot Execution)   │   │   (Trade Model)    │
    └────────────────────┘   └────────────────────┘
```

---

## 🔄 Trade Lifecycle Flow

```
START
  │
  ▼
┌─────────────────────────────────────────┐
│ 1. BOT ANALYZES MARKET                  │
│    • Check RSI, MACD, EMA               │
│    • AI analysis via OpenAI             │
│    • Generate BUY/SELL/HOLD signal      │
└──────────────┬──────────────────────────┘
               │
               ▼ Signal = BUY
┌─────────────────────────────────────────┐
│ 2. EXECUTE ORDER                        │
│    a) Place Binance futures order       │
│    b) Get entry price                   │
│    c) Calculate SL/TP                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. CREATE TRADE RECORD                  │
│    TradeManager.createTrade()           │
│    • userId: user123                    │
│    • symbol: BTCUSDT                    │
│    • side: long                         │
│    • entryPrice: $65,000                │
│    • quantity: 0.1                      │
│    • stopLoss: $64,000                  │
│    • takeProfit: $67,000                │
│    • status: open                       │
│    • Store trade._id                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. PLACE STOP ORDERS                    │
│    • Stop Loss @ $64,000                │
│    • Take Profit @ $67,000              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. MONITOR POSITION                     │
│    • Check current price                │
│    • Calculate unrealized PnL           │
│    • Wait for exit condition            │
└──────────────┬──────────────────────────┘
               │
               ▼ Take Profit Hit!
┌─────────────────────────────────────────┐
│ 6. CLOSE POSITION                       │
│    a) Cancel open orders                │
│    b) Place market close order          │
│    c) Get exit price: $67,000           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 7. UPDATE TRADE RECORD                  │
│    TradeManager.closeTrade()            │
│    • exitPrice: $67,000                 │
│    • pnl: +$200.00                      │
│    • pnlPercentage: +3.08%              │
│    • status: closed                     │
│    • exitTime: 2024-01-15 14:30         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 8. DASHBOARD UPDATES                    │
│    • Active Trades: 1 (was 2)           │
│    • Total Profit: $1,450.50 (+$200)    │
│    • Win Rate: 68.75% (updated)         │
└─────────────────────────────────────────┘
               │
               ▼
              END
```

---

## 💾 Database Structure

```
Trade Collection
├── _id: ObjectId("...")
├── userId: ObjectId("user123")
├── strategyId: ObjectId("bot456")
├── symbol: "BTCUSDT"
├── type: "buy"
├── side: "long"
├── entryPrice: 65000
├── exitPrice: 67000
├── quantity: 0.1
├── stopLoss: 64000
├── takeProfit: 67000
├── leverage: 10
├── pnl: 200.00
├── pnlPercentage: 3.08
├── status: "closed"
├── exchange: "binance"
├── entryTime: 2024-01-15T10:30:00Z
├── exitTime: 2024-01-15T14:30:00Z
├── fees: 5.00
├── notes: "Take profit hit at $67,000"
├── createdAt: 2024-01-15T10:30:00Z
└── updatedAt: 2024-01-15T14:30:00Z
```

---

## 🔌 API Integration Points

```
Frontend Component
      │
      │ useEffect(() => {
      │   fetchTrades()
      │ }, [])
      │
      ▼
┌─────────────────────┐
│  GET /api/trades/   │
│      stats          │
└──────────┬──────────┘
           │
           ▼
     ┌─────────┐
     │  Auth   │
     │  Check  │
     └────┬────┘
          │ ✅ Authenticated
          ▼
    ┌──────────────┐
    │  Connect DB  │
    └──────┬───────┘
           │
           ▼
┌─────────────────────────────┐
│ TradeManager.getTradeStats()│
│                             │
│ Trade.find({userId})        │
│   .filter(status='closed')  │
│   .reduce((sum, t) => pnl)  │
└──────────────┬──────────────┘
               │
               ▼
         ┌──────────┐
         │ Response │
         │  {       │
         │   open:2 │
         │   pnl:$$ │
         │  }       │
         └──────────┘
```

---

## 🎯 Trade State Machine

```
        ┌──────────┐
        │   NEW    │
        │  Trade   │
        └────┬─────┘
             │ createTrade()
             ▼
        ┌──────────┐
   ┌────│   OPEN   │────┐
   │    │ Position │    │
   │    └────┬─────┘    │
   │         │          │
   │         │          │
   │ Stop    │ Take     │ Manual
   │ Loss    │ Profit   │ Close
   │ Hit     │ Hit      │
   │         │          │
   │         ▼          │
   │    ┌──────────┐   │
   └───▶│  CLOSED  │◀──┘
        │ Position │
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │ Calculate│
        │   PnL    │
        └──────────┘
             │
             ▼
        ┌──────────┐
        │  Update  │
        │Dashboard │
        └──────────┘

Special Cases:
┌──────────┐
│  ERROR   │─────▶ cancelTrade()
│ Detected │      └──▶ status: 'cancelled'
└──────────┘
```

---

## 📊 Statistics Calculation

```
User's Trade History
├── Trade 1: +$150 (CLOSED)
├── Trade 2: -$50  (CLOSED)
├── Trade 3: +$300 (CLOSED)
├── Trade 4: +$200 (OPEN)
└── Trade 5: +$100 (OPEN)

TradeManager.getTradeStats()
         │
         ▼
┌────────────────────────┐
│  Filter & Calculate    │
├────────────────────────┤
│ Closed Trades: 3       │
│  └─ [1, 2, 3]         │
│                        │
│ Open Trades: 2         │
│  └─ [4, 5]            │
│                        │
│ Total PnL: $400        │
│  └─ 150 - 50 + 300    │
│                        │
│ Winning Trades: 2      │
│  └─ [1, 3]            │
│                        │
│ Losing Trades: 1       │
│  └─ [2]               │
│                        │
│ Win Rate: 66.67%       │
│  └─ (2 / 3) × 100     │
│                        │
│ Avg Profit: $133.33    │
│  └─ 400 / 3           │
└────────────────────────┘
```

---

## 🔐 Security Flow

```
HTTP Request
     │
     ▼
┌─────────────┐
│ NextAuth    │
│ Session     │
│ Check       │
└──────┬──────┘
       │
       │ No session
       ├──────────▶ 401 Unauthorized
       │
       │ Has session
       ▼
┌─────────────┐
│ Extract     │
│ userId from │
│ session     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Query DB    │
│ with userId │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Verify      │
│ Ownership   │
└──────┬──────┘
       │
       │ Not owner
       ├──────────▶ 403 Forbidden
       │
       │ Is owner
       ▼
┌─────────────┐
│ Process     │
│ Request     │
└──────┬──────┘
       │
       ▼
    Response
```

---

## 🧮 PnL Calculation Flow

```
Trade Data:
├─ Entry Price: $65,000
├─ Exit Price: $67,000
├─ Quantity: 0.1 BTC
├─ Side: LONG
└─ Fees: $5

calculatePnL()
     │
     ▼
┌────────────────────────┐
│  Check Position Side   │
└────────┬───────────────┘
         │
    LONG │
         ▼
┌────────────────────────┐
│ pnl = (exitPrice -     │
│        entryPrice) ×   │
│        quantity        │
├────────────────────────┤
│ = (67000 - 65000) × 0.1│
│ = 2000 × 0.1           │
│ = $200                 │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Subtract Fees         │
├────────────────────────┤
│ pnl = 200 - 5          │
│     = $195             │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Calculate Percentage   │
├────────────────────────┤
│ % = (67000-65000)/65000│
│   = 2000/65000 × 100   │
│   = 3.08%              │
└────────┬───────────────┘
         │
         ▼
    Return Results
```

---

## 🔗 Component Integration

```
Dashboard Page
├── useState: trades, stats, loading
│
├── useEffect: fetchData()
│   ├── GET /api/trades/stats
│   └── GET /api/trades/active
│
├── Components:
│   │
│   ├── StatsWidget
│   │   ├── Total Profit: ${stats.totalProfit}
│   │   ├── Win Rate: {stats.winRate}%
│   │   └── Active: {stats.openTrades}
│   │
│   ├── ActiveTradesList
│   │   └── {trades.map(trade => (
│   │         <TradeCard
│   │           symbol={trade.symbol}
│   │           side={trade.side}
│   │           entry={trade.entryPrice}
│   │           pnl={trade.pnl}
│   │         />
│   │       ))}
│   │
│   └── TradeHistory
│       └── Closed trades table
│
└── Auto-refresh: setInterval(fetchData, 30000)
```

---

## 🎨 Data Flow Visualization

```
User starts bot
       │
       ▼
┌──────────────┐
│ Bot Instance │──────┐
│  (Running)   │      │
└──────────────┘      │
       │              │
       │ Analyzes     │
       ▼              │
┌──────────────┐      │
│ Market Data  │      │
│ (Binance API)│      │
└──────────────┘      │
       │              │
       │ Signal       │
       ▼              │
┌──────────────┐      │
│ Execute Buy  │      │
│ (Binance)    │      │
└──────────────┘      │
       │              │
       │ Success      │
       ▼              │
┌──────────────┐      │ botInstanceId
│ TradeManager │◀─────┘
│ createTrade()│
└──────────────┘
       │
       │ Saves to
       ▼
┌──────────────┐
│   MongoDB    │
│ Trade Record │
└──────────────┘
       │
       │ Queries
       ▼
┌──────────────┐
│  Dashboard   │
│  (Frontend)  │
└──────────────┘
```

---

## 📱 Mobile View Layout

```
┌─────────────────────┐
│     Dashboard       │
├─────────────────────┤
│                     │
│ 💰 Total Balance    │
│    $10,000.00       │
│                     │
├─────────────────────┤
│                     │
│ 📊 Statistics       │
│                     │
│ Active Trades: 2    │
│ Total Profit: +$1K  │
│ Win Rate: 66.67%    │
│                     │
├─────────────────────┤
│                     │
│ 📈 Active Trades    │
│                     │
│ ┌─────────────────┐ │
│ │ BTC/USDT LONG   │ │
│ │ Entry: $65,000  │ │
│ │ PnL: +$150 ✅   │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ ETH/USDT SHORT  │ │
│ │ Entry: $3,500   │ │
│ │ PnL: +$85 ✅    │ │
│ └─────────────────┘ │
│                     │
├─────────────────────┤
│ [Refresh] [Export]  │
└─────────────────────┘
```

---

**Architecture Completed ✅**
- Clear separation of concerns
- Scalable design
- Easy to test
- Well documented

