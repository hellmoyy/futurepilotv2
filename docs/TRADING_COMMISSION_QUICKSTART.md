# Trading Commission - Quick Integration Guide

## 🚀 3-Step Bot Integration

### Step 1: Import Hooks

```typescript
import { beforeTrade, onProfitUpdate, afterTrade } from '@/lib/trading/hooks';
```

### Step 2: Check Before Trading

```typescript
const { allowed, reason, autoCloseThreshold } = await beforeTrade(userId);
if (!allowed) {
  throw new Error(reason); // "Insufficient gas fee balance. Minimum 10 USDT required."
}
```

### Step 3: Monitor & Deduct Commission

```typescript
// During position (every 5 sec)
const { shouldClose } = await onProfitUpdate(userId, currentProfit);
if (shouldClose) {
  closePosition();
}

// After closing
const { success, commission } = await afterTrade(userId, profitOrLoss, positionId);
```

---

## 📊 Business Rules

| Rule | Value | Note |
|------|-------|------|
| **Minimum Gas Fee** | $10 USDT | User cannot trade below this |
| **Commission Rate** | 20% (default) | Configurable by admin in Settings |
| **Auto-Close Trigger** | 90% of max profit | Prevents negative balance |
| **Max Profit Formula** | `gasFee / commissionRate` | Example: $10 / 0.20 = $50 |
| **Admin Settings** | `/administrator/settings` | Trading Commission tab |

---

## 🧮 Example Calculations

### Scenario 1: User with $10 Gas Fee
```
Gas Fee: $10
Commission Rate: 20%
Max Profit = $10 / 0.20 = $50
Auto-Close Threshold = $50 × 0.90 = $45

If profit reaches $45 → Auto-close triggered
If closed at $30 profit → Commission: $30 × 20% = $6
Remaining Gas Fee: $10 - $6 = $4 (⚠️ Cannot trade, need topup)
```

### Scenario 2: User with $50 Gas Fee
```
Gas Fee: $50
Max Profit = $50 / 0.20 = $250
Auto-Close Threshold = $225

Profit $200 → Commission $40 → Remaining $10 (✅ Can still trade)
Profit $100 → Commission $20 → Remaining $30 (✅ Can still trade)
```

---

## 🔧 API Quick Reference

### Check if user can trade:
```bash
GET /api/trading/commission?userId=XXX&action=check
```

### Get max profit limits:
```bash
GET /api/trading/commission?userId=XXX&action=max-profit
```

### Check auto-close:
```bash
GET /api/trading/commission?userId=XXX&action=auto-close&profit=100
```

### Deduct commission:
```bash
POST /api/trading/commission
Body: { userId, profit, positionId }
```

### Get commission history:
```bash
GET /api/trading/commission?userId=XXX&action=summary
```

---

## ⚠️ Important Notes

✅ **Always call beforeTrade()** before opening position  
✅ **Check onProfitUpdate()** every 5 seconds during open position  
✅ **Always call afterTrade()** even for losing trades (no commission for losses)  
✅ **Handle errors gracefully** - don't let commission failure stop trading  
✅ **Log everything** for debugging and auditing

❌ **Don't skip beforeTrade()** - user might have insufficient gas fee  
❌ **Don't forget onProfitUpdate()** - auto-close prevents negative balance  
❌ **Don't throw errors in afterTrade()** - log and continue

---

## 📂 File Locations

- Core Library: `/src/lib/tradingCommission.ts`
- Trading Hooks: `/src/lib/trading/hooks.ts`
- API Endpoint: `/src/app/api/trading/commission/route.ts`
- Full Documentation: `/docs/TRADING_COMMISSION_SYSTEM.md`

---

**Status:** ✅ Infrastructure Complete - Ready for Integration  
**Last Updated:** January 25, 2025
