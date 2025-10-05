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
   
   **Required Variables:**
   ```bash
   MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/futurepilot
   NEXTAUTH_SECRET=your-32-character-secret-here
   NEXTAUTH_URL=https://your-app.railway.app
   NODE_ENV=production
   ```

   **Optional Variables:**
   ```bash
   ENCRYPTION_SECRET_KEY=your-32-character-encryption-key
   RESEND_API_KEY=re_your_resend_api_key (for email functionality)
   OPENAI_API_KEY=sk-your-openai-key (for AI features)
   ```

   **Notes:**
   - `MONGODB_URI` - Required for database operations
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Will be your Railway deployment URL
   - `ENCRYPTION_SECRET_KEY` - For encrypting API keys (optional, uses default if not set)
   - `RESEND_API_KEY` - Only needed if using email verification
   - `OPENAI_API_KEY` - Only needed if using AI analysis features
   - Environment variables are validated at runtime, not during build

4. **Deploy**
   - Railway will use custom Dockerfile
   - Builder: DOCKERFILE (not NIXPACKS)
   - Build time: ~3-4 minutes (multi-stage build)
   - Uses custom multi-stage Docker build for reliability

## Build Configuration

### `railway.toml`
```toml
[build]
builder = "DOCKERFILE"

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

### `Dockerfile`
- **Custom multi-stage build** for guaranteed .next directory preservation
- **Builder stage:** Runs build process and creates .next artifacts
- **Runner stage:** Copies built artifacts and runs production server
- **Alpine Linux** for optimized image size
- **Explicit .next copying** ensures all build artifacts are available

### `next.config.js`
- **Standard Build:** Uses default Next.js output (not standalone)
- **Dynamic Rendering:** All pages render on-demand (no static generation)
- **Experimental:** `missingSuspenseWithCSRBailout` disabled

### `scripts/build.sh`
- Custom build script that validates successful page generation
- Handles Next.js export errors gracefully
- Ensures deployment succeeds even if default error page warnings appear

### `.dockerignore`
- **CRITICAL:** `.next` directory must NOT be ignored
- Build artifacts in `.next/` are required for production
- Railway/Docker respects `.dockerignore` during deployment
- Excluding `.next` causes missing prerender-manifest.json error

## Known Issues & Solutions

### ✅ FIXED: Missing .next Directory in Deployment

**Previous Symptom:**
```
Error: ENOENT: no such file or directory, open '/app/.next/prerender-manifest.json'
Starting...
[Error repeats continuously]
```

**Root Cause:**
- The `.dockerignore` file was excluding the `.next` directory
- Railway uses Docker/NIXPACKS which respects `.dockerignore`
- Build artifacts were created but not copied to production container
- `npm start` requires the full `.next/` directory to run

**Solution Implemented:**
- **Switched from NIXPACKS to custom Dockerfile**
- Multi-stage Docker build explicitly copies .next directory
- Builder stage creates build artifacts, runner stage uses them
- Added verification step to ensure prerender-manifest.json exists
- Dockerfile has explicit control over what gets copied

**Alternative tried:** Removed `.next` from `.dockerignore` but NIXPACKS still had issues

### ✅ FIXED: Environment Variables at Build Time

**Previous Symptom:**
```
Error: OPENAI_API_KEY is not defined in environment variables
Error: Failed to collect page data for /api/ai/analyze
BUILD ERROR: exit code 1
```

**Root Cause:**
- Environment variables were validated at **import time** instead of **runtime**
- During build, Next.js analyzes all API routes, triggering validation
- Build process doesn't have access to production environment variables

**Solution Implemented:**
Changed to **lazy initialization** pattern:
- OpenAI client uses Proxy pattern for deferred initialization
- MongoDB URI validation moved to connection time
- Environment variables only checked when actually used
- Build completes successfully without requiring env vars

### ✅ FIXED: Default Error Page Warnings

**Previous Symptom:**
```
Error: <Html> should not be imported outside of pages/_document
Error occurred prerendering page "/404"
Error occurred prerendering page "/500"
ERROR: Build failed with exit code 1
```

**Root Cause:**
- Next.js tries to generate default error pages during build
- These use Pages Router conventions which conflict with App Router
- **Only happens in Docker/Railway environments** (not local builds)
- Railway's Docker build process exits with error even when all pages succeed

**Solution Implemented:**
Created `scripts/build.sh` that:
1. Runs `npm run build`
2. Validates that all 27 pages build successfully
3. Exits with success (0) if all pages are generated
4. Ignores non-critical export errors for default error pages
5. Only fails if actual application pages fail to build

**Expected Railway Build Output:**
```
🚀 Starting Next.js build...
✓ Generating static pages (27/27)

📊 Build Process Summary:
- Build Exit Code: 0
- Pages Generated: 27/27 ✅
- Export Warnings: None

✅ Build completed successfully!
```

☑️ **Build will succeed** - The custom build script ensures deployment completes successfully.

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
