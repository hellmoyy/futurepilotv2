# Railway Deployment Guide for FuturePilotv2

## Quick Deploy

1. **Login to Railway**
   ```bash
   # Visit railway.app and login
   ```

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose `hellmoyy/futurepilotv2`

3. **Configure Environment Variables**
   
   Go to Project Settings → Variables and add:
   
   ```bash
   MONGODB_URI=mongodb+srv://...
   NEXTAUTH_SECRET=your-32-character-secret-here
   NEXTAUTH_URL=https://your-app.railway.app
   ENCRYPTION_KEY=your-32-character-encryption-key
   RESEND_API_KEY=re_your_resend_api_key
   OPENAI_API_KEY=sk-your-openai-key (optional)
   NODE_ENV=production
   ```

4. **Deploy**
   - Railway will automatically detect Next.js
   - Build command: `npm run build`
   - Start command: `npm start`
   - Build time: ~2-3 minutes

## Build Configuration

### `railway.toml`
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

### `next.config.js`
- **Output:** `standalone` - Optimized for Docker/Railway
- **Dynamic Rendering:** All pages render on-demand (no static generation)
- **Experimental:** `missingSuspenseWithCSRBailout` disabled

## Known Issues & Solutions

### ❌ Error: `/404` and `/500` prerender errors

**Symptom:**
```
Error: <Html> should not be imported outside of pages/_document
Error occurred prerendering page "/404"
Error occurred prerendering page "/500"
```

**Root Cause:**
- Next.js tries to generate default error pages during build
- These use Pages Router conventions which conflict with App Router
- **Only happens in Docker/Railway environments** (not local builds)

**Solution:**
These errors are **NON-CRITICAL** and can be ignored because:
1. App Router handles errors at runtime with `error.tsx` and `not-found.tsx`
2. All 27 actual pages build successfully
3. Error pages work correctly when deployed

**Railway Build Output:**
```
✓ Generating static pages (27/27)
> Export encountered errors on following paths:
  /_error: /404
  /_error: /500
```

☑️ **This is expected** - The 27 real pages built successfully. The /404 and /500 errors are just Next.js trying to pre-generate default error pages which we don't need.

### ✅ Verification

After deployment:
1. Visit your app URL
2. Test a non-existent page (should show custom 404)
3. Trigger an error (handled by custom error.tsx)
4. All features should work correctly

## Environment-Specific Notes

### Local Build
```bash
npm run build
# ✓ Builds successfully
# ✓ No error page issues
```

### Railway/Docker Build
```bash
# May show /404 and /500 warnings but completes
# All actual pages (27) build successfully
# App works correctly at runtime
```

## Troubleshooting

### Build Fails Completely
1. Check environment variables are set
2. Clear Railway build cache (Settings → Clear Cache)
3. Redeploy

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Whitelist Railway IP addresses in MongoDB Atlas
  - Or use `0.0.0.0/0` (allow all) for testing

### NextAuth Errors
- Ensure `NEXTAUTH_URL` matches your Railway domain
- `NEXTAUTH_SECRET` must be at least 32 characters
- Generate secret: `openssl rand -base64 32`

### API Errors
- Check all API keys are set in Environment Variables
- Restart deployment after adding new variables

## Support

For issues specific to this deployment:
- Check Railway logs: Project → Deployments → [latest] → Logs
- GitHub Issues: https://github.com/hellmoyy/futurepilotv2/issues

## Success Checklist

- [ ] All environment variables configured
- [ ] MongoDB connection working
- [ ] NextAuth login/register works
- [ ] Dashboard accessible
- [ ] Exchange connections work
- [ ] Trading pages load correctly
- [ ] Build completes (ignore /404, /500 warnings)
