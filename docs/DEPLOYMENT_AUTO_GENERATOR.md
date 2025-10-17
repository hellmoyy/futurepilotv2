# 🚀 Deployment Guide: Auto Signal Generator

**Masalah:** "Generator akan tetap jalan meskipun tidak ada user mengunjungi web?"

**Jawaban:** Tergantung platform deployment!

---

## 📋 Table of Contents

1. [Platform Comparison](#platform-comparison)
2. [Option A: VPS Always-On (Recommended)](#option-a-vps-always-on)
3. [Option B: Railway Pro](#option-b-railway-pro)
4. [Option C: Vercel + External Cron](#option-c-vercel--external-cron)
5. [Auto-Start Configuration](#auto-start-configuration)
6. [Monitoring & Health Checks](#monitoring--health-checks)

---

## 🔍 Platform Comparison

### ❌ **TIDAK AKAN JALAN 24/7:**

| Platform | Type | Issue | Solution |
|----------|------|-------|----------|
| **Vercel** | Serverless | Functions sleep saat idle | Use external cron |
| **Netlify** | Serverless | Functions sleep saat idle | Use external cron |
| **Railway Free** | Container | Sleep after 5 min idle | Upgrade to Pro |
| **Render Free** | Container | Spin down after 15 min | Upgrade to Paid |

**Kenapa tidak jalan?**
```
Request → Server Wake → Process → Response → Sleep
```
- Server hanya bangun saat ada HTTP request
- Setelah selesai, server sleep lagi
- Background jobs (setInterval) akan STOP
- Generator tidak jalan tanpa traffic

---

### ✅ **AKAN JALAN 24/7:**

| Platform | Type | Cost | Pros | Cons |
|----------|------|------|------|------|
| **DigitalOcean** | VPS | $6/mo | Full control, 100% uptime | Manual setup |
| **Linode** | VPS | $5/mo | Cheap, reliable | Manual setup |
| **Railway Pro** | Container | $5+/mo | Easy deploy, auto-scaling | Usage-based pricing |
| **Heroku Standard** | Container | $7/mo | Easy deploy, proven | Expensive for scale |
| **AWS EC2** | VPS | Free-$$ | Free tier 1 year | Complex setup |

**Kenapa jalan 24/7?**
```
Server Start → Always Running → Background Jobs Active → Never Sleep
```
- Server terus jalan meskipun tidak ada request
- Background jobs tetap running
- setInterval terus eksekusi
- Generator otomatis jalan

---

## 🎯 Option A: VPS Always-On (Recommended)

### **Platforms:**
- DigitalOcean Droplet ($6/month)
- Linode Compute Instance ($5/month)
- AWS EC2 t2.micro (Free 1 year)
- Google Cloud e2-micro (Free 1 year)

### **Why Best?**
- ✅ True always-on server
- ✅ Background jobs guaranteed running
- ✅ Full control over environment
- ✅ Can run PM2 for process management
- ✅ Best price/performance ratio

---

### 🔧 **Setup: DigitalOcean Droplet**

#### **1. Create Droplet**

```bash
# Choose:
# - Image: Ubuntu 22.04 LTS
# - Plan: Basic ($6/mo)
# - RAM: 1GB
# - Disk: 25GB SSD
```

#### **2. SSH to Server**

```bash
ssh root@your-droplet-ip
```

#### **3. Install Node.js & PM2**

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version  # v20.x.x
npm --version   # 10.x.x

# Install PM2 (process manager)
npm install -g pm2

# Install git
apt install -y git
```

#### **4. Clone & Setup Project**

```bash
# Clone repository
git clone https://github.com/hellmoyy/futurepilotv2.git
cd futurepilotv2

# Install dependencies
npm install

# Setup environment variables
nano .env
```

**`.env` Configuration:**
```bash
# Copy from .env.example
cp .env.example .env

# Edit with your values
nano .env

# IMPORTANT: Enable auto-start
AUTO_START_SIGNAL_GENERATOR=true
SIGNAL_GENERATOR_INTERVAL=5

# Set production URL
NEXTAUTH_URL=http://your-droplet-ip:3000
```

#### **5. Build & Start with PM2**

```bash
# Build production
npm run build

# Start with PM2
pm2 start npm --name "futurepilot" -- start

# View logs
pm2 logs futurepilot

# Check status
pm2 status

# Should show:
# ┌─────┬──────────────┬─────────┬─────────┬─────────┬──────────┐
# │ id  │ name         │ mode    │ status  │ restart │ uptime   │
# ├─────┼──────────────┼─────────┼─────────┼─────────┼──────────┤
# │ 0   │ futurepilot  │ fork    │ online  │ 0       │ 10s      │
# └─────┴──────────────┴─────────┴─────────┴─────────┴──────────┘
```

#### **6. Setup Auto-Restart on Server Reboot**

```bash
# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup

# Copy and run the command it outputs (something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Reboot to test
reboot

# After reboot, SSH again and check:
pm2 status
# Should still show "online"
```

#### **7. Setup Nginx Reverse Proxy (Optional)**

```bash
# Install nginx
apt install -y nginx

# Create nginx config
nano /etc/nginx/sites-available/futurepilot
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name your-droplet-ip;  # or your-domain.com

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/futurepilot /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart nginx
systemctl restart nginx

# Now accessible at: http://your-droplet-ip
```

#### **8. Verify Auto Generator**

```bash
# Check PM2 logs
pm2 logs futurepilot --lines 50

# Should see:
# 🚀 [INIT] Next.js server starting...
# 🤖 [INIT] Auto-starting signal generator (5s interval)...
# ✅ [INIT] Signal generator started successfully
# 🤖 [AUTO] Generating signals for 10 pairs...
# ✅ [AUTO] Generated 10 signals in 1234ms

# Test API
curl http://localhost:3000/api/cron/control

# Should return:
# {"success":true,"status":"running","isRunning":true,"hasInterval":true}
```

---

## 🚂 Option B: Railway Pro

### **Why Railway?**
- ✅ Easy deployment via GitHub
- ✅ Always-on with Pro plan
- ✅ Auto-deploy on push
- ✅ Built-in monitoring
- ⚠️ Usage-based pricing ($5 base + compute)

---

### 🔧 **Setup: Railway Pro**

#### **1. Create Railway Account**

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Upgrade to Pro plan ($5/month)

#### **2. Deploy from GitHub**

```bash
# Push your code to GitHub
git add .
git commit -m "feat: auto signal generator"
git push origin main
```

1. Click "New Project" on Railway
2. Select "Deploy from GitHub repo"
3. Choose `hellmoyy/futurepilotv2`
4. Railway auto-detects Next.js

#### **3. Add Environment Variables**

In Railway dashboard → Variables tab:

```bash
NEXTAUTH_SECRET=your-secret
MONGODB_URI=mongodb+srv://...
BINANCE_API_KEY=your-key
BINANCE_API_SECRET=your-secret
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
ENCRYPTION_KEY=your-32-char-key
CRON_SECRET=your-cron-secret

# IMPORTANT: Enable auto-start
AUTO_START_SIGNAL_GENERATOR=true
SIGNAL_GENERATOR_INTERVAL=5
```

#### **4. Configure railway.toml**

Already configured in your repo:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

#### **5. Deploy & Monitor**

```bash
# Railway auto-deploys
# Watch logs in dashboard

# Should see:
# 🚀 [INIT] Next.js server starting...
# 🤖 [INIT] Auto-starting signal generator (5s interval)...
# ✅ [INIT] Signal generator started successfully
```

#### **6. Get Public URL**

Railway gives you: `https://futurepilotv2-production.up.railway.app`

Update `.env`:
```bash
NEXTAUTH_URL=https://futurepilotv2-production.up.railway.app
PRODUCTION_URL=https://futurepilotv2-production.up.railway.app
```

---

## 🌐 Option C: Vercel + External Cron

### **When to Use?**
- ✅ Free hosting needed
- ✅ Can accept 1-minute minimum interval
- ⚠️ Cannot do 5-second intervals
- ⚠️ Cold start latency

---

### 🔧 **Setup: Vercel + Upstash Cron**

#### **1. Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts
# Project name: futurepilotv2
# Framework: Next.js

# Add environment variables in Vercel dashboard
```

#### **2. Setup Upstash Cron**

1. Go to [upstash.com](https://upstash.com)
2. Create account (Free tier: 1M requests/month)
3. Create new QStash schedule

**Schedule Configuration:**
```
Name: Generate Trading Signals
URL: https://futurepilotv2.vercel.app/api/cron/generate-signals
Method: POST
Schedule: */1 * * * * (every 1 minute)
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
```

#### **3. Add CRON_SECRET to Vercel**

```bash
# Generate secret
openssl rand -base64 32

# Add to Vercel env vars:
CRON_SECRET=your-generated-secret
```

#### **4. Test Endpoint**

```bash
curl -X POST https://futurepilotv2.vercel.app/api/cron/generate-signals \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should return:
# {"success":true,"signalsGenerated":10,"timestamp":"2025-10-17T..."}
```

**Limitations:**
- ❌ Minimum 1-minute interval (not 5 seconds)
- ❌ Cold start latency (1-3 seconds)
- ❌ Not guaranteed execution time
- ⚠️ Costs increase with frequency

---

## ⚙️ Auto-Start Configuration

### **Environment Variables**

```bash
# .env
AUTO_START_SIGNAL_GENERATOR=true  # or false
SIGNAL_GENERATOR_INTERVAL=5       # seconds (1-3600)
```

### **How It Works**

1. **Server starts** → Next.js runs `instrumentation.ts`
2. **Check env** → If `AUTO_START_SIGNAL_GENERATOR=true`
3. **Import generator** → Dynamic import to avoid circular deps
4. **Start generator** → Call `startSignalGenerator(intervalSeconds)`
5. **Background loop** → setInterval runs every X seconds
6. **Generate signals** → Fetch market data → Analyze → Save to DB
7. **Repeat forever** → Until server stops or crashes

### **Manual Control**

Even with auto-start, you can control manually:

```bash
# Stop auto-started generator
curl -X DELETE http://localhost:3000/api/cron/control

# Start again with different interval
curl -X POST http://localhost:3000/api/cron/control \
  -H "Content-Type: application/json" \
  -d '{"intervalSeconds": 10}'

# Check status
curl http://localhost:3000/api/cron/control
```

---

## 📊 Monitoring & Health Checks

### **Check Generator Status**

```bash
# API status
curl http://your-domain.com/api/cron/control

# Response:
{
  "success": true,
  "status": "running",
  "isRunning": true,
  "hasInterval": true
}
```

### **View Recent Signals**

```bash
# Get latest 10 signals
curl http://your-domain.com/api/signals/latest?limit=10

# Check timestamps
curl -s http://your-domain.com/api/signals/latest?limit=3 | \
  jq '.data[] | {symbol, action, generatedAt}'

# Should see fresh timestamps (< 30 seconds old)
```

### **PM2 Monitoring (VPS only)**

```bash
# Real-time logs
pm2 logs futurepilot --lines 100

# CPU & Memory usage
pm2 monit

# Detailed info
pm2 info futurepilot

# Restart if needed
pm2 restart futurepilot
```

### **Setup Uptime Monitoring**

**UptimeRobot (Free):**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.com/api/cron/control`
   - Interval: 5 minutes
   - Alert: Email on downtime

**Alerts:**
- ✅ Get email if server goes down
- ✅ Check generator status every 5 min
- ✅ Also keeps serverless warm (if used)

---

## 🐛 Troubleshooting

### **Generator Not Starting**

```bash
# Check environment variable
echo $AUTO_START_SIGNAL_GENERATOR  # Should be "true"

# Check logs
pm2 logs futurepilot | grep "INIT"

# Should see:
# 🚀 [INIT] Next.js server starting...
# 🤖 [INIT] Auto-starting signal generator (5s interval)...
```

**Common Issues:**
- ❌ `AUTO_START_SIGNAL_GENERATOR=false` → Set to `true`
- ❌ `SIGNAL_GENERATOR_INTERVAL` invalid → Set 1-3600
- ❌ MongoDB connection failed → Check `MONGODB_URI`
- ❌ Binance API error → Check API keys

---

### **Generator Keeps Stopping**

```bash
# Check if server is sleeping (serverless platforms)
# Fix: Use VPS or Railway Pro

# Check for crashes
pm2 logs futurepilot --err --lines 100

# Check error rate
curl http://your-domain.com/api/signals/latest?limit=50 | \
  jq '.data | group_by(.symbol) | length'

# Should return number of unique symbols (>= 10)
```

---

### **High API Rate Limit**

If generating signals too frequently:

```bash
# Reduce frequency
curl -X DELETE http://localhost:3000/api/cron/control
curl -X POST http://localhost:3000/api/cron/control \
  -d '{"intervalSeconds": 30}'  # Every 30 seconds instead of 5

# Or reduce number of pairs in /src/config/trading-pairs.ts
```

---

## 📝 Summary

| Deployment Type | Always-On? | Setup Difficulty | Cost | Best For |
|-----------------|------------|------------------|------|----------|
| **VPS (DigitalOcean)** | ✅ Yes | 🔧 Medium | $6/mo | Production |
| **Railway Pro** | ✅ Yes | 🟢 Easy | $5+/mo | Quick deploy |
| **Heroku Standard** | ✅ Yes | 🟢 Easy | $7/mo | Enterprise |
| **Vercel + Cron** | ⚠️ Partial | 🟢 Easy | Free-$10 | MVP/Testing |
| **Railway Free** | ❌ No | 🟢 Easy | Free | Development |

---

## ✅ Recommendation

**For FuturePilot Production:**

1. **Start with Railway Pro** ($5/month)
   - Easy GitHub deployment
   - Set `AUTO_START_SIGNAL_GENERATOR=true`
   - Generator runs automatically
   - Scale up if needed

2. **Later migrate to DigitalOcean VPS** ($6/month)
   - When you need more control
   - Better price at scale
   - PM2 for process management
   - Full customization

**Current Setup (Development):**
```bash
npm run dev
# Generator running locally ✅
# Perfect for testing
```

**Next Step:**
1. Push code to GitHub
2. Deploy to Railway Pro
3. Add environment variables
4. Set `AUTO_START_SIGNAL_GENERATOR=true`
5. Done! Generator runs 24/7 ✅

---

**Questions?** Check:
- `/docs/AUTO_SIGNAL_GENERATION.md` - Auto-generation guide
- `/docs/CRON_ARCHITECTURE.md` - Cron system architecture
- `/docs/PRODUCTION_DEPLOYMENT.md` - General deployment guide
