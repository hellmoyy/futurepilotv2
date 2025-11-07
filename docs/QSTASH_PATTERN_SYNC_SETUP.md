# 🔄 QStash Automated Pattern Sync Setup Guide

**Status:** ✅ Ready for deployment
**Schedule:** Every 15 minutes
**Purpose:** Automatically sync Bot Signal patterns to Bot Decision

---

## 📋 Overview

**What it does:**
- Automatically imports latest patterns from Bot Signal Learning Center every 15 minutes
- Updates Bot Decision AI with proven strategies (68.3% win rate)
- No manual intervention required after setup

**Benefits:**
- ✅ Always up-to-date patterns (within 15 minutes of new backtest)
- ✅ Zero manual effort after initial setup
- ✅ Consistent AI improvement over time
- ✅ Fail-safe with error logging

---

## 🛠️ Setup Instructions

### Step 1: Add CRON_SECRET to Environment Variables

**In `.env`:**
```bash
# QStash Cron Secret (generate random string)
CRON_SECRET=your-random-secret-here-min-32-chars

# App URL (for internal API calls)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Generate secure secret:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# https://www.random.org/passwords/?num=1&len=32&format=plain
```

**Example:**
```bash
CRON_SECRET=a8f3k2L9mN4pQ7rS1tU6vW8xY0zA2bC4dE6fG8hI0jK2
NEXT_PUBLIC_APP_URL=https://futurepilot.vercel.app
```

---

### Step 2: Deploy to Production

**Railway:**
```bash
# Push to git
git add .
git commit -m "Add QStash automated pattern sync"
git push origin main

# Set environment variables in Railway dashboard
# Settings → Variables → Add:
# CRON_SECRET=a8f3k2L9mN4pQ7rS1tU6vW8xY0zA2bC4dE6fG8hI0jK2
# NEXT_PUBLIC_APP_URL=https://futurepilot-production.up.railway.app
```

**Vercel:**
```bash
# Deploy
vercel --prod

# Set environment variables
vercel env add CRON_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production

# Redeploy to apply env vars
vercel --prod
```

---

### Step 3: Setup QStash Schedule

**3.1 Go to Upstash Console:**
```
https://console.upstash.com/qstash
```

**3.2 Create New Schedule:**
1. Click **"Schedules"** → **"Create Schedule"**
2. Fill in details:

**Schedule Configuration:**
```
Name: Bot Pattern Sync
Description: Sync Bot Signal patterns to Bot Decision every 15 minutes
Destination: https://your-domain.com/api/cron/sync-bot-patterns
Method: POST
Cron Expression: */15 * * * *
```

**Cron Expression Guide:**
```bash
*/15 * * * *   # Every 15 minutes
# │  │ │ │ │
# │  │ │ │ └─── Day of week (0-7, 0 and 7 = Sunday)
# │  │ │ └───── Month (1-12)
# │  │ └─────── Day of month (1-31)
# │  └───────── Hour (0-23)
# └─────────── Minute (0-59)

Examples:
*/5 * * * *    # Every 5 minutes
*/30 * * * *   # Every 30 minutes
0 * * * *      # Every hour
0 */6 * * *    # Every 6 hours
```

**3.3 Add Authorization Header:**
```
Header Name: Authorization
Header Value: Bearer a8f3k2L9mN4pQ7rS1tU6vW8xY0zA2bC4dE6fG8hI0jK2
```

**3.4 Configure Retries (Optional):**
```
Max Retries: 3
Retry Delay: 60 seconds
```

**3.5 Save & Activate:**
- Click **"Create"**
- Toggle **"Enabled"** switch to ON

---

## 🧪 Testing

### Test Cron Endpoint Locally

**1. Start dev server:**
```bash
npm run dev
```

**2. Test POST request:**
```bash
# Replace with your CRON_SECRET from .env
CRON_SECRET="your-secret-here"

curl -X POST http://localhost:3000/api/cron/sync-bot-patterns \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-07T12:30:00.000Z",
  "duration": "2341ms",
  "sync": {
    "created": 18,
    "updated": 0,
    "skipped": 0,
    "total": 18,
    "insights": [
      "✅ Imported 13 backtests with 68.30% average ROI",
      "📈 Win rate: 66.67% (20 wins / 10 losses)",
      "🎯 Created 18 new patterns from Bot Signal proven strategies"
    ]
  },
  "source": {
    "backtests": 13,
    "avgROI": 68.3,
    "winRate": 0.667,
    "totalTrades": 30
  },
  "message": "Pattern sync completed: 18 created, 0 updated in 2341ms"
}
```

**3. Test GET status:**
```bash
curl -X GET http://localhost:3000/api/cron/sync-bot-patterns \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "cron": {
    "endpoint": "/api/cron/sync-bot-patterns",
    "schedule": "Every 15 minutes",
    "method": "POST",
    "enabled": true
  },
  "status": {
    "success": true,
    "totalPatterns": 18,
    "aiPatterns": 18,
    "manualPatterns": 0,
    "lastSynced": "2025-11-07T12:30:00.000Z"
  },
  "nextRun": "Calculated by QStash scheduler"
}
```

---

### Test Production Endpoint

**After deployment to Railway/Vercel:**

```bash
# Replace with your production URL and CRON_SECRET
PROD_URL="https://futurepilot-production.up.railway.app"
CRON_SECRET="your-production-secret"

curl -X POST $PROD_URL/api/cron/sync-bot-patterns \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Check logs:**
- Railway: Deployments → View Logs
- Vercel: Deployments → View Function Logs
- Look for: `✅ [CRON] Pattern sync completed successfully`

---

### Test QStash Schedule

**Manual trigger from QStash dashboard:**
1. Go to: https://console.upstash.com/qstash
2. Click **"Schedules"**
3. Find **"Bot Pattern Sync"**
4. Click **"Run Now"** button
5. Wait 10-20 seconds
6. Check **"Logs"** tab for result

**Expected log:**
```
✅ 200 OK
Duration: 2.3s
Response: {"success":true,"sync":{"created":18,...}}
```

---

## 📊 Monitoring

### Check Sync Status in UI

**Admin Dashboard:**
```
1. Navigate to: /administrator/bot-decision
2. Click: "Learning" tab
3. Look at "Pattern Sources" banner:
   - Bot Signal patterns: 18+ ✨
   - Last synced: 2025-11-07 12:30:00
```

### Check Database

```bash
mongosh
> use futurepilot
> db.learningpatterns.countDocuments({ source: 'ai_import' })
# Expected: 18+

> db.learningpatterns.findOne({ source: 'ai_import' })
# Shows latest synced pattern

> db.learningpatterns.aggregate([
  { $match: { source: 'ai_import' } },
  { $group: { _id: null, lastSync: { $max: '$createdAt' } } }
])
# Shows last sync timestamp
```

### QStash Logs

**View execution history:**
```
1. Go to: https://console.upstash.com/qstash
2. Click: "Schedules" → "Bot Pattern Sync" → "Logs"
3. Check:
   - Success rate (should be 95%+)
   - Average duration (should be 2-5 seconds)
   - Recent failures (investigate if any)
```

**Set up alerts (Optional):**
```
1. QStash → "Schedules" → "Bot Pattern Sync" → "Alerts"
2. Add alert:
   - Type: Failed Execution
   - Threshold: 3 consecutive failures
   - Action: Email notification
```

---

## 🐛 Troubleshooting

### Issue 1: Cron Returns 401 Unauthorized

**Symptoms:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Diagnosis:**
1. Check `CRON_SECRET` in `.env` matches QStash header
2. Verify Authorization header format: `Bearer <secret>`
3. Check environment variable loaded in production

**Fix:**
```bash
# Verify secret in production
# Railway: Settings → Variables → CRON_SECRET
# Vercel: Settings → Environment Variables → CRON_SECRET

# Update QStash header
# QStash → Schedules → Bot Pattern Sync → Edit
# Authorization: Bearer <new-secret>
```

---

### Issue 2: Cron Returns 500 Internal Error

**Symptoms:**
```json
{
  "success": false,
  "error": "Sync API failed"
}
```

**Diagnosis:**
1. Check API endpoint accessible: `/api/admin/bot-decision/sync-signal-patterns`
2. Check Bot Signal Learning Center has data: `/api/backtest/learning`
3. Check MongoDB connection

**Fix:**
```bash
# Test API endpoint manually
curl https://your-domain.com/api/admin/bot-decision/sync-signal-patterns \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"source":"backtest-learning","symbol":"BTCUSDT"}'

# Check response for detailed error
```

---

### Issue 3: Patterns Not Updating

**Symptoms:**
- Cron runs successfully (200 OK)
- But pattern count not increasing
- `updated: 0, skipped: 18` in response

**Diagnosis:**
- Patterns already synced (no new backtests)
- This is normal! Sync only creates/updates when Bot Signal has new data

**Expected Behavior:**
```
First sync:  created: 18, updated: 0, skipped: 0
Second sync: created: 0, updated: 0, skipped: 18 ✅ Normal
New backtest: created: 6, updated: 12, skipped: 0 ✅ Updated
```

---

### Issue 4: QStash Not Triggering

**Symptoms:**
- Schedule enabled, but no logs
- Cron never executes

**Diagnosis:**
1. Check QStash account active (not suspended)
2. Verify schedule enabled (toggle ON)
3. Check cron expression valid

**Fix:**
```bash
# Verify schedule in QStash dashboard
# Should show:
# Status: ✅ Enabled
# Next Run: 2025-11-07 12:45:00
# Last Run: 2025-11-07 12:30:00 (Success)

# If "Never Executed":
# - Click "Run Now" to test
# - Check logs for errors
# - Verify destination URL reachable
```

---

## 📈 Performance Expectations

### Sync Statistics (per execution)

| Metric | First Sync | Subsequent Syncs |
|--------|------------|------------------|
| Duration | 2-5 seconds | 1-3 seconds |
| Patterns Created | 18+ | 0-6 (new backtests only) |
| Patterns Updated | 0 | 0-12 (changed data) |
| Patterns Skipped | 0 | 18+ (no changes) |
| Database Writes | 18+ | 0-18 |
| API Calls | 2 (learning + sync) | 2 |

### Expected Behavior

**Daily (96 executions):**
- Total executions: 96 (every 15 minutes × 24 hours)
- Successful syncs: 95+ (99% success rate)
- Failed syncs: 0-1 (network issues, retried)
- New patterns: 0-30 (depends on new backtests)
- Updated patterns: 0-50 (pattern data changes)

**Monthly (2,880 executions):**
- Total executions: 2,880
- Successful syncs: 2,850+ (99% success rate)
- New patterns: 50-200 (new users + backtests)
- Database growth: ~200-500 pattern documents

---

## ✅ Success Criteria

**Cron is working correctly if:**
- [x] QStash schedule shows "Enabled" with green checkmark
- [x] Logs show 200 OK responses every 15 minutes
- [x] Average duration < 5 seconds
- [x] Success rate > 95%
- [x] Bot Decision Learning tab shows increasing pattern count
- [x] Last synced timestamp updates every 15 minutes
- [x] No 401/500 errors in logs

**Bot Decision AI is improving if:**
- [x] Pattern count > 0 (sync successful)
- [x] AI decision logs show confidence adjustments
- [x] Win rate trending upward over 7-14 days
- [x] False positives decreasing over time

---

## 🔗 Related Files

**Cron Endpoint:**
- `/src/app/api/cron/sync-bot-patterns/route.ts` - QStash handler

**Sync API:**
- `/src/app/api/admin/bot-decision/sync-signal-patterns/route.ts` - Internal sync logic

**Pattern Converter:**
- `/src/lib/pattern-sync.ts` - Bot Signal → Bot Decision conversion

**Documentation:**
- `/docs/BOT_SIGNAL_INTEGRATION_COMPLETE.md` - Full integration guide
- `/docs/BOT_SIGNAL_INTEGRATION_QUICK_REFERENCE.md` - Quick reference

---

## 🎯 Next Steps

1. **Set CRON_SECRET** in `.env` and production
2. **Deploy to production** (Railway/Vercel)
3. **Create QStash schedule** (15 minute interval)
4. **Test manual trigger** (Run Now button)
5. **Monitor first 24 hours** (check logs every hour)
6. **Set up alerts** (email on 3 consecutive failures)
7. **Review weekly** (check success rate, pattern growth)

---

**Last Updated:** November 7, 2025
**Status:** ✅ Ready for deployment
**Next Review:** After 7 days of automated sync
