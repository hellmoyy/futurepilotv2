# Trading Commission Testing Guide

## 🧪 Manual Testing Checklist

### Prerequisites:
- ✅ MongoDB connection working
- ✅ At least one user with gas fee balance in database
- ✅ Settings document exists with tradingCommission field

---

## 📋 Test Cases

### **Test 1: Minimum Gas Fee Check**

**Objective:** Verify users cannot trade with less than $10 USDT gas fee

**Steps:**
1. Find a test user in database
2. Set gasFeeBalance to $5
3. Call `canUserTrade(userId)`
4. **Expected:** `canTrade: false`, reason mentions "Insufficient"
5. Set gasFeeBalance to $10
6. Call `canUserTrade(userId)`
7. **Expected:** `canTrade: true`
8. Set gasFeeBalance to $50
9. Call `canUserTrade(userId)`
10. **Expected:** `canTrade: true`

**Command:**
```bash
node scripts/test-trading-commission.js
```

**Expected Result:**
```
✅ PASSED: User with $5 balance should NOT be able to trade
✅ PASSED: User with $10 balance SHOULD be able to trade
✅ PASSED: User with $50 balance SHOULD be able to trade
```

---

### **Test 2: Max Profit Calculation**

**Objective:** Verify max profit formula: `gasFee / commissionRate`

**Steps:**
1. Get commission rate from Settings (default 20%)
2. Set user gas fee balance to $10
3. Call `calculateMaxProfit(userId)`
4. **Expected:** 
   - maxProfit = $10 / 0.20 = $50
   - autoCloseThreshold = $50 × 0.90 = $45
5. Set user gas fee balance to $50
6. Call `calculateMaxProfit(userId)`
7. **Expected:**
   - maxProfit = $50 / 0.20 = $250
   - autoCloseThreshold = $250 × 0.90 = $225

**Formula:**
```javascript
maxProfit = gasFeeBalance / (commissionRate / 100)
autoCloseThreshold = maxProfit × 0.90
```

---

### **Test 3: Auto-Close Detection**

**Objective:** Verify auto-close triggers at 90% of max profit

**Steps:**
1. Set user gas fee balance to $10
2. Calculate maxProfit and autoCloseThreshold
3. Call `shouldAutoClose(userId, profit)` with:
   - Profit = threshold - $5 → **Expected:** `shouldClose: false`
   - Profit = threshold → **Expected:** `shouldClose: true`
   - Profit = threshold + $5 → **Expected:** `shouldClose: true`

**Example:**
```
Gas Fee: $10
Max Profit: $50
Threshold: $45

shouldAutoClose(userId, 40) → false (below threshold)
shouldAutoClose(userId, 45) → true (at threshold)
shouldAutoClose(userId, 50) → true (above threshold)
```

---

### **Test 4: Commission Deduction**

**Objective:** Verify commission is correctly calculated and deducted

**Steps:**
1. Set user gas fee balance to $50
2. Call `deductTradingCommission({ userId, profit: 100, positionId: 'TEST_001' })`
3. **Expected:**
   - success: true
   - commission: $20 (100 × 20%)
   - remainingBalance: $30 ($50 - $20)
4. Verify transaction created in database:
   - type: 'trading_commission'
   - amount: $20
   - tradingMetadata.profit: $100
   - tradingMetadata.commissionRate: 20
5. Set user gas fee balance to $5
6. Call `deductTradingCommission({ userId, profit: 100, positionId: 'TEST_002' })`
7. **Expected:**
   - success: false
   - error mentions "Insufficient balance"

---

### **Test 5: Commission Summary**

**Objective:** Verify commission history aggregation

**Steps:**
1. Call `getTradingCommissionSummary(userId)`
2. **Expected:**
   - totalCommissionPaid: sum of all commission amounts
   - totalProfits: sum of all profits
   - averageCommissionRate: average of rates used
   - transactionCount: number of commission transactions
   - transactions: array of transaction details

**Verify:**
- Numbers match database records
- Transactions array contains correct data
- All fields are properly populated

---

### **Test 6: Loss Trade (No Commission)**

**Objective:** Verify no commission charged on losing trades

**Steps:**
1. Set user gas fee balance to $50
2. Call `deductTradingCommission({ userId, profit: -20, positionId: 'LOSS_001' })`
3. **Expected:**
   - success: false OR commission: 0
   - No transaction created
   - User balance unchanged

**Verification:**
```javascript
// Loss trade
profit = -20
commission = should be 0 or fail
```

---

## 🚀 Running Automated Tests

### Run All Tests:
```bash
node scripts/test-trading-commission.js
```

### Expected Output:
```
============================================================
🧪 TRADING COMMISSION SYSTEM - MANUAL TESTING
============================================================

✅ Connected to MongoDB

🧪 TEST 1: Minimum Gas Fee Check
✅ PASSED: User with $5 balance should NOT be able to trade
✅ PASSED: Reason should mention insufficient balance
✅ PASSED: User with $10 balance SHOULD be able to trade
✅ PASSED: User with $50 balance SHOULD be able to trade
✅ TEST 1 COMPLETED

🧪 TEST 2: Max Profit Calculation
✅ PASSED: Max profit should be ~$50.00, got $50.00
✅ PASSED: Auto-close threshold should be ~$45.00, got $45.00
✅ PASSED: Max profit should be ~$250.00, got $250.00
✅ TEST 2 COMPLETED

🧪 TEST 3: Auto-Close Detection
✅ PASSED: Should NOT auto-close when profit is below threshold
✅ PASSED: SHOULD auto-close when profit reaches threshold
✅ PASSED: SHOULD auto-close when profit exceeds threshold
✅ TEST 3 COMPLETED

🧪 TEST 4: Commission Deduction
✅ PASSED: Commission deduction should succeed
✅ PASSED: Commission should be $20.00, got $20.00
✅ PASSED: Remaining balance should be $30.00, got $30.00
✅ PASSED: Transaction should be created in database
✅ PASSED: Transaction type should be 'trading_commission'
✅ PASSED: Transaction metadata should contain profit amount
✅ PASSED: Commission deduction should fail with insufficient balance
✅ PASSED: Error message should mention insufficient balance
✅ TEST 4 COMPLETED

🧪 TEST 5: Commission Summary
✅ PASSED: totalCommissionPaid should be a number
✅ PASSED: transactions array should not exceed count
✅ PASSED: Transaction should have profit field
✅ PASSED: Transaction should have commission field
✅ TEST 5 COMPLETED

🧪 TEST 6: Loss Trade (No Commission)
✅ PASSED: No commission should be deducted for loss trades
✅ TEST 6 COMPLETED

✅ Disconnected from MongoDB

============================================================
📊 TEST SUMMARY
============================================================
✅ Passed: 6
❌ Failed: 0
📈 Success Rate: 100.0%
============================================================
```

---

## 🌐 UI Testing

### **Admin Dashboard Test:**

1. Navigate to: `http://localhost:3000/administrator/trading-commissions`

**Verify:**
- ✅ Statistics cards display correct totals
- ✅ Top 10 users table shows commission data
- ✅ Recent transactions table populated
- ✅ Date filters work correctly
- ✅ Pagination works
- ✅ Export CSV downloads correct data

**Test Filters:**
- Set start date and end date
- Verify transactions filtered correctly
- Clear filters
- Verify all transactions shown again

---

### **User Dashboard Test:**

1. Login as user
2. Navigate to: `http://localhost:3000/dashboard`

**Verify Trading Commission Widget:**
- ✅ Gas fee balance displayed correctly
- ✅ Max profit calculation correct
- ✅ Auto-close threshold shown
- ✅ Commission rate displayed
- ✅ Total commission paid accurate
- ✅ "Cannot Trade" warning if balance < $10
- ✅ Commission history toggles correctly
- ✅ Last 10 transactions shown

**Test with Different Balances:**
- Set gas fee to $5 → Should show "Cannot Trade" warning
- Set gas fee to $50 → Should show max profit $250, threshold $225
- Verify all cards update with correct values

---

## 🔧 API Endpoint Testing

### **Test with cURL:**

```bash
# 1. Check trading eligibility
curl "http://localhost:3000/api/trading/commission?userId=USER_ID&action=check"

# Expected: { success: true, data: { canTrade: true/false, gasFeeBalance: X, reason: "..." } }

# 2. Get max profit
curl "http://localhost:3000/api/trading/commission?userId=USER_ID&action=max-profit"

# Expected: { success: true, data: { maxProfit: X, autoCloseThreshold: Y, gasFeeBalance: Z, commissionRate: R } }

# 3. Check auto-close
curl "http://localhost:3000/api/trading/commission?userId=USER_ID&action=auto-close&profit=100"

# Expected: { success: true, data: { shouldClose: true/false, reason: "...", maxProfit: X, threshold: Y } }

# 4. Get commission summary
curl "http://localhost:3000/api/trading/commission?userId=USER_ID&action=summary"

# Expected: { success: true, data: { totalCommissionPaid: X, totalProfits: Y, averageCommissionRate: Z, transactionCount: N, transactions: [...] } }

# 5. Deduct commission (POST)
curl -X POST "http://localhost:3000/api/trading/commission" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","profit":100,"positionId":"TEST_001"}'

# Expected: { success: true, data: { commission: 20, remainingBalance: X, transactionId: "..." } }
```

---

## 📊 Database Verification

### **Check Transaction Records:**

```javascript
// MongoDB query
db.transactions.find({
  type: "trading_commission",
  status: "confirmed"
}).sort({ createdAt: -1 }).limit(10)

// Verify each transaction has:
// - type: "trading_commission"
// - amount: commission amount
// - tradingMetadata.profit: original profit
// - tradingMetadata.commissionRate: rate used
// - tradingMetadata.positionId: position identifier
// - tradingMetadata.closedAt: close timestamp
```

### **Verify User Balance:**

```javascript
// Find user
db.futurepilotcol.findOne({ email: "user@example.com" })

// Check gasFeeBalance field
// Should match: originalBalance - sum(commissions)
```

---

## ✅ Success Criteria

All tests should pass with these results:

- ✅ **Test 1:** Users with < $10 cannot trade
- ✅ **Test 2:** Max profit calculated correctly
- ✅ **Test 3:** Auto-close triggers at 90% threshold
- ✅ **Test 4:** Commission deducted accurately
- ✅ **Test 5:** Summary aggregates correct data
- ✅ **Test 6:** No commission on losses
- ✅ **Admin UI:** All features working
- ✅ **User UI:** Widget displays correct info
- ✅ **API:** All endpoints return expected data
- ✅ **Database:** Transaction records accurate

---

## 🐛 Troubleshooting

### Issue: Tests fail with "User not found"
**Solution:** Ensure at least one user exists in database

### Issue: "Cannot connect to MongoDB"
**Solution:** Check `.env.local` has correct `MONGODB_URI`

### Issue: Commission rate is wrong
**Solution:** Check Settings collection has `tradingCommission` field (default 20)

### Issue: Balance not updating
**Solution:** Verify transaction was created and user.gasFeeBalance was saved

---

**Last Updated:** January 25, 2025  
**Status:** ✅ All Tests Documented  
**Run Command:** `node scripts/test-trading-commission.js`
