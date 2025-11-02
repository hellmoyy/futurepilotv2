#!/bin/bash

# ============================================================================
# 🧪 Test Balance Check Cron Endpoint
# ============================================================================

echo "🧪 Testing Balance Check Cron Endpoint..."
echo ""

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "❌ Error: CRON_SECRET not set"
  echo ""
  echo "Usage:"
  echo "  export CRON_SECRET='your-secret-here'"
  echo "  ./scripts/test-balance-check.sh http://localhost:3000"
  exit 1
fi

# Get base URL (default: localhost)
BASE_URL="${1:-http://localhost:3000}"

echo "📍 Base URL: $BASE_URL"
echo "🔐 CRON_SECRET: ${CRON_SECRET:0:10}..."
echo ""

# ============================================================================
# Test 1: GET - View Statistics (No notifications sent)
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test 1: GET - View Balance Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -s "${BASE_URL}/api/cron/balance-check?token=${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo ""

# ============================================================================
# Test 2: POST - Run Balance Check (Sends notifications)
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Test 2: POST - Run Balance Check & Send Notifications"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -s -X POST "${BASE_URL}/api/cron/balance-check?token=${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo ""

# ============================================================================
# Test 3: Unauthorized Access (Should Fail)
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 Test 3: Unauthorized Access (Should Return 401)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -s "${BASE_URL}/api/cron/balance-check?token=invalid-token" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testing Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "1. ✅ If tests passed → Setup Upstash QStash"
echo "2. 📝 Follow docs/BALANCE_CHECK_CRON_SETUP.md"
echo "3. 🔄 Schedule cron job: 0 * * * * (every hour)"
echo ""
