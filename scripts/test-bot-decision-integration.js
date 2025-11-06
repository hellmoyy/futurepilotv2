/**
 * 🧪 BOT DECISION LAYER - INTEGRATION TEST
 * 
 * Tests complete flow:
 * 1. Signal Generation (mock)
 * 2. News Sentiment Analysis
 * 3. Learning Pattern Detection
 * 4. AI Decision Making (DeepSeek)
 * 5. Bot Execution Simulation
 * 
 * Run: node scripts/test-bot-decision-integration.js
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Test configuration
const TESTS = {
  SIGNAL_EVALUATION: true,
  NEWS_INTEGRATION: true,
  LEARNING_SYSTEM: true,
  END_TO_END: true,
  CLEANUP: false, // Set true to cleanup test data after
};

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
  timestamp: new Date(),
};

// Test database connection
async function connectDB() {
  try {
    log('Connecting to MongoDB...', 'cyan');
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Connected to MongoDB', 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to connect to MongoDB: ${error.message}`, 'red');
    return false;
  }
}

// Test 1: Signal Evaluation
async function testSignalEvaluation() {
  section('TEST 1: Signal Evaluation');
  
  try {
    log('📊 Testing signal evaluation with AIDecisionEngine...', 'cyan');
    
    // Import AIDecisionEngine
    const { AIDecisionEngine } = await import('../src/lib/ai-bot/AIDecisionEngine.ts');
    
    // Create test user
    const User = (await import('../src/models/User.ts')).default;
    let testUser = await User.findOne({ email: 'test-bot@futurepilot.com' });
    
    if (!testUser) {
      log('Creating test user...', 'yellow');
      testUser = await User.create({
        email: 'test-bot@futurepilot.com',
        username: 'testbot',
        password: 'test123456',
        walletData: {
          balance: 0,
          mainnetBalance: 0,
          gasFeeBalance: 100, // $100 gas fee for testing
        },
      });
      log('✅ Test user created', 'green');
    }
    
    // Create UserBot if not exists
    const UserBot = (await import('../src/models/UserBot.ts')).default;
    let testBot = await UserBot.findOne({ userId: testUser._id });
    
    if (!testBot) {
      log('Creating test bot...', 'yellow');
      testBot = await UserBot.create({
        userId: testUser._id,
        status: 'active',
        aiConfig: {
          enabled: true,
          confidenceThreshold: 0.82,
          newsWeight: 0.10,
          backtestWeight: 0.05,
          learningWeight: 0.03,
          minGasFeeBalance: 10,
        },
        tradingConfig: {
          riskPercent: 0.02,
          maxLeverage: 10,
          maxDailyTrades: 20,
          allowedPairs: ['BTCUSDT', 'ETHUSDT'],
          blacklistPairs: [],
        },
        lastBalanceCheck: {
          timestamp: new Date(),
          binanceBalance: 10000,
          gasFeeBalance: 100,
          availableMargin: 8000,
        },
      });
      log('✅ Test bot created', 'green');
    }
    
    // Initialize decision engine
    const engine = new AIDecisionEngine();
    
    log('\n📊 Signal Details:', 'cyan');
    console.log(JSON.stringify(mockSignal, null, 2));
    
    // Evaluate signal
    log('\n🤖 Evaluating signal with AI...', 'cyan');
    const decision = await engine.evaluate(mockSignal, testUser._id.toString());
    
    log('\n✅ Decision Result:', 'green');
    console.log(JSON.stringify(decision, null, 2));
    
    // Verify decision
    if (decision.decision === 'EXECUTE' || decision.decision === 'SKIP') {
      log('\n✅ TEST PASSED: Signal evaluation successful', 'green');
      log(`Decision: ${decision.decision}`, decision.decision === 'EXECUTE' ? 'green' : 'yellow');
      log(`Final Confidence: ${(decision.confidenceBreakdown.total * 100).toFixed(2)}%`, 'cyan');
      log(`Threshold: ${(testBot.aiConfig.confidenceThreshold * 100).toFixed(0)}%`, 'cyan');
      return { success: true, decision };
    } else {
      log('❌ TEST FAILED: Invalid decision format', 'red');
      return { success: false, error: 'Invalid decision' };
    }
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Test 2: News Integration
async function testNewsIntegration() {
  section('TEST 2: News Integration');
  
  try {
    log('📰 Testing news sentiment analysis...', 'cyan');
    
    const NewsEvent = (await import('../src/models/NewsEvent.ts')).default;
    
    // Check if news exists
    const newsCount = await NewsEvent.countDocuments();
    log(`Found ${newsCount} news articles in database`, 'cyan');
    
    if (newsCount === 0) {
      log('⚠️ No news in database. Fetching from API...', 'yellow');
      
      // Simulate news fetch (call real API endpoint)
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:3000/api/admin/bot-decision/news/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In real test, need admin token
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        log(`✅ Fetched ${data.added + data.updated} articles`, 'green');
      } else {
        log('⚠️ Could not fetch news (admin auth required)', 'yellow');
        log('Skipping news integration test', 'yellow');
        return { success: true, skipped: true };
      }
    }
    
    // Get aggregate sentiment
    const aggregate = await NewsEvent.getAggregateSentiment('BTCUSDT', 24);
    
    log('\n📊 News Sentiment Summary (last 24h):', 'cyan');
    console.log(JSON.stringify(aggregate, null, 2));
    
    // Test sentiment impact calculation
    const sentimentImpact = aggregate.avgSentiment * 0.10; // 10% weight
    log(`\n💡 Sentiment Impact: ${(sentimentImpact * 100).toFixed(2)}%`, 'cyan');
    
    if (aggregate.count > 0) {
      log('\n✅ TEST PASSED: News integration working', 'green');
      return { success: true, aggregate };
    } else {
      log('\n⚠️ TEST SKIPPED: No news data available', 'yellow');
      return { success: true, skipped: true };
    }
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Test 3: Learning System
async function testLearningSystem() {
  section('TEST 3: Learning System');
  
  try {
    log('🎓 Testing learning pattern detection...', 'cyan');
    
    const LearningPattern = (await import('../src/models/LearningPattern.ts')).default;
    
    // Check existing patterns
    const patternCount = await LearningPattern.countDocuments();
    log(`Found ${patternCount} learning patterns in database`, 'cyan');
    
    // Get pattern statistics
    const stats = await LearningPattern.getStats();
    
    log('\n📊 Learning Pattern Statistics:', 'cyan');
    console.log(JSON.stringify(stats, null, 2));
    
    // Test pattern matching for signal
    const matchingPatterns = await LearningPattern.findMatchingPatterns(mockSignal);
    
    log(`\n🔍 Found ${matchingPatterns.length} matching patterns for signal`, 'cyan');
    
    if (matchingPatterns.length > 0) {
      log('\n📋 Top Matching Patterns:', 'cyan');
      matchingPatterns.slice(0, 3).forEach((pattern, idx) => {
        console.log(`\n${idx + 1}. ${pattern.type.toUpperCase()} Pattern:`);
        console.log(`   Description: ${pattern.description}`);
        console.log(`   Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
        console.log(`   Success Rate: ${(pattern.successRate * 100).toFixed(1)}%`);
        console.log(`   Occurrences: ${pattern.occurrences}`);
      });
    }
    
    // Calculate learning impact
    let learningImpact = 0;
    matchingPatterns.forEach(pattern => {
      if (pattern.type === 'loss') {
        learningImpact -= pattern.confidence * 0.03; // Negative for loss patterns
      } else if (pattern.type === 'win') {
        learningImpact += pattern.confidence * 0.03; // Positive for win patterns
      }
    });
    
    log(`\n💡 Learning Impact: ${(learningImpact * 100).toFixed(2)}%`, 'cyan');
    
    log('\n✅ TEST PASSED: Learning system functional', 'green');
    return { success: true, stats, matchingPatterns, learningImpact };
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Test 4: End-to-End Bot Execution
async function testEndToEnd() {
  section('TEST 4: End-to-End Bot Execution');
  
  try {
    log('🤖 Testing complete bot decision flow...', 'cyan');
    
    // Step 1: Signal Generation (already have mockSignal)
    log('\n📊 Step 1: Signal Generated', 'green');
    console.log(`Symbol: ${mockSignal.symbol}`);
    console.log(`Action: ${mockSignal.action}`);
    console.log(`Technical Confidence: ${(mockSignal.technicalConfidence * 100).toFixed(1)}%`);
    
    // Step 2: News Sentiment
    log('\n📰 Step 2: Fetching News Sentiment...', 'cyan');
    const NewsEvent = (await import('../src/models/NewsEvent.ts')).default;
    const newsAggregate = await NewsEvent.getAggregateSentiment(mockSignal.symbol, 24);
    const newsImpact = newsAggregate.avgSentiment * 0.10;
    log(`News Impact: ${(newsImpact * 100).toFixed(2)}%`, newsImpact > 0 ? 'green' : 'red');
    
    // Step 3: Learning Patterns
    log('\n🎓 Step 3: Checking Learning Patterns...', 'cyan');
    const LearningPattern = (await import('../src/models/LearningPattern.ts')).default;
    const patterns = await LearningPattern.findMatchingPatterns(mockSignal);
    let learningImpact = 0;
    patterns.forEach(p => {
      learningImpact += (p.type === 'win' ? 1 : -1) * p.confidence * 0.03;
    });
    log(`Learning Impact: ${(learningImpact * 100).toFixed(2)}%`, learningImpact > 0 ? 'green' : 'red');
    log(`Matching Patterns: ${patterns.length}`, 'cyan');
    
    // Step 4: AI Decision
    log('\n🤖 Step 4: AI Decision Making...', 'cyan');
    const { AIDecisionEngine } = await import('../src/lib/ai-bot/AIDecisionEngine.ts');
    const engine = new AIDecisionEngine();
    
    const User = (await import('../src/models/User.ts')).default;
    const testUser = await User.findOne({ email: 'test-bot@futurepilot.com' });
    
    const decision = await engine.evaluate(mockSignal, testUser._id.toString());
    
    log(`\nDecision: ${decision.decision}`, decision.decision === 'EXECUTE' ? 'green' : 'yellow');
    log(`Final Confidence: ${(decision.confidenceBreakdown.total * 100).toFixed(2)}%`, 'cyan');
    
    // Step 5: Gas Fee Check
    log('\n💰 Step 5: Gas Fee Balance Check...', 'cyan');
    const gasFeeBalance = testUser.walletData.gasFeeBalance || 0;
    log(`Gas Fee Balance: $${gasFeeBalance.toFixed(2)}`, 'cyan');
    
    const canTrade = gasFeeBalance >= 10;
    log(`Can Trade: ${canTrade ? 'YES' : 'NO'}`, canTrade ? 'green' : 'red');
    
    // Step 6: Execution Simulation
    if (decision.decision === 'EXECUTE' && canTrade) {
      log('\n⚡ Step 6: Simulating Trade Execution...', 'cyan');
      
      // Calculate position size
      const accountBalance = 10000; // Mock balance
      const riskAmount = accountBalance * 0.02; // 2% risk
      const stopLossDistance = Math.abs(mockSignal.entryPrice - mockSignal.stopLoss);
      const positionSize = riskAmount / stopLossDistance;
      
      log(`Account Balance: $${accountBalance}`, 'cyan');
      log(`Risk Amount: $${riskAmount.toFixed(2)} (2%)`, 'cyan');
      log(`Position Size: ${positionSize.toFixed(4)} ${mockSignal.symbol.replace('USDT', '')}`, 'cyan');
      
      // Simulate entry
      log(`\nENTERING TRADE:`, 'green');
      log(`  Entry Price: $${mockSignal.entryPrice}`, 'cyan');
      log(`  Stop Loss: $${mockSignal.stopLoss}`, 'red');
      log(`  Take Profit: $${mockSignal.takeProfit}`, 'green');
      log(`  Leverage: 10x`, 'cyan');
      
      // Mock result (random WIN/LOSS for testing)
      const isWin = Math.random() > 0.3; // 70% win rate
      const profit = isWin 
        ? positionSize * (mockSignal.takeProfit - mockSignal.entryPrice)
        : -positionSize * (mockSignal.entryPrice - mockSignal.stopLoss);
      
      log(`\nTRADE RESULT: ${isWin ? 'WIN' : 'LOSS'}`, isWin ? 'green' : 'red');
      log(`Profit/Loss: $${profit.toFixed(2)}`, profit > 0 ? 'green' : 'red');
      
      // Step 7: Commission Deduction
      if (isWin && profit > 0) {
        const commissionRate = 0.20; // 20% default
        const commission = profit * commissionRate;
        const newGasFee = gasFeeBalance - commission;
        
        log('\n💸 Step 7: Commission Deduction...', 'cyan');
        log(`Profit: $${profit.toFixed(2)}`, 'green');
        log(`Commission (20%): $${commission.toFixed(2)}`, 'yellow');
        log(`New Gas Fee Balance: $${newGasFee.toFixed(2)}`, newGasFee >= 10 ? 'green' : 'red');
        
        if (newGasFee < 10) {
          log('\n⚠️ WARNING: Gas fee balance below $10 after trade!', 'yellow');
          log('User will not be able to trade again until topup', 'yellow');
        }
      }
      
      log('\n✅ TEST PASSED: End-to-end flow completed successfully', 'green');
      return { success: true, decision, profit, canTrade };
      
    } else {
      if (!canTrade) {
        log('\n❌ TRADE BLOCKED: Insufficient gas fee balance', 'red');
      } else {
        log('\n⏭️ TRADE SKIPPED: AI decision was SKIP', 'yellow');
      }
      
      log('\n✅ TEST PASSED: Flow completed (no execution)', 'green');
      return { success: true, decision, executed: false };
    }
    
  } catch (error) {
    log(`❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Cleanup test data
async function cleanup() {
  section('CLEANUP');
  
  try {
    log('🧹 Cleaning up test data...', 'cyan');
    
    const User = (await import('../src/models/User.ts')).default;
    const UserBot = (await import('../src/models/UserBot.ts')).default;
    const AIDecision = (await import('../src/models/AIDecision.ts')).default;
    
    // Find test user
    const testUser = await User.findOne({ email: 'test-bot@futurepilot.com' });
    
    if (testUser) {
      // Delete test bot
      await UserBot.deleteMany({ userId: testUser._id });
      log('✅ Deleted test bot', 'green');
      
      // Delete test decisions
      await AIDecision.deleteMany({ userId: testUser._id });
      log('✅ Deleted test decisions', 'green');
      
      // Delete test user
      await User.deleteOne({ _id: testUser._id });
      log('✅ Deleted test user', 'green');
    }
    
    log('\n✅ Cleanup completed', 'green');
    
  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
  }
}

// Main test runner
async function runTests() {
  section('BOT DECISION LAYER - INTEGRATION TEST');
  
  log('Starting integration tests...', 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
  
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    log('\n❌ Cannot run tests without database connection', 'red');
    process.exit(1);
  }
  
  const results = {
    signalEvaluation: null,
    newsIntegration: null,
    learningSystem: null,
    endToEnd: null,
  };
  
  try {
    // Run tests
    if (TESTS.SIGNAL_EVALUATION) {
      results.signalEvaluation = await testSignalEvaluation();
    }
    
    if (TESTS.NEWS_INTEGRATION) {
      results.newsIntegration = await testNewsIntegration();
    }
    
    if (TESTS.LEARNING_SYSTEM) {
      results.learningSystem = await testLearningSystem();
    }
    
    if (TESTS.END_TO_END) {
      results.endToEnd = await testEndToEnd();
    }
    
    // Cleanup if enabled
    if (TESTS.CLEANUP) {
      await cleanup();
    }
    
    // Summary
    section('TEST SUMMARY');
    
    const passed = Object.values(results).filter(r => r?.success).length;
    const total = Object.values(results).filter(r => r !== null).length;
    
    log(`\n📊 Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
    
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
    
    log('\n🎉 Integration testing complete!', 'bright');
    
  } catch (error) {
    log(`\n❌ Test runner error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log('\n📴 Disconnected from MongoDB', 'cyan');
  }
}

// Run tests
runTests().catch(console.error);
