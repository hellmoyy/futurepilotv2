# ⏰ Upstash Cron Setup - Quick Guide

**Status:** Ready to configure  
**Estimated Time:** 5 minutes

---

## 🎯 What You'll Setup

A scheduled job that runs **every hour** to check all users' gas fee balances and send notifications to users with low balances.

---

## 📋 Prerequisites

- ✅ Application deployed and accessible via HTTPS
- ✅ `CRON_SECRET` environment variable configured
- ✅ Endpoint `/api/cron/balance-check` is live

---

## 🚀 Step-by-Step Setup

### Step 1: Generate CRON_SECRET (if not done)

```bash
# Generate a secure random secret
openssl rand -hex 32
```

**Output Example:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Add to your `.env.local` or deployment environment:
```bash
CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**⚠️ Important:** Use the SAME secret in both your app and Upstash configuration.

---

### Step 2: Create Upstash Account (Free)

1. Go to: https://console.upstash.com
2. Click **"Sign Up"** (free tier available)
3. Verify your email
4. Login to dashboard

---

### Step 3: Navigate to QStash

1. Click **"QStash"** in left sidebar
2. Or go directly to: https://console.upstash.com/qstash
3. You should see the QStash dashboard

---

### Step 4: Create Scheduled Request

1. Click **"Create Schedule"** button (top right)

2. **Fill in the form:**

   **Name:**
   ```
   Balance Check - Hourly
   ```

   **Destination URL:**
   ```
   https://yourdomain.com/api/cron/balance-check?token=YOUR_CRON_SECRET
   ```
   
   Replace:
   - `yourdomain.com` → Your actual domain
   - `YOUR_CRON_SECRET` → Your generated secret from Step 1

   **Example:**
   ```
   https://futurepilot.com/api/cron/balance-check?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

   **Schedule (Cron Expression):**
   ```
   0 * * * *
   ```
   This means: "Every hour at minute 0" (e.g., 1:00, 2:00, 3:00, etc.)

   **Method:**
   ```
   POST
   ```

   **Headers:** (Optional, leave empty)

   **Body:** (Optional, leave empty)

3. Click **"Create Schedule"**

---

### Step 5: Verify Setup

#### Test Immediately

1. In the schedule list, find your newly created schedule
2. Click the **"..."** menu (three dots)
3. Click **"Trigger Now"**
4. Wait 5-10 seconds

#### Check Response

In Upstash dashboard:
- Should show **200 OK** status
- Response time should be < 5 seconds

#### Check Your Logs

In your application logs, you should see:
```
[BALANCE-CHECK] Starting balance check...
[BALANCE-CHECK] Checking 10 users...
✅ [BALANCE-CHECK] Completed in 1234ms { checked: 10, cannotTrade: 0, critical: 1, warning: 2, healthy: 7, errors: 0 }
```

---

## 📊 Cron Expression Guide

Want to run at different intervals? Use these:

| Expression | Meaning | Example |
|------------|---------|---------|
| `0 * * * *` | Every hour at :00 | 1:00, 2:00, 3:00 |
| `*/30 * * * *` | Every 30 minutes | 1:00, 1:30, 2:00, 2:30 |
| `0 */2 * * *` | Every 2 hours | 12:00, 2:00, 4:00 |
| `0 0 * * *` | Daily at midnight | 12:00 AM every day |
| `0 9 * * *` | Daily at 9 AM | 9:00 AM every day |
| `0 */6 * * *` | Every 6 hours | 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM |

**Recommendation:** Start with `0 * * * *` (hourly) and adjust based on user needs.

---

## 🧪 Testing Your Cron

### Manual Trigger (Recommended)

Use `curl` to test your endpoint:

```bash
curl -X POST "https://yourdomain.com/api/cron/balance-check?token=YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Balance check completed",
  "stats": {
    "checked": 15,
    "cannotTrade": 1,
    "critical": 2,
    "warning": 3,
    "healthy": 9,
    "errors": 0
  }
}
```

**Status Code:** `200 OK`

---

### Check User Notifications

1. Find a user with low balance (< $15):
   ```javascript
   db.futurepilotcols.findOne({ "walletData.balance": { $lt: 15 } })
   ```

2. Trigger the cron (manual or via Upstash)

3. Check:
   - **Email:** User should receive "Low Gas Fee Balance" email
   - **In-App:** Check NotificationCenter for alert
   - **Toast:** If user is logged in, should see toast

---

## 🔐 Security Best Practices

### ✅ Do's

- ✅ Use a strong, random CRON_SECRET (at least 32 characters)
- ✅ Use HTTPS for your endpoint (not HTTP)
- ✅ Keep CRON_SECRET in environment variables (never commit to git)
- ✅ Rotate CRON_SECRET periodically (every 6 months)

### ❌ Don'ts

- ❌ Don't use predictable secrets like "password123"
- ❌ Don't expose CRON_SECRET in client-side code
- ❌ Don't hardcode secrets in source files
- ❌ Don't share secrets in public channels

---

## 📊 Monitoring Your Cron

### Upstash Dashboard

Check execution history:
1. Go to QStash dashboard
2. Click on your schedule
3. View **"Executions"** tab
4. See:
   - Execution time
   - Status code
   - Response time
   - Error messages (if any)

### Application Logs

Filter logs for `[BALANCE-CHECK]`:

```bash
# Railway
railway logs --filter="BALANCE-CHECK"

# Heroku
heroku logs --tail | grep "BALANCE-CHECK"

# Vercel
vercel logs --filter="BALANCE-CHECK"

# Docker
docker logs futurepilot | grep "BALANCE-CHECK"
```

---

## 🚨 Troubleshooting

### Issue: 401 Unauthorized

**Cause:** CRON_SECRET mismatch

**Fix:**
1. Check `.env` file: `echo $CRON_SECRET`
2. Check Upstash URL includes correct token
3. Ensure token parameter is in URL (not header)

---

### Issue: 404 Not Found

**Cause:** Endpoint not deployed or wrong URL

**Fix:**
1. Verify endpoint exists: `curl https://yourdomain.com/api/cron/balance-check`
2. Check deployment logs for errors
3. Ensure route file exists: `src/app/api/cron/balance-check/route.ts`

---

### Issue: 500 Internal Server Error

**Cause:** Application error

**Fix:**
1. Check application logs for stack trace
2. Common causes:
   - MongoDB connection failed
   - Environment variables missing
   - Code syntax error
3. Test endpoint manually first

---

### Issue: No Users Receiving Notifications

**Cause:** No users with low balance or notification system issue

**Fix:**
1. Check user balances:
   ```javascript
   db.futurepilotcols.aggregate([
     { $match: { "walletData.balance": { $lt: 15 } } },
     { $project: { email: 1, "walletData.balance": 1 } }
   ])
   ```
2. If users exist, check notification logs
3. Verify email service (Resend) is configured
4. Test notification manually:
   ```typescript
   await notificationManager.notifyLowGasFee(userId, balance);
   ```

---

## 📈 Expected Behavior

### First Hour After Setup

```
[BALANCE-CHECK] Starting balance check...
[BALANCE-CHECK] Checking 10 users...
⚠️  [BALANCE-CHECK] User user1@example.com: $12.50 - CRITICAL
⚡ [BALANCE-CHECK] User user2@example.com: $14.00 - WARNING
✅ [BALANCE-CHECK] Completed in 1234ms {
  checked: 10,
  cannotTrade: 0,
  critical: 1,
  warning: 1,
  healthy: 8,
  errors: 0
}
```

### Subsequent Hours

- Only users with low balance receive notifications
- Users with healthy balance ($15+) are skipped
- Execution time should be consistent (< 2 seconds per user)

---

## ✅ Success Checklist

After setup, verify:

- [ ] Upstash schedule created
- [ ] Schedule shows "Active" status
- [ ] Manual trigger returns 200 OK
- [ ] Application logs show `[BALANCE-CHECK]` messages
- [ ] Test user receives email notification
- [ ] NotificationCenter shows alert
- [ ] No error logs in Upstash
- [ ] Cron runs automatically on schedule

---

## 🎯 Next Steps

After successful setup:

1. **Monitor for 24 hours**
   - Check execution logs
   - Verify notifications sent
   - Monitor error rates

2. **Adjust Frequency (Optional)**
   - If too frequent: Change to `0 */2 * * *` (every 2 hours)
   - If not enough: Change to `*/30 * * * *` (every 30 minutes)

3. **Scale Notifications**
   - Add SMS notifications (Twilio)
   - Add push notifications (OneSignal)
   - Add Telegram/Discord alerts

4. **Add Monitoring**
   - Set up alerts for cron failures
   - Monitor notification delivery rates
   - Track balance trends

---

## 📞 Support

If issues persist:

1. Check documentation: `docs/BALANCE_CHECK_CRON_COMPLETE.md`
2. Review code: `src/app/api/cron/balance-check/route.ts`
3. Test manually: `curl` command above
4. Check logs: Application + Upstash
5. Verify environment variables

---

**Status:** ✅ Ready to Deploy  
**Difficulty:** Easy  
**Time Required:** 5 minutes  
**Cost:** Free (Upstash free tier)

Good luck! 🚀
