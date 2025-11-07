#!/bin/bash

##
# 🚀 Upstash QStash Schedule Setup Script
# 
# Auto-create cron schedule for news fetcher
##

set -e

echo "📰 Upstash QStash Schedule Setup"
echo "=================================="
echo ""

# Check required environment variables
if [ -z "$QSTASH_TOKEN" ]; then
  echo "❌ Error: QSTASH_TOKEN not set"
  echo ""
  echo "Please set environment variables:"
  echo "  export QSTASH_TOKEN='your_qstash_token'"
  echo "  export APP_URL='https://your-app.railway.app'"
  echo "  export CRON_SECRET='your-cron-secret'"
  echo ""
  echo "Get your QStash token at: https://console.upstash.com/qstash"
  exit 1
fi

if [ -z "$APP_URL" ]; then
  echo "❌ Error: APP_URL not set"
  echo "Example: export APP_URL='https://futurepilotv2.railway.app'"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "⚠️  Warning: CRON_SECRET not set, using default"
  CRON_SECRET="dev-secret-12345"
fi

# Configuration
SCHEDULE_NAME="news-fetcher-auto"
ENDPOINT="/api/cron/fetch-news"
DESTINATION="${APP_URL}${ENDPOINT}"

# Prompt for interval
echo "Select interval:"
echo "  1) 1 minute  (1440 req/day - PAID PLAN REQUIRED)"
echo "  2) 5 minutes (288 req/day  - FREE TIER ✅)"
echo "  3) 15 minutes (96 req/day  - FREE TIER ✅)"
echo ""
read -p "Enter choice (1-3) [default: 2]: " CHOICE
CHOICE=${CHOICE:-2}

case $CHOICE in
  1)
    CRON_EXPR="* * * * *"
    INTERVAL_NAME="1-minute"
    ;;
  2)
    CRON_EXPR="*/5 * * * *"
    INTERVAL_NAME="5-minute"
    ;;
  3)
    CRON_EXPR="*/15 * * * *"
    INTERVAL_NAME="15-minute"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "Creating schedule with:"
echo "  Name: ${SCHEDULE_NAME}-${INTERVAL_NAME}"
echo "  URL: $DESTINATION"
echo "  Cron: $CRON_EXPR"
echo "  Auth: Bearer ${CRON_SECRET:0:10}..."
echo ""

# Create schedule
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer ${QSTASH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"destination\": \"${DESTINATION}\",
    \"cron\": \"${CRON_EXPR}\",
    \"headers\": {
      \"Authorization\": \"Bearer ${CRON_SECRET}\"
    },
    \"retries\": 3,
    \"timeout\": 60
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Schedule created successfully!"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.'
  echo ""
  echo "Next steps:"
  echo "  1. Verify at: https://console.upstash.com/qstash"
  echo "  2. Wait for first execution (max ${INTERVAL_NAME})"
  echo "  3. Check logs: railway logs --tail"
  echo "  4. Monitor at: ${APP_URL}/administrator/bot-decision (News tab)"
else
  echo "❌ Failed to create schedule (HTTP $HTTP_CODE)"
  echo ""
  echo "Response:"
  echo "$BODY"
  exit 1
fi
