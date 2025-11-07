# 📰 Auto News Fetcher - Upstash QStash Setup

## 🎯 Quick Setup (5 Minutes)

### Step 1: Get Upstash QStash Token

1. Go to **https://console.upstash.com/**
2. Login/Sign up
3. Navigate to **QStash** section
4. Copy your **QStash Token**

### Step 2: Create Schedule

**Via Upstash Console:**

1. Go to **QStash** → **Schedules** → **Create Schedule**
2. Fill in:
   - **Name:** `news-fetcher-1min`
   - **URL:** `https://futurepilotv2.railway.app/api/cron/fetch-news` *(replace with your Railway URL)*
   - **Cron:** `* * * * *` (every 1 minute)
   - **Method:** GET
   - **Headers:**
     ```
     Authorization: Bearer dev-secret-12345
     ```
     *(replace with your CRON_SECRET)*
   - **Retries:** 3
   - **Timeout:** 60s

3. Click **Create**

**Via API (Alternative):**

```bash
export QSTASH_TOKEN="your_qstash_token"
export APP_URL="https://futurepilotv2.railway.app"
export CRON_SECRET="dev-secret-12345"

curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer ${QSTASH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"destination\": \"${APP_URL}/api/cron/fetch-news\",
    \"cron\": \"* * * * *\",
    \"headers\": {
      \"Authorization\": \"Bearer ${CRON_SECRET}\"
    },
    \"retries\": 3
  }"
```

### Step 3: Verify

1. Wait 1 minute
2. Check **Upstash Console** → **Schedules** → `news-fetcher-1min` → **Logs**
3. Check Railway logs:
   ```
   ✅ [CRON] News fetch completed: { new: 5, updated: 2 }
   ```

---

## ⚠️ Important Notes

### Free Tier Limits

- **Upstash Free:** 500 requests/day
- **1-minute interval:** 1,440 requests/day → **EXCEEDS FREE TIER**
- **5-minute interval:** 288 requests/day → ✅ **FREE**

### Recommended Intervals

| Interval | Cron | Daily Requests | Cost |
|----------|------|----------------|------|
| 1 minute | `* * * * *` | 1,440 | **Paid** (~$10/mo) |
| 5 minutes | `*/5 * * * *` | 288 | **FREE** ✅ |
| 15 minutes | `*/15 * * * *` | 96 | **FREE** ✅ |

**For production (free tier):** Use **5-minute interval**

---

## 🔄 Update Interval

### Change to 5 Minutes (Free Tier)

**Via Upstash Console:**
1. Go to **Schedules** → `news-fetcher-1min`
2. Click **Edit**
3. Change Cron to: `*/5 * * * *`
4. Save

**Via API:**
```bash
# Delete old schedule
curl -X DELETE "https://qstash.upstash.io/v2/schedules/{SCHEDULE_ID}" \
  -H "Authorization: Bearer ${QSTASH_TOKEN}"

# Create new with 5-min interval
curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer ${QSTASH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"destination\": \"${APP_URL}/api/cron/fetch-news\",
    \"cron\": \"*/5 * * * *\",
    \"headers\": {
      \"Authorization\": \"Bearer ${CRON_SECRET}\"
    }
  }"
```

---

## 🧪 Testing

### Test Endpoint

```bash
# Local
curl http://localhost:3000/api/cron/fetch-news \
  -H "Authorization: Bearer dev-secret-12345"

# Production
curl https://futurepilotv2.railway.app/api/cron/fetch-news \
  -H "Authorization: Bearer dev-secret-12345"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2025-11-07T...",
  "processed": 50,
  "new": 5,
  "updated": 2,
  "skipped": 43,
  "deleted": 0,
  "errors": 0
}
```

---

## 📊 Monitoring

### Upstash Dashboard

1. **Schedules** → `news-fetcher-1min`
2. View:
   - ✅ Success rate
   - ❌ Failed requests
   - ⏱️ Average latency
   - 📊 Execution logs

### Railway Logs

```bash
railway logs --tail
```

Look for:
```
✅ [CRON] News fetch completed: { new: X, updated: Y }
❌ [CRON] News fetch error: ...
```

---

## 🛠️ Environment Variables

Add to Railway/Vercel:

```bash
# Upstash QStash (optional, for signature verification)
QSTASH_TOKEN=eyJxxx...
QSTASH_CURRENT_SIGNING_KEY=sig_xxx
QSTASH_NEXT_SIGNING_KEY=sig_xxx

# Cron Authorization
CRON_SECRET=dev-secret-12345  # Change in production!

# App URL
NEXT_PUBLIC_APP_URL=https://futurepilotv2.railway.app

# CryptoNews API
CRYPTONEWS_API_KEY=your_api_key

# DeepSeek AI (optional, for sentiment analysis)
DEEPSEEK_API_KEY=sk-xxx
```

---

## ✅ Production Checklist

- [ ] Upstash account created
- [ ] Schedule created (5-min interval for free tier)
- [ ] CRON_SECRET set in Railway
- [ ] NEXT_PUBLIC_APP_URL configured
- [ ] Test endpoint manually
- [ ] Monitor first execution in Upstash logs
- [ ] Verify news appearing in `/administrator/bot-decision` → News tab
- [ ] Set up alerts for failures (optional)

---

**Last Updated:** November 7, 2025  
**Status:** ✅ Ready for Deployment
