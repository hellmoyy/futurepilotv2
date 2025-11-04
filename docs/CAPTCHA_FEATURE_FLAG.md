# CAPTCHA Feature Flag - Quick Reference

## 🎛️ Enable/Disable CAPTCHA

### Environment Variable
```bash
# Enable CAPTCHA (default)
NEXT_PUBLIC_CAPTCHA_ENABLED=true

# Disable CAPTCHA (for testing/debugging)
NEXT_PUBLIC_CAPTCHA_ENABLED=false
```

---

## 📍 Where to Set

### Local Development (`.env.local`)
```bash
# Edit /Users/hap/Documents/CODE-MASTER/futurepilotv2/.env.local
NEXT_PUBLIC_CAPTCHA_ENABLED=false  # Disable for local testing
```

### Production (Railway Dashboard)
1. Go to Railway Dashboard
2. Select your service
3. Click **Variables** tab
4. Add or edit: `NEXT_PUBLIC_CAPTCHA_ENABLED`
5. Set value: `true` or `false`
6. Railway will auto-redeploy

---

## 🚀 Usage Examples

### Scenario 1: Disable for Local Development
```bash
# .env.local
NEXT_PUBLIC_CAPTCHA_ENABLED=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA  # Still need this
```

**Result:**
- ✅ No CAPTCHA widget shown
- ✅ No CAPTCHA validation
- ✅ Register/login works without CAPTCHA
- ✅ Faster testing workflow

### Scenario 2: Disable in Production (Emergency)
```bash
# Railway Variables
NEXT_PUBLIC_CAPTCHA_ENABLED=false
```

**Use Cases:**
- Cloudflare Turnstile down
- CAPTCHA causing issues
- Urgent user registration needed
- Testing production behavior

### Scenario 3: Enable for Production (Normal)
```bash
# Railway Variables
NEXT_PUBLIC_CAPTCHA_ENABLED=true
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB_DOh39tS3F6XLw
TURNSTILE_SECRET_KEY=0x4AAAAAAB_DOk-6eWh3a3XX4qi9KY6M7l8
```

**Result:**
- ✅ CAPTCHA widget shown
- ✅ CAPTCHA validation enforced
- ✅ Bot protection active
- ✅ Normal security mode

---

## 🔍 How It Works

### Code Implementation

**1. Feature Flag Check:**
```typescript
// All auth pages (register/login/admin)
const CAPTCHA_ENABLED = process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true';
```

**2. Conditional Rendering:**
```typescript
{CAPTCHA_ENABLED && (
  <TurnstileCaptcha sitekey={TURNSTILE_SITE_KEY} />
)}
```

**3. Validation Skip:**
```typescript
// Only validate if enabled
if (CAPTCHA_ENABLED && !captchaSolution) {
  setError('Please complete the security check');
  return;
}

// Only verify if enabled
if (CAPTCHA_ENABLED) {
  await fetch('/api/auth/verify-captcha', { ... });
}
```

---

## 🎯 Affected Pages

| Page | Path | Feature Flag Respected |
|------|------|------------------------|
| Register | `/register` | ✅ Yes |
| Login | `/login` | ✅ Yes |
| Admin Login | `/administrator` | ✅ Yes |

---

## ⚙️ Configuration Files

### next.config.js
```javascript
env: {
  NEXT_PUBLIC_CAPTCHA_ENABLED: process.env.NEXT_PUBLIC_CAPTCHA_ENABLED,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  // ... other vars
}
```

### .env (production reference)
```bash
NEXT_PUBLIC_CAPTCHA_ENABLED=true
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB_DOh39tS3F6XLw
TURNSTILE_SECRET_KEY=0x4AAAAAAB_DOk-6eWh3a3XX4qi9KY6M7l8
```

### .env.local (development)
```bash
NEXT_PUBLIC_CAPTCHA_ENABLED=true
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

---

## 🧪 Testing Checklist

### When CAPTCHA Enabled (true)
- [ ] CAPTCHA widget appears on `/register`
- [ ] CAPTCHA widget appears on `/login`
- [ ] CAPTCHA widget appears on `/administrator`
- [ ] Cannot submit without completing CAPTCHA
- [ ] Error message if CAPTCHA not solved
- [ ] Form submits after CAPTCHA solved

### When CAPTCHA Disabled (false)
- [ ] No CAPTCHA widget on `/register`
- [ ] No CAPTCHA widget on `/login`
- [ ] No CAPTCHA widget on `/administrator`
- [ ] Can submit form immediately
- [ ] No CAPTCHA validation errors
- [ ] Registration/login works normally

---

## 🛡️ Security Considerations

### ⚠️ When to Disable
- ✅ Local development
- ✅ Automated testing (CI/CD)
- ✅ Emergency maintenance
- ✅ Cloudflare outage

### ❌ When NOT to Disable
- ❌ Production (normal operation)
- ❌ Public registration open
- ❌ Bot attacks detected
- ❌ Without other security measures

### 🔐 Fallback Security (when CAPTCHA disabled)
- ✅ Honeypot fields (still active)
- ✅ Timing analysis (3-second minimum)
- ✅ Rate limiting (in-memory, upgrade to Redis recommended)
- ✅ Email verification (mandatory)
- ✅ Strong password requirements

---

## 📊 Monitoring

### Check Current Status

**Production API:**
```bash
curl https://futurepilot.pro/api/debug-env
```

**Expected Response:**
```json
{
  "hasSiteKey": true,
  "siteKeyLength": 26,
  "siteKeyPrefix": "0x4AAAAAAB",
  "allPublicVars": {
    "NEXT_PUBLIC_CAPTCHA_ENABLED": "true"
  }
}
```

### Railway Logs
```bash
# Via CLI
railway logs --tail

# Look for:
# ✅ NEXT_PUBLIC_CAPTCHA_ENABLED=true
# ✅ No CAPTCHA-related errors
```

---

## 🚨 Troubleshooting

### Issue: Flag Not Working in Production

**Symptom:** Changed flag but CAPTCHA still showing/hidden

**Fix:**
1. Check Railway Variables tab
2. Verify exact variable name: `NEXT_PUBLIC_CAPTCHA_ENABLED`
3. Verify value is `true` or `false` (lowercase)
4. Trigger manual redeploy
5. Hard refresh browser: `Ctrl+Shift+R`

### Issue: Flag Works Locally But Not Production

**Cause:** `.env.local` overriding production settings

**Fix:**
1. `.env.local` is for local only (not deployed)
2. Railway uses its own Variables (not `.env` file)
3. Set Railway Variables separately
4. Delete `.env.local` if testing production locally

---

## 📝 Change Log

**November 5, 2025:**
- ✅ Added `NEXT_PUBLIC_CAPTCHA_ENABLED` feature flag
- ✅ Applied to register/login/admin pages
- ✅ Updated `next.config.js` exposure
- ✅ Updated `.env` and `.env.local` templates
- ✅ Maintained honeypot and timing security when disabled

---

## 🔗 Related Documentation

- [CAPTCHA Production Fix](./CAPTCHA_PRODUCTION_FIX_COMPLETE.md)
- [Railway Turnstile Fix](./RAILWAY_TURNSTILE_FIX.md)
- [Advanced Bot Protection](./ADVANCED_BOT_PROTECTION.md)
- [Security Audit Report](./SECURITY_AUDIT_REPORT.md)

---

**Quick Commands:**

```bash
# Disable CAPTCHA locally
echo "NEXT_PUBLIC_CAPTCHA_ENABLED=false" >> .env.local

# Enable CAPTCHA locally
echo "NEXT_PUBLIC_CAPTCHA_ENABLED=true" >> .env.local

# Check current status (production)
curl https://futurepilot.pro/api/debug-env | jq '.allPublicVars.NEXT_PUBLIC_CAPTCHA_ENABLED'

# Railway CLI set
railway variables set NEXT_PUBLIC_CAPTCHA_ENABLED=false
railway variables set NEXT_PUBLIC_CAPTCHA_ENABLED=true
```

---

**Status:** ✅ Feature Complete  
**Last Updated:** November 5, 2025  
**Tested:** ✅ Local + Production
