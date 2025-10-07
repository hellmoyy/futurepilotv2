# Cron Job Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         UPSTASH CRON                            │
│                    (Every 5 minutes)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP GET + Authorization Header
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   /api/cron/run-bots                            │
│                   (Next.js API Route)                           │
│                                                                  │
│  1. Verify CRON_SECRET                                          │
│  2. Connect to MongoDB                                          │
│  3. Fetch all ACTIVE bots                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FOR EACH BOT                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Bot #1      │   │  Bot #2      │   │  Bot #3      │
│  Bitcoin Pro │   │  Bitcoin Pro │   │  Safe Trader │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TRADING ENGINE EXECUTION                        │
│                                                                  │
│  1. Get Exchange Connection                                     │
│  2. Decrypt API Credentials                                     │
│  3. Initialize Strategy (BitcoinProStrategy)                    │
│  4. Execute Trading Cycle:                                      │
│     ├─ Check Safety Limits (Daily Loss, Position Size)         │
│     ├─ Get Current Position                                     │
│     ├─ If NO Position:                                          │
│     │  ├─ Fetch Market Data (Candlesticks)                     │
│     │  ├─ Calculate Technical Indicators (RSI, MACD, EMA)      │
│     │  ├─ Analyze Trend                                         │
│     │  ├─ Get AI Confirmation (GPT-4)                          │
│     │  ├─ Generate Signal (BUY/SELL/HOLD)                      │
│     │  └─ Execute Order (if confidence > 70%)                  │
│     └─ If HAS Position:                                         │
│        └─ Monitor & Return Status                               │
│  5. Log Analysis to Database                                    │
│  6. Update Bot Instance:                                        │
│     ├─ lastAnalysis                                             │
│     ├─ currentPosition                                          │
│     ├─ statistics                                               │
│     └─ lastError (if any)                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RESPONSE                                  │
│                                                                  │
│  {                                                               │
│    "success": true,                                             │
│    "timestamp": "2025-10-07T12:00:00Z",                        │
│    "summary": {                                                 │
│      "totalBots": 3,                                            │
│      "successful": 3,                                           │
│      "failed": 0,                                               │
│      "withPositions": 1                                         │
│    },                                                           │
│    "results": [...]                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│   Upstash    │
│     Cron     │
└──────┬───────┘
       │
       │ Every 5 minutes
       │
       ▼
┌──────────────────────────────┐
│  Authorization Check         │
│  CRON_SECRET validation      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Database Query              │
│  Find active bots            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Bot Processing Loop         │
│  - Decrypt credentials       │
│  - Initialize strategy       │
│  - Execute trading cycle     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Market Analysis             │
│  - Fetch candles from Binance│
│  - Calculate indicators      │
│  - AI analysis (OpenAI)      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Signal Generation           │
│  BUY / SELL / HOLD           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Safety Checks               │
│  - Daily loss limit          │
│  - Position size limit       │
│  - Consecutive losses        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Order Execution             │
│  (if signal is strong)       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Database Update             │
│  - Bot instance              │
│  - Trade log                 │
│  - Statistics                │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Response to Upstash         │
│  Success/Failure summary     │
└──────────────────────────────┘
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Request from Upstash                          │
│  GET /api/cron/run-bots                                         │
│  Headers:                                                        │
│    Authorization: Bearer <CRON_SECRET>                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Verify Secret  │
                    │ Match?         │
                    └───┬────────┬───┘
                        │        │
                   Yes  │        │  No
                        │        │
                        ▼        ▼
              ┌──────────────┐  ┌──────────────┐
              │  Continue    │  │  Return 401  │
              │  Processing  │  │  Unauthorized│
              └──────────────┘  └──────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        BotInstance                               │
├─────────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                                  │
│  userId: ObjectId                                               │
│  botId: Number (1-4)                                            │
│  botName: String                                                │
│  symbol: String (BTCUSDT)                                       │
│  status: ACTIVE | STOPPED | ERROR | PAUSED                     │
│  config: {                                                      │
│    leverage: 10                                                 │
│    stopLossPercent: 3                                           │
│    takeProfitPercent: 6                                         │
│    positionSizePercent: 10                                      │
│    maxDailyLoss: 100                                            │
│  }                                                               │
│  currentPosition: {                                             │
│    symbol, side, entryPrice, quantity,                          │
│    leverage, stopLoss, takeProfit,                              │
│    pnl, pnlPercent, openTime                                    │
│  }                                                               │
│  lastAnalysis: {                                                │
│    timestamp: Date                                              │
│    signal: { action, confidence, reason }                       │
│  }                                                               │
│  statistics: {                                                  │
│    totalTrades, winningTrades, losingTrades,                    │
│    totalProfit, totalLoss, winRate, avgProfit                   │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          TradeLog                                │
├─────────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                                  │
│  userId: ObjectId                                               │
│  botInstanceId: ObjectId                                        │
│  logType: TRADE | ERROR | ANALYSIS | SAFETY | SYSTEM           │
│  severity: INFO | WARNING | ERROR | CRITICAL                    │
│  action: String                                                 │
│  message: String                                                │
│  data: Object (signal details, indicators, etc.)                │
│  createdAt: Date                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Timing Diagram

```
Time      Upstash      API           Database       Binance       OpenAI
─────────────────────────────────────────────────────────────────────────
12:00     │                                                              
          │ GET /api/cron/run-bots                                      
          ├──────────>│                                                 
          │           │ Verify auth                                     
          │           │                                                  
          │           │ Query bots                                      
          │           ├──────────>│                                     
          │           │<──────────┤ Active bots                         
          │           │                                                  
12:00:01  │           │ For each bot:                                   
          │           │                                                  
          │           │   Get candles                                   
          │           ├─────────────────────>│                          
          │           │<─────────────────────┤ Market data              
          │           │                                                  
          │           │   Calculate indicators                          
          │           │   (RSI, MACD, EMA)                             
          │           │                                                  
12:00:02  │           │   AI analysis                                   
          │           ├───────────────────────────────────>│            
          │           │<───────────────────────────────────┤ Confirmation
          │           │                                                  
          │           │   Execute trade (if signal)                     
          │           ├─────────────────────>│                          
          │           │<─────────────────────┤ Order filled             
          │           │                                                  
12:00:03  │           │   Update DB                                     
          │           ├──────────>│                                     
          │           │<──────────┤ Success                             
          │           │                                                  
          │<──────────┤ Response                                        
          │  200 OK   │                                                  
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Scenarios                             │
└─────────────────────────────────────────────────────────────────┘

1. Invalid CRON_SECRET
   └─> Return 401 Unauthorized immediately

2. No Active Bots
   └─> Return 200 with "No active bots" message

3. Exchange Connection Error
   ├─> Skip bot
   ├─> Log error to database
   └─> Continue with next bot

4. API Rate Limit (Binance)
   ├─> Log warning
   ├─> Skip current cycle
   └─> Will retry next cycle

5. Daily Loss Limit Exceeded
   ├─> Emergency stop bot
   ├─> Set status to PAUSED
   ├─> Log CRITICAL severity
   └─> Continue with next bot

6. OpenAI API Error
   ├─> Fall back to technical indicators only
   ├─> Log warning
   └─> Continue with reduced confidence

7. Order Execution Failure
   ├─> Log error with details
   ├─> Don't update position
   └─> Retry next cycle
```

## Monitoring Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    What to Monitor                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Upstash Console                                             │
│     - Success rate                                              │
│     - Response time                                             │
│     - Failed requests                                           │
│                                                                  │
│  2. Database (TradeLog collection)                              │
│     - Number of ANALYSIS entries                                │
│     - ERROR severity logs                                       │
│     - CRITICAL safety triggers                                  │
│                                                                  │
│  3. BotInstance collection                                      │
│     - Bot status (ACTIVE vs PAUSED)                            │
│     - Current positions                                         │
│     - Daily P&L                                                 │
│                                                                  │
│  4. Application Logs                                            │
│     - Cron execution logs                                       │
│     - Trading engine errors                                     │
│     - API rate limits                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Optimization Tips                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Parallel Processing                                         │
│     - Process bots in parallel (Promise.all)                    │
│     - Reduces total execution time                              │
│                                                                  │
│  2. Cache Market Data                                           │
│     - Cache candles for 1 minute                                │
│     - Reuse for multiple bots on same symbol                    │
│                                                                  │
│  3. Batch Database Operations                                   │
│     - Use bulkWrite for multiple updates                        │
│     - Reduces database round trips                              │
│                                                                  │
│  4. Timeout Handling                                            │
│     - Set 270s timeout (Upstash max is 300s)                   │
│     - Early exit if approaching limit                           │
│                                                                  │
│  5. Rate Limit Management                                       │
│     - Track Binance API calls                                   │
│     - Distribute calls across time                              │
│     - Use weight-based tracking                                 │
└─────────────────────────────────────────────────────────────────┘
```
