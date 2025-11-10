# Balance Display Feature - Documentation

## Overview
Fitur untuk menampilkan real-time balance (saldo) dari akun exchange yang terkoneksi di FuturePilot.

## Features Implemented

### 1. **Automatic Balance Fetching**
- ✅ Balance otomatis di-fetch saat page load untuk semua Binance connections yang aktif
- ✅ Balance otomatis di-fetch setelah berhasil menambahkan connection baru
- ✅ Manual refresh button untuk update balance kapan saja

### 2. **Balance Display UI**
- 📊 Menampilkan balance untuk **Spot** dan **Futures** trading
- 💰 Format: `$XXX.XX` (2 decimal places)
- 🔄 Refresh button dengan loading animation
- ⚡ "Fetch Balance" button jika balance belum ada
- 🎨 Glassmorphism design dengan background `/5`

### 3. **Security**
- 🔒 API keys tetap encrypted di database
- 🔐 Decryption hanya di server-side
- ✅ Authentication required
- ✅ Ownership validation (userId match)

## File Structure

```
src/
├── app/
│   ├── dashboard/
│   │   └── settings/
│   │       └── page.tsx                    # Settings page with balance UI
│   └── api/
│       └── exchange/
│           └── connections/
│               └── [id]/
│                   └── balance/
│                       └── route.ts        # Balance API endpoint
├── lib/
│   ├── binance.ts                          # Binance API client
│   └── encryption.ts                       # AES-256 encryption utilities
└── models/
    └── ExchangeConnection.ts               # Database model with balances field

scripts/
└── clean-exchange-connections.js           # Cleanup script for corrupted data
```

## Database Schema

### ExchangeConnection Model
```typescript
interface IExchangeConnection {
  userId: ObjectId;
  exchange: 'binance' | 'bybit' | 'kucoin' | 'okx';
  apiKey: string;        // Encrypted with AES-256
  apiSecret: string;     // Encrypted with AES-256
  nickname?: string;
  isActive: boolean;
  permissions: {
    spot?: boolean;
    futures?: boolean;
  };
  balances?: {           // ✨ New field
    spot?: number;
    futures?: number;
  };
  lastConnected?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### GET `/api/exchange/connections/:id/balance`

**Purpose:** Fetch and update balance for a specific exchange connection

**Authentication:** Required (NextAuth session)

**Parameters:**
- `id` - Exchange connection ID (path parameter)

**Response Success (200):**
```json
{
  "balances": {
    "spot": 1234.56,
    "futures": 789.01
  }
}
```

**Response Errors:**
- `401` - Unauthorized (no session)
- `404` - Connection not found
- `400` - Exchange not supported (only Binance for now)
- `500` - Decryption error or API call failed

**Flow:**
1. Validate session
2. Find connection by ID and userId
3. Check if exchange is Binance
4. Decrypt API keys with error handling
5. Call Binance API to get balances
6. Sum all non-zero balances per account type
7. Update database with new balances
8. Return balances to frontend

## Frontend Implementation

### State Management
```typescript
const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
```

### Functions

#### `fetchConnections()`
```typescript
const fetchConnections = async () => {
  // Fetch all connections
  const connections = await fetch('/api/exchange/connections');
  
  // Auto-fetch balance for active Binance connections
  connections.forEach((conn) => {
    if (conn.isActive && conn.exchange === 'binance') {
      refreshBalance(conn._id);
    }
  });
};
```

#### `refreshBalance(connectionId: string)`
```typescript
const refreshBalance = async (connectionId: string) => {
  setLoadingBalances(prev => ({ ...prev, [connectionId]: true }));
  
  const response = await fetch(`/api/exchange/connections/${connectionId}/balance`);
  const data = await response.json();
  
  if (response.ok && data.balances) {
    // Update connection with new balances
    setConnections(prev => 
      prev.map(conn => 
        conn._id === connectionId 
          ? { ...conn, balances: data.balances }
          : conn
      )
    );
  }
  
  setLoadingBalances(prev => ({ ...prev, [connectionId]: false }));
};
```

### UI Components

#### Balance Display with Data
```tsx
{connection.balances && (
  <div className="mb-4 bg-white/5 rounded-lg p-3">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-gray-500">Account Balance:</p>
      <button onClick={() => refreshBalance(connection._id)}>
        🔄 Refresh
      </button>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {connection.permissions.spot && (
        <div>
          <p className="text-xs text-gray-400">Spot</p>
          <p className="text-sm font-semibold text-white">
            ${(connection.balances.spot || 0).toFixed(2)}
          </p>
        </div>
      )}
      {connection.permissions.futures && (
        <div>
          <p className="text-xs text-gray-400">Futures</p>
          <p className="text-sm font-semibold text-white">
            ${(connection.balances.futures || 0).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  </div>
)}
```

#### Balance Display without Data
```tsx
{!connection.balances && (
  <div className="text-center py-2">
    <p className="text-xs text-gray-400 mb-2">No balance data yet</p>
    <button
      onClick={() => refreshBalance(connection._id)}
      disabled={loadingBalances[connection._id]}
    >
      {loadingBalances[connection._id] ? 'Fetching...' : 'Fetch Balance'}
    </button>
  </div>
)}
```

## Binance API Integration

### BinanceClient Methods Used

```typescript
class BinanceClient {
  async getAccountBalances(): Promise<any> {
    // Calls GET /api/v3/account
    // Returns only non-zero balances
    // Filters: balance.free > 0 || balance.locked > 0
  }
}
```

### Balance Calculation
```typescript
// Spot Balance: Sum of all assets (free + locked)
const spotBalance = spotBalances.reduce((total: number, balance: any) => {
  return total + parseFloat(balance.free) + parseFloat(balance.locked);
}, 0);

// Futures Balance: Currently returns 0
// TODO: Implement Binance Futures API client
```

## Error Handling

### Decryption Errors
```typescript
try {
  decryptedApiKey = decryptApiKey(connection.apiKey);
} catch (decryptError) {
  return NextResponse.json({
    error: 'Failed to decrypt API credentials. Please reconnect your exchange.',
    details: decryptError.message
  }, { status: 500 });
}
```

### Solution for Corrupted Data
```bash
# Run cleanup script to remove old connections
node scripts/clean-exchange-connections.js
```

## Usage Flow

### For Users:

1. **Add Exchange Connection**
   ```
   Settings → Add Exchange → Enter API Keys → Save
   ↓
   Auto-fetch balance starts
   ↓
   Balance displayed in connection card
   ```

2. **Refresh Balance Manually**
   ```
   Click "🔄 Refresh" button
   ↓
   Loading animation shows
   ↓
   Updated balance displayed
   ```

3. **First Time Fetch**
   ```
   Connection without balance shows "Fetch Balance" button
   ↓
   Click button
   ↓
   Balance fetched and saved
   ```

## Testing

### Test Scenarios:

1. ✅ **Add new Binance connection**
   - Balance should auto-fetch after successful save
   - Should display Spot and/or Futures based on permissions

2. ✅ **Refresh existing balance**
   - Click refresh button
   - Should show loading state
   - Should update with new balance

3. ✅ **Page reload**
   - All active Binance connections should auto-fetch balance
   - Multiple connections should fetch in parallel

4. ✅ **Error handling**
   - Invalid API keys → Error shown, balance not displayed
   - Network error → Console error, balance remains unchanged
   - Decryption error → User-friendly error message

## Limitations & Future Improvements

### Current Limitations:
- ❌ Futures balance always shows $0.00 (needs separate Futures API client)
- ❌ Only Binance supported (Bybit, KuCoin, OKX coming soon)
- ❌ No balance conversion to common currency (shows sum of all assets)
- ❌ No historical balance tracking

### Planned Improvements:
- 🔮 Implement Binance Futures API client
- 🔮 Add balance conversion to USDT equivalent
- 🔮 Support for other exchanges (Bybit, KuCoin, OKX)
- 🔮 Balance history chart
- 🔮 Auto-refresh every X minutes
- 🔮 WebSocket real-time balance updates
- 🔮 Breakdown by asset (BTC: X, ETH: Y, etc.)

## Troubleshooting

### Issue: Balance not showing

**Solution 1:** Click "Fetch Balance" button manually

**Solution 2:** Check console for errors
```javascript
// Common errors:
- "Failed to decrypt API credentials" → Run cleanup script
- "Invalid API key" → Reconnect with valid keys
- "Balance fetching only supported for Binance" → Other exchanges not ready yet
```

**Solution 3:** Clean and reconnect
```bash
# Remove corrupted connections
node scripts/clean-exchange-connections.js

# Then reconnect in UI
```

### Issue: Decryption error

**Cause:** Old data encrypted with different key or not encrypted properly

**Solution:**
```bash
node scripts/clean-exchange-connections.js
```

Then add connection again with valid API keys.

## Security Best Practices

1. ✅ Never log decrypted API keys
2. ✅ Always decrypt on server-side only
3. ✅ Validate user ownership before operations
4. ✅ Use environment variable for encryption key
5. ✅ Don't send API keys to frontend
6. ✅ Implement rate limiting for balance fetching (TODO)

## Environment Variables

```bash
# Required for encryption/decryption
ENCRYPTION_SECRET_KEY=your-32-character-secret-key-here

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/futurepilotdb

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## Dependencies

```json
{
  "crypto-js": "^4.2.0",     // AES-256 encryption
  "mongoose": "^8.0.0",       // MongoDB ODM
  "next-auth": "^4.24.0"      // Authentication
}
```

---

**Created:** October 6, 2025  
**Last Updated:** October 6, 2025  
**Version:** 1.0.0  
**Author:** FuturePilot Team
