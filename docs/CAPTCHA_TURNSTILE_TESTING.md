# Cloudflare Turnstile CAPTCHA - Testing Checklist

**Date:** January 2025  
**Status:** Ready for Testing  
**Migration:** friendly-challenge → Cloudflare Turnstile  

---

## 🚀 Quick Start

### 1. Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
✓ Ready in 2.5s
○ Local: http://localhost:3001
```

---

### 2. Environment Variables Check

**Verify `.env.local` has Turnstile keys:**

```bash
# Development (test keys)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**If missing, copy from template:**
```bash
cat .env.captcha.example >> .env.local
```

---

## ✅ Testing Checklist

### Phase 1: Visual Inspection ✅

**Test 1.1: Login Page**
```bash
URL: http://localhost:3001/login
```

**Expected:**
- [ ] Turnstile widget visible above "Sign In" button
- [ ] Widget uses dark theme (matches page design)
- [ ] Widget is responsive (not overflowing)
- [ ] No console errors in browser DevTools
- [ ] Widget loads within 2 seconds

**Screenshot Location:** `docs/screenshots/turnstile-login.png` (optional)

---

**Test 1.2: Register Page**
```bash
URL: http://localhost:3001/register
```

**Expected:**
- [ ] Turnstile widget visible above "Create Account" button
- [ ] Widget theme matches page (dark/light based on system)
- [ ] Widget positioned correctly in form layout
- [ ] No console errors
- [ ] Widget loads quickly

---

**Test 1.3: Administrator Page**
```bash
URL: http://localhost:3001/administrator
```

**Expected:**
- [ ] Turnstile widget visible with label "Security Verification"
- [ ] Widget uses dark theme
- [ ] Widget centered in form
- [ ] No console errors
- [ ] Professional appearance

---

### Phase 2: Functional Testing ✅

**Test 2.1: Successful Login with CAPTCHA**

```bash
Steps:
1. Go to http://localhost:3001/login
2. Enter valid email: test@example.com
3. Enter valid password: Test123!
4. Wait for Turnstile widget to show checkmark (~1-2 seconds)
5. Click "Sign In"

Expected Result:
✅ Login successful, redirected to dashboard
```

**Actual Result:** _______________

---

**Test 2.2: Login WITHOUT CAPTCHA Completion**

```bash
Steps:
1. Go to http://localhost:3001/login
2. Enter email/password
3. Immediately click "Sign In" (before Turnstile verifies)

Expected Result:
❌ Error message: "Please complete the security check"
❌ Login blocked
```

**Actual Result:** _______________

---

**Test 2.3: CAPTCHA Expiration Handling**

```bash
Steps:
1. Go to http://localhost:3001/login
2. Fill email/password
3. Wait for Turnstile to verify (checkmark appears)
4. Wait 5 minutes (CAPTCHA expires)
5. Click "Sign In"

Expected Result:
❌ Error message: "Security check expired. Please try again."
⟳ Turnstile widget resets automatically
```

**Actual Result:** _______________

---

**Test 2.4: Register with CAPTCHA**

```bash
Steps:
1. Go to http://localhost:3001/register
2. Fill name, email, password
3. Wait for Turnstile verification
4. Click "Create Account"

Expected Result:
✅ Account created successfully
✅ Redirected to dashboard or login
```

**Actual Result:** _______________

---

**Test 2.5: Administrator Login with CAPTCHA**

```bash
Steps:
1. Go to http://localhost:3001/administrator
2. Enter admin email/password
3. Wait for Turnstile verification
4. Click "Login as Administrator"

Expected Result:
✅ Admin login successful
✅ Redirected to /administrator/dashboard
```

**Actual Result:** _______________

---

### Phase 3: Server-Side Verification ✅

**Test 3.1: API Token Validation**

**Test Valid Token:**
```bash
curl -X POST http://localhost:3001/api/auth/verify-captcha \
  -H "Content-Type: application/json" \
  -d '{"token":"test_valid_token_from_widget"}'
```

**Expected Response:**
```json
{
  "success": true
}
```

**Actual Response:** _______________

---

**Test 3.2: API Invalid Token**

```bash
curl -X POST http://localhost:3001/api/auth/verify-captcha \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid_token_12345"}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "CAPTCHA verification failed"
}
```

**Actual Response:** _______________

---

**Test 3.3: API Missing Token**

```bash
curl -X POST http://localhost:3001/api/auth/verify-captcha \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "CAPTCHA token is required"
}
```

**Actual Response:** _______________

---

### Phase 4: Error Handling ✅

**Test 4.1: Network Error Simulation**

```bash
Steps:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Enable "Offline" mode
4. Go to http://localhost:3001/login
5. Try to verify CAPTCHA

Expected Result:
❌ Error message: "Security check error. Please refresh the page."
⟳ Widget shows error state
```

**Actual Result:** _______________

---

**Test 4.2: Rate Limiting with CAPTCHA**

```bash
Steps:
1. Go to http://localhost:3001/login
2. Complete CAPTCHA
3. Enter WRONG password
4. Submit (failed login #1)
5. Repeat 4 more times (5 total failed logins)
6. Try 6th login

Expected Result:
❌ Error: "Too many login attempts. Retry in X minutes."
⏱️ Rate limiter blocks request even with valid CAPTCHA
```

**Actual Result:** _______________

---

### Phase 5: Theme Support ✅

**Test 5.1: Dark Theme**

```bash
Steps:
1. Set OS theme to Dark
2. Go to http://localhost:3001/login
3. Observe Turnstile widget

Expected Result:
🌙 Widget uses dark theme
🎨 Widget matches page design (dark background)
```

**Actual Result:** _______________

---

**Test 5.2: Light Theme**

```bash
Steps:
1. Set OS theme to Light
2. Refresh http://localhost:3001/login
3. Observe Turnstile widget

Expected Result:
☀️ Widget uses light theme
🎨 Widget matches page design (light background)
```

**Actual Result:** _______________

---

### Phase 6: Mobile Responsiveness ✅

**Test 6.1: Mobile View (375px width)**

```bash
Steps:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone SE" (375px)
4. Go to http://localhost:3001/login

Expected Result:
📱 Turnstile widget fits within screen
📱 No horizontal overflow
📱 Widget maintains aspect ratio
```

**Actual Result:** _______________

---

**Test 6.2: Tablet View (768px width)**

```bash
Steps:
1. Open DevTools
2. Select "iPad" (768px)
3. Go to http://localhost:3001/register

Expected Result:
📱 Widget properly sized for tablet
📱 Form layout remains centered
```

**Actual Result:** _______________

---

### Phase 7: Browser Compatibility ✅

**Test 7.1: Chrome/Edge**
- [ ] Login page CAPTCHA works
- [ ] Register page CAPTCHA works
- [ ] Administrator page CAPTCHA works

**Test 7.2: Firefox**
- [ ] Login page CAPTCHA works
- [ ] Register page CAPTCHA works
- [ ] Administrator page CAPTCHA works

**Test 7.3: Safari**
- [ ] Login page CAPTCHA works
- [ ] Register page CAPTCHA works
- [ ] Administrator page CAPTCHA works

---

## 🐛 Known Issues / Bugs

**Issue Log:**

| # | Issue | Severity | Page | Status |
|---|-------|----------|------|--------|
| 1 | (example) Widget not loading | Critical | Login | ❌ Open |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

---

## 📊 Test Results Summary

**Execution Date:** _______________

### Visual Tests (Phase 1)
- Login Page: ⬜ Pass / ⬜ Fail
- Register Page: ⬜ Pass / ⬜ Fail
- Administrator Page: ⬜ Pass / ⬜ Fail

### Functional Tests (Phase 2)
- Successful Login: ⬜ Pass / ⬜ Fail
- Login Without CAPTCHA: ⬜ Pass / ⬜ Fail
- CAPTCHA Expiration: ⬜ Pass / ⬜ Fail
- Register: ⬜ Pass / ⬜ Fail
- Admin Login: ⬜ Pass / ⬜ Fail

### Server Tests (Phase 3)
- Valid Token: ⬜ Pass / ⬜ Fail
- Invalid Token: ⬜ Pass / ⬜ Fail
- Missing Token: ⬜ Pass / ⬜ Fail

### Error Handling (Phase 4)
- Network Error: ⬜ Pass / ⬜ Fail
- Rate Limiting: ⬜ Pass / ⬜ Fail

### Theme Support (Phase 5)
- Dark Theme: ⬜ Pass / ⬜ Fail
- Light Theme: ⬜ Pass / ⬜ Fail

### Mobile (Phase 6)
- Mobile View: ⬜ Pass / ⬜ Fail
- Tablet View: ⬜ Pass / ⬜ Fail

### Browsers (Phase 7)
- Chrome/Edge: ⬜ Pass / ⬜ Fail
- Firefox: ⬜ Pass / ⬜ Fail
- Safari: ⬜ Pass / ⬜ Fail

**Overall Result:** ⬜ PASS ✅ / ⬜ FAIL ❌

**Notes:** _______________________________________________

---

## 🔧 Troubleshooting

### Issue: Widget Not Loading

**Symptoms:** Turnstile widget doesn't appear on page

**Possible Causes:**
1. Missing environment variables
2. Network blocked (firewall/ad blocker)
3. Cloudflare API down
4. JavaScript error

**Solutions:**
```bash
# 1. Check .env.local
cat .env.local | grep TURNSTILE

# 2. Check browser console (F12)
# Look for errors like:
# - "Failed to load Turnstile script"
# - "Sitekey is invalid"

# 3. Test Cloudflare API
curl https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/orchestrate/

# 4. Disable ad blocker temporarily
```

---

### Issue: Token Verification Fails

**Symptoms:** Server returns "CAPTCHA verification failed"

**Possible Causes:**
1. Wrong secret key in .env.local
2. Token expired (5 min timeout)
3. Token already used (replay attack prevention)
4. Network issue between server and Cloudflare

**Solutions:**
```bash
# 1. Verify secret key
echo $TURNSTILE_SECRET_KEY

# 2. Check server logs
npm run dev | grep "turnstile"

# 3. Test API manually
node -e "
const token = 'your_token_here';
const secret = process.env.TURNSTILE_SECRET_KEY;
fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  body: new URLSearchParams({ secret, response: token })
}).then(r => r.json()).then(console.log);
"
```

---

### Issue: Theme Not Matching

**Symptoms:** Widget uses wrong theme (dark/light)

**Possible Causes:**
1. `theme` prop not set in component
2. OS theme detection not working
3. CSS conflicts

**Solutions:**
```tsx
// 1. Explicit theme prop
<TurnstileCaptcha
  sitekey="..."
  theme="dark"  // Force dark theme
  onSuccess={...}
/>

// 2. Dynamic theme based on state
<TurnstileCaptcha
  theme={isDarkMode ? 'dark' : 'light'}
  ...
/>
```

---

### Issue: Rate Limiting Not Working

**Symptoms:** Can submit form multiple times without block

**Possible Causes:**
1. Rate limiter not enabled on endpoint
2. IP detection failing (returns 'unknown')
3. Rate limit config too high

**Solutions:**
```typescript
// Check API route has rate limiting
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  // ✅ This should exist
  const rateLimitCheck = await checkRateLimit(
    request,
    RateLimitConfigs.LOGIN
  );
  
  if (!rateLimitCheck.success) {
    return NextResponse.json(
      { error: rateLimitCheck.error },
      { status: 429 }
    );
  }
  
  // ... rest of handler
}
```

---

## 📝 Automated Test Script (Future)

**File:** `/tests/captcha-turnstile.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Turnstile CAPTCHA', () => {
  test('should display Turnstile widget on login page', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Wait for Turnstile iframe
    const turnstile = page.frameLocator('iframe[src*="challenges.cloudflare.com"]');
    await expect(turnstile.locator('body')).toBeVisible();
  });
  
  test('should block login without CAPTCHA', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'Test123!');
    
    // Submit before CAPTCHA completes
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('text=Please complete the security check')).toBeVisible();
  });
  
  test('should allow login with valid CAPTCHA', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'Test123!');
    
    // Wait for CAPTCHA to complete (test key auto-passes)
    await page.waitForTimeout(2000);
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

**Run Tests:**
```bash
npm install -D @playwright/test
npx playwright test tests/captcha-turnstile.test.ts
```

---

## ✅ Sign-Off

**Tester Name:** _______________  
**Date:** _______________  
**Result:** ⬜ APPROVED ✅ / ⬜ REJECTED ❌  

**Comments:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```

**Ready for Production?** ⬜ YES / ⬜ NO

**If NO, blockers:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## 🚀 Production Deployment Checklist

**After testing passes:**

- [ ] Get production Cloudflare Turnstile keys
  - [ ] Go to https://dash.cloudflare.com/
  - [ ] Create production site
  - [ ] Add domain (e.g., futurepilot.app)
  - [ ] Copy Site Key and Secret Key

- [ ] Add keys to production environment
  - [ ] Railway/Vercel dashboard
  - [ ] Set NEXT_PUBLIC_TURNSTILE_SITE_KEY
  - [ ] Set TURNSTILE_SECRET_KEY

- [ ] Deploy to staging
  - [ ] Test all auth pages
  - [ ] Verify token validation
  - [ ] Check analytics (Cloudflare dashboard)

- [ ] Monitor for 24 hours
  - [ ] Check solve rate (should be >95%)
  - [ ] Monitor error logs
  - [ ] Verify no false positives

- [ ] Deploy to production
  - [ ] Announce maintenance window (if needed)
  - [ ] Deploy new version
  - [ ] Test immediately after deploy
  - [ ] Monitor for issues

- [ ] Post-deployment
  - [ ] Update documentation
  - [ ] Notify team
  - [ ] Set up monitoring alerts
  - [ ] Schedule weekly analytics review

---

**🎉 Testing Complete! Ready for Cloudflare Turnstile Production Deployment!**
