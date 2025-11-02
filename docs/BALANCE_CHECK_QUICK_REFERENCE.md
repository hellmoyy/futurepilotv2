# ⚡ Balance Check Cron - Quick Reference

## 🎯 5-Minute Setup

### 1. Generate CRON_SECRET
```bash
openssl rand -base64 32
```

### 2. Add to Environment
```bash
# .env.local
CRON_SECRET=your-generated-secret
```

### 3. Test Locally
```bash
export CRON_SECRET="your-generated-secret"
./scripts/test-balance-check.sh http://localhost:3000
```

### 4. Setup Upstash QStash

**URL:** https://console.upstash.com/qstash

**Settings:**
```
Name: Balance Check Hourly
URL: https://yourdomain.com/api/cron/balance-check?token=YOUR_CRON_SECRET
Cron: 0 * * * *
Method: POST
```

---

## 📊 Alert Levels

| Balance | Status | Notification |
|---------|--------|--------------|
| ≥ $15 | 🟢 Healthy | None |
| < $15 | ⚡ Warning | Email alert |
| < $12 | ⚠️ Critical | Urgent email |
| < $10 | 🚫 Cannot Trade | Email + In-app |

---

## 🧪 Test Commands

```bash
# View Statistics (GET - no notifications)
curl "https://yourdomain.com/api/cron/balance-check?token=YOUR_SECRET"

# Run Balance Check (POST - sends notifications)
curl -X POST "https://yourdomain.com/api/cron/balance-check?token=YOUR_SECRET"
```

---

## 📁 Files

```
API Route:    /src/app/api/cron/balance-check/route.ts
Test Script:  /scripts/test-balance-check.sh
Docs:         /docs/BALANCE_CHECK_CRON_SETUP.md
```

---

## ✅ Verification

- [ ] Local test passed (3/3 tests)
- [ ] Production deployed with CRON_SECRET
- [ ] Upstash schedule created
- [ ] Test run successful (200 OK)
- [ ] Schedule enabled
- [ ] Users receive notifications

---

## 🔗 Links

- **Console:** https://console.upstash.com/qstash
- **Logs:** https://console.upstash.com/qstash/logs
- **Cron Helper:** https://crontab.guru/#0_*_*_*_*

---

**Status:** ✅ READY FOR DEPLOYMENT
