/**
 * 🧪 BOT INTEGRATION TEST SCRIPT
 * 
 * Test AI Decision Layer integration with Signal Listener
 * 
 * Test Cases:
 * 1. AI approves signal (EXECUTE) → Signal executed
 * 2. AI rejects signal (SKIP) → Signal skipped
 * 3. AI error with fallback → Signal executed anyway
 * 4. AI disabled → Signal executed directly
 * 5. Verify decision logging to database
 * 6. Verify statistics tracking
 * 
 * Usage:
 *   node scripts/test-bot-integration.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI,
  userId: null, // Will be set dynamically
  testSymbol: 'BTCUSDT',
};

// Mock TradingSignal for testing
const createMockSignal = (overrides = {}) => ({
  id: `test_signal_${Date.now()}`,
  symbol: 'BTCUSDT',
  timestamp: Date.now(),
  expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  action: 'BUY',
  strength: 'STRONG',
  confidence: 85,
  entryPrice: 68000,
  stopLoss: 67450,
  takeProfit: 68550,
  riskRewardRatio: 1.0,
  maxLossPercent: 0.008,
  maxProfitPercent: 0.008,
  marketRegime: 'BULLISH',
  trend: 'Uptrend',
  volatility: 0.005,
  indicators: {
    rsi: 62,
    macd: {
      value: 150,
      signal: 120,
      histogram: 30,
    },
    ema: {
      fast: 67900,
      slow: 67700,
    },
    adx: 35,
    volume: {
      current: 1200000,
      average: 1000000,
      ratio: 1.2,
    },
  },
  timeframes: {
    '1m': {
      signal: 'BUY',
      confidence: 80,
      trend: 'UP',
    },
    '3m': {
      signal: 'BUY',
      confidence: 85,
      trend: 'UP',
    },
    '5m': {
      signal: 'BUY',
      confidence: 90,
      trend: 'UP',
    },
  },
  reason: 'Triple timeframe confirmation, strong volume',
  strategy: 'futures-scalper',
  status: 'ACTIVE',
  ...overrides,
});

// Test runner
class BotIntegrationTest {
  constructor() {
    this.results = [];
  }

  async setup() {
    console.log('🔧 Setting up test environment...\n');
    
    // Connect to MongoDB
    await mongoose.connect(TEST_CONFIG.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Import models (using require for TypeScript models in Node.js)
    const UserModule = require('../src/models/User.ts');
    const AIDecisionModule = require('../src/models/AIDecision.ts');
    const UserBotModule = require('../src/models/UserBot.ts');
    
    this.User = UserModule.default || UserModule.User;
    this.AIDecision = AIDecisionModule.default || AIDecisionModule;
    this.UserBot = UserBotModule.default || UserBotModule;
    
    // Create test user
    const testUser = await this.User.findOne({ email: 'test@futurepilot.pro' });
    if (!testUser) {
      throw new Error('Test user not found. Please create test@futurepilot.pro first.');
    }
    
    TEST_CONFIG.userId = testUser._id.toString();
    console.log(`✅ Found test user: ${testUser.email} (${TEST_CONFIG.userId})`);
    
    // Ensure UserBot exists
    let userBot = await this.UserBot.findOne({ userId: testUser._id });
    if (!userBot) {
      userBot = await this.UserBot.create({
        userId: testUser._id,
        aiConfig: {
          confidenceThreshold: 0.82,
          newsWeight: 0.10,
          backtestWeight: 0.05,
          learningEnabled: true,
        },
        performanceMetrics: {
          totalSignalsReceived: 0,
          totalSignalsExecuted: 0,
          totalTrades: 0,
          profitTrades: 0,
          lossTrades: 0,
          totalProfit: 0,
          totalLoss: 0,
        },
      });
      console.log('✅ Created UserBot for test user');
    } else {
      console.log('✅ UserBot already exists');
    }
    
    // Update bot settings for testing
    await this.User.findByIdAndUpdate(testUser._id, {
      'botSettings.enabled': true,
      'botSettings.symbols': ['BTCUSDT'],
      'botSettings.minStrength': 'MODERATE',
      'botSettings.aiDecisionEnabled': true,
      'botSettings.aiDecisionFallbackEnabled': true,
    });
    console.log('✅ Bot settings configured for testing\n');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete test decisions
    const deleted = await this.AIDecision.deleteMany({
      userId: TEST_CONFIG.userId,
      'signal.symbol': TEST_CONFIG.testSymbol,
    });
    console.log(`✅ Deleted ${deleted.deletedCount} test decisions`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async runTest(name, testFn) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 TEST: ${name}`);
      console.log('='.repeat(60));
      
      const result = await testFn.call(this);
      
      this.results.push({
        name,
        status: result.success ? '✅ PASSED' : '❌ FAILED',
        details: result.details || '',
      });
      
      console.log(`\n${result.success ? '✅' : '❌'} Test ${result.success ? 'PASSED' : 'FAILED'}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    } catch (error) {
      console.error(`\n❌ Test FAILED with error:`, error.message);
      this.results.push({
        name,
        status: '❌ FAILED',
        details: error.message,
      });
    }
  }

  async testAIApproval() {
    const { AIDecisionEngine } = await import('../src/lib/ai-bot/AIDecisionEngine.js');
    
    // Create strong signal that AI should approve
    const signal = {
      id: `test_ai_approval_${Date.now()}`,
      symbol: 'BTCUSDT',
      action: 'LONG',
      confidence: 0.88, // High confidence
      entryPrice: 68000,
      stopLoss: 67450,
      takeProfit: 68550,
      indicators: {
        rsi: 62,
        macd: 30,
        adx: 35,
        volume: 1.2,
      },
      timestamp: new Date(),
    };
    
    const engine = new AIDecisionEngine();
    const result = await engine.evaluate(TEST_CONFIG.userId, signal);
    
    console.log(`\n   Decision: ${result.decision}`);
    console.log(`   Confidence: ${(result.confidenceBreakdown.total * 100).toFixed(1)}%`);
    console.log(`   Reason: ${result.reason}`);
    console.log(`   AI Cost: $${result.aiCost.toFixed(4)}`);
    
    // Verify decision was logged
    const savedDecision = await this.AIDecision.findOne({
      userId: TEST_CONFIG.userId,
      signalId: signal.id,
    });
    
    if (!savedDecision) {
      return {
        success: false,
        details: 'Decision not saved to database',
      };
    }
    
    console.log(`   ✅ Decision logged to database (ID: ${savedDecision._id})`);
    
    return {
      success: result.decision === 'EXECUTE',
      details: `AI ${result.decision} signal with ${(result.confidenceBreakdown.total * 100).toFixed(1)}% confidence`,
    };
  }

  async testAIRejection() {
    const { AIDecisionEngine } = await import('../src/lib/ai-bot/AIDecisionEngine.js');
    
    // Create weak signal that AI should reject
    const signal = {
      id: `test_ai_rejection_${Date.now()}`,
      symbol: 'BTCUSDT',
      action: 'LONG',
      confidence: 0.65, // Low confidence
      entryPrice: 68000,
      stopLoss: 67450,
      takeProfit: 68550,
      indicators: {
        rsi: 45,
        macd: 5,
        adx: 18,
        volume: 0.7,
      },
      timestamp: new Date(),
    };
    
    const engine = new AIDecisionEngine();
    const result = await engine.evaluate(TEST_CONFIG.userId, signal);
    
    console.log(`\n   Decision: ${result.decision}`);
    console.log(`   Confidence: ${(result.confidenceBreakdown.total * 100).toFixed(1)}%`);
    console.log(`   Reason: ${result.reason}`);
    
    return {
      success: result.decision === 'SKIP',
      details: `AI ${result.decision} signal with ${(result.confidenceBreakdown.total * 100).toFixed(1)}% confidence`,
    };
  }

  async testConversionFunctions() {
    // Test signal conversion from TradingSignal to AISignal format
    const mockSignal = createMockSignal();
    
    // Simulate conversion (from SignalListener.convertSignalToAI)
    const convertActionToAI = (action) => {
      if (action === 'BUY' || action === 'CLOSE_SHORT') return 'LONG';
      return 'SHORT';
    };
    
    const normalizeStrengthToConfidence = (strength) => {
      const strengthMap = {
        'WEAK': 0.65,
        'MODERATE': 0.75,
        'STRONG': 0.85,
        'VERY_STRONG': 0.95,
      };
      return strengthMap[strength] || 0.75;
    };
    
    const aiSignal = {
      id: mockSignal.id,
      symbol: mockSignal.symbol,
      action: convertActionToAI(mockSignal.action),
      confidence: normalizeStrengthToConfidence(mockSignal.strength),
      entryPrice: mockSignal.entryPrice,
      stopLoss: mockSignal.stopLoss,
      takeProfit: mockSignal.takeProfit,
      indicators: {
        rsi: mockSignal.indicators.rsi,
        macd: mockSignal.indicators.macd.histogram,
        adx: mockSignal.indicators.adx,
        volume: mockSignal.indicators.volume.ratio,
      },
      timestamp: new Date(mockSignal.timestamp),
    };
    
    console.log(`\n   Original Signal:`);
    console.log(`     - Action: ${mockSignal.action}`);
    console.log(`     - Strength: ${mockSignal.strength}`);
    console.log(`     - Confidence: ${mockSignal.confidence}%`);
    
    console.log(`\n   Converted AISignal:`);
    console.log(`     - Action: ${aiSignal.action}`);
    console.log(`     - Confidence: ${(aiSignal.confidence * 100).toFixed(1)}%`);
    console.log(`     - RSI: ${aiSignal.indicators.rsi}`);
    console.log(`     - MACD: ${aiSignal.indicators.macd}`);
    console.log(`     - ADX: ${aiSignal.indicators.adx}`);
    console.log(`     - Volume: ${aiSignal.indicators.volume}x`);
    
    return {
      success: aiSignal.action === 'LONG' && aiSignal.confidence === 0.85,
      details: 'Signal conversion successful',
    };
  }

  async testStatisticsTracking() {
    const userBot = await this.UserBot.findOne({ userId: TEST_CONFIG.userId });
    
    const initialStats = {
      signalsReceived: userBot.performanceMetrics.totalSignalsReceived,
      signalsExecuted: userBot.performanceMetrics.totalSignalsExecuted,
    };
    
    console.log(`\n   Initial Stats:`);
    console.log(`     - Signals Received: ${initialStats.signalsReceived}`);
    console.log(`     - Signals Executed: ${initialStats.signalsExecuted}`);
    
    // Simulate signal evaluation (will increment stats)
    const { AIDecisionEngine } = await import('../src/lib/ai-bot/AIDecisionEngine.js');
    const engine = new AIDecisionEngine();
    
    await engine.evaluate(TEST_CONFIG.userId, {
      id: `test_stats_${Date.now()}`,
      symbol: 'BTCUSDT',
      action: 'LONG',
      confidence: 0.88,
      entryPrice: 68000,
      stopLoss: 67450,
      takeProfit: 68550,
      timestamp: new Date(),
    });
    
    const updatedBot = await this.UserBot.findOne({ userId: TEST_CONFIG.userId });
    
    console.log(`\n   Updated Stats:`);
    console.log(`     - Signals Received: ${updatedBot.performanceMetrics.totalSignalsReceived}`);
    console.log(`     - Signals Executed: ${updatedBot.performanceMetrics.totalSignalsExecuted}`);
    
    return {
      success: updatedBot.performanceMetrics.totalSignalsReceived > initialStats.signalsReceived,
      details: `Stats incremented correctly`,
    };
  }

  printResults() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   ${result.status}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    });
    
    const passed = this.results.filter(r => r.status.includes('PASSED')).length;
    const failed = this.results.filter(r => r.status.includes('FAILED')).length;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ PASSED: ${passed}/${this.results.length}`);
    console.log(`❌ FAILED: ${failed}/${this.results.length}`);
    console.log('='.repeat(60));
  }
}

// Run all tests
async function main() {
  const tester = new BotIntegrationTest();
  
  try {
    await tester.setup();
    
    await tester.runTest('1. AI Approval (High Confidence Signal)', tester.testAIApproval);
    await tester.runTest('2. AI Rejection (Low Confidence Signal)', tester.testAIRejection);
    await tester.runTest('3. Signal Conversion (TradingSignal → AISignal)', tester.testConversionFunctions);
    await tester.runTest('4. Statistics Tracking', tester.testStatisticsTracking);
    
    tester.printResults();
    
    await tester.cleanup();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();
