# Trading Commission System - Complete Implementation

## 🎯 Overview

The Trading Commission System automatically deducts 20% (configurable) of trading profits from users' gas fee balance. It also prevents the gas fee balance from going negative by auto-closing positions when profit approaches the maximum allowable limit.

**Status:** ✅ Infrastructure Complete (Ready for Bot Integration)

---

## 📋 System Requirements

### Business Rules:
1. **Minimum Gas Fee:** Users must have ≥ $10 USDT to trade
2. **Commission Rate:** 20% of profit (default, configurable by admin in Settings)
3. **Auto-Close:** Trigger when profit reaches 90% of max allowable
4. **Loss Protection:** No commission deducted on losing trades
5. **Balance Protection:** System prevents gas fee from going negative
6. **Admin Control:** Commission rate can be changed at `/administrator/settings` → Trading Commission tab

### Example Calculation:
```
User has $10 gas fee balance
Commission rate: 20%
Max profit = $10 / 0.20 = $50
Auto-close threshold = $50 × 0.90 = $45

Scenario 1: Profit reaches $45 → Auto-close triggered
Scenario 2: Position closed at $30 profit → Commission: $30 × 20% = $6
Scenario 3: Loss of $20 → No commission deducted
```

---

## 🏗️ Architecture

### Core Components:

1. **Trading Commission Library** (`/src/lib/tradingCommission.ts`)
   - `canUserTrade()` - Check if user has minimum gas fee
   - `calculateMaxProfit()` - Calculate profit limits
   - `shouldAutoClose()` - Check if auto-close needed
   - `deductTradingCommission()` - Deduct commission from gas fee
   - `getTradingCommissionSummary()` - Get user's commission history

2. **Trading Hooks** (`/src/lib/trading/hooks.ts`)
   - `beforeTrade()` - Call before opening position
   - `onProfitUpdate()` - Call during open position (periodic check)
   - `afterTrade()` - Call after closing position

3. **API Endpoint** (`/src/app/api/trading/commission/route.ts`)
   - `POST /api/trading/commission` - Deduct commission
   - `GET /api/trading/commission?action=check` - Check eligibility
   - `GET /api/trading/commission?action=max-profit` - Get profit limits
   - `GET /api/trading/commission?action=summary` - Get commission history
   - `GET /api/trading/commission?action=auto-close&profit=X` - Check auto-close

4. **Transaction Model** (`/src/models/Transaction.ts`)
   - Type: `'trading_commission'`
   - Metadata: `{ profit, commissionRate, positionId, closedAt }`

---

## 🔌 Bot Integration Guide

### Step 1: Before Opening Position

```typescript
import { beforeTrade } from '@/lib/trading/hooks';

async function openPosition(userId: string, symbol: string) {
  // Check if user can trade
  const { allowed, reason, maxProfit, autoCloseThreshold } = await beforeTrade(userId);
  
  if (!allowed) {
    throw new Error(`Cannot trade: ${reason}`);
    // Example: "Insufficient gas fee balance. Minimum 10 USDT required."
  }
  
  console.log(`✅ User can trade`);
  console.log(`📊 Max profit before auto-close: $${maxProfit.toFixed(2)}`);
  console.log(`⚠️ Auto-close threshold: $${autoCloseThreshold.toFixed(2)}`);
  
  // Open position...
  const position = await exchange.openPosition(symbol, leverage, amount);
  
  return { position, maxProfit, autoCloseThreshold };
}
```

### Step 2: During Open Position (Monitor)

```typescript
import { onProfitUpdate } from '@/lib/trading/hooks';

async function monitorPosition(userId: string, position: Position) {
  // Check every 5 seconds (or on price update)
  const interval = setInterval(async () => {
    const currentProfit = calculateProfit(position);
    
    // Check if should auto-close
    const { shouldClose, reason, threshold } = await onProfitUpdate(userId, currentProfit);
    
    if (shouldClose) {
      console.log(`🛑 Auto-closing position: ${reason}`);
      clearInterval(interval);
      
      // Close position
      await exchange.closePosition(position.id);
      
      // Deduct commission (see Step 3)
      await handlePositionClose(userId, position.id, currentProfit);
    }
  }, 5000);
}
```

### Step 3: After Closing Position

```typescript
import { afterTrade } from '@/lib/trading/hooks';

async function handlePositionClose(userId: string, positionId: string, profitOrLoss: number) {
  console.log(`📊 Position closed. P&L: $${profitOrLoss.toFixed(2)}`);
  
  // Deduct commission (only for profits)
  const { success, commission, remainingBalance, error } = await afterTrade(
    userId,
    profitOrLoss,
    positionId
  );
  
  if (success && commission! > 0) {
    console.log(`💰 Commission deducted: $${commission!.toFixed(2)}`);
    console.log(`💳 Remaining gas fee: $${remainingBalance!.toFixed(2)}`);
    
    // Check if user can still trade
    if (remainingBalance! < 10) {
      console.log(`⚠️ Warning: Gas fee below minimum ($10). User cannot trade until topup.`);
      // Optionally: Send notification to user
    }
  } else if (!success) {
    console.error(`❌ Failed to deduct commission: ${error}`);
    // Log error but don't block the trade completion
  } else {
    console.log(`ℹ️ No commission (loss or breakeven trade)`);
  }
}
```

### Complete Trading Flow Example:

```typescript
import { beforeTrade, onProfitUpdate, afterTrade } from '@/lib/trading/hooks';

async function executeTradingStrategy(userId: string) {
  try {
    // 1. PRE-TRADE: Check eligibility
    const { allowed, reason, autoCloseThreshold } = await beforeTrade(userId);
    if (!allowed) {
      throw new Error(reason);
    }
    
    // 2. OPEN: Create position
    const position = await openBinancePosition('BTCUSDT', 10, 1000);
    console.log(`✅ Position opened: ${position.id}`);
    
    // 3. MONITOR: Check auto-close periodically
    let isClosed = false;
    const monitorInterval = setInterval(async () => {
      if (isClosed) {
        clearInterval(monitorInterval);
        return;
      }
      
      const profit = await getPositionProfit(position.id);
      const { shouldClose, reason } = await onProfitUpdate(userId, profit);
      
      if (shouldClose) {
        console.log(`🛑 ${reason}`);
        isClosed = true;
        clearInterval(monitorInterval);
        
        // Close position
        await closeBinancePosition(position.id);
        
        // 4. POST-TRADE: Deduct commission
        const { success, commission } = await afterTrade(userId, profit, position.id);
        if (success) {
          console.log(`✅ Trade completed. Commission: $${commission}`);
        }
      }
    }, 5000);
    
    // Alternative: Strategy-based exit
    // When your strategy signals exit, do the same afterTrade() call
    
  } catch (error) {
    console.error('Trading error:', error);
    throw error;
  }
}
```

---

## 🔧 API Usage Examples

### Check Trading Eligibility:

```bash
# Check if user can trade
curl "https://yourapp.com/api/trading/commission?userId=USER_ID&action=check"

# Response:
{
  "success": true,
  "data": {
    "canTrade": true,
    "gasFeeBalance": 50.00,
    "reason": null
  }
}
```

### Get Max Profit Limits:

```bash
curl "https://yourapp.com/api/trading/commission?userId=USER_ID&action=max-profit"

# Response:
{
  "success": true,
  "data": {
    "maxProfit": 250.00,      # Max profit before balance = 0
    "autoCloseThreshold": 225.00,  # 90% safety margin
    "gasFeeBalance": 50.00,
    "commissionRate": 20
  }
}
```

### Check Auto-Close:

```bash
curl "https://yourapp.com/api/trading/commission?userId=USER_ID&action=auto-close&profit=200"

# Response:
{
  "success": true,
  "data": {
    "shouldClose": false,
    "maxProfit": 250.00,
    "threshold": 225.00
  }
}
```

### Deduct Commission (POST):

```bash
curl -X POST "https://yourapp.com/api/trading/commission" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "profit": 100.00,
    "positionId": "BTC_POS_123",
    "notes": "Closed position at +100 USDT profit"
  }'

# Response:
{
  "success": true,
  "data": {
    "commission": 20.00,        # 20% of $100
    "remainingBalance": 30.00,  # $50 - $20
    "transactionId": "..."
  }
}
```

### Get Commission Summary:

```bash
curl "https://yourapp.com/api/trading/commission?userId=USER_ID&action=summary"

# Response:
{
  "success": true,
  "data": {
    "totalCommissionPaid": 150.00,
    "totalProfits": 750.00,
    "averageCommissionRate": 20,
    "transactionCount": 12,
    "transactions": [
      {
        "id": "...",
        "profit": 100.00,
        "commission": 20.00,
        "rate": 20,
        "positionId": "BTC_POS_123",
        "date": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## 📊 Database Records

### Transaction Record Example:

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  type: "trading_commission",
  network: "ERC20",  // Placeholder, not relevant
  txHash: "TRADING_COMMISSION_1737789123_USER_ID",
  amount: 20.00,  // Commission amount
  status: "confirmed",
  walletAddress: "0x...",
  tradingMetadata: {
    profit: 100.00,          // Original profit
    commissionRate: 20,      // Rate used
    positionId: "BTC_POS_123",
    closedAt: ISODate("2025-01-15T10:30:00Z")
  },
  createdAt: ISODate("2025-01-15T10:30:05Z"),
  updatedAt: ISODate("2025-01-15T10:30:05Z")
}
```

### Query Examples:

```javascript
// Get all trading commissions for a user
db.transactions.find({
  userId: ObjectId("USER_ID"),
  type: "trading_commission",
  status: "confirmed"
});

// Calculate total commission paid by user
db.transactions.aggregate([
  { $match: { userId: ObjectId("USER_ID"), type: "trading_commission", status: "confirmed" }},
  { $group: { _id: null, total: { $sum: "$amount" }}}
]);

// Get commission stats by date range
db.transactions.aggregate([
  { $match: { 
    type: "trading_commission", 
    status: "confirmed",
    createdAt: { $gte: ISODate("2025-01-01"), $lte: ISODate("2025-01-31") }
  }},
  { $group: {
    _id: null,
    totalCommission: { $sum: "$amount" },
    totalProfit: { $sum: "$tradingMetadata.profit" },
    count: { $sum: 1 }
  }}
]);
```

---

## 🧪 Testing Checklist

### Manual Testing:

- [ ] **Test 1: Minimum Gas Fee Check**
  - User with $5 gas fee → Cannot trade
  - User with $10 gas fee → Can trade
  - User with $0 gas fee → Cannot trade

- [ ] **Test 2: Auto-Close Trigger**
  - Gas fee: $10, Max profit: $50, Threshold: $45
  - Position reaches $40 profit → No auto-close
  - Position reaches $45 profit → Auto-close triggered
  - Position reaches $50 profit → Auto-close triggered

- [ ] **Test 3: Commission Deduction**
  - Close with $100 profit → $20 commission deducted
  - Close with -$50 loss → $0 commission deducted
  - Close at breakeven → $0 commission deducted

- [ ] **Test 4: Balance Updates**
  - Start: $50 gas fee
  - Profit: $100 → Commission: $20
  - End: $30 gas fee (verified in database)

- [ ] **Test 5: Multiple Trades**
  - Trade 1: +$50 profit → -$10 commission → $40 remaining
  - Trade 2: +$30 profit → -$6 commission → $34 remaining
  - Trade 3: -$20 loss → $0 commission → $34 remaining
  - Trade 4: +$100 profit → -$20 commission → $14 remaining

- [ ] **Test 6: Low Balance Warning**
  - User with $12 gas fee makes $10 profit
  - Commission: $2 → Balance: $10
  - Should allow one more trade but show warning

- [ ] **Test 7: Transaction Records**
  - Verify all commissions recorded in `transactions` collection
  - Verify `tradingMetadata` fields populated correctly
  - Verify transaction type = 'trading_commission'

### Automated Testing (TODO):

```typescript
// TODO: Create test suite in /tests/tradingCommission.test.ts
describe('Trading Commission System', () => {
  test('prevents trading with insufficient gas fee', async () => {});
  test('calculates max profit correctly', async () => {});
  test('triggers auto-close at threshold', async () => {});
  test('deducts commission for profitable trades', async () => {});
  test('skips commission for losing trades', async () => {});
  test('creates correct transaction records', async () => {});
});
```

---

## ⚠️ Important Notes

### For Bot Developers:

1. **Always call beforeTrade()** before opening any position
2. **Periodically call onProfitUpdate()** during open positions (recommended: every 5 seconds)
3. **Always call afterTrade()** after closing positions (even for losses)
4. **Handle errors gracefully** - commission failure shouldn't break trading flow
5. **Log all commission operations** for debugging and auditing

### Edge Cases Handled:

✅ User has exactly $10 gas fee → Can trade once
✅ Profit exceeds max allowable → Auto-close prevents negative balance
✅ Multiple concurrent positions → Each checked independently
✅ Commission deduction fails → Returns error but doesn't throw
✅ Loss trades → No commission deducted
✅ Breakeven trades ($0 profit) → No commission deducted

### Not Implemented Yet (Future Enhancements):

❌ Admin dashboard for viewing all trading commissions (see todo #6)
❌ User dashboard showing commission history (see todo #7)
❌ Real-time notifications for auto-close events
❌ Email alerts for low gas fee balance
❌ Trading commission analytics/charts
❌ Automated tests

---

## 📚 File Reference

| File | Purpose | Status |
|------|---------|--------|
| `/src/lib/tradingCommission.ts` | Core commission logic | ✅ Complete |
| `/src/lib/trading/hooks.ts` | Bot integration interface | ✅ Complete |
| `/src/app/api/trading/commission/route.ts` | HTTP API endpoint | ✅ Complete |
| `/src/models/Transaction.ts` | Transaction schema (updated) | ✅ Complete |
| `/src/models/Settings.ts` | Commission rate config | ✅ Exists |
| `/docs/TRADING_COMMISSION_SYSTEM.md` | This documentation | ✅ Complete |

---

## 🚀 Next Steps

1. **Integrate with Trading Bot:**
   - Import hooks in bot code
   - Add beforeTrade() calls before opening positions
   - Add onProfitUpdate() calls in monitoring loop
   - Add afterTrade() calls after closing positions

2. **Build Admin Dashboard:**
   - Page: `/administrator/trading-commissions`
   - Show: Total revenue, commission by user, date range filter
   - Export: CSV/PDF reports

3. **Build User Dashboard:**
   - Section in `/dashboard` or `/profile`
   - Show: Total commission paid, trading limits, recent commissions
   - Charts: Commission over time

4. **Add Notifications:**
   - Auto-close triggered → Toast notification
   - Gas fee < $10 → Email + dashboard alert
   - Commission deducted → Transaction notification

5. **Testing:**
   - Write automated tests
   - Run manual test suite
   - Test with real Binance testnet

---

## 🐛 Troubleshooting

### "Cannot trade: Insufficient gas fee balance"
**Cause:** User has < $10 USDT gas fee
**Solution:** User needs to topup gas fee balance

### Commission deduction failed
**Cause:** Race condition or database error
**Solution:** Check transaction logs, retry deduction manually via admin panel

### Auto-close not triggering
**Cause:** onProfitUpdate() not being called periodically
**Solution:** Verify bot's monitoring loop is calling the hook every 5 seconds

### Balance mismatch
**Cause:** Commission not deducted or deducted twice
**Solution:** Run balance reconciliation script (similar to `/scripts/check-balance-discrepancy.js`)

---

**Implementation Date:** January 25, 2025  
**Status:** ✅ Infrastructure Complete - Ready for Bot Integration  
**Next Milestone:** Admin Dashboard + User Dashboard
