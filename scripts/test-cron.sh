#!/bin/bash

# Test Cron Endpoint Script
# This script tests the cron endpoint locally or in production

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 FuturePilot Cron Test Script${NC}"
echo "=================================="
echo ""

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}❌ Error: CRON_SECRET environment variable is not set${NC}"
    echo ""
    echo "Please set it first:"
    echo "export CRON_SECRET='your-secret-here'"
    echo ""
    echo "Or generate a new one:"
    echo "export CRON_SECRET=\$(openssl rand -base64 32)"
    exit 1
fi

# Get target URL (default to localhost)
TARGET_URL="${1:-http://localhost:3000}"
ENDPOINT="$TARGET_URL/api/cron/run-bots"

echo -e "Target URL: ${YELLOW}$ENDPOINT${NC}"
echo -e "Using CRON_SECRET: ${YELLOW}${CRON_SECRET:0:10}...${NC}"
echo ""
echo "Testing endpoint..."
echo ""

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$ENDPOINT" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

# Split response and status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo "HTTP Status: $HTTP_CODE"
echo ""

# Check status code
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Success!${NC}"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
    
    # Parse and display summary
    TOTAL_BOTS=$(echo "$HTTP_BODY" | jq -r '.summary.totalBots' 2>/dev/null)
    SUCCESSFUL=$(echo "$HTTP_BODY" | jq -r '.summary.successful' 2>/dev/null)
    FAILED=$(echo "$HTTP_BODY" | jq -r '.summary.failed' 2>/dev/null)
    WITH_POSITIONS=$(echo "$HTTP_BODY" | jq -r '.summary.withPositions' 2>/dev/null)
    
    if [ "$TOTAL_BOTS" != "null" ]; then
        echo ""
        echo -e "${GREEN}📊 Summary:${NC}"
        echo "  Total Bots: $TOTAL_BOTS"
        echo "  Successful: $SUCCESSFUL"
        echo "  Failed: $FAILED"
        echo "  With Positions: $WITH_POSITIONS"
    fi
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}❌ Unauthorized!${NC}"
    echo ""
    echo "The CRON_SECRET is incorrect or missing."
    echo "Please check your environment variable."
elif [ "$HTTP_CODE" -eq 500 ]; then
    echo -e "${RED}❌ Server Error!${NC}"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
else
    echo -e "${RED}❌ Request failed with status: $HTTP_CODE${NC}"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY"
fi

echo ""
echo "=================================="
