# 🚀 Railway Environment Variables - MAINNET PRODUCTION

**Last Updated:** November 11, 2025  
**Status:** ✅ All Variables Set

---

## ✅ REQUIRED ENVIRONMENT VARIABLES

### 🌐 Network Configuration
```bash
NETWORK_MODE=mainnet
NEXT_PUBLIC_NETWORK_MODE=mainnet
BINANCE_TESTNET=false
```

### 🔗 RPC Endpoints (Mainnet)
```bash
ETHEREUM_RPC_URL=https://ethereum.publicnode.com
BSC_RPC_URL=https://1rpc.io/bnb
```

### 💰 USDT Contract Addresses (Mainnet)
```bash
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955
USDT_ERC20_DECIMAL=6
USDT_BEP20_DECIMAL=18
```

### 📡 Moralis (Multi-chain Webhook)
```bash
MORALIS_API_KEY=xxxxx...  # Get from Moralis dashboard
MORALIS_BSC_STREAM_ID=100e00c2-1091-4787-9725-943dd7694d2b
MORALIS_ETHEREUM_STREAM_ID=100e00c2-1091-4787-9725-943dd7694d2b
```

### 🔐 Authentication
```bash
NEXTAUTH_SECRET=xxxxx...  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://futurepilot.pro
JWT_SECRET=xxxxx...       # Generate with: openssl rand -base64 32
JWT_EXPIRES_IN=7d
```

### 🗄️ Database
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

### 🔑 Encryption
```bash
ENCRYPTION_SECRET_KEY=xxxxx...         # Generate with: openssl rand -hex 32
ENCRYPTION_SECRET_KEY_LEGACY=xxxxx...  # Old key for migration
```

### 🤖 API Keys
```bash
OPENAI_API_KEY=sk-proj-xxxxx...  # Get from OpenAI dashboard
DEEPSEEK_API_KEY=sk-xxxxx...     # Get from DeepSeek dashboard
RESEND_API_KEY=re_xxxxx...       # Get from Resend dashboard
CRYPTONEWS_API_KEY=xxxxx...      # Get from CryptoNews API
BINANCE_API_SECRET=xxxxx...      # Get from Binance account
```

### ⚙️ Application Settings
```bash
NEXT_PUBLIC_APP_NAME=FuturePilot
NEXT_PUBLIC_APP_URL=https://futurepilot.pro
NEXT_PUBLIC_API_URL=https://futurepilot.pro/api
NEXT_PUBLIC_CAPTCHA_ENABLED=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxxxx...  # Get from Cloudflare Turnstile
TURNSTILE_SECRET_KEY=xxxxx...            # Get from Cloudflare Turnstile
PIN_SIGNAL_CONFIGURATION=366984          # 6-digit PIN for signal center
LOG_LEVEL=debug
CRON_SECRET=xxxxx...                     # Generate random string for cron security
```

### 💳 Master Wallet (Custodial System)
```bash
MASTER_WALLET_ADDRESS=0x2e95ca7db1ba2f68e3cff330a9a55980c7283b0a
# Private key encrypted in database, not in env
```

---

## 🔄 DEPLOYMENT STEPS

### 1. Verify All Variables Set
```bash
# Check Railway Dashboard → Variables tab
# Ensure all 30+ variables are present
```

### 2. Trigger Redeploy
```bash
# Option A: Railway Dashboard
# Go to: Deployments → Click "Redeploy"

# Option B: Railway CLI
railway up --detach

# Option C: Git Push (auto-deploy)
git push origin main
```

### 3. Monitor Deployment
```bash
# Railway Dashboard → Deployments → Logs
# Wait for: "✓ Deployed successfully"
# Check for errors in build/runtime logs
```

### 4. Verify Production
```bash
# Test these URLs:
https://futurepilot.pro                    # Homepage
https://futurepilot.pro/register           # Register
https://futurepilot.pro/login              # Login
https://futurepilot.pro/dashboard          # Dashboard
https://futurepilot.pro/topup              # Topup (should show "Mainnet")
https://futurepilot.pro/administrator      # Admin

# Check console for errors (should be clean)
# Check network badge on /topup (should be green "Mainnet")
```

---

## ✅ VERIFICATION CHECKLIST

### After Redeploy:
- [ ] Build completed without errors
- [ ] Deployment status: "Deployed"
- [ ] Homepage loads correctly
- [ ] User can register (mainnet wallet created)
- [ ] Topup page shows "Mainnet" badge (green, not yellow)
- [ ] Dashboard displays properly
- [ ] Admin panel accessible
- [ ] No console errors
- [ ] Moralis webhook active

### Critical Endpoints to Test:
```bash
# 1. Health Check
GET https://futurepilot.pro/api/health

# 2. Network Config
GET https://futurepilot.pro/api/config/network
# Should return: { networkMode: "mainnet" }

# 3. Wallet Generation
POST https://futurepilot.pro/api/wallet/generate
# Should create mainnet wallet addresses

# 4. Moralis Webhook
POST https://futurepilot.pro/api/webhook/moralis
# Should accept Moralis stream data
```

---

## 🐛 TROUBLESHOOTING

### Issue: Topup Page Still Shows "Testnet"
**Cause:** `NEXT_PUBLIC_NETWORK_MODE` not set or deployment not refreshed

**Solution:**
1. Verify variable exists: Railway Dashboard → Variables
2. Value must be exactly: `mainnet` (lowercase, no spaces)
3. Redeploy: Railway Dashboard → Deployments → Redeploy
4. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
5. Clear browser cache if needed

### Issue: Wallet Generation Creates Testnet Address
**Cause:** `NETWORK_MODE` (backend) not set

**Solution:**
1. Check both variables exist:
   - `NETWORK_MODE=mainnet` (backend)
   - `NEXT_PUBLIC_NETWORK_MODE=mainnet` (frontend)
2. Redeploy application
3. Test wallet generation again

### Issue: Deposit Not Detected
**Cause:** Moralis stream not active or webhook not configured

**Solution:**
1. Check Moralis Dashboard → Streams
2. Stream ID: `100e00c2-1091-4787-9725-943dd7694d2b`
3. Webhook URL: `https://futurepilot.pro/api/webhook/moralis`
4. Status should be: "Active"
5. Test webhook manually from Moralis dashboard

### Issue: Environment Variables Not Loading
**Cause:** Railway deployment cache

**Solution:**
1. Delete deployment cache: Railway Dashboard → Settings → "Clear Cache"
2. Redeploy from scratch
3. Wait 3-5 minutes for full deployment
4. Check logs for environment variable loading

---

## 📊 EXPECTED BEHAVIOR (Production)

### ✅ Correct Mainnet Behavior:

**Topup Page (`/topup`):**
- Badge shows: `🟢 Mainnet` (green)
- Networks listed: Ethereum + BSC Mainnet
- Contract addresses: 
  - ERC20: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
  - BEP20: `0x55d398326f99059fF775485246999027B3197955`

**Wallet Generation:**
- Creates real Ethereum/BSC addresses
- Deposits tracked on mainnet blockchain
- Real USDT balance updates

**Dashboard:**
- Network indicator: Mainnet
- Balance shows real deposits
- Trading bot uses Binance mainnet

### ❌ Incorrect Testnet Behavior (MUST FIX):

**Topup Page:**
- Badge shows: `🟡 Testnet` (yellow)
- Networks listed: Sepolia + BSC Testnet
- Wrong contract addresses

**Wallet Generation:**
- Creates testnet addresses
- Uses testnet RPC endpoints
- No real money involved

---

## 🎯 POST-DEPLOYMENT TASKS

### 1. First Real Deposit Test ⏳
```bash
# Send test deposit to master wallet
To: 0x2e95ca7db1ba2f68e3cff330a9a55980c7283b0a
Network: Ethereum Mainnet OR BSC Mainnet
Token: USDT
Amount: $10-20 USDT

# Monitor:
1. Railway logs for webhook hit
2. Database for new transaction
3. User dashboard for balance update
4. Admin panel for transaction record
```

### 2. Monitor for 24 Hours
```bash
# Check these every few hours:
- Railway logs for errors
- Database for unexpected data
- User registrations (mainnet wallets)
- Moralis stream activity
- Error tracking (if enabled)
```

### 3. Backup Configuration
```bash
# Export Railway environment variables
# Keep backup in secure location
# Update documentation if changed
```

---

## 📝 NOTES

### Important:
- ✅ All environment variables are **production-ready**
- ✅ No testnet references in variables
- ✅ Moralis stream configured for mainnet
- ✅ USDT contracts are mainnet addresses
- ✅ Database cleaned of all testnet data

### Security:
- ⚠️ Never commit `.env` file to git
- ⚠️ Keep API keys secure
- ⚠️ Rotate secrets periodically
- ⚠️ Use Railway's secret management

### Performance:
- ✅ RPC endpoints are rate-limit-free (publicnode.com)
- ✅ MongoDB Atlas has auto-scaling
- ✅ Railway provides CDN caching
- ✅ Next.js optimized for production

---

## 🚀 DEPLOYMENT COMMAND

```bash
# Trigger redeploy after setting all variables
railway up --detach

# Or via git push (auto-deploy)
git push origin main

# Monitor deployment
railway logs --follow
```

---

**Status:** ✅ All environment variables set and verified  
**Next Action:** Redeploy and test first real mainnet deposit  
**Expected Result:** Topup page shows "Mainnet" badge (green)
