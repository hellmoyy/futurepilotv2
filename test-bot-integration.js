/**
 * Phase 2 Bot Integration - API Testing Script
 * 
 * Tests all bot integration endpoints and flow:
 * 1. Configure bot settings
 * 2. Start bot
 * 3. Generate signal
 * 4. Check bot status
 * 5. Stop bot
 * 
 * Prerequisites:
 * - Dev server running (npm run dev)
 * - User logged in (need session token)
 * - Binance API credentials configured
 * - Gas fee balance >= $10
 */

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  botSettings: {
    enabled: true,
    symbols: ['BTCUSDT'],
    minStrength: 'STRONG',
    riskPerTrade: 2,
    maxPositions: 3,
    leverage: 10,
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Configure Bot Settings
 */
async function testBotSettings() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('TEST 1: Configure Bot Settings', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);
  
  try {
    logInfo('Sending POST request to /api/user/bot-settings...');
    
    const response = await fetch(`${BASE_URL}/api/user/bot-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CONFIG.botSettings),
      credentials: 'include', // Include cookies for session
    });
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess('Bot settings configured successfully');
      console.log('Settings:', JSON.stringify(data.settings, null, 2));
      return true;
    } else {
      logError(`Failed: ${data.error}`);
      if (data.error?.includes('Unauthorized')) {
        logWarning('You need to be logged in. Please login first.');
      }
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Get Bot Settings
 */
async function testGetBotSettings() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('TEST 2: Get Bot Settings', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);
  
  try {
    logInfo('Sending GET request to /api/user/bot-settings...');
    
    const response = await fetch(`${BASE_URL}/api/user/bot-settings`, {
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess('Bot settings retrieved successfully');
      console.log('Settings:', JSON.stringify(data.settings, null, 2));
      return true;
    } else {
      logError(`Failed: ${data.error}`);
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Start Bot
 */
async function testStartBot() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('TEST 3: Start Bot', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);
  
  try {
    logInfo('Sending POST request to /api/user/bot-control...');
    
    const response = await fetch(`${BASE_URL}/api/user/bot-control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'start' }),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess(`Bot started successfully - Status: ${data.status}`);
      if (data.stats) {
        console.log('Stats:', JSON.stringify(data.stats, null, 2));
      }
      return true;
    } else {
      logError(`Failed: ${data.error}`);
      if (data.error?.includes('Binance API')) {
        logWarning('Make sure Binance API credentials are configured in your account');
      }
      if (data.error?.includes('gas fee')) {
        logWarning('Make sure you have at least $10 gas fee balance');
      }
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Get Bot Status
 */
async function testGetBotStatus() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('TEST 4: Get Bot Status', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);
  
  try {
    logInfo('Sending GET request to /api/user/bot-control...');
    
    const response = await fetch(`${BASE_URL}/api/user/bot-control`, {
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess(`Bot status retrieved - Status: ${data.status}`);
      console.log('Stats:', JSON.stringify(data.stats, null, 2));
      console.log('Active Positions:', data.activePositions);
      console.log('Settings:', JSON.stringify(data.settings, null, 2));
      return true;
    } else {
      logError(`Failed: ${data.error}`);
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Generate Signal (Manual Trigger)
 */
async function testGenerateSignal() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('TEST 5: Generate Signal (Manual Trigger)', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);
  
  try {
    logInfo('Sending POST request to /api/cron/generate-signals...');
    
    const response = await fetch(`${BASE_URL}/api/cron/generate-signals`, {
      method: 'POST',
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.signal) {
        logSuccess('Signal generated successfully!');
        console.log('Signal:', JSON.stringify(data.signal, null, 2));
        console.log('\nStats:', JSON.stringify(data.stats, null, 2));
        logInfo('Bot should automatically receive and execute this signal if running');
      } else {
        logWarning('No signal generated (market conditions not met)');
        console.log('Message:', data.message);
      }
      return true;
    } else {
      logError(`Failed: ${data.error}`);
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Stop Bot
 */
async function testStopBot() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('TEST 6: Stop Bot', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);
  
  try {
    logInfo('Sending POST request to /api/user/bot-control...');
    
    const response = await fetch(`${BASE_URL}/api/user/bot-control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'stop' }),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess(`Bot stopped successfully - Status: ${data.status}`);
      if (data.stats) {
        console.log('Final Stats:', JSON.stringify(data.stats, null, 2));
      }
      return true;
    } else {
      logError(`Failed: ${data.error}`);
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Check Signal Center Status
 */
async function testSignalCenterStatus() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('TEST 7: Check Signal Center Status', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);
  
  try {
    logInfo('Sending GET request to /api/cron/generate-signals...');
    
    const response = await fetch(`${BASE_URL}/api/cron/generate-signals`, {
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess('Signal Center operational');
      console.log('Status:', data.status);
      console.log('Generator Stats:', JSON.stringify(data.stats, null, 2));
      console.log('Broadcaster Stats:', JSON.stringify(data.broadcasterStats, null, 2));
      return true;
    } else {
      logError(`Failed: ${data.error}`);
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n╔══════════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║  🧪 PHASE 2 BOT INTEGRATION - API TESTING                       ║', colors.cyan);
  log('╚══════════════════════════════════════════════════════════════════╝\n', colors.cyan);
  
  logInfo('Starting comprehensive API tests...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };
  
  // Test 1: Configure Bot Settings
  results.total++;
  if (await testBotSettings()) results.passed++;
  else results.failed++;
  
  await sleep(1000);
  
  // Test 2: Get Bot Settings
  results.total++;
  if (await testGetBotSettings()) results.passed++;
  else results.failed++;
  
  await sleep(1000);
  
  // Test 3: Start Bot
  results.total++;
  if (await testStartBot()) results.passed++;
  else results.failed++;
  
  await sleep(2000);
  
  // Test 4: Get Bot Status
  results.total++;
  if (await testGetBotStatus()) results.passed++;
  else results.failed++;
  
  await sleep(1000);
  
  // Test 5: Generate Signal
  results.total++;
  if (await testGenerateSignal()) results.passed++;
  else results.failed++;
  
  await sleep(3000);
  
  // Test 6: Check status after signal
  results.total++;
  logInfo('Checking bot status after signal generation...');
  if (await testGetBotStatus()) results.passed++;
  else results.failed++;
  
  await sleep(1000);
  
  // Test 7: Signal Center Status
  results.total++;
  if (await testSignalCenterStatus()) results.passed++;
  else results.failed++;
  
  await sleep(1000);
  
  // Test 8: Stop Bot
  results.total++;
  if (await testStopBot()) results.passed++;
  else results.failed++;
  
  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('TEST SUMMARY', colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);
  
  console.log(`Total Tests:  ${results.total}`);
  logSuccess(`Passed:       ${results.passed}`);
  logError(`Failed:       ${results.failed}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);
  
  if (results.failed === 0) {
    logSuccess('🎉 ALL TESTS PASSED! Bot integration working perfectly!');
  } else {
    logWarning(`⚠️  ${results.failed} test(s) failed. Check errors above for details.`);
  }
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
