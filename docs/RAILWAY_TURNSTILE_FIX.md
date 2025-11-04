# Railway Turnstile Environment Variables Fix

## Problem
Production showing: **"⚠️ Security verification unavailable. Please contact support."**

This means `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is **not set** or **empty** in Railway environment.

---

## Solution: Add Environment Variables to Railway

### Method 1: Via Railway Dashboard (Recommended)

1. **Open Railway Dashboard:**
   - Go to: https://railway.app/dashboard
   - Select your project: `futurepilotv2`
   - Click on your service (e.g., "Web Service")

2. **Navigate to Variables Tab:**
   - Click **"Variables"** in the left sidebar
   - You should see list of environment variables

3. **Add/Verify These Variables:**

   ```bash
   # Cloudflare Turnstile Keys (REQUIRED for CAPTCHA)
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB_DOh39tS3F6XLw
   TURNSTILE_SECRET_KEY=0x4AAAAAAB_DOk-6eWh3a3XX4qi9KY6M7l8
   ```

4. **Check for Existing Variables:**
   - If variables already exist → **Edit** them
   - If variables don't exist → Click **"+ New Variable"**
   - Copy-paste exact values above

5. **Save & Redeploy:**
   - Click **"Add Variable"** or **"Update"**
   - Railway will **automatically trigger redeploy**
   - Wait 2-3 minutes for deployment to complete

---

### Method 2: Via Railway CLI

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Add environment variables
railway variables set NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB_DOh39tS3F6XLw
railway variables set TURNSTILE_SECRET_KEY=0x4AAAAAAB_DOk-6eWh3a3XX4qi9KY6M7l8

# Verify variables are set
railway variables
```

---

## Verification Steps

### 1. Check Railway Logs (After Redeploy)
```bash
# Via CLI
railway logs

# Or via Dashboard:
# Click "Deployments" → Latest deployment → View logs
```

**Look for:**
```
✓ Creating an optimized production build
✓ Compiled successfully
```

**Should NOT see:**
```
warn - Environment variable NEXT_PUBLIC_TURNSTILE_SITE_KEY is not defined
```

### 2. Test in Production
1. Open: `https://futurepilot.pro/register`
2. **Expected:** Cloudflare Turnstile widget appears (checkbox or challenge)
3. **Not Expected:** Red error message "Security verification unavailable"

### 3. Check Browser Console
- Press `F12` → Console tab
- **Should NOT see:**
  ```
  TurnstileError: Invalid or missing type for parameter "sitekey", got "undefined"
  ```

---

## Common Issues & Fixes

### Issue 1: Variables Set but Still Showing Error

**Cause:** Railway cached old build

**Fix:**
1. Go to Railway Dashboard
2. Click **"Deployments"**
3. Click **"Redeploy"** on latest deployment
4. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

### Issue 2: Variable Shows in Dashboard but Not in App

**Cause:** Variable set in wrong service/environment

**Fix:**
1. Verify you're in the **correct service** (not staging/preview)
2. Check **"Production"** environment (not "Development")
3. Railway variables are **per-service**, not global

---

### Issue 3: Still Undefined After Deploy

**Cause:** Missing `NEXT_PUBLIC_` prefix or typo

**Fix:**
```bash
# ❌ WRONG (no prefix - not exposed to client)
TURNSTILE_SITE_KEY=0x4AAAAAAB_DOh39tS3F6XLw

# ✅ CORRECT (with NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB_DOh39tS3F6XLw
```

**Important:** Next.js requires `NEXT_PUBLIC_` prefix to expose env vars to browser/client-side code!

---

## Debug Commands

### Check if Variable is Set (Server-Side)
Add temporary debug endpoint:

```typescript
// src/app/api/debug/env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasSiteKey: !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    hasSecretKey: !!process.env.TURNSTILE_SECRET_KEY,
    siteKeyLength: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.length || 0,
    // Don't expose actual keys in production!
    siteKeyPrefix: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.substring(0, 10) || 'MISSING',
  });
}
```

Test: `https://futurepilot.pro/api/debug/env`

Expected response:
```json
{
  "hasSiteKey": true,
  "hasSecretKey": true,
  "siteKeyLength": 26,
  "siteKeyPrefix": "0x4AAAAAAB"
}
```

---

## Alternative: Regenerate Turnstile Keys

If you suspect keys are expired/invalid:

1. **Go to Cloudflare Dashboard:**
   - https://dash.cloudflare.com/
   - Navigate to: **Turnstile** section

2. **Create New Site:**
   - Click **"Add Site"**
   - Domain: `futurepilot.pro`
   - Mode: **Managed** (recommended)

3. **Get New Keys:**
   - Copy **Site Key** (starts with `0x`)
   - Copy **Secret Key** (starts with `0x`)

4. **Update Railway Variables:**
   - Replace `NEXT_PUBLIC_TURNSTILE_SITE_KEY` with new site key
   - Replace `TURNSTILE_SECRET_KEY` with new secret key

5. **Update `.env` Local:**
   ```bash
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=<new_site_key>
   TURNSTILE_SECRET_KEY=<new_secret_key>
   ```

---

## Current Production Keys (Reference)

**DO NOT commit these to Git!**

```bash
# Production (futurepilot.pro)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB_DOh39tS3F6XLw
TURNSTILE_SECRET_KEY=0x4AAAAAAB_DOk-6eWh3a3XX4qi9KY6M7l8

# Development (localhost)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

---

## Quick Fix Checklist

- [ ] Open Railway Dashboard → Variables
- [ ] Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` exists
- [ ] Verify value is `0x4AAAAAAB_DOh39tS3F6XLw`
- [ ] Verify `TURNSTILE_SECRET_KEY` exists
- [ ] Verify value is `0x4AAAAAAB_DOk-6eWh3a3XX4qi9KY6M7l8`
- [ ] Click "Redeploy" if variables were missing
- [ ] Wait 2-3 minutes for deployment
- [ ] Test: `https://futurepilot.pro/register`
- [ ] CAPTCHA widget should appear (not error message)

---

## Support

If issue persists after following all steps:

1. **Check Railway Logs:**
   ```bash
   railway logs --tail
   ```

2. **Check Browser Console:**
   - F12 → Console → Look for errors

3. **Verify Cloudflare Turnstile:**
   - Login to Cloudflare
   - Check if domain `futurepilot.pro` is whitelisted
   - Check if keys are active (not suspended)

4. **Contact Cloudflare Support:**
   - If keys are invalid/expired
   - Request new Turnstile site creation

---

**Last Updated:** November 5, 2025
**Status:** Fix deployed, waiting for Railway env vars configuration
