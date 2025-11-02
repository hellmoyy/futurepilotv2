/**
 * Trading Commission Manual Testing Script
 * 
 * This script helps test trading commission system manually
 * Run: node scripts/test-trading-commission.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User').User;
const Transaction = require('../src/models/Transaction').Transaction;
const Settings = require('../src/models/Settings').Settings;

// Import trading commission functions
const {
  canUserTrade,
  calculateMaxProfit,
  shouldAutoClose,
  deductTradingCommission,
  getTradingCommissionSummary,
  MINIMUM_GAS_FEE,
} = require('../src/lib/tradingCommission');

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

// Test utilities
function log(emoji, message, data = null) {
  console.log(`\n${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    return false;
  }
  console.log(`✅ PASSED: ${message}`);
  return true;
}

// ====================
// TEST CASES
// ====================

async function test1_MinimumGasFeeCheck() {
  log('🧪', 'TEST 1: Minimum Gas Fee Check');
  
  try {
    // Find a user (or create test user)
    let testUser = await User.findOne({ email: { $regex: /test/i } }).limit(1);
    if (!testUser) {
      log('⚠️', 'No test user found, using first available user');
      testUser = await User.findOne().limit(1);
    }
    
    if (!testUser) {
      log('❌', 'No users found in database');
      return false;
    }
    
    log('📝', `Using test user: ${testUser.email}`);
    const originalBalance = testUser.gasFeeBalance;
    log('💰', `Original gas fee balance: $${originalBalance}`);
    
    // Test 1a: Balance < $10
    testUser.gasFeeBalance = 5;
    await testUser.save();
    const result1 = await canUserTrade(testUser._id);
    assert(
      !result1.canTrade,
      `User with $5 balance should NOT be able to trade`
    );
    assert(
      result1.reason.includes('Insufficient'),
      `Reason should mention insufficient balance`
    );
    
    // Test 1b: Balance = $10
    testUser.gasFeeBalance = 10;
    await testUser.save();
    const result2 = await canUserTrade(testUser._id);
    assert(
      result2.canTrade,
      `User with $10 balance SHOULD be able to trade`
    );
    
    // Test 1c: Balance > $10
    testUser.gasFeeBalance = 50;
    await testUser.save();
    const result3 = await canUserTrade(testUser._id);
    assert(
      result3.canTrade,
      `User with $50 balance SHOULD be able to trade`
    );
    
    // Restore original balance
    testUser.gasFeeBalance = originalBalance;
    await testUser.save();
    
    log('✅', 'TEST 1 COMPLETED');
    return true;
  } catch (error) {
    log('❌', 'TEST 1 FAILED', error.message);
    return false;
  }
}

async function test2_MaxProfitCalculation() {
  log('🧪', 'TEST 2: Max Profit Calculation');
  
  try {
    const testUser = await User.findOne().limit(1);
    const originalBalance = testUser.gasFeeBalance;
    
    // Get settings for commission rate
    const settings = await Settings.findOne();
    const commissionRate = settings?.tradingCommission || 20;
    
    log('⚙️', `Commission rate: ${commissionRate}%`);
    
    // Test with $10 gas fee
    testUser.gasFeeBalance = 10;
    await testUser.save();
    
    const result1 = await calculateMaxProfit(testUser._id);
    const expectedMaxProfit = 10 / (commissionRate / 100);
    const expectedThreshold = expectedMaxProfit * 0.9;
    
    log('📊', 'Results for $10 gas fee:', result1);
    
    assert(
      Math.abs(result1.maxProfit - expectedMaxProfit) < 0.01,
      `Max profit should be ~$${expectedMaxProfit.toFixed(2)}, got $${result1.maxProfit.toFixed(2)}`
    );
    
    assert(
      Math.abs(result1.autoCloseThreshold - expectedThreshold) < 0.01,
      `Auto-close threshold should be ~$${expectedThreshold.toFixed(2)}, got $${result1.autoCloseThreshold.toFixed(2)}`
    );
    
    // Test with $50 gas fee
    testUser.gasFeeBalance = 50;
    await testUser.save();
    
    const result2 = await calculateMaxProfit(testUser._id);
    const expectedMaxProfit2 = 50 / (commissionRate / 100);
    
    log('📊', 'Results for $50 gas fee:', result2);
    
    assert(
      Math.abs(result2.maxProfit - expectedMaxProfit2) < 0.01,
      `Max profit should be ~$${expectedMaxProfit2.toFixed(2)}, got $${result2.maxProfit.toFixed(2)}`
    );
    
    // Restore original balance
    testUser.gasFeeBalance = originalBalance;
    await testUser.save();
    
    log('✅', 'TEST 2 COMPLETED');
    return true;
  } catch (error) {
    log('❌', 'TEST 2 FAILED', error.message);
    return false;
  }
}

async function test3_AutoCloseDetection() {
  log('🧪', 'TEST 3: Auto-Close Detection');
  
  try {
    const testUser = await User.findOne().limit(1);
    const originalBalance = testUser.gasFeeBalance;
    
    testUser.gasFeeBalance = 10;
    await testUser.save();
    
    const { maxProfit, autoCloseThreshold } = await calculateMaxProfit(testUser._id);
    
    log('💰', `Gas fee: $10, Max profit: $${maxProfit.toFixed(2)}, Threshold: $${autoCloseThreshold.toFixed(2)}`);
    
    // Test 3a: Profit below threshold
    const result1 = await shouldAutoClose(testUser._id, autoCloseThreshold - 5);
    assert(
      !result1.shouldClose,
      `Should NOT auto-close when profit is below threshold`
    );
    
    // Test 3b: Profit at threshold
    const result2 = await shouldAutoClose(testUser._id, autoCloseThreshold);
    assert(
      result2.shouldClose,
      `SHOULD auto-close when profit reaches threshold`
    );
    
    // Test 3c: Profit above threshold
    const result3 = await shouldAutoClose(testUser._id, autoCloseThreshold + 5);
    assert(
      result3.shouldClose,
      `SHOULD auto-close when profit exceeds threshold`
    );
    
    // Restore original balance
    testUser.gasFeeBalance = originalBalance;
    await testUser.save();
    
    log('✅', 'TEST 3 COMPLETED');
    return true;
  } catch (error) {
    log('❌', 'TEST 3 FAILED', error.message);
    return false;
  }
}

async function test4_CommissionDeduction() {
  log('🧪', 'TEST 4: Commission Deduction');
  
  try {
    const testUser = await User.findOne().limit(1);
    const originalBalance = testUser.gasFeeBalance;
    
    // Set balance to $50
    testUser.gasFeeBalance = 50;
    await testUser.save();
    
    const settings = await Settings.findOne();
    const commissionRate = settings?.tradingCommission || 20;
    
    // Test 4a: Profitable trade
    const profit = 100;
    const expectedCommission = profit * (commissionRate / 100);
    
    log('💹', `Simulating profitable trade: $${profit} profit`);
    
    const result1 = await deductTradingCommission({
      userId: testUser._id,
      profit,
      positionId: 'TEST_POS_001',
      notes: 'Test commission deduction',
    });
    
    assert(
      result1.success,
      `Commission deduction should succeed`
    );
    
    assert(
      Math.abs(result1.commission - expectedCommission) < 0.01,
      `Commission should be $${expectedCommission.toFixed(2)}, got $${result1.commission.toFixed(2)}`
    );
    
    assert(
      Math.abs(result1.remainingBalance - (50 - expectedCommission)) < 0.01,
      `Remaining balance should be $${(50 - expectedCommission).toFixed(2)}, got $${result1.remainingBalance.toFixed(2)}`
    );
    
    // Verify transaction was created
    const transaction = await Transaction.findById(result1.transactionId);
    assert(
      transaction !== null,
      `Transaction should be created in database`
    );
    
    assert(
      transaction.type === 'trading_commission',
      `Transaction type should be 'trading_commission'`
    );
    
    assert(
      transaction.tradingMetadata.profit === profit,
      `Transaction metadata should contain profit amount`
    );
    
    log('📝', 'Transaction created:', {
      id: transaction._id.toString(),
      amount: transaction.amount,
      profit: transaction.tradingMetadata.profit,
      rate: transaction.tradingMetadata.commissionRate,
    });
    
    // Test 4b: Insufficient balance
    testUser.gasFeeBalance = 5;
    await testUser.save();
    
    const result2 = await deductTradingCommission({
      userId: testUser._id,
      profit: 100,
      positionId: 'TEST_POS_002',
    });
    
    assert(
      !result2.success,
      `Commission deduction should fail with insufficient balance`
    );
    
    assert(
      result2.error.includes('Insufficient'),
      `Error message should mention insufficient balance`
    );
    
    // Restore original balance
    testUser.gasFeeBalance = originalBalance;
    await testUser.save();
    
    log('✅', 'TEST 4 COMPLETED');
    return true;
  } catch (error) {
    log('❌', 'TEST 4 FAILED', error.message);
    return false;
  }
}

async function test5_CommissionSummary() {
  log('🧪', 'TEST 5: Commission Summary');
  
  try {
    const testUser = await User.findOne().limit(1);
    
    const summary = await getTradingCommissionSummary(testUser._id);
    
    log('📊', 'Commission summary:', {
      totalCommissionPaid: summary.totalCommissionPaid,
      totalProfits: summary.totalProfits,
      averageCommissionRate: summary.averageCommissionRate,
      transactionCount: summary.transactionCount,
    });
    
    assert(
      typeof summary.totalCommissionPaid === 'number',
      `totalCommissionPaid should be a number`
    );
    
    assert(
      summary.transactions.length <= summary.transactionCount,
      `transactions array should not exceed count`
    );
    
    if (summary.transactionCount > 0) {
      const firstTx = summary.transactions[0];
      assert(
        firstTx.profit !== undefined,
        `Transaction should have profit field`
      );
      assert(
        firstTx.commission !== undefined,
        `Transaction should have commission field`
      );
    }
    
    log('✅', 'TEST 5 COMPLETED');
    return true;
  } catch (error) {
    log('❌', 'TEST 5 FAILED', error.message);
    return false;
  }
}

async function test6_LossTrade() {
  log('🧪', 'TEST 6: Loss Trade (No Commission)');
  
  try {
    const testUser = await User.findOne().limit(1);
    const originalBalance = testUser.gasFeeBalance;
    
    testUser.gasFeeBalance = 50;
    await testUser.save();
    
    // Test with loss
    const loss = -20;
    
    log('📉', `Simulating loss trade: $${loss} loss`);
    
    const result = await deductTradingCommission({
      userId: testUser._id,
      profit: loss,
      positionId: 'TEST_LOSS_001',
    });
    
    // Should fail or return 0 commission for losses
    assert(
      !result.success || result.commission === 0,
      `No commission should be deducted for loss trades`
    );
    
    // Restore original balance
    testUser.gasFeeBalance = originalBalance;
    await testUser.save();
    
    log('✅', 'TEST 6 COMPLETED');
    return true;
  } catch (error) {
    log('❌', 'TEST 6 FAILED', error.message);
    return false;
  }
}

// ====================
// RUN ALL TESTS
// ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TRADING COMMISSION SYSTEM - MANUAL TESTING');
  console.log('='.repeat(60));
  
  await connectDB();
  
  const results = [];
  
  results.push(await test1_MinimumGasFeeCheck());
  results.push(await test2_MaxProfitCalculation());
  results.push(await test3_AutoCloseDetection());
  results.push(await test4_CommissionDeduction());
  results.push(await test5_CommissionSummary());
  results.push(await test6_LossTrade());
  
  await disconnectDB();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
