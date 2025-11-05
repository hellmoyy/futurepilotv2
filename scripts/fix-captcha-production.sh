#!/bin/bash

# Cloudflare Turnstile Production Fix
# This script helps diagnose and fix CAPTCHA issues in production

echo "🔍 Checking Cloudflare Turnstile Configuration..."
echo ""

# Check current environment
echo "📋 Current Environment Variables:"
echo "NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY}"
echo "TURNSTILE_SECRET_KEY: ${TURNSTILE_SECRET_KEY:0:20}..." # Only show first 20 chars
echo ""

# Check if using dummy keys
if [[ "$NEXT_PUBLIC_TURNSTILE_SITE_KEY" == "1x00000000000000000000AA" ]]; then
    echo "❌ ERROR: Using DUMMY testing keys!"
    echo "   These keys only work on localhost and always pass."
    echo ""
    echo "✅ FIX: Update to production keys:"
    echo "   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB_DOh39tS3F6XLw"
    echo "   TURNSTILE_SECRET_KEY=0x4AAAAAAB_DOk-6eWh3a3XX4qi9KY6M7l8"
    echo ""
    exit 1
fi

# Check if using production keys
if [[ "$NEXT_PUBLIC_TURNSTILE_SITE_KEY" == "0x4AAAAAAB_DOh39tS3F6XLw" ]]; then
    echo "✅ Production keys detected!"
    echo ""
else
    echo "⚠️  WARNING: Unknown site key format"
    echo "   Expected: 0x4AAAAAAB_DOh39tS3F6XLw"
    echo "   Current: $NEXT_PUBLIC_TURNSTILE_SITE_KEY"
    echo ""
fi

# Instructions for deployment platforms
echo "📝 Deployment Platform Setup:"
echo ""
echo "1. VERCEL:"
echo "   - Go to: https://vercel.com/[your-project]/settings/environment-variables"
echo "   - Add/Update:"
echo "     NEXT_PUBLIC_TURNSTILE_SITE_KEY = 0x4AAAAAAB_DOh39tS3F6XLw"
echo "     TURNSTILE_SECRET_KEY = 0x4AAAAAAB_DOk-6eWh3a3XX4qi9KY6M7l8"
echo "   - Redeploy: vercel --prod"
echo ""
echo "2. RAILWAY:"
echo "   - Go to: railway.app → Your Project → Variables"
echo "   - Add/Update same keys as above"
echo "   - Railway will auto-redeploy"
echo ""
echo "3. NETLIFY:"
echo "   - Go to: Site settings → Environment variables"
echo "   - Add/Update same keys"
echo "   - Trigger new deploy"
echo ""

echo "🔄 After updating, clear Cloudflare cache:"
echo "   - Cloudflare Dashboard → Caching → Purge Everything"
echo "   - Or wait 5-10 minutes for cache to expire"
echo ""

echo "✅ Done! CAPTCHA should work in production after these steps."
