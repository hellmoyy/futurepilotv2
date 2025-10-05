# MongoDB Integration Guide

## Setup

### 1. Install Dependencies
```bash
npm install mongodb mongoose
```

### 2. Configure Environment Variables
Add your MongoDB connection string to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

## Database Models

### 1. User Model
User accounts and authentication.

**Schema:**
```typescript
{
  email: string (unique)
  name: string
  password: string (hashed)
  provider: string (default: 'credentials')
  image: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 2. Trading Strategy Model
AI-powered trading strategies.

**Schema:**
```typescript
{
  userId: ObjectId (ref: User)
  name: string
  description: string
  symbol: string (e.g., 'BTC/USDT')
  timeframe: string ('1m', '5m', '1h', '4h', '1d')
  type: 'long' | 'short' | 'both'
  indicators: Array<{name, params}>
  entryConditions: string
  exitConditions: string
  riskPercentage: number (0.1-10)
  stopLoss: number
  takeProfit: number
  isActive: boolean
  performance: {
    totalTrades: number
    winRate: number
    profitLoss: number
    lastExecuted: Date
  }
  createdAt: Date
  updatedAt: Date
}
```

### 3. Trade Model
Individual trade records.

**Schema:**
```typescript
{
  userId: ObjectId (ref: User)
  strategyId: ObjectId (ref: TradingStrategy)
  symbol: string
  type: 'buy' | 'sell'
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  quantity: number
  stopLoss: number
  takeProfit: number
  status: 'open' | 'closed' | 'cancelled'
  pnl: number (calculated)
  pnlPercentage: number (calculated)
  entryTime: Date
  exitTime: Date
  notes: string
  exchange: string (default: 'binance')
  fees: number
  createdAt: Date
  updatedAt: Date
}
```

### 4. Chat History Model
AI conversation history.

**Schema:**
```typescript
{
  userId: ObjectId (ref: User)
  sessionId: string (unique)
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  title: string (default: 'New Chat')
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### Database Test
Test MongoDB connection and list collections.

```
GET /api/db/test
```

**Response:**
```json
{
  "success": true,
  "status": "connected",
  "database": "futurepilot",
  "collections": ["users", "trades", "strategies", "chathistories"],
  "timestamp": "2025-10-05T12:00:00Z"
}
```

### Users API

**Get all users:**
```
GET /api/users
```

**Create user:**
```
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword"
}
```

### Trades API

**Get all trades:**
```
GET /api/trades?userId=xxx&status=open&symbol=BTCUSDT
```

**Create trade:**
```
POST /api/trades
Content-Type: application/json

{
  "userId": "user_id_here",
  "symbol": "BTC/USDT",
  "type": "buy",
  "side": "long",
  "entryPrice": 45000,
  "quantity": 0.1,
  "stopLoss": 44000,
  "takeProfit": 47000
}
```

**Get single trade:**
```
GET /api/trades/[id]
```

**Update trade:**
```
PUT /api/trades/[id]
Content-Type: application/json

{
  "exitPrice": 46000,
  "status": "closed"
}
```

**Delete trade:**
```
DELETE /api/trades/[id]
```

### Strategies API

**Get all strategies:**
```
GET /api/strategies?userId=xxx&isActive=true
```

**Create strategy:**
```
POST /api/strategies
Content-Type: application/json

{
  "userId": "user_id_here",
  "name": "BTC Momentum Strategy",
  "symbol": "BTC/USDT",
  "timeframe": "1h",
  "type": "both",
  "indicators": [
    { "name": "RSI", "params": { "period": 14 } },
    { "name": "MACD", "params": { "fast": 12, "slow": 26, "signal": 9 } }
  ],
  "entryConditions": "RSI < 30 AND MACD crosses above signal",
  "exitConditions": "RSI > 70 OR price hits take profit",
  "riskPercentage": 2,
  "stopLoss": 2,
  "takeProfit": 5,
  "isActive": true
}
```

## Database Connection

The connection utility (`src/lib/mongodb.ts`) implements:
- Connection pooling
- Automatic reconnection
- Connection caching (prevents multiple connections in development)
- Error handling

**Usage:**
```typescript
import connectDB from '@/lib/mongodb';

export async function GET() {
  await connectDB();
  // Use mongoose models here
}
```

## Dashboard

Visit `/dashboard` to:
- Check database connection status
- View all collections
- Monitor recent trades
- Manage trading activities

## Features

### Auto-calculated Fields
- **Trade PnL**: Automatically calculated on save when status is 'closed'
- **Trade PnL%**: Percentage profit/loss based on entry price

### Indexes
Optimized queries with indexes on:
- User email (unique)
- Trade userId + status
- Trade symbol + entryTime
- Strategy userId + symbol
- Chat History userId + createdAt

### Validation
All models include:
- Required field validation
- Type validation
- Min/max value constraints
- Enum validation for specific fields

## Best Practices

### 1. Connection Management
```typescript
// Always connect before database operations
await connectDB();
```

### 2. Error Handling
```typescript
try {
  await connectDB();
  const data = await Model.find();
  return NextResponse.json({ success: true, data });
} catch (error) {
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}
```

### 3. Populate References
```typescript
const trade = await Trade.findById(id)
  .populate('userId', 'name email')
  .populate('strategyId', 'name');
```

### 4. Query Building
```typescript
const query: any = {};
if (userId) query.userId = new mongoose.Types.ObjectId(userId);
if (status) query.status = status;

const trades = await Trade.find(query).sort({ entryTime: -1 });
```

## Security Notes

⚠️ **Important:**
- Never commit MongoDB credentials to Git
- Use environment variables for connection strings
- Hash passwords before storing (use bcrypt)
- Validate all user input
- Implement authentication middleware
- Use HTTPS in production
- Enable MongoDB IP whitelisting
- Regularly backup your database

## Performance Tips

1. **Use Indexes**: Add indexes for frequently queried fields
2. **Limit Results**: Use `.limit()` for large datasets
3. **Select Fields**: Use `.select()` to fetch only needed fields
4. **Lean Queries**: Use `.lean()` for read-only operations
5. **Connection Pooling**: Configure appropriate pool size

## Next Steps

1. ✅ MongoDB connected and tested
2. ✅ Models created (User, Trade, Strategy, ChatHistory)
3. ✅ API routes implemented
4. ✅ Dashboard page ready

**Future enhancements:**
- Add authentication middleware
- Implement user registration/login
- Add trade analytics and charts
- Create strategy backtest system
- Add real-time trade notifications
- Implement data export/import
- Add portfolio performance metrics
