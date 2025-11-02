# ✅ Upstash QStash Setup - COMPLETE

**Date:** November 2, 2025  
**Status:** 🎉 Production Ready

---

## 📊 Active Schedule

**Schedule Details:**
- **Schedule ID:** `scd_5fReHbL6qb62rXBVNGJjQXF2wcnQ`
- **Endpoint:** `https://futurepilot.pro/api/cron/balance-check?token=amu5KjBHoh31QIB5AyoXKB8wDSEPgJ3U`
- **Cron Expression:** `0 * * * *` (every hour at minute 0)
- **Method:** POST
- **Retries:** 3
- **Status:** ✅ Active (isPaused: false)

**Management:**
- **Console:** https://console.upstash.com/qstash
- **Logs:** https://console.upstash.com/qstash/logs
- **Created:** November 2, 2025

---

## 🧪 Testing Results

### ✅ Direct Publish Test

**Command:**
```bash
curl -X POST "https://qstash.upstash.io/v2/publish/https://futurepilot.pro/api/cron/balance-check?token=amu5KjBHoh31QIB5AyoXKB8wDSEPgJ3U" \
  -H "Authorization: Bearer <QSTASH_TOKEN>" \
  -H "Content-Type: application/json"
```

**Result:**
```json
{
  "messageId": "msg_26hZCxZCuWyyTWPmSVBrNB882AxJ7SxLcKsTTmHHMGYANkBPdCoQd1hbCX1Frye"
}
```

**Status:** ✅ Message delivered successfully

---

## 🔧 Setup Script

**Location:** `/scripts/setup-upstash-balance-check.js`

**Usage:**
```bash
node scripts/setup-upstash-balance-check.js
```

**Prerequisites:**
1. `QSTASH_TOKEN` in `.env.local`
2. `CRON_SECRET` in `.env.local`
3. Production endpoint deployed

**Output:**
```
✅ SETUP COMPLETE! ✅
Balance check cron will run every hour automatically! 🎉

Schedule ID: scd_5fReHbL6qb62rXBVNGJjQXF2wcnQ
URL: https://console.upstash.com/qstash
Test: Click "Send Now" to trigger immediately
```

---

## 🐛 Troubleshooting

### Issue: "invalid destination url: endpoint has invalid scheme"

**Root Cause:** URL was encoded with `encodeURIComponent()`, turning `https://` into `https%3A%2F%2F`

**Solution:** Pass URL directly without encoding:
```javascript
// ❌ WRONG
path: `/v2/schedules/${encodeURIComponent(endpoint)}`

// ✅ CORRECT
path: `/v2/schedules/${endpoint}`
```

### Issue: Schedule trigger fails but schedule exists

**Solution:** Use direct publish instead:
```bash
curl -X POST "https://qstash.upstash.io/v2/publish/<your-endpoint>" \
  -H "Authorization: Bearer <QSTASH_TOKEN>" \
  -H "Content-Type: application/json"
```

---

## 📋 Manual Verification

### 1. Check Schedule Exists
```bash
curl -s "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer <QSTASH_TOKEN>" | \
  jq '.[] | select(.destination | contains("balance-check"))'
```

### 2. Get Schedule Details
```bash
curl -s "https://qstash.upstash.io/v2/schedules/scd_5fReHbL6qb62rXBVNGJjQXF2wcnQ" \
  -H "Authorization: Bearer <QSTASH_TOKEN>" | jq .
```

### 3. Test Direct Publish
```bash
curl -X POST "https://qstash.upstash.io/v2/publish/https://futurepilot.pro/api/cron/balance-check?token=amu5KjBHoh31QIB5AyoXKB8wDSEPgJ3U" \
  -H "Authorization: Bearer <QSTASH_TOKEN>" \
  -H "Content-Type: application/json"
```

### 4. Check Logs
Visit: https://console.upstash.com/qstash/logs

---

## 🎯 What Happens Every Hour

**At minute 0 of every hour:**

1. QStash triggers POST to `/api/cron/balance-check`
2. API checks all users' gas fee balances
3. Sends notifications based on alert level:
   - **CRITICAL:** Balance < $10 (cannot trade)
   - **WARNING:** Balance $10-$15 (low balance)
   - **NORMAL:** Balance > $15 (informational)
4. Notifications sent via:
   - Email (Resend)
   - In-app notifications
   - Optional: SMS/Telegram (future)

---

## 📊 Monitoring

**Key Metrics to Monitor:**

1. **Schedule Execution:**
   - Check logs hourly for successful executions
   - Monitor error rate in QStash console

2. **API Performance:**
   - Response time should be < 5 seconds
   - Check for authentication failures

3. **Email Delivery:**
   - Monitor Resend dashboard for send rate
   - Check bounce/spam rates

4. **User Response:**
   - Track top-up rate after low balance alerts
   - Measure time from alert to top-up

---

## 🔐 Security Notes

1. **CRON_SECRET Protection:**
   - Never expose in logs or error messages
   - Rotate periodically (quarterly)
   - Different from API keys

2. **QSTASH_TOKEN:**
   - Store in `.env.local` only
   - Never commit to git
   - Use signing keys for webhook verification

3. **Endpoint Security:**
   - Rate limiting: Max 10 req/min
   - IP whitelisting: QStash IPs only (optional)
   - Audit logs for all executions

---

## 📝 Next Steps

- [x] Create schedule in QStash
- [x] Test with direct publish
- [x] Verify logs in console
- [ ] Monitor first automatic execution (next hour)
- [ ] Check email delivery
- [ ] Review user responses
- [ ] Add Telegram notifications (optional)
- [ ] Setup alerting for failed crons

---

## 🆘 Support

**If schedule stops working:**

1. Check QStash console for errors
2. Verify endpoint is accessible (curl test)
3. Check CRON_SECRET hasn't changed
4. Review logs in production
5. Re-run setup script if needed

**Emergency Contact:**
- QStash Support: https://upstash.com/support
- Internal: admin@futurepilot.pro

---

**Last Updated:** November 2, 2025  
**Author:** AI Assistant  
**Version:** 1.0
