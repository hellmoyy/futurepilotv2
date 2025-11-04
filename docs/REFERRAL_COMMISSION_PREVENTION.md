# Referral Commission System - Prevention Guide

## ✅ Current Status

**System is now fully operational!**

- ✅ Commission calculation integrated in both deposit endpoints
- ✅ Backfilled commissions for historical deposits ($5,803.75 distributed)
- ✅ Enhanced error logging for debugging
- ✅ Monitoring script available

---

## 🔧 How Commission System Works

### Automatic Distribution (NEW DEPOSITS)

**When user deposits (manual or auto-detected):**

1. Deposit recorded in Transaction collection
2. User's `totalPersonalDeposit` updated
3. Tier auto-upgraded if threshold reached
4. **`calculateReferralCommission()` called automatically**
5. Commission distributed to 3 levels of referrers
6. `totalEarnings` updated for each referrer
7. ReferralCommission records created

**Integrated in:**
- `/api/user/balance` (manual credit by admin)
- `/api/wallet/check-deposit` (auto-detected blockchain deposits)

---

## 🚨 How to Prevent Issues

### 1. **Never Bypass These Endpoints**

❌ **DON'T** manually update balance in MongoDB:
```javascript
// WRONG - skips commission calculation
User.updateOne({ _id: userId }, { $inc: { gasFeeBalance: 100 } });
```

✅ **DO** use the API endpoints:
```bash
# Manual credit (calls commission system)
POST /api/user/balance
{ "userId": "...", "amount": 100 }
```

### 2. **Monitor Regularly**

Run monitoring script **weekly** or after bulk operations:

```bash
node scripts/monitor-commissions.js
```

**What it checks:**
- Deposits without commissions
- Commission system health
- Recent activity (24h)
- Total statistics

**Expected output:**
```
✅ All deposits have corresponding commissions!
```

**If issues found:**
```
⚠️  ALERT: Found deposits without commissions!
💡 Action Required: Run backfill script
```

### 3. **Backfill When Needed**

If monitoring detects missing commissions:

```bash
node scripts/backfill-referral-commissions.js
```

**Safe to run multiple times** - skips existing commissions.

---

## 📊 Verification Scripts

### Check User Deposit
```bash
node scripts/check-user-deposit.js <email>
```
Shows: deposits, balance, tier, commission records

### Check Referral Data
```bash
node scripts/check-referral-data.js
```
Shows: all referral relationships, statistics

### Check Commissions
```bash
node scripts/check-commission-records.js
```
Shows: all commission records, earnings breakdown

### Sync Total Deposit
```bash
node scripts/sync-total-personal-deposit.js
```
Updates: `totalPersonalDeposit` and `membershipLevel` from transactions

---

## 🐛 Debugging Commission Issues

### Issue: "Commission not created for new deposit"

**Check 1: Verify user has referrer**
```bash
node scripts/check-referral-data.js
# Look for user email in referral relationships
```

**Check 2: Check error logs**
```bash
# In production logs, search for:
"CRITICAL: Error calculating referral commission"
```

**Check 3: Verify referrer chain**
```javascript
// User → Referrer Level 1 → Referrer Level 2 → Referrer Level 3
// All must exist in database
```

**Check 4: Commission rate settings**
```bash
# Check MongoDB settings collection
db.settings.findOne({ key: 'tierCommissionRates' })
```

### Issue: "TotalEarnings doesn't match commission records"

**Solution: Run sync script**
```bash
# Recalculate totalEarnings from commission records
node scripts/sync-total-earnings.js
```

---

## 🎯 Best Practices

### For Admins

1. **Always use manual credit via admin panel** (not direct DB edit)
2. **Run monitoring weekly** to catch issues early
3. **Review commission logs** in production regularly
4. **Test on staging** before bulk operations

### For Developers

1. **Never modify balance** without calling commission system
2. **Always handle commission errors gracefully** (log but don't fail deposit)
3. **Add comprehensive logging** for debugging
4. **Test referral chains** (Level 1, 2, 3) in development

### For QA/Testing

1. **Test complete referral chain:**
   ```
   User A → User B → User C → User D
   ```
2. **Verify commissions at all 3 levels**
3. **Test different tier combinations** (Bronze, Silver, Gold, Platinum)
4. **Check commission rates** match tier settings

---

## 📁 Important Files

### Commission Logic
- `/src/lib/referralCommission.ts` - Main calculation function
- `/src/lib/referralCommissionHelpers.ts` - Helper utilities

### API Endpoints (WITH Commission Integration)
- `/src/app/api/user/balance/route.ts` - Manual credit
- `/src/app/api/wallet/check-deposit/route.ts` - Auto-detection

### Scripts (Maintenance)
- `scripts/backfill-referral-commissions.js` - Fix missing commissions
- `scripts/monitor-commissions.js` - Health check
- `scripts/check-commission-records.js` - Detailed inspection

### Database Models
- `src/models/User.ts` - User with `totalEarnings`, `referredBy`
- `src/models/ReferralCommission.ts` - Commission records

---

## ⚡ Quick Reference

### Commission Rates (Default)

| Tier | Level 1 | Level 2 | Level 3 | Total |
|------|---------|---------|---------|-------|
| 🥉 Bronze | 10% | 5% | 5% | 20% |
| 🥈 Silver | 20% | 5% | 5% | 30% |
| 🥇 Gold | 30% | 5% | 5% | 40% |
| 💎 Platinum | 40% | 5% | 5% | 50% |

**Configurable in:** `/administrator/settings` → "Referral Commission" tab

### Tier Thresholds

| Tier | Min Deposit | Max Deposit |
|------|-------------|-------------|
| 🥉 Bronze | $0 | $999 |
| 🥈 Silver | $1,000 | $1,999 |
| 🥇 Gold | $2,000 | $9,999 |
| 💎 Platinum | $10,000+ | ∞ |

---

## ✅ Checklist Before Production Deploy

- [ ] Run `node scripts/monitor-commissions.js` - All green?
- [ ] Test manual credit via admin panel - Commission created?
- [ ] Test blockchain deposit detection - Commission triggered?
- [ ] Verify commission rates in settings - Correct percentages?
- [ ] Check error logs - No critical commission errors?
- [ ] Test 3-level referral chain - All levels get paid?
- [ ] Verify totalEarnings synced - Matches commission records?
- [ ] Review admin referrals page - Data showing correctly?

---

## 🚀 Future Improvements

1. **Real-time Alerts:** Webhook to Slack/Discord when commission fails
2. **Auto-Healing:** Cron job to auto-run backfill if issues detected
3. **Commission Dashboard:** Admin page showing commission flow visualization
4. **Audit Trail:** More detailed logging of commission calculations
5. **Commission History:** User-facing page showing earned commissions over time

---

**Last Updated:** November 4, 2025  
**Status:** ✅ Production Ready  
**Scripts Tested:** All passing  
**Backfill Complete:** $5,803.75 distributed
