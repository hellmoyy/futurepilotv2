# Production Deployment Guide
## FuturePilot - https://futurepilot.pro

This guide covers deploying FuturePilot to production at https://futurepilot.pro

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

**Required Variables for Production:**

```bash
# Application
NEXT_PUBLIC_APP_NAME=FuturePilot
NEXT_PUBLIC_APP_URL=https://futurepilot.pro
NEXT_PUBLIC_API_URL=https://futurepilot.pro/api

# Database
MONGODB_URI=your_production_mongodb_uri

# Encryption (GENERATE NEW FOR PRODUCTION!)
ENCRYPTION_SECRET_KEY=run: openssl rand -hex 16

# Authentication
NEXTAUTH_URL=https://futurepilot.pro
NEXTAUTH_SECRET=run: openssl rand -base64 32

# JWT
JWT_SECRET=run: openssl rand -base64 32
JWT_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Email Service
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@futurepilot.pro

# Cron Job Security (CRITICAL!)
CRON_SECRET=run: openssl rand -base64 32

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

### 2. Generate Production Secrets

```bash
# Generate ENCRYPTION_SECRET_KEY
openssl rand -hex 16

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

**⚠️ IMPORTANT:** Use DIFFERENT secrets for production than development!

---

## 🚀 Deployment Platforms

### Option 1: Vercel (Recommended)

#### A. Connect Repository
1. Go to https://vercel.com/
2. Click "New Project"
3. Import from GitHub: `hellmoyy/futurepilotv2`
4. Select main branch

#### B. Configure Project
- **Framework Preset:** Next.js
- **Root Directory:** ./
- **Build Command:** `npm run build`
- **Output Directory:** .next
- **Install Command:** `npm install`

#### C. Environment Variables
Add all production variables from `.env.production.example`:
```
Vercel Dashboard → Project Settings → Environment Variables
```

Add each variable:
- Select "Production" environment
- Click "Add"

#### D. Domain Configuration
1. Go to **Settings** → **Domains**
2. Add custom domain: `futurepilot.pro`
3. Add www redirect: `www.futurepilot.pro` → `futurepilot.pro`
4. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

#### E. Deploy
- Push to main branch or click "Deploy" in Vercel
- Wait for deployment to complete
- Visit https://futurepilot.pro

---

### Option 2: Railway

#### A. Create New Project
1. Go to https://railway.app/
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `hellmoyy/futurepilotv2`

#### B. Configure Service
- **Start Command:** `npm start`
- **Build Command:** `npm run build`
- **Root Directory:** /

#### C. Environment Variables
```
Railway Dashboard → Project → Variables
```
Add all production variables

#### D. Domain Setup
1. Go to **Settings** → **Domains**
2. Click "Generate Domain" or "Custom Domain"
3. Add: `futurepilot.pro`
4. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: provided by Railway
   ```

#### E. Deploy
- Automatic deployment on git push
- Or trigger manual deployment

---

### Option 3: DigitalOcean App Platform

#### A. Create App
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect GitHub: `hellmoyy/futurepilotv2`

#### B. Configure
- **Branch:** main
- **Source Directory:** /
- **Build Command:** `npm run build`
- **Run Command:** `npm start`

#### C. Environment Variables
Add in App Settings → Environment Variables

#### D. Domain
- Add custom domain in Settings
- Configure DNS as instructed

---

## 🔧 Post-Deployment Configuration

### 1. Upstash Cron Setup

After deployment is live:

```bash
# Test the endpoint first
curl https://futurepilot.pro/api/cron/run-bots \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

If successful, set up Upstash Cron:

**URL:** `https://futurepilot.pro/api/cron/run-bots`
**Schedule:** `*/5 * * * *`
**Headers:**
```json
{
  "authorization": "Bearer YOUR_CRON_SECRET"
}
```

### 2. Email Configuration (Resend)

1. Go to https://resend.com/domains
2. Add domain: `futurepilot.pro`
3. Configure DNS records:
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [provided by Resend]
   
   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   ```
4. Verify domain
5. Update `FROM_EMAIL` to `noreply@futurepilot.pro`

### 3. Database Backup

Set up automatic backups for MongoDB:

**MongoDB Atlas:**
- Go to Cluster → Backup
- Enable Continuous Cloud Backup
- Set retention policy
- Configure backup schedule

### 4. Monitoring Setup

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

Add to `src/app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Sentry (Error Tracking):**
```bash
npm install @sentry/nextjs
```

Configure in `.env.production`:
```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## 🔐 Security Hardening

### 1. HTTPS Enforcement
Vercel automatically provides HTTPS, but verify:
- All API calls use `https://`
- Mixed content warnings are resolved
- HSTS headers are enabled

### 2. Rate Limiting
Add rate limiting to API routes:

```typescript
// src/middleware/rateLimit.ts
import { NextRequest } from 'next/server';

const rateLimit = new Map();

export function checkRateLimit(req: NextRequest, limit = 100) {
  const ip = req.ip || 'anonymous';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = rateLimit.get(ip);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

### 3. CORS Configuration
Update `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://futurepilot.pro' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### 4. API Key Rotation Schedule
Set reminders to rotate keys every 90 days:
- CRON_SECRET
- JWT_SECRET
- ENCRYPTION_SECRET_KEY
- NEXTAUTH_SECRET

---

## 📊 Monitoring & Logging

### Health Check Endpoint
Create `/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
}
```

### Uptime Monitoring
Set up monitoring with:
- **UptimeRobot** (https://uptimerobot.com/)
- **Pingdom** (https://www.pingdom.com/)
- **Better Uptime** (https://betteruptime.com/)

Monitor:
- `https://futurepilot.pro/`
- `https://futurepilot.pro/api/health`
- `https://futurepilot.pro/api/cron/run-bots` (with auth header)

---

## 🧪 Testing Production

### 1. Smoke Tests
```bash
# Homepage
curl -I https://futurepilot.pro/

# API Health
curl https://futurepilot.pro/api/health

# Cron Endpoint (with auth)
curl https://futurepilot.pro/api/cron/run-bots \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 2. User Flow Tests
- ✅ User registration
- ✅ Email verification
- ✅ Login/logout
- ✅ Connect exchange
- ✅ Start bot
- ✅ View positions
- ✅ Check live signals
- ✅ Stop bot

### 3. Bot Operation Tests
- ✅ Cron job executes every 5 minutes
- ✅ Bots analyze market correctly
- ✅ Safety limits are enforced
- ✅ Logs are created
- ✅ Positions update in real-time

---

## 🚨 Rollback Plan

If deployment fails:

### Vercel:
1. Go to Deployments
2. Find last working deployment
3. Click "Promote to Production"

### Railway:
1. Go to Deployments
2. Click on previous deployment
3. Click "Redeploy"

### Manual:
```bash
git revert HEAD
git push origin main
```

---

## 📝 Launch Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Production secrets generated (new, not dev secrets)
- [ ] Domain DNS configured and verified
- [ ] SSL certificate active (HTTPS working)
- [ ] Upstash cron job created and tested
- [ ] Email domain verified (Resend)
- [ ] Database backup enabled
- [ ] Error tracking configured (Sentry)
- [ ] Analytics installed (Vercel Analytics)
- [ ] Health checks configured
- [ ] Rate limiting implemented
- [ ] CORS configured
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Support email configured

---

## 🎯 Post-Launch Tasks

**Day 1:**
- Monitor Upstash logs for cron execution
- Check error logs for any issues
- Verify bot operations
- Monitor database performance

**Week 1:**
- Review user signups
- Monitor bot performance
- Check email delivery rates
- Review API response times

**Month 1:**
- Analyze trading bot success rates
- Review safety feature triggers
- Optimize cron schedule if needed
- Gather user feedback

---

## 📞 Support Contacts

- **Domain:** https://futurepilot.pro
- **Repository:** https://github.com/hellmoyy/futurepilotv2
- **Upstash Console:** https://console.upstash.com
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Resend Dashboard:** https://resend.com/overview

---

**Ready to Deploy? Follow this guide step by step!** 🚀
