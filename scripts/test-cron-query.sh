#!/bin/bash

# Test Cron Endpoint with Query Parameter for FuturePilot
# Usage: ./scripts/test-cron-query.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Cron Test (Query Parameter)         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

source .env

if [ -z "$CRON_SECRET" ]; then
  echo -e "${RED}Error: CRON_SECRET not set in .env${NC}"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  echo -e "${YELLOW}Using localhost...${NC}"
  API_URL="http://localhost:3000"
else
  API_URL="$NEXT_PUBLIC_APP_URL"
fi

ENDPOINT="${API_URL}/api/cron/run-bots?token=${CRON_SECRET}"

echo -e "${BLUE}Testing:${NC} ${API_URL}/api/cron/run-bots"
echo -e "${BLUE}Method:${NC} Query Parameter"
echo ""
echo -e "${YELLOW}→ Sending request...${NC}"
echo ""

# Make the request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$ENDPOINT")

# Parse response
HTTP_BODY=$(echo "$RESPONSE" | sed -n '1,/HTTP_STATUS/p' | sed '$d')
HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d: -f2)

echo -e "${BLUE}HTTP Status:${NC} $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Success!${NC}"
  echo ""
  echo -e "${BLUE}Response:${NC}"
  echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
  echo ""
  
  # Parse and display summary
  TOTAL=$(echo "$HTTP_BODY" | jq -r '.summary.totalBots' 2>/dev/null || echo "N/A")
  SUCCESS=$(echo "$HTTP_BODY" | jq -r '.summary.successful' 2>/dev/null || echo "N/A")
  FAILED=$(echo "$HTTP_BODY" | jq -r '.summary.failed' 2>/dev/null || echo "N/A")
  
  echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║           Summary                      ║${NC}"
  echo -e "${GREEN}╠════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║${NC} Total Bots:    $TOTAL"
  echo -e "${GREEN}║${NC} Successful:    $SUCCESS"
  echo -e "${GREEN}║${NC} Failed:        $FAILED"
  echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
else
  echo -e "${RED}✗ Failed!${NC}"
  echo ""
  echo -e "${RED}Response:${NC}"
  echo "$HTTP_BODY"
fi

echo ""
echo -e "${BLUE}Test complete!${NC}"
