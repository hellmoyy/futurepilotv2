#!/usr/bin/env node

/**
 * 🔧 BINANCE API CONNECTION TESTER
 * 
 * Script untuk test koneksi ke Binance API
 * Usage: node scripts/test-binance-connection.js
 */

require('dotenv').config();
const crypto = require('crypto');

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  data: (label, value) => console.log(`  ${colors.cyan}${label}:${colors.reset} ${value}`),
  section: (msg) => console.log(`\n${colors.yellow}═══════════════════════════════════════${colors.reset}\n${msg}\n${colors.yellow}═══════════════════════════════════════${colors.reset}`),
};

// Get API credentials from environment
const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;
const USE_TESTNET = process.env.BINANCE_TESTNET === 'true';

// Base URLs
const BASE_URL = USE_TESTNET 
  ? 'https://testnet.binancefuture.com/fapi'
  : 'https://fapi.binance.com/fapi';

/**
 * Generate signature for signed endpoints
 */
function generateSignature(queryString) {
  return crypto
    .createHmac('sha256', API_SECRET)
    .update(queryString)
    .digest('hex');
}

/**
 * Make authenticated request to Binance
 */
async function makeRequest(endpoint, params = {}) {
  try {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({ ...params, timestamp }).toString();
    const signature = generateSignature(queryString);
    const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || 'Request failed');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test 1: Check if API keys are configured
 */
function testApiKeysConfigured() {
  log.section('TEST 1: Checking API Keys Configuration');

  if (!API_KEY || !API_SECRET) {
    log.error('API keys not found in .env file');
    log.warning('Please add BINANCE_API_KEY and BINANCE_API_SECRET to your .env file');
    return false;
  }

  log.success('API keys found in .env');
  log.data('API Key (first 10 chars)', API_KEY.substring(0, 10) + '...');
  log.data('API Secret (first 10 chars)', API_SECRET.substring(0, 10) + '...');
  log.data('Environment', USE_TESTNET ? 'TESTNET' : 'MAINNET');
  log.data('Base URL', BASE_URL);

  return true;
}

/**
 * Test 2: Test public endpoint (no auth required)
 */
async function testPublicEndpoint() {
  log.section('TEST 2: Testing Public Endpoint (No Auth)');

  try {
    const url = `${BASE_URL}/v1/ping`;
    log.info(`Fetching: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      log.success('Public endpoint accessible');
      log.data('Response', JSON.stringify(data));
      return true;
    } else {
      log.error('Public endpoint failed');
      log.data('Error', JSON.stringify(data));
      return false;
    }
  } catch (error) {
    log.error(`Public endpoint error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Test server time sync
 */
async function testServerTime() {
  log.section('TEST 3: Testing Server Time Sync');

  try {
    const url = `${BASE_URL}/v1/time`;
    log.info(`Fetching: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      const serverTime = data.serverTime;
      const localTime = Date.now();
      const timeDiff = Math.abs(serverTime - localTime);

      log.success('Server time retrieved');
      log.data('Server Time', new Date(serverTime).toISOString());
      log.data('Local Time', new Date(localTime).toISOString());
      log.data('Time Difference', `${timeDiff}ms`);

      if (timeDiff > 5000) {
        log.warning('Time difference > 5 seconds - may cause signature errors');
        return false;
      } else {
        log.success('Time sync OK (< 5 seconds difference)');
        return true;
      }
    } else {
      log.error('Failed to get server time');
      return false;
    }
  } catch (error) {
    log.error(`Server time error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Test account access (authenticated)
 */
async function testAccountAccess() {
  log.section('TEST 4: Testing Account Access (Authenticated)');

  const result = await makeRequest('/v2/account');

  if (result.success) {
    log.success('Account access successful');
    log.data('Total Wallet Balance', `${result.data.totalWalletBalance} USDT`);
    log.data('Available Balance', `${result.data.availableBalance} USDT`);
    log.data('Total Position Initial Margin', `${result.data.totalPositionInitialMargin} USDT`);
    log.data('Can Trade', result.data.canTrade ? 'Yes' : 'No');
    log.data('Can Deposit', result.data.canDeposit ? 'Yes' : 'No');
    log.data('Can Withdraw', result.data.canWithdraw ? 'Yes' : 'No');
    
    return true;
  } else {
    log.error('Account access failed');
    log.data('Error', result.error);
    log.warning('Common issues:');
    log.warning('  1. Invalid API key or secret');
    log.warning('  2. API key not enabled for Futures trading');
    log.warning('  3. IP address not whitelisted');
    log.warning('  4. Time sync issue');
    return false;
  }
}

/**
 * Test 5: Test API permissions
 */
async function testApiPermissions() {
  log.section('TEST 5: Testing API Permissions');

  const result = await makeRequest('/v1/apiTradingStatus');

  if (result.success) {
    log.success('Trading status retrieved');
    
    const indicators = result.data.indicators || {};
    const isLocked = indicators.isLocked || false;
    
    if (isLocked) {
      log.error('Account is locked for trading');
      log.data('Reason', indicators.reason || 'Unknown');
    } else {
      log.success('Account is active for trading');
    }
    
    return !isLocked;
  } else {
    log.error('Failed to get trading status');
    log.data('Error', result.error);
    return false;
  }
}

/**
 * Test 6: Test market data access
 */
async function testMarketData() {
  log.section('TEST 6: Testing Market Data Access');

  try {
    const url = `${BASE_URL}/v1/ticker/price?symbol=BTCUSDT`;
    log.info(`Fetching BTC price: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      log.success('Market data accessible');
      log.data('BTCUSDT Price', `$${parseFloat(data.price).toLocaleString()}`);
      return true;
    } else {
      log.error('Market data failed');
      log.data('Error', JSON.stringify(data));
      return false;
    }
  } catch (error) {
    log.error(`Market data error: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Test candle data (for technical analysis)
 */
async function testCandleData() {
  log.section('TEST 7: Testing Candle Data (For Technical Analysis)');

  try {
    const url = `${BASE_URL}/v1/klines?symbol=BTCUSDT&interval=15m&limit=5`;
    log.info(`Fetching 5 candles: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && Array.isArray(data)) {
      log.success('Candle data retrieved');
      log.data('Candles received', data.length);
      
      // Show last candle
      const lastCandle = data[data.length - 1];
      const [timestamp, open, high, low, close, volume] = lastCandle;
      
      log.info('Last candle (15m):');
      log.data('  Time', new Date(timestamp).toISOString());
      log.data('  Open', parseFloat(open).toFixed(2));
      log.data('  High', parseFloat(high).toFixed(2));
      log.data('  Low', parseFloat(low).toFixed(2));
      log.data('  Close', parseFloat(close).toFixed(2));
      log.data('  Volume', parseFloat(volume).toFixed(2));
      
      return true;
    } else {
      log.error('Candle data failed');
      log.data('Error', JSON.stringify(data));
      return false;
    }
  } catch (error) {
    log.error(`Candle data error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n');
  console.log(`${colors.yellow}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.yellow}║  BINANCE API CONNECTION TEST SUITE    ║${colors.reset}`);
  console.log(`${colors.yellow}╚════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');

  const results = [];

  // Run all tests
  results.push({ name: 'API Keys Configured', result: testApiKeysConfigured() });
  results.push({ name: 'Public Endpoint', result: await testPublicEndpoint() });
  results.push({ name: 'Server Time Sync', result: await testServerTime() });
  results.push({ name: 'Account Access', result: await testAccountAccess() });
  results.push({ name: 'API Permissions', result: await testApiPermissions() });
  results.push({ name: 'Market Data', result: await testMarketData() });
  results.push({ name: 'Candle Data', result: await testCandleData() });

  // Summary
  log.section('TEST SUMMARY');
  
  const passed = results.filter(r => r.result).length;
  const total = results.length;

  results.forEach(({ name, result }) => {
    if (result) {
      log.success(name);
    } else {
      log.error(name);
    }
  });

  console.log('\n');
  if (passed === total) {
    log.success(`All tests passed! (${passed}/${total})`);
    console.log(`\n${colors.green}🎉 Your Binance API is ready to use!${colors.reset}\n`);
    process.exit(0);
  } else {
    log.warning(`${passed}/${total} tests passed`);
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Please check the errors above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
