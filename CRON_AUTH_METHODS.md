# Upstash Cron Setup - Two Methods

FuturePilot supports **two authentication methods** for the cron endpoint to give you flexibility with different cron services.

---

## 🎯 Method 1: Query Parameter (EASIEST!)

**Best for:** Upstash QStash and services that don't easily support custom headers

### Upstash Configuration:

1. **Destination URL:**
   ```
   https://futurepilot.pro/api/cron/run-bots?token=YOUR_CRON_SECRET
   ```

2. **Schedule:** `*/5 * * * *` (every 5 minutes)

3. **Method:** `GET`

4. **Headers:** None needed! ✅

### Test Command:
```bash
curl "https://futurepilot.pro/api/cron/run-bots?token=YOUR_CRON_SECRET"
```

### Test Script:
```bash
chmod +x scripts/test-cron-query.sh
./scripts/test-cron-query.sh
```

**Pros:**
- ✅ No custom headers needed
- ✅ Works with any cron service
- ✅ Easy to test in browser
- ✅ Simple Upstash setup

**Cons:**
- ⚠️ Token visible in URL logs
- ⚠️ Less secure than header method

---

## 🔒 Method 2: Authorization Header (MORE SECURE)

**Best for:** Services that support custom headers, production environments

### Upstash Configuration:

1. **Destination URL:**
   ```
   https://futurepilot.pro/api/cron/run-bots
   ```

2. **Schedule:** `*/5 * * * *`

3. **Method:** `GET`

4. **Headers:**
   ```json
   {
     "Authorization": "Bearer YOUR_CRON_SECRET"
   }
   ```

### Test Command:
```bash
curl https://futurepilot.pro/api/cron/run-bots \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Script:
```bash
chmod +x scripts/test-cron.sh
./scripts/test-cron.sh
```

**Pros:**
- ✅ More secure (token not in URL)
- ✅ Standard authentication method
- ✅ Better for production
- ✅ Not logged in URL access logs

**Cons:**
- ⚠️ Requires header support
- ⚠️ May be harder to configure in some services

---

## 🚀 Which Method Should I Use?

| Scenario | Recommended Method | Reason |
|----------|-------------------|---------|
| **Upstash QStash** | Query Parameter | Easier to configure |
| **Production** | Authorization Header | More secure |
| **Testing/Dev** | Query Parameter | Quick and easy |
| **Can't add headers** | Query Parameter | Only option |
| **Maximum security** | Authorization Header | Industry standard |

---

## 🛡️ Security Notes

### For Query Parameter Method:
1. ✅ Use a strong random CRON_SECRET (32+ characters)
2. ✅ Rotate secret regularly (every 90 days)
3. ✅ Monitor access logs for unauthorized attempts
4. ⚠️ Token will appear in server logs - acceptable for private deployments

### For Header Method:
1. ✅ Headers are not logged in most access logs
2. ✅ Standard OAuth 2.0 Bearer token format
3. ✅ Better for compliance requirements
4. ✅ Recommended for public-facing production

---

## 📊 Example Success Response

Both methods return the same response:

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
      "hasPosition": true
    }
  ]
}
```

---

## 🔧 Environment Variable

Both methods use the same `CRON_SECRET` from your `.env` file:

```bash
# Generate a strong secret:
openssl rand -base64 32

# Add to .env:
CRON_SECRET=your-generated-secret-here
```

---

## 📝 Quick Start

1. **Choose your method** based on the table above
2. **Set up Upstash** with the appropriate configuration
3. **Test manually** using curl commands
4. **Monitor** the first few executions
5. **Check logs** in Live Signal and Position pages

---

## ❓ Troubleshooting

### Query Parameter Method:
```bash
# Test unauthorized (should fail):
curl "https://futurepilot.pro/api/cron/run-bots?token=wrong-token"
# Expected: {"error": "Unauthorized"}, Status: 401

# Test authorized (should succeed):
curl "https://futurepilot.pro/api/cron/run-bots?token=YOUR_CRON_SECRET"
# Expected: {"success": true, ...}
```

### Header Method:
```bash
# Test unauthorized (should fail):
curl https://futurepilot.pro/api/cron/run-bots
# Expected: {"error": "Unauthorized"}, Status: 401

# Test authorized (should succeed):
curl https://futurepilot.pro/api/cron/run-bots \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# Expected: {"success": true, ...}
```

---

## 🎯 Recommendation

**For Upstash QStash:** Use **Query Parameter** method - it's simpler and works perfectly with Upstash's interface.

Just use this URL in Upstash:
```
https://futurepilot.pro/api/cron/run-bots?token=YOUR_CRON_SECRET
```

No headers, no complexity! 🚀
