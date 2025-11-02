# Trading Commission Admin Configuration Guide

## 📍 How to Configure Trading Commission Rate

### Step 1: Navigate to Settings
Go to: **http://localhost:3000/administrator/settings**

### Step 2: Select Trading Commission Tab
Click on the "**📈 Trading Commission**" tab in the settings page

### Step 3: Adjust Commission Rate
You'll see:
- **Trading Commission Rate (%)** input field
- Current value (default: **20%**)
- Min: 0%, Max: 100%
- Step: 0.5% increments

### Step 4: View Live Example Calculation
The page shows real-time calculation:
```
Example Calculation:
• User makes $1,000 profit from trading bot
• Platform commission (20%): $200.00
• User keeps: $800.00
```

### Step 5: Review Business Logic Info
Two important info boxes explain:

**⚠️ Note:**
- Commission is automatically deducted from user's **gas fee balance**
- Only applies to **profitable trades**
- No commission on losing trades

**💡 Business Logic:**
- Commission deducted from **gas fee balance**, not trading account
- User must maintain **minimum $10 USDT gas fee** to continue trading
- Auto-close triggers at **90% of max profit** to prevent negative balance

**🛡️ Gas Fee Balance Protection:**
- **Minimum Gas Fee:** $10 USDT (users cannot trade below this)
- **Max Profit Formula:** Gas Fee ÷ Commission Rate
- **Auto-Close Threshold:** 90% of max profit
- **Example:** If user has $50 gas fee with 20% rate:
  - Max profit = $50 ÷ 0.20 = $250
  - Auto-close triggers at $225 profit

### Step 6: Save Changes
Click "**💾 Save Settings**" button at the bottom

---

## 🎯 Recommended Settings

| Scenario | Recommended Rate | Reason |
|----------|------------------|--------|
| **Competitive Market** | 10-15% | Attract more users |
| **Balanced (Default)** | 20% | Fair for both platform and users |
| **Premium Service** | 25-30% | High-value features |
| **Conservative** | 5-10% | Build user base first |

---

## 💡 Important Notes

1. **Default Value:** 20% (set in Settings model)
2. **Dynamic:** Rate is fetched from database, not hardcoded
3. **Applied Immediately:** Changes affect all new trades
4. **Historical Trades:** Existing commission records retain their original rate
5. **Transaction Record:** Each commission deduction is recorded with the rate used

---

## 🔧 Technical Details

### Database Field:
```javascript
Settings.tradingCommission: Number
- default: 20
- min: 0
- max: 100
```

### Usage in Code:
```typescript
// Fetch rate from Settings
const settings = await Settings.findOne();
const rate = settings?.tradingCommission || 20; // Fallback to 20%

// Calculate commission
const commission = profit * (rate / 100);
```

### Transaction Record:
```javascript
{
  type: "trading_commission",
  amount: 20.00, // Commission amount
  tradingMetadata: {
    profit: 100.00,
    commissionRate: 20, // Rate used for this trade
    positionId: "BTC_POS_123",
    closedAt: "2025-01-25T10:30:00Z"
  }
}
```

---

## 🧪 Testing Your Configuration

### Test Case 1: Change Rate and Verify
1. Set trading commission to 15%
2. Simulate trade with $100 profit
3. Verify commission = $100 × 15% = $15
4. Check transaction record has `commissionRate: 15`

### Test Case 2: Gas Fee Protection
1. User has $10 gas fee, rate 20%
2. Max profit = $10 / 0.20 = $50
3. Open position that reaches $45 profit
4. Verify auto-close triggered
5. Commission deducted: $45 × 20% = $9
6. Remaining gas fee: $10 - $9 = $1
7. User should not be able to trade (< $10)

### Test Case 3: Multiple Rate Changes
1. Set rate to 25%
2. Close trade with $100 profit → $25 commission
3. Change rate to 10%
4. Close another trade with $100 profit → $10 commission
5. Verify both transactions have correct rates recorded

---

## 🐛 Troubleshooting

### Issue: Rate not updating
**Solution:** 
- Check browser console for errors
- Verify Settings collection exists in database
- Clear cache and refresh page

### Issue: Wrong commission amount
**Solution:**
- Check if Settings.tradingCommission is set correctly
- Verify transaction record has correct `commissionRate`
- Check if fallback value (20%) is being used

### Issue: Auto-close not triggering
**Solution:**
- Verify rate is fetched correctly in bot
- Check max profit calculation: `gasFee / (rate / 100)`
- Ensure `onProfitUpdate()` is called periodically

---

## 📚 Related Documentation

- **Full System Docs:** `/docs/TRADING_COMMISSION_SYSTEM.md`
- **Quick Integration:** `/docs/TRADING_COMMISSION_QUICKSTART.md`
- **Settings Model:** `/src/models/Settings.ts`
- **Admin Settings Page:** `/src/app/administrator/settings/page.tsx`

---

**Last Updated:** January 25, 2025  
**Default Rate:** 20%  
**Status:** ✅ Fully Configurable
