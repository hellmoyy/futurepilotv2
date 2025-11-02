# 🛡️ COMMISSION WALLET SECURITY - QUICK REFERENCE

**Last Updated:** November 2, 2025  
**Priority:** 🔴 CRITICAL - Implementation Required

---

## 🚨 IDENTIFIED VULNERABILITIES

| # | Vulnerability | Severity | Status |
|---|---------------|----------|--------|
| 1 | Race Condition - Double Withdrawal | 🔴 CRITICAL | ❌ Not Fixed |
| 2 | No Database Transaction | 🔴 CRITICAL | ❌ Not Fixed |
| 3 | Balance Calculation Inconsistency | 🟡 HIGH | ❌ Not Fixed |
| 4 | No Pessimistic Locking | 🔴 CRITICAL | ❌ Not Fixed |
| 5 | No Withdrawal Queue | 🟡 HIGH | ❌ Not Fixed |
| 6 | No Idempotency Key | 🟡 HIGH | ❌ Not Fixed |
| 7 | Insufficient Balance Validation | 🟡 HIGH | ❌ Not Fixed |

---

## ⚡ QUICK FIX CHECKLIST

### 1️⃣ **Apply Secure Withdrawal API (P0 - URGENT)**

```bash
# Backup current file
cp src/app/api/withdrawals/route.ts src/app/api/withdrawals/route.OLD.ts

# Replace with secure version
cp src/app/api/withdrawals/route.SECURE.ts src/app/api/withdrawals/route.ts
```

**What it fixes:**
- ✅ Race condition (MongoDB transactions)
- ✅ Data inconsistency (atomic operations)
- ✅ Negative balances ($inc atomic decrement)
- ✅ Duplicate detection (60-second window)

---

### 2️⃣ **Fix Balance Calculation (P0 - URGENT)**

**File:** `src/app/api/referral/stats/route.ts`

**Change Line 111-113 from:**
```typescript
// ❌ WRONG (double deduction)
const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
const availableCommission = (user.totalEarnings || 0) - totalWithdrawn;
```

**To:**
```typescript
// ✅ CORRECT (totalEarnings already deducted)
const availableCommission = Math.max(0, user.totalEarnings || 0);

// For display purposes only (show total withdrawn)
const totalWithdrawn = await Withdrawal.aggregate([
  {
    $match: {
      userId: user._id,
      status: { $in: ['completed', 'processing'] },
    },
  },
  {
    $group: {
      _id: null,
      total: { $sum: '$amount' },
    },
  },
]);
```

---

### 3️⃣ **Test for Vulnerabilities (P0 - REQUIRED)**

```bash
# Run race condition test
node scripts/test-race-condition.js

# Expected output:
# ✅ SECURE: Only 1 withdrawal processed (if fixed)
# 🚨 VULNERABLE: Multiple withdrawals (if not fixed)
```

---

## 🔍 HOW TO VERIFY FIXES

### Test 1: Manual Race Condition Test

```bash
# Terminal 1
curl -X POST http://localhost:3000/api/withdrawals \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"amount": 50, "walletAddress": "0x1234567890123456789012345678901234567890", "network": "ERC20"}' &

# Terminal 2 (run immediately after Terminal 1)
curl -X POST http://localhost:3000/api/withdrawals \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"amount": 50, "walletAddress": "0x1234567890123456789012345678901234567890", "network": "ERC20"}' &

# Check results:
# ✅ SECURE: Only 1 request succeeds
# 🚨 VULNERABLE: Both requests succeed
```

### Test 2: Balance Verification

```javascript
// Before withdrawal
User balance: $100

// Withdraw $30
POST /api/withdrawals { amount: 30 }

// After withdrawal
User.totalEarnings: $70 ✅ (correct)

// Check display
GET /api/referral/stats
availableCommission: $70 ✅ (correct, not $40)
```

---

## 🚀 DEPLOYMENT PLAN

### Phase 1: Urgent Fixes (Week 1)
- [x] Create security audit document
- [ ] Apply secure withdrawal API
- [ ] Fix balance calculation
- [ ] Run test suite
- [ ] Deploy to staging

### Phase 2: Enhanced Protection (Week 2)
- [ ] Add Redis distributed lock
- [ ] Implement idempotency keys
- [ ] Add rate limiting
- [ ] Deploy to production

### Phase 3: Monitoring (Week 3)
- [ ] Add balance integrity checks
- [ ] Set up fraud detection alerts
- [ ] Implement audit logging
- [ ] Create admin dashboard

---

## 📊 SECURITY METRICS (Post-Fix)

| Metric | Target | How to Monitor |
|--------|--------|----------------|
| Race condition attacks | 0 | Check for negative balances |
| Duplicate withdrawals | 0 | Check for same TxHash |
| Balance discrepancies | 0 | Daily audit script |
| Failed transactions | <1% | Transaction rollback logs |

---

## 🔧 TROUBLESHOOTING

### Issue: "Transaction failed to commit"
**Cause:** MongoDB not configured for transactions  
**Fix:** Ensure MongoDB is replica set (required for transactions)

```bash
# Check if replica set enabled
mongo --eval "rs.status()"

# If not enabled, convert standalone to replica set
mongod --replSet rs0
mongo --eval "rs.initiate()"
```

### Issue: "Lock acquisition timeout"
**Cause:** Redis not running or unreachable  
**Fix:** Start Redis server

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Check connection
redis-cli ping  # Should return PONG
```

### Issue: Balance still incorrect after fix
**Cause:** Old data in database  
**Fix:** Run balance reconciliation script

```bash
node scripts/fix-balance-discrepancy.js
```

---

## 📚 RELATED DOCUMENTS

- **Full Audit:** `/docs/COMMISSION_WALLET_SECURITY_AUDIT.md` (detailed analysis)
- **Test Script:** `/scripts/test-race-condition.js` (automated testing)
- **Secure API:** `/src/app/api/withdrawals/route.SECURE.ts` (implementation)
- **Balance Fix Guide:** `/docs/BALANCE_DISPLAY.md` (balance system)

---

## ⚠️ ROLLBACK PLAN

If secure version causes issues:

```bash
# Restore original file
cp src/app/api/withdrawals/route.OLD.ts src/app/api/withdrawals/route.ts

# Restart server
npm run build
pm2 restart futurepilot

# Enable manual approval only (temporary workaround)
# Set in .env.local:
REQUIRE_MANUAL_APPROVAL=true
MIN_WITHDRAWAL_AMOUNT=100  # Increase to reduce attack surface
```

---

## 🎯 ACCEPTANCE CRITERIA

### Before Production Deploy:
- [ ] All 7 vulnerabilities fixed
- [ ] Test script passes 100%
- [ ] Manual testing completed
- [ ] Staging environment validated
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

### Success Metrics:
- [ ] Zero negative balances (30 days)
- [ ] Zero duplicate withdrawals (30 days)
- [ ] < 0.1% transaction failures
- [ ] < 100ms withdrawal API latency

---

## 📞 ESCALATION

**If critical issue found in production:**

1. **Immediately disable withdrawals:**
   ```bash
   # Add to .env.local
   WITHDRAWALS_DISABLED=true
   ```

2. **Check for damage:**
   ```bash
   node scripts/check-balance-discrepancy.js
   ```

3. **Notify team:**
   - Admin dashboard alert
   - Email notification
   - Slack/Discord ping

4. **Document incident:**
   - Create incident report
   - Log all affected users
   - Calculate financial impact

---

**Remember:** This is a financial system. Security > Features > Speed.

**Test everything. Trust nothing. Verify always.**
