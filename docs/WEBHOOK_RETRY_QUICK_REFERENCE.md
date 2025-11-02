# Webhook Retry System - Quick Reference

**Quick access guide for common tasks**

---

## 🚀 Quick Start

### 1. **Check if webhook retry is working:**
```typescript
// Check recent retries
db.webhook_retries.find().sort({ createdAt: -1 }).limit(10).pretty()

// Check statistics
curl http://localhost:3000/api/admin/webhook-retries/stats
```

### 2. **Monitor Dead Letter Queue:**
```bash
# Open admin dashboard
http://localhost:3000/administrator/webhook-failures

# Or query MongoDB
db.webhook_retries.find({ status: 'dead_letter' }).count()
```

### 3. **Manually retry a webhook:**
```bash
# In admin dashboard:
# 1. Go to /administrator/webhook-failures
# 2. Filter by "Dead Letter Queue"
# 3. Click "View" on webhook
# 4. Click "Retry Now"

# Or via API:
curl -X POST http://localhost:3000/api/admin/webhook-retries/manual-retry \
  -H "Content-Type: application/json" \
  -d '{"webhookId": "WEBHOOK_ID_HERE"}'
```

---

## 📊 Key Metrics Dashboard

```bash
# Statistics API
GET /api/admin/webhook-retries/stats

# Response shows:
# - Total webhooks
# - By status (pending, retrying, dead_letter, success)
# - By type (moralis, binance, other)
```

---

## 🔄 Retry Timeline

| Attempt | Delay | Formula | Total Time |
|---------|-------|---------|------------|
| 0 | 0s (immediate) | NOW | 0s |
| 1 | 1s | 2^0 | 1s |
| 2 | 2s | 2^1 | 3s |
| 3 | 4s | 2^2 | 7s |
| 4 | 8s | 2^3 | 15s |
| 5 | 16s | 2^4 | 31s |
| **After 5** | **→ DLQ** | Max retries | **31s total** |

---

## 🛠️ Common Commands

### MongoDB Queries

```javascript
// Find all pending retries
db.webhook_retries.find({ status: 'pending' })

// Find webhooks in DLQ
db.webhook_retries.find({ status: 'dead_letter' })

// Count by status
db.webhook_retries.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
])

// Find failed webhooks with specific error
db.webhook_retries.find({
  lastError: /database timeout/i
})

// Get oldest pending retry
db.webhook_retries.find({ status: 'pending' })
  .sort({ nextRetryAt: 1 })
  .limit(1)

// Delete old successful retries (>30 days)
db.webhook_retries.deleteMany({
  status: 'success',
  createdAt: { $lt: new Date(Date.now() - 30*24*60*60*1000) }
})
```

### Cron Job Commands

```typescript
// Manually trigger retry cron
import { processWebhookRetries } from '@/cron/webhook-retry';
await processWebhookRetries();

// Manually trigger cleanup
import { cleanupOldWebhookRetries } from '@/cron/webhook-retry';
await cleanupOldWebhookRetries();

// Get statistics
import { getWebhookRetryStats } from '@/cron/webhook-retry';
const stats = await getWebhookRetryStats();
```

---

## 🚨 Troubleshooting Checklist

### Webhooks Not Retrying?
- [ ] Cron job running? Check cron logs
- [ ] MongoDB connected? Check connection string
- [ ] `nextRetryAt` in past? Should trigger immediately
- [ ] Check `status` = 'pending' or 'retrying'

### Too Many in DLQ?
- [ ] Check common error patterns
- [ ] Fix underlying issue (DB, API, network)
- [ ] Bulk retry after fix
- [ ] Monitor success rate

### Email Not Sent?
- [ ] SMTP credentials correct? `.env` check
- [ ] Admin email set? `ADMIN_EMAIL` env var
- [ ] Email service working? Test manually
- [ ] Check spam folder

### Duplicate Transactions?
- [ ] Duplicate detection working? Check `txHash` uniqueness
- [ ] Transaction model has unique index? `txHash` indexed
- [ ] Verify balance calculation correct

---

## 📁 File Locations

| Component | File Path |
|-----------|-----------|
| **Model** | `/src/models/WebhookRetry.ts` |
| **Manager** | `/src/lib/webhookRetry.ts` |
| **Processor** | `/src/lib/webhookProcessors/moralis.ts` |
| **Cron** | `/src/cron/webhook-retry.ts` |
| **Webhook Route** | `/src/app/api/webhook/moralis/route.ts` |
| **Admin Page** | `/src/app/administrator/webhook-failures/page.tsx` |
| **API - List** | `/src/app/api/admin/webhook-retries/route.ts` |
| **API - Stats** | `/src/app/api/admin/webhook-retries/stats/route.ts` |
| **API - Retry** | `/src/app/api/admin/webhook-retries/manual-retry/route.ts` |
| **API - Delete** | `/src/app/api/admin/webhook-retries/[id]/route.ts` |
| **Docs** | `/docs/WEBHOOK_RETRY_SYSTEM.md` |

---

## 🧪 Test Scenarios

### Test 1: Simulate Failure
```typescript
// In webhook route, throw error temporarily
throw new Error('TEST: Database timeout');
```

**Expected:**
- Webhook saved to `webhook_retries` collection
- `status: 'pending'`, `retryCount: 0`
- `nextRetryAt` = NOW (immediate)

---

### Test 2: Verify Exponential Backoff
```bash
# Wait for cron to run 5 times
# Check nextRetryAt after each run:
# Attempt 1: +1s
# Attempt 2: +2s
# Attempt 3: +4s
# Attempt 4: +8s
# Attempt 5: +16s
```

**Expected:**
- Each retry scheduled with exponential delay
- Total ~31 seconds over 5 attempts

---

### Test 3: Test DLQ
```bash
# Keep throwing errors for 5 retries
# After 5th failure:
```

**Expected:**
- `status: 'dead_letter'`
- `movedToDLQAt` timestamp set
- `dlqReason: "Max retries (5) reached"`
- Admin email received

---

### Test 4: Manual Retry
```bash
# In admin dashboard:
# 1. Find DLQ webhook
# 2. Click "Retry Now"
```

**Expected:**
- Webhook `retryCount` reset to 0
- DLQ fields cleared
- Immediate processing attempt
- Either success or back to pending

---

## 📈 Monitoring Alerts

### Critical (Immediate Action)
```javascript
// DLQ size > 10
db.webhook_retries.countDocuments({ status: 'dead_letter' }) > 10

// Oldest pending > 10 minutes
const oldestPending = db.webhook_retries.findOne(
  { status: 'pending' },
  { sort: { nextRetryAt: 1 } }
);
(Date.now() - oldestPending.nextRetryAt) > 10 * 60 * 1000
```

### Warning (Monitor Closely)
```javascript
// DLQ size > 5
db.webhook_retries.countDocuments({ status: 'dead_letter' }) > 5

// Success rate < 70%
const stats = await WebhookRetry.aggregate([
  { $group: {
    _id: null,
    total: { $sum: 1 },
    success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } }
  }}
]);
(stats[0].success / stats[0].total) < 0.7
```

---

## 🔐 Security Notes

1. **Admin Auth:** TODO - Implement authentication in API routes
2. **Payload Sanitization:** Redact sensitive data before logging
3. **Rate Limiting:** Limit manual retry attempts (max 3/minute)
4. **Input Validation:** Validate MongoDB ObjectIds

---

## 🎯 Success Criteria

- ✅ Retry success rate > 80%
- ✅ DLQ size < 5 webhooks
- ✅ Average retry attempts < 2 before success
- ✅ Oldest pending retry < 5 minutes
- ✅ Admin email delivered within 30 seconds of DLQ
- ✅ Manual retry success > 90%

---

## 📞 Quick Support

**Issue:** Webhook stuck in pending  
**Fix:** `await processWebhookRetries()` manually

**Issue:** DLQ growing  
**Fix:** Check `lastError`, fix root cause, bulk retry

**Issue:** Email not sent  
**Fix:** Verify SMTP env vars, test EmailService manually

**Issue:** Duplicate transactions  
**Fix:** Check `txHash` uniqueness, recalculate balance

---

**End of Quick Reference**  
For complete documentation, see: `/docs/WEBHOOK_RETRY_SYSTEM.md`
