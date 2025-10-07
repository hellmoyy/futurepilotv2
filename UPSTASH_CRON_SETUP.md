# Upstash Cron Job Setup Guide

## Overview
This guide explains how to set up Upstash Cron to automatically run your trading bots at regular intervals.

## Prerequisites
1. Upstash account (https://upstash.com/)
2. Deployed FuturePilot application with API accessible via public URL
3. CRON_SECRET environment variable set

## Step 1: Set Environment Variable

Add this to your `.env.local` or deployment environment variables:

```bash
CRON_SECRET=your-super-secret-random-string-here
```

**Important:** Generate a strong random string for production. You can use:
```bash
openssl rand -base64 32
```

## Step 2: Create Upstash Cron Job

1. Go to [Upstash Console](https://console.upstash.com/)
2. Navigate to **QStash** → **Cron Jobs**
3. Click **Create Cron Job**

### Configuration:

**🎯 Method A: Using URL Query Parameter (EASIEST!)**

**Destination URL:**
```
https://futurepilot.pro/api/cron/run-bots?token=YOUR_CRON_SECRET
```
*(Replace YOUR_CRON_SECRET with your actual secret)*

**Schedule (Choose one):**

- **Every 1 minute** (Aggressive): `* * * * *`
- **Every 5 minutes** (Recommended): `*/5 * * * *`
- **Every 15 minutes** (Conservative): `*/15 * * * *`
- **Every hour**: `0 * * * *`

**Method:** `GET` or `POST`

**Headers:** Not required! ✅

**Timeout:** `300` seconds (5 minutes)

**Retries:** `3`

---

**🔒 Method B: Using Authorization Header (More Secure)**

**Destination URL:**
```
https://futurepilot.pro/api/cron/run-bots
```

**Schedule:** Same as above

**Method:** `GET` or `POST`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_CRON_SECRET"
}
```
*(Use the same value from CRON_SECRET)*

**Timeout:** `300` seconds (5 minutes)

**Retries:** `3`

## Step 3: Test Your Cron Job

### Method A - Test with Query Parameter:

```bash
# Replace YOUR_CRON_SECRET with your actual secret
curl "https://futurepilot.pro/api/cron/run-bots?token=YOUR_CRON_SECRET"
```

### Method B - Test with Authorization Header:

```bash
curl https://futurepilot.pro/api/cron/run-bots \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Expected Response:

```json
{
  "success": true,
  "timestamp": "2025-10-07T12:00:00.000Z",
  "summary": {
    "totalBots": 2,
    "successful": 2,
    "failed": 0,
    "withPositions": 1
  },
  "results": [
    {
      "botId": "670b1234567890abcdef1234",
      "botName": "Bitcoin Pro",
      "success": true,
      "message": "Position active",
      "hasPosition": true,
      "safetyWarnings": []
    },
    {
      "botId": "670b1234567890abcdef5678",
      "botName": "Bitcoin Pro",
      "success": true,
      "message": "No trade signal. Action: HOLD, Confidence: 65%",
      "hasPosition": false,
      "safetyWarnings": []
    }
  ]
}
```

## Step 4: Monitor Cron Jobs

### In Upstash Console:
1. Go to **QStash** → **Logs**
2. Monitor execution history
3. Check for errors or failures

### In Your Application:
1. Check **Live Signal** page for new analysis entries
2. Check **Position** page for active positions
3. Monitor bot statistics in **Auto Trading** page

## Cron Schedule Examples

### Production Recommended:
```
*/5 * * * *   # Every 5 minutes
*/15 * * * *  # Every 15 minutes (safer for production)
```

### Development/Testing:
```
*/1 * * * *   # Every 1 minute (for testing only)
0 */4 * * *   # Every 4 hours
```

### Specific Times:
```
0 9,12,15,18 * * *  # At 9 AM, 12 PM, 3 PM, 6 PM
0 */2 * * *         # Every 2 hours
30 * * * *          # Every hour at :30
```

## Security Best Practices

1. **Never commit CRON_SECRET to version control**
2. **Use strong random strings** (32+ characters)
3. **Rotate secrets periodically** (every 90 days)
4. **Monitor logs** for unauthorized access attempts
5. **Use HTTPS only** for production endpoints

## Troubleshooting

### Error: "Unauthorized"
- Check that `Authorization` header matches `CRON_SECRET`
- Verify header format: `Bearer <secret>`

### Error: "No active bots to run"
- Start at least one bot in the **Auto Trading** page
- Check bot status in database

### Error: "Exchange connection not found"
- Verify exchange connection exists in **CEX Settings**
- Check that bot has valid `exchangeConnectionId`

### Timeout Issues:
- Increase timeout in Upstash (max 300s)
- Reduce number of active bots
- Optimize strategy execution time

## Monitoring & Alerts

### Set up QStash Alerts:
1. Go to **QStash** → **Settings**
2. Enable **Email Notifications**
3. Set alert conditions:
   - Failed requests > 3
   - Success rate < 90%

### Custom Monitoring:
Monitor the cron endpoint response:
- `summary.successful` should equal `summary.totalBots`
- `summary.failed` should be 0
- Check for `safetyWarnings` in results

## Cost Optimization

### Upstash QStash Pricing:
- **Free Tier:** 500 requests/day
- **Pay-as-you-go:** $0.50 per 10,000 requests

### Calculate Your Usage:
```
Every 5 minutes = 288 requests/day (within free tier)
Every 1 minute = 1,440 requests/day (needs paid plan)
```

### Recommendations:
- Start with **every 5-15 minutes**
- Scale up only if needed
- Use longer intervals for less volatile pairs

## Alternative Cron Providers

If not using Upstash, you can use:

1. **Vercel Cron** (requires Pro plan)
2. **Cron-job.org** (free, external service)
3. **EasyCron** (free tier available)
4. **GitHub Actions** (using scheduled workflows)

### Example: Cron-job.org Setup
1. Go to https://cron-job.org/
2. Create free account
3. Add new cron job with same URL and headers
4. Set schedule and enable

## Next Steps

1. ✅ Set `CRON_SECRET` environment variable
2. ✅ Deploy application with `/api/cron/run-bots` endpoint
3. ✅ Create Upstash cron job
4. ✅ Test manually with curl
5. ✅ Start a trading bot
6. ✅ Monitor first few executions
7. ✅ Adjust schedule based on performance

## Support

For issues:
- Check Upstash logs
- Review application logs
- Check MongoDB for bot status
- Verify API credentials are valid

---

**Ready to Start?** Follow Step 1 above to set up your CRON_SECRET! 🚀
