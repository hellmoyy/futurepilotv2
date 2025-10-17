# ✅ Railway Pro Deployment Checklist

**Date:** October 17, 2025  
**Branch:** `feature/auto-deposit-monitoring-2025-10-09`  
**Status:** Ready for deployment

---

## 📋 Pre-Deployment Checklist

### ✅ Code Fixes Completed

- [x] Fixed `next.config.js` - Merged experimental config blocks
- [x] Fixed `TechnicalAnalyzer.ts` - Prevent NaN in volume.ratio calculation
- [x] Fixed `live-signal/page.tsx` - Escaped quotes (ESLint error)
- [x] Created `instrumentation.ts` - Auto-start generator on server boot
- [x] Added `.env.example` - Documentation for environment variables
- [x] Created health check endpoint - `/api/health`
- [x] Local build test passed - No errors, only warnings

### 📦 Files Created/Modified

```
Modified:
✓ next.config.js (fixed experimental config)
✓ src/lib/trading/engines/TechnicalAnalyzer.ts (volume NaN fix)
✓ src/app/dashboard/live-signal/page.tsx (ESLint fix)
✓ .env (added AUTO_START_SIGNAL_GENERATOR)

Created:
✓ src/instrumentation.ts (auto-start hook)
✓ src/app/api/health/route.ts (health check)
✓ .env.example (template)
✓ docs/DEPLOYMENT_AUTO_GENERATOR.md (deployment guide)
```

---

## 🚂 Railway Deployment Steps

### 1️⃣ **Verify GitHub Push**

```bash
# ✅ Already pushed to GitHub
git log --oneline -1
# 0bf99eb feat: Auto signal generator with Railway support

git remote -v
# origin  https://github.com/hellmoyy/futurepilotv2.git
```

### 2️⃣ **Railway Dashboard Setup**

**Go to:** [railway.app/project/your-project](https://railway.app)

**Check:**
- [ ] Repository connected: `hellmoyy/futurepilotv2`
- [ ] Branch deployed: `feature/auto-deposit-monitoring-2025-10-09` or `main`
- [ ] Auto-deploy enabled

### 3️⃣ **Environment Variables** (CRITICAL!)

**In Railway Dashboard → Variables:**

```bash
# Core App
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=https://futurepilotv2-production.up.railway.app
MONGODB_URI=<your-mongodb-uri>

# Binance API
BINANCE_API_KEY=<your-binance-api-key>
BINANCE_API_SECRET=<your-binance-api-secret>

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>

# Email
RESEND_API_KEY=<your-resend-api-key>

# Encryption
ENCRYPTION_SECRET_KEY=<your-32-char-encryption-key>

# Cron
CRON_SECRET=<your-cron-secret>

# RPC URLs
ETHEREUM_RPC_URL=https://ethereum.publicnode.com
BSC_RPC_URL=https://1rpc.io/bnb
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955

# 🚀 AUTO SIGNAL GENERATOR (IMPORTANT!)
AUTO_START_SIGNAL_GENERATOR=true
SIGNAL_GENERATOR_INTERVAL=5
```

**Double-check these critical ones:**
```
✓ AUTO_START_SIGNAL_GENERATOR=true  (enables auto-start)
✓ SIGNAL_GENERATOR_INTERVAL=5       (5 seconds polling)
✓ MONGODB_URI                        (must be valid)
✓ BINANCE_API_KEY                    (must be valid)
✓ BINANCE_API_SECRET                 (must be valid)
```

### 4️⃣ **Trigger Deployment**

Railway auto-deploys on push, but you can manually trigger:

1. Go to Railway project
2. Click "Deployments" tab
3. Click "Deploy" button (or wait for auto-deploy)
4. Watch build logs

**Expected logs:**
```
[Builder] > futurepilotv2@0.1.0 build
[Builder] > next build
[Builder]   ▲ Next.js 14.2.18
[Builder]    ✓ Compiled successfully
[Builder]    Linting and checking validity of types ...
[Builder]    Creating an optimized production build ...
[Builder]    ✓ Completed in 45s

[Deployment] > futurepilotv2@0.1.0 start
[Deployment] > next start
[Deployment]   ▲ Next.js 14.2.18
[Deployment]   - Local:        http://0.0.0.0:3000
[Deployment] 🚀 [INIT] Next.js server starting...
[Deployment] 🤖 [INIT] Auto-starting signal generator (5s interval)...
[Deployment] 🤖 Starting auto signal generator (every 5 seconds)...
[Deployment] ✅ [INIT] Signal generator started successfully
[Deployment]   ✓ Ready in 2s
```

### 5️⃣ **Verify Deployment**

**A. Check Health Endpoint:**
```bash
curl https://futurepilotv2-production.up.railway.app/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "checks": {
    "server": "healthy",
    "database": "connected",
    "generator": {
      "status": "running",
      "hasInterval": true
    },
    "environment": "configured"
  }
}
```

**B. Check Generator Status:**
```bash
curl https://futurepilotv2-production.up.railway.app/api/cron/control
```

**Expected response:**
```json
{
  "success": true,
  "status": "running",
  "isRunning": true,
  "hasInterval": true
}
```

**C. Check Latest Signals:**
```bash
curl 'https://futurepilotv2-production.up.railway.app/api/signals/latest?limit=5'
```

**Expected:**
- 5+ signals returned
- Recent timestamps (< 1 minute old)
- No MATICUSDT errors in Railway logs

**D. Monitor Railway Logs:**
```
Railway Dashboard → Deployments → View Logs

Should see every 5 seconds:
🔄 [AUTO] Generating signals...
✅ [AUTO] Generated 18 signals in 1234ms
```

---

## 🐛 Troubleshooting

### Issue: Generator Not Starting

**Symptom:**
```json
{"generator": {"status": "stopped"}}
```

**Solutions:**
1. Check environment variable:
   ```
   AUTO_START_SIGNAL_GENERATOR=true  (not false!)
   ```

2. Check Railway logs for errors:
   ```
   ❌ [INIT] Failed to start signal generator: ...
   ```

3. Redeploy:
   ```bash
   Railway Dashboard → Redeploy
   ```

### Issue: MATICUSDT Errors Continue

**Symptom:**
```
❌ [AUTO] Error for MATICUSDT: Signal validation failed
```

**Solution:**
- Should be fixed in latest code
- Check if Railway deployed latest commit: `0bf99eb`
- Force redeploy if needed

### Issue: Build Fails

**Symptom:**
```
ERROR: failed to build: exit code: 1
```

**Solution:**
- ESLint errors should be fixed
- Check Railway logs for specific error
- Verify local build works: `npm run build`

---

## 📊 Success Metrics

### ✅ Deployment Successful If:

- [ ] Health check returns `"status": "healthy"`
- [ ] Generator status returns `"isRunning": true`
- [ ] Signals endpoint returns data < 1 minute old
- [ ] Railway logs show signal generation every 5 seconds
- [ ] No MATICUSDT volume.ratio errors
- [ ] Website accessible: https://your-domain.railway.app
- [ ] Dashboard shows live signals updating

### 📈 Expected Performance:

```
Signal Generation:
✓ Interval: 5 seconds
✓ Pairs: 18-19 coins (BTCUSDT, ETHUSDT, etc.)
✓ Speed: 900-1500ms per batch
✓ Uptime: 24/7 (never stops)

Database:
✓ Connection: Cached (reused)
✓ Write speed: < 100ms per signal
✓ Auto-expire: 30 days TTL

API Latency:
✓ /api/health: < 200ms
✓ /api/cron/control: < 100ms
✓ /api/signals/latest: < 500ms
```

---

## 🎯 Next Steps After Deployment

1. **Monitor for 24 hours:**
   - Watch Railway logs
   - Check for memory leaks
   - Verify continuous operation

2. **Setup monitoring:**
   - Add UptimeRobot: https://uptimerobot.com
   - Monitor: `/api/health` every 5 minutes
   - Email alerts on downtime

3. **Optimize if needed:**
   - Increase interval if rate limited
   - Reduce pairs if too slow
   - Add more indicators if accuracy low

4. **Optional enhancements:**
   - WebSocket for real-time push
   - PM2 integration (if using VPS later)
   - Custom domain setup
   - SSL certificate

---

## 📞 Support

**Documentation:**
- `/docs/DEPLOYMENT_AUTO_GENERATOR.md` - Full deployment guide
- `/docs/AUTO_SIGNAL_GENERATION.md` - System architecture
- `.env.example` - Environment variables reference

**Railway Support:**
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app

**FuturePilot Issues:**
- GitHub: https://github.com/hellmoyy/futurepilotv2/issues

---

## ✅ Checklist Summary

**Before Deploy:**
- [x] Code pushed to GitHub
- [x] Build tested locally
- [x] Environment variables prepared
- [ ] Railway project created
- [ ] Railway connected to GitHub

**During Deploy:**
- [ ] Environment variables added
- [ ] `AUTO_START_SIGNAL_GENERATOR=true` set
- [ ] Deployment triggered
- [ ] Build logs checked (no errors)

**After Deploy:**
- [ ] Health check passed
- [ ] Generator running
- [ ] Signals generating every 5 seconds
- [ ] No MATICUSDT errors
- [ ] Dashboard accessible
- [ ] Monitoring setup (optional)

---

**Status:** ✅ Ready to deploy to Railway Pro!

**Estimated deployment time:** 3-5 minutes  
**Expected result:** Auto signal generator running 24/7 🚀
