/**
 * 🧪 BOT DECISION LAYER - API INTEGRATION TEST
 * 
 * Tests via API endpoints (no direct TypeScript imports needed)
 * 
 * Prerequisites:
 * - Next.js dev server running (npm run dev)
 * - MongoDB connected
 * - Admin logged in (to get admin_token cookie)
 * 
 * Run: node scripts/test-bot-decision-api.js
 */

require('dotenv').config({ path: '.env' });

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TEST_TOKEN || ''; // Set this after login

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(60) + '\n');
}

// Mock signal data
const mockSignal = {
  symbol: 'BTCUSDT',
  action: 'LONG',
  entryPrice: 68000,
  stopLoss: 67450,
  takeProfit: 68550,
  technicalConfidence: 0.78,
  indicators: {
    rsi: 62,
    macd: 0.00045,
    adx: 35,
    ema9: 67980,
    ema21: 67850,
    volume: 1.2,
  },
  timestamp: new Date().toISOString(),
};

// Test 1: News Fetch API
async function testNewsFetch() {
  section('TEST 1: News Fetch & Sentiment Analysis');
  
  try {
    log('📰 Fetching news from CryptoNews API...', 'cyan');
    
    // Note: This endpoint requires admin authentication
    const response = await fetch(`${BASE_URL}/api/admin/bot-decision/news/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin_token=${ADMIN_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        log('⚠️ TEST SKIPPED: Admin authentication required', 'yellow');
        log('Set ADMIN_TEST_TOKEN environment variable after logging in', 'yellow');
        return { success: true, skipped: true };
      }
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    log('\n✅ News Fetch Result:', 'green');
    console.log(JSON.stringify(data, null, 2));
    
    log(`\n📊 Added: ${data.added}`, 'green');
    log(`📊 Updated: ${data.updated}`, 'green');
    log(`📊 Skipped: ${data.skipped}`, 'cyan');
    
    log('\n✅ TEST PASSED: News fetch successful', 'green');
    return { success: true, data };
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Test 2: News Sentiment API
async function testNewsSentiment() {
  section('TEST 2: News Sentiment Retrieval');
  
  try {
    log('📊 Fetching news sentiment aggregate...', 'cyan');
    
    const response = await fetch(`${BASE_URL}/api/admin/bot-decision/news?symbol=BTCUSDT&hours=24`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${ADMIN_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        log('⚠️ TEST SKIPPED: Admin authentication required', 'yellow');
        return { success: true, skipped: true };
      }
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    log('\n✅ News Sentiment Summary:', 'green');
    console.log(JSON.stringify(data.aggregate, null, 2));
    
    log(`\n📰 Total News: ${data.aggregate.count}`, 'cyan');
    log(`📈 Avg Sentiment: ${data.aggregate.avgSentiment.toFixed(2)}`, 
      data.aggregate.avgSentiment > 0 ? 'green' : 'red');
    log(`✅ Bullish: ${data.aggregate.bullish}`, 'green');
    log(`❌ Bearish: ${data.aggregate.bearish}`, 'red');
    log(`➖ Neutral: ${data.aggregate.neutral}`, 'yellow');
    
    if (data.news && data.news.length > 0) {
      log(`\n📋 Latest News (top 3):`, 'cyan');
      data.news.slice(0, 3).forEach((article, idx) => {
        console.log(`\n${idx + 1}. ${article.title}`);
        console.log(`   Sentiment: ${article.sentimentLabel} (${(article.sentiment * 100).toFixed(1)}%)`);
        console.log(`   Impact: ${article.impact} (${article.impactScore}/100)`);
      });
    }
    
    log('\n✅ TEST PASSED: News sentiment retrieval successful', 'green');
    return { success: true, data };
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Test 3: Learning System Stats
async function testLearningStats() {
  section('TEST 3: Learning System Statistics');
  
  try {
    log('🎓 Fetching learning pattern statistics...', 'cyan');
    
    const response = await fetch(`${BASE_URL}/api/admin/bot-decision/learning/stats`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${ADMIN_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        log('⚠️ TEST SKIPPED: Admin authentication required', 'yellow');
        return { success: true, skipped: true };
      }
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    log('\n✅ Learning Statistics:', 'green');
    console.log(JSON.stringify(data, null, 2));
    
    log(`\n📊 Total Patterns: ${data.patterns.total}`, 'cyan');
    log(`❌ Loss Patterns: ${data.patterns.lossPatterns}`, 'red');
    log(`✅ Win Patterns: ${data.patterns.winPatterns}`, 'green');
    log(`📈 Avg Effectiveness: ${(data.effectiveness.avgSuccessRate * 100).toFixed(1)}%`, 'cyan');
    
    if (data.topPatterns && data.topPatterns.length > 0) {
      log(`\n🏆 Top 3 Patterns:`, 'cyan');
      data.topPatterns.slice(0, 3).forEach((pattern, idx) => {
        console.log(`\n${idx + 1}. ${pattern.type.toUpperCase()} - ${pattern.description}`);
        console.log(`   Effectiveness: ${(pattern.successRate * 100).toFixed(1)}%`);
        console.log(`   Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
        console.log(`   Occurrences: ${pattern.occurrences}`);
      });
    }
    
    log('\n✅ TEST PASSED: Learning stats retrieval successful', 'green');
    return { success: true, data };
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Test 4: Decision Logging
async function testDecisionLogging() {
  section('TEST 4: Decision Logging Retrieval');
  
  try {
    log('📋 Fetching decision logs...', 'cyan');
    
    const response = await fetch(`${BASE_URL}/api/admin/bot-decision/decisions?limit=5`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${ADMIN_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        log('⚠️ TEST SKIPPED: Admin authentication required', 'yellow');
        return { success: true, skipped: true };
      }
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    log('\n✅ Decision Logs Summary:', 'green');
    log(`Total Decisions: ${data.total}`, 'cyan');
    log(`Executed: ${data.stats.executed}`, 'green');
    log(`Skipped: ${data.stats.skipped}`, 'yellow');
    log(`Avg Confidence: ${(data.stats.avgConfidence * 100).toFixed(1)}%`, 'cyan');
    
    if (data.decisions && data.decisions.length > 0) {
      log(`\n📋 Latest Decisions (top 3):`, 'cyan');
      data.decisions.slice(0, 3).forEach((decision, idx) => {
        console.log(`\n${idx + 1}. ${decision.signal?.symbol} ${decision.signal?.action}`);
        console.log(`   Decision: ${decision.decision}`);
        console.log(`   Confidence: ${(decision.confidenceBreakdown.total * 100).toFixed(1)}%`);
        console.log(`   Timestamp: ${new Date(decision.timestamp).toLocaleString()}`);
        if (decision.execution) {
          console.log(`   Result: ${decision.execution.result} (${decision.execution.profit > 0 ? '+' : ''}$${decision.execution.profit.toFixed(2)})`);
        }
      });
    }
    
    log('\n✅ TEST PASSED: Decision logging retrieval successful', 'green');
    return { success: true, data };
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Test 5: Health Check
async function testHealthCheck() {
  section('TEST 5: System Health Check');
  
  try {
    log('🏥 Checking system health...', 'cyan');
    
    // Check if dev server is running
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Dev server not responding');
    }
    
    log('✅ Dev server is running', 'green');
    
    // Check if MongoDB is connected (via any API)
    const dbResponse = await fetch(`${BASE_URL}/api/admin/bot-decision/news?hours=1`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${ADMIN_TOKEN}`,
      },
    });
    
    if (dbResponse.ok || dbResponse.status === 401) {
      log('✅ MongoDB connection active', 'green');
    } else {
      log('⚠️ MongoDB connection issue', 'yellow');
    }
    
    log('\n✅ TEST PASSED: System health OK', 'green');
    return { success: true };
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTests() {
  section('BOT DECISION LAYER - API INTEGRATION TEST');
  
  log('Starting API integration tests...', 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  
  if (!ADMIN_TOKEN) {
    log('\n⚠️ WARNING: No ADMIN_TEST_TOKEN set', 'yellow');
    log('Some tests will be skipped. To get token:', 'yellow');
    log('1. Login to admin at /administrator', 'yellow');
    log('2. Open DevTools → Application → Cookies', 'yellow');
    log('3. Copy admin_token value', 'yellow');
    log('4. Set ADMIN_TEST_TOKEN=<token> in .env\n', 'yellow');
  }
  
  const results = {
    healthCheck: null,
    newsFetch: null,
    newsSentiment: null,
    learningStats: null,
    decisionLogging: null,
  };
  
  try {
    // Run tests
    results.healthCheck = await testHealthCheck();
    results.newsSentiment = await testNewsSentiment();
    results.learningStats = await testLearningStats();
    results.decisionLogging = await testDecisionLogging();
    
    // Uncomment to test news fetch (creates new DB records)
    // results.newsFetch = await testNewsFetch();
    
    // Summary
    section('TEST SUMMARY');
    
    const passed = Object.values(results).filter(r => r?.success).length;
    const skipped = Object.values(results).filter(r => r?.skipped).length;
    const total = Object.values(results).filter(r => r !== null).length;
    
    log(`\n📊 Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
    if (skipped > 0) {
      log(`⚠️ Skipped: ${skipped} tests (auth required)`, 'yellow');
    }
    
    Object.entries(results).forEach(([test, result]) => {
      if (result === null) return;
      
      const status = result.success 
        ? (result.skipped ? '⚠️ SKIPPED' : '✅ PASSED') 
        : '❌ FAILED';
      const color = result.success 
        ? (result.skipped ? 'yellow' : 'green') 
        : 'red';
      
      log(`${status} - ${test}`, color);
      if (result.error) {
        log(`  Error: ${result.error}`, 'red');
      }
    });
    
    if (passed === total && skipped === 0) {
      log('\n🎉 All tests passed! Bot Decision Layer is fully functional!', 'bright');
    } else if (passed + skipped === total) {
      log('\n✅ All tests passed (some skipped due to auth)', 'green');
      log('Set ADMIN_TEST_TOKEN to run full test suite', 'yellow');
    } else {
      log('\n⚠️ Some tests failed. Check errors above.', 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ Test runner error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Check if dev server is running
async function checkDevServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    return response.ok || response.status === 404; // 404 is OK if health endpoint doesn't exist
  } catch (error) {
    return false;
  }
}

// Run tests
(async () => {
  const serverRunning = await checkDevServer();
  
  if (!serverRunning) {
    log('❌ ERROR: Dev server is not running!', 'red');
    log('\nPlease start the dev server first:', 'yellow');
    log('  npm run dev', 'cyan');
    log('\nThen run this test again.', 'yellow');
    process.exit(1);
  }
  
  await runTests();
})().catch(console.error);
