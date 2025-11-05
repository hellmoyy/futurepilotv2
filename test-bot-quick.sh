#!/bin/bash

# Phase 2 Bot Integration - Quick Test Runner
# This script automates the entire testing process

set -e # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  🧪 PHASE 2 BOT INTEGRATION - QUICK TEST RUNNER                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo ""
    echo "Please create .env.local with required environment variables:"
    echo "  MONGODB_URI=..."
    echo "  BINANCE_TESTNET=true"
    echo "  BINANCE_TESTNET_API_KEY=..."
    echo "  BINANCE_TESTNET_API_SECRET=..."
    echo ""
    exit 1
fi

# Check if Binance keys are configured
if ! grep -q "BINANCE_TESTNET_API_KEY" .env.local; then
    echo -e "${YELLOW}⚠️  Warning: BINANCE_TESTNET_API_KEY not found in .env.local${NC}"
    echo ""
    echo "To test bot integration, you need Binance Testnet API keys:"
    echo "1. Go to: https://testnet.binancefuture.com/"
    echo "2. Login with GitHub/Google"
    echo "3. Create API Key with Futures trading permission"
    echo "4. Add to .env.local:"
    echo "   BINANCE_TESTNET_API_KEY=your_key"
    echo "   BINANCE_TESTNET_API_SECRET=your_secret"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Setup test user
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 1: Setup Test User${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f scripts/setup-test-user.js ]; then
    echo -e "${GREEN}Running setup-test-user.js...${NC}"
    node scripts/setup-test-user.js
    echo ""
else
    echo -e "${YELLOW}⚠️  setup-test-user.js not found, skipping...${NC}"
    echo ""
fi

# Step 2: Check if dev server is running
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 2: Check Dev Server${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Dev server is running on http://localhost:3000${NC}"
    echo ""
else
    echo -e "${RED}❌ Dev server is not running${NC}"
    echo ""
    echo "Please start dev server in another terminal:"
    echo "  npm run dev"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Step 3: Run API tests
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 3: Run API Tests${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f test-bot-integration.js ]; then
    echo -e "${GREEN}Running test-bot-integration.js...${NC}"
    echo ""
    node test-bot-integration.js
    
    TEST_EXIT_CODE=$?
    
    echo ""
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  🎉 ALL TESTS COMPLETED SUCCESSFULLY!                            ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${RED}╔══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ⚠️  SOME TESTS FAILED                                           ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Common issues:"
        echo "1. Not logged in → Login at http://localhost:3000/login"
        echo "2. Binance API not configured → Add keys to .env.local"
        echo "3. Insufficient gas balance → Run setup-test-user.js"
        echo ""
    fi
else
    echo -e "${RED}❌ test-bot-integration.js not found${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}NEXT STEPS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "✅ Check MongoDB collections for data:"
echo "   - positions: Open/closed positions"
echo "   - botexecutions: Execution attempts"
echo "   - futurepilotcols: User balance updates"
echo ""
echo "✅ Monitor dev server logs for:"
echo "   - Signal generation"
echo "   - Bot execution"
echo "   - Position monitoring"
echo "   - Commission deductions"
echo ""
echo "✅ Build Bot Control Panel UI (optional):"
echo "   - File: src/app/dashboard/bot-control/page.tsx"
echo "   - Features: Start/stop, status, positions, settings"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
