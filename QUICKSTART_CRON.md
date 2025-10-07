# Quick Start: Cron Job Setup

## 🚀 Quick Setup (## Step 3: Test Your Cron Endpoint

### Quick Test (via URL):
```bash
# Test with query parameter (easiest)
curl "https://futurepilot.pro/api/cron/run-bots?token=YOUR_CRON_SECRET"

# Or test with header
curl https://futurepilot.pro/api/cron/run-bots \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```. Generate Secret
```bash
openssl rand -base64 32
```
Copy the output (example: `XYZ123abc...`)

### 2. Add to Environment
```bash
# Local development (.env.local)
echo "CRON_SECRET=XYZ123abc..." >> .env.local

# Or for production deployment
# Add CRON_SECRET to your hosting platform (Vercel, Railway, etc.)
```

### 3. Restart Application
```bash
npm run dev
```

### 4. Test Locally
```bash
# Set the secret in your terminal
export CRON_SECRET="XYZ123abc..."

# Run test script
chmod +x scripts/test-cron.sh
./scripts/test-cron.sh http://localhost:3000
```

### 5. Create Upstash Cron

Go to: https://console.upstash.com/qstash

**Click:** Create Cron Job

## Step 2: Setup Upstash Cron Job

### Option A: Using Query Parameter (Easiest for Upstash)

1. Go to [Upstash QStash Console](https://console.upstash.com/qstash)
2. Click **"Create Schedule"**
3. Fill in:
   - **Destination URL:** `https://futurepilot.pro/api/cron/run-bots?token=YOUR_CRON_SECRET`
   - **Schedule:** `*/5 * * * *` (every 5 minutes)
   - **Method:** `GET` or `POST`
   - **No headers needed!** Token is in URL

### Option B: Using Authorization Header (More Secure)

1. Go to [Upstash QStash Console](https://console.upstash.com/qstash)
2. Click **"Create Schedule"**
3. Fill in:
   - **Destination URL:** `https://futurepilot.pro/api/cron/run-bots`
   - **Schedule:** `*/5 * * * *` (every 5 minutes)
   - **Method:** `GET` or `POST`
   - **Headers:** Add custom header:
     - Key: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET`

---

**Click:** Create

## ✅ Done! 

Your bots will now run automatically every 5 minutes.

## 📊 Monitor

- **Upstash Logs:** https://console.upstash.com/qstash/logs
- **Live Signal:** https://futurepilot.pro/dashboard/live-signal
- **Positions:** https://futurepilot.pro/dashboard/position

## 🔧 Test Endpoints

### Local Test:
```bash
curl http://localhost:3000/api/cron/run-bots \
  -H "Authorization: Bearer YOUR_SECRET"
```

### Production Test:
```bash
curl https://futurepilot.pro/api/cron/run-bots \
  -H "Authorization: Bearer YOUR_SECRET"
```

## 📝 What Happens Every Cron Run?

1. ✅ Fetch all ACTIVE bots from database
2. ✅ For each bot:
   - Get exchange credentials
   - Check market conditions
   - Analyze with AI + Technical indicators
   - Execute trades if signal is strong
   - Update position & statistics
   - Log everything
3. ✅ Return summary of all operations

## ⚙️ Recommended Schedule

| Interval | Requests/Day | Use Case |
|----------|--------------|----------|
| 1 min    | 1,440        | Testing only |
| 5 min    | 288          | **Recommended** |
| 15 min   | 96           | Conservative |
| 1 hour   | 24           | Long-term strategies |

## 🛟 Troubleshooting

**"No active bots"** 
→ Start a bot in Auto Trading page

**"Unauthorized"**
→ Check CRON_SECRET matches in both .env and Upstash

**"Timeout"**
→ Increase Upstash timeout to 300s

## 🔐 Security Checklist

- [ ] Strong CRON_SECRET (32+ chars)
- [ ] HTTPS only in production
- [ ] Secret not in git
- [ ] Different secret for dev/prod
- [ ] Monitor Upstash logs

---

**Need Help?** Check UPSTASH_CRON_SETUP.md for detailed guide.
