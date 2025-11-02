# 🤖 Balance Check Cron - Upstash QStash Setup Guide

## 📋 Overview

The Balance Check Cron monitors all user gas fee balances hourly and sends notifications when balances are low.

**Endpoint:** `/api/cron/balance-check`  
**Frequency:** Every hour (0 * * * *)  
**Method:** POST  
**Auth:** CRON_SECRET (query parameter or header)

---

## 🎯 Alert Levels

| Level | Threshold | Status | Action |
|-------|-----------|--------|--------|
| 🟢 **HEALTHY** | ≥ $15 | Can trade normally | No notification |
| ⚡ **WARNING** | < $15 | Can still trade | Email warning |
| ⚠️ **CRITICAL** | < $12 | Very low | Urgent email alert |
| 🚫 **CANNOT_TRADE** | < $10 | Trading blocked | Email + in-app alert |

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Generate CRON_SECRET (if not exists)

```bash
# Generate a secure random secret
openssl rand -base64 32
```

Copy the output and add to your `.env.local`:

```bash
CRON_SECRET=your-generated-secret-here
```

### Step 2: Test Locally

```bash
# Set CRON_SECRET in terminal
export CRON_SECRET="your-generated-secret-here"

# Run test script
chmod +x scripts/test-balance-check.sh
./scripts/test-balance-check.sh http://localhost:3000
```

**Expected Output:**
```json
{
  "success": true,
  "stats": {
    "total": 5,
    "healthy": 3,
    "warning": 1,
    "critical": 0,
    "cannotTrade": 1,
    "errors": 0
  },
  "duration": "234ms",
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

### Step 3: Deploy to Production

```bash
# Vercel
vercel env add CRON_SECRET
# Paste your CRON_SECRET

# Redeploy
vercel --prod
```

### Step 4: Setup Upstash QStash

1. **Go to Upstash Console:**
   - Visit: https://console.upstash.com/qstash
   - Login with your account

2. **Create New Schedule:**
   - Click **"Create Schedule"** button
   
3. **Configure Schedule:**
   ```
   Name: Balance Check - Hourly Alert
   Destination URL: https://yourdomain.com/api/cron/balance-check?token=YOUR_CRON_SECRET
   Cron Expression: 0 * * * *
   Method: POST
   Content-Type: application/json
   ```

4. **Test Schedule:**
   - Click **"Test"** button
   - Check response (should return 200 OK)

5. **Activate Schedule:**
   - Click **"Enable"** to activate
   - Schedule will run every hour at minute 0

---

## 🔍 Verification Checklist

### ✅ Local Testing

- [ ] `npm run dev` is running
- [ ] CRON_SECRET is set in `.env.local`
- [ ] Test script returns success
- [ ] GET endpoint shows statistics
- [ ] POST endpoint runs balance check
- [ ] Unauthorized access returns 401

### ✅ Production Setup

- [ ] CRON_SECRET added to production env
- [ ] Deployed to production
- [ ] Production URL is accessible
- [ ] Manual POST request works
- [ ] Upstash QStash schedule created
- [ ] Test run successful
- [ ] Schedule enabled

---

## 📊 Monitoring

### View Logs in Upstash

1. Go to: https://console.upstash.com/qstash/logs
2. Filter by schedule name: "Balance Check - Hourly Alert"
3. Check recent executions

**Successful execution:**
```json
{
  "status": 200,
  "body": {
    "success": true,
    "stats": {
      "total": 50,
      "healthy": 45,
      "warning": 3,
      "critical": 1,
      "cannotTrade": 1
    }
  }
}
```

### Check User Notifications

Users with low balance will receive:

1. **Email Notification** - HTML formatted with balance details
2. **In-App Notification** - Dashboard alert
3. **Toast Message** - When they login

### Admin Dashboard

Monitor balance statistics at:
- `/administrator/users` - View all user balances
- `/administrator/custodial-wallet` - Scan all balances

---

## 🔧 Troubleshooting

### Issue 1: 401 Unauthorized

**Cause:** CRON_SECRET mismatch

**Fix:**
```bash
# Check production env variable
vercel env ls

# Update CRON_SECRET
vercel env rm CRON_SECRET
vercel env add CRON_SECRET
vercel --prod
```

### Issue 2: No Notifications Sent

**Cause:** Email service not configured

**Fix:**
```bash
# Check .env.local has email settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@futurepilot.pro
```

### Issue 3: Timeout (504 Gateway Timeout)

**Cause:** Too many users, processing time > 60s

**Fix:** Increase maxDuration in route.ts:
```typescript
export const maxDuration = 300; // 5 minutes
```

### Issue 4: Missing Users

**Cause:** MongoDB not connected

**Fix:** Check MongoDB connection string:
```bash
# Verify MONGODB_URI is set
echo $MONGODB_URI

# Test connection manually
mongosh "your-connection-string"
```

---

## 📈 Expected Behavior

### Hourly Execution

```
00:00 → Balance check runs → 50 users checked → 3 notifications sent
01:00 → Balance check runs → 50 users checked → 2 notifications sent
02:00 → Balance check runs → 50 users checked → 1 notification sent
...
```

### Notification Flow

```
User Balance: $8
↓
Balance Check Cron runs
↓
Detects: balance < $10 (CANNOT_TRADE)
↓
Sends notification via NotificationManager
↓
User receives email + in-app alert
↓
User sees: "⚠️ Your gas fee balance is too low ($8). Minimum $10 required to trade."
```

---

## 🔐 Security Best Practices

1. **Use Strong CRON_SECRET:**
   - Minimum 32 characters
   - Random generated (not guessable)
   - Different from other secrets

2. **Query Parameter vs Header:**
   - Query parameter: Easier to setup in Upstash
   - Header: More secure (not in URL logs)
   - Both methods supported

3. **Rate Limiting:**
   - Upstash QStash has built-in rate limiting
   - Max 1 request per minute per schedule
   - Safe for hourly cron

4. **Error Handling:**
   - Per-user try-catch blocks
   - Continues on individual errors
   - Logs all failures

---

## 📝 Manual Testing Commands

### Test GET (View Statistics Only)

```bash
curl "https://yourdomain.com/api/cron/balance-check?token=YOUR_CRON_SECRET"
```

### Test POST (Run Balance Check + Send Notifications)

```bash
curl -X POST "https://yourdomain.com/api/cron/balance-check?token=YOUR_CRON_SECRET"
```

### Test with Authorization Header

```bash
curl -X POST https://yourdomain.com/api/cron/balance-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🎯 Success Metrics

After 24 hours of running:

- ✅ 24 successful executions (1 per hour)
- ✅ All low-balance users notified
- ✅ No missed executions
- ✅ Average execution time < 5 seconds
- ✅ 0 errors in Upstash logs

---

## 📚 Related Documentation

- **Trading Commission System:** `/docs/TRADING_COMMISSION_SYSTEM.md`
- **Bot Integration Guide:** `/docs/TRADING_COMMISSION_BOT_INTEGRATION.md`
- **Notification System:** `/docs/TRADING_NOTIFICATIONS_COMPLETE.md`
- **Upstash Setup:** `/docs/UPSTASH_CRON_SETUP.md`

---

## 🔗 Useful Links

- **Upstash QStash Console:** https://console.upstash.com/qstash
- **Upstash Logs:** https://console.upstash.com/qstash/logs
- **Cron Expression Helper:** https://crontab.guru/#0_*_*_*_*
- **API Endpoint:** `/api/cron/balance-check`

---

## ✅ Completion Checklist

- [ ] CRON_SECRET generated and set
- [ ] Local testing passed (all 3 tests)
- [ ] Production deployment successful
- [ ] Upstash QStash schedule created
- [ ] Schedule enabled and running
- [ ] First execution successful
- [ ] Users receive notifications
- [ ] Monitoring dashboard shows stats

**Status:** 🟢 READY FOR PRODUCTION

---

**Last Updated:** November 2, 2025  
**Author:** FuturePilot Development Team
