#!/usr/bin/env node

/**
 * RACE CONDITION TEST SCRIPT
 * 
 * Purpose: Test if withdrawal API is vulnerable to race condition attacks
 * 
 * Test Cases:
 * 1. Double withdrawal with same amount (concurrent requests)
 * 2. Multiple small withdrawals exceeding balance
 * 3. Rapid-fire requests (10 concurrent)
 * 
 * Expected Results:
 * - VULNERABLE: Multiple withdrawals succeed, negative balance
 * - SECURE: Only allowed withdrawals succeed, balance correct
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

// User Schema (minimal)
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  password: String,
  totalEarnings: { type: Number, default: 0 },
  referralCode: String,
}, { collection: 'futurepilotcols' });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);

// Withdrawal Schema
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'futurepilotcol' },
  amount: Number,
  walletAddress: String,
  network: String,
  status: String,
  type: String,
  requestedAt: Date,
}, { timestamps: true });

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Simulate withdrawal API call (direct DB operation, bypassing HTTP)
async function simulateWithdrawal(userId, amount, walletAddress, network) {
  try {
    // Step 1: Read user balance (NOT ATOMIC!)
    const user = await User.findById(userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Step 2: Check balance (RACE CONDITION WINDOW HERE!)
    if ((user.totalEarnings || 0) < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Simulate network delay (makes race condition more likely)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    // Step 3: Check for pending withdrawals
    const pendingWithdrawal = await Withdrawal.findOne({
      userId: user._id,
      status: { $in: ['pending', 'processing'] },
    });

    if (pendingWithdrawal) {
      return { success: false, error: 'Pending withdrawal exists' };
    }

    // Step 4: Create withdrawal record
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount,
      walletAddress,
      network,
      type: 'referral',
      status: 'pending',
      requestedAt: new Date(),
    });

    // Step 5: Deduct balance (SEPARATE OPERATION - RACE CONDITION!)
    user.totalEarnings = (user.totalEarnings || 0) - amount;
    await user.save();

    return {
      success: true,
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test Case 1: Double Withdrawal Attack
async function testDoubleWithdrawal() {
  log('\n════════════════════════════════════════════════', 'cyan');
  log('TEST 1: Double Withdrawal Attack (Same Amount)', 'bold');
  log('════════════════════════════════════════════════\n', 'cyan');

  // Setup: Create test user with $100 balance
  const testUser = await User.create({
    email: `test-race-${Date.now()}@example.com`,
    name: 'Race Condition Test User',
    password: 'test123',
    totalEarnings: 100,
    referralCode: `RACE${Date.now()}`,
  });

  log(`✅ Created test user: ${testUser.email}`, 'green');
  log(`💰 Initial balance: $${testUser.totalEarnings}`, 'cyan');

  // Attack: Two concurrent withdrawal requests of $100 each
  log('\n🚀 Launching 2 concurrent withdrawal requests ($100 each)...', 'yellow');
  
  const walletAddress = '0x1234567890123456789012345678901234567890';
  
  const [result1, result2] = await Promise.all([
    simulateWithdrawal(testUser._id, 100, walletAddress, 'ERC20'),
    simulateWithdrawal(testUser._id, 100, walletAddress, 'ERC20'),
  ]);

  // Check results
  log('\n📊 Results:', 'bold');
  log(`Request 1: ${result1.success ? '✅ SUCCESS' : '❌ FAILED'} - ${result1.error || 'Withdrawal created'}`, result1.success ? 'green' : 'red');
  log(`Request 2: ${result2.success ? '✅ SUCCESS' : '❌ FAILED'} - ${result2.error || 'Withdrawal created'}`, result2.success ? 'green' : 'red');

  // Verify final balance
  const finalUser = await User.findById(testUser._id);
  const withdrawalCount = await Withdrawal.countDocuments({ userId: testUser._id });

  log('\n🔍 Final State:', 'bold');
  log(`💰 Final balance: $${finalUser.totalEarnings}`, finalUser.totalEarnings < 0 ? 'red' : 'cyan');
  log(`📝 Withdrawal records created: ${withdrawalCount}`, 'cyan');

  // Analyze vulnerability
  log('\n⚖️  Analysis:', 'bold');
  
  const bothSucceeded = result1.success && result2.success;
  const balanceNegative = finalUser.totalEarnings < 0;
  const multipleRecords = withdrawalCount > 1;

  if (bothSucceeded && multipleRecords) {
    log('🚨 CRITICAL VULNERABILITY DETECTED!', 'red');
    log('   → Both requests succeeded (should only allow 1)', 'red');
    log('   → Race condition exploit confirmed', 'red');
    
    if (balanceNegative) {
      log('   → NEGATIVE BALANCE! Platform financial loss', 'red');
    }
  } else if (withdrawalCount === 1 && !balanceNegative) {
    log('✅ SECURE: Only 1 withdrawal processed', 'green');
    log('   → Race condition protection working', 'green');
  } else {
    log('⚠️  PARTIAL ISSUE: Unexpected state', 'yellow');
  }

  // Cleanup
  await User.findByIdAndDelete(testUser._id);
  await Withdrawal.deleteMany({ userId: testUser._id });

  return { bothSucceeded, balanceNegative, multipleRecords };
}

// Test Case 2: Multiple Small Withdrawals
async function testMultipleSmallWithdrawals() {
  log('\n════════════════════════════════════════════════', 'cyan');
  log('TEST 2: Multiple Small Withdrawals (10x $20)', 'bold');
  log('════════════════════════════════════════════════\n', 'cyan');

  // Setup: Create test user with $100 balance
  const testUser = await User.create({
    email: `test-multi-${Date.now()}@example.com`,
    name: 'Multi Withdrawal Test',
    password: 'test123',
    totalEarnings: 100,
    referralCode: `MULTI${Date.now()}`,
  });

  log(`✅ Created test user: ${testUser.email}`, 'green');
  log(`💰 Initial balance: $${testUser.totalEarnings}`, 'cyan');

  // Attack: 10 concurrent withdrawal requests of $20 each
  log('\n🚀 Launching 10 concurrent withdrawal requests ($20 each)...', 'yellow');
  log('   Expected: Max 5 should succeed ($100 / $20 = 5)', 'yellow');
  
  const walletAddress = '0x1234567890123456789012345678901234567890';
  
  const promises = Array(10).fill(null).map((_, i) => 
    simulateWithdrawal(testUser._id, 20, walletAddress, 'ERC20')
  );

  const results = await Promise.all(promises);

  // Analyze results
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  log('\n📊 Results:', 'bold');
  log(`✅ Successful: ${successCount} withdrawals`, successCount > 5 ? 'red' : 'green');
  log(`❌ Failed: ${failCount} withdrawals`, 'cyan');

  // Verify final balance
  const finalUser = await User.findById(testUser._id);
  const withdrawalCount = await Withdrawal.countDocuments({ userId: testUser._id });
  const totalWithdrawn = withdrawalCount * 20;

  log('\n🔍 Final State:', 'bold');
  log(`💰 Final balance: $${finalUser.totalEarnings}`, finalUser.totalEarnings < 0 ? 'red' : 'cyan');
  log(`📝 Withdrawal records: ${withdrawalCount}`, 'cyan');
  log(`💸 Total withdrawn: $${totalWithdrawn}`, totalWithdrawn > 100 ? 'red' : 'cyan');

  // Analyze vulnerability
  log('\n⚖️  Analysis:', 'bold');

  if (successCount > 5) {
    log('🚨 RACE CONDITION DETECTED!', 'red');
    log(`   → ${successCount} withdrawals succeeded (expected max 5)`, 'red');
    log(`   → Over-withdrawal: $${totalWithdrawn - 100}`, 'red');
  } else if (successCount === 5 && finalUser.totalEarnings === 0) {
    log('✅ SECURE: Exactly 5 withdrawals processed', 'green');
    log('   → Balance correctly depleted', 'green');
  } else {
    log('⚠️  PARTIAL ISSUE', 'yellow');
    log(`   → ${successCount} succeeded, balance: $${finalUser.totalEarnings}`, 'yellow');
  }

  // Cleanup
  await User.findByIdAndDelete(testUser._id);
  await Withdrawal.deleteMany({ userId: testUser._id });

  return {
    successCount,
    expectedMax: 5,
    vulnerable: successCount > 5,
    balanceNegative: finalUser.totalEarnings < 0,
  };
}

// Test Case 3: Rapid-Fire Requests
async function testRapidFireRequests() {
  log('\n════════════════════════════════════════════════', 'cyan');
  log('TEST 3: Rapid-Fire Requests (10x $50)', 'bold');
  log('════════════════════════════════════════════════\n', 'cyan');

  // Setup: Create test user with $100 balance
  const testUser = await User.create({
    email: `test-rapid-${Date.now()}@example.com`,
    name: 'Rapid Fire Test',
    password: 'test123',
    totalEarnings: 100,
    referralCode: `RAPID${Date.now()}`,
  });

  log(`✅ Created test user: ${testUser.email}`, 'green');
  log(`💰 Initial balance: $${testUser.totalEarnings}`, 'cyan');

  // Attack: 10 concurrent withdrawal requests of $50 each
  log('\n🚀 Launching 10 concurrent withdrawal requests ($50 each)...', 'yellow');
  log('   Expected: Max 2 should succeed ($100 / $50 = 2)', 'yellow');
  
  const walletAddress = '0x1234567890123456789012345678901234567890';
  
  const promises = Array(10).fill(null).map(() => 
    simulateWithdrawal(testUser._id, 50, walletAddress, 'ERC20')
  );

  const results = await Promise.all(promises);

  // Analyze results
  const successCount = results.filter(r => r.success).length;

  log('\n📊 Results:', 'bold');
  log(`✅ Successful: ${successCount} withdrawals`, successCount > 2 ? 'red' : 'green');

  // Verify final balance
  const finalUser = await User.findById(testUser._id);
  const withdrawalCount = await Withdrawal.countDocuments({ userId: testUser._id });

  log('\n🔍 Final State:', 'bold');
  log(`💰 Final balance: $${finalUser.totalEarnings}`, finalUser.totalEarnings < 0 ? 'red' : 'cyan');
  log(`📝 Withdrawal records: ${withdrawalCount}`, 'cyan');

  // Analyze vulnerability
  log('\n⚖️  Analysis:', 'bold');

  if (successCount > 2) {
    log('🚨 SEVERE RACE CONDITION!', 'red');
    log(`   → ${successCount} withdrawals succeeded (expected max 2)`, 'red');
    log(`   → Platform loss: $${(successCount - 2) * 50}`, 'red');
  } else if (successCount === 2 && finalUser.totalEarnings === 0) {
    log('✅ SECURE: Exactly 2 withdrawals processed', 'green');
  } else {
    log('⚠️  UNEXPECTED RESULT', 'yellow');
  }

  // Cleanup
  await User.findByIdAndDelete(testUser._id);
  await Withdrawal.deleteMany({ userId: testUser._id });

  return {
    successCount,
    expectedMax: 2,
    vulnerable: successCount > 2,
  };
}

// Main execution
async function main() {
  try {
    log('\n╔══════════════════════════════════════════════════════╗', 'bold');
    log('║   RACE CONDITION SECURITY TEST - Withdrawal API     ║', 'bold');
    log('╚══════════════════════════════════════════════════════╝\n', 'bold');

    // Connect to MongoDB
    log('🔌 Connecting to MongoDB...', 'cyan');
    await mongoose.connect(MONGODB_URI);
    log('✅ Connected to database\n', 'green');

    // Run all tests
    const test1 = await testDoubleWithdrawal();
    const test2 = await testMultipleSmallWithdrawals();
    const test3 = await testRapidFireRequests();

    // Final summary
    log('\n╔══════════════════════════════════════════════════════╗', 'bold');
    log('║               SECURITY AUDIT SUMMARY                 ║', 'bold');
    log('╚══════════════════════════════════════════════════════╝\n', 'bold');

    const allVulnerabilities = [
      { name: 'Double Withdrawal', vulnerable: test1.bothSucceeded && test1.multipleRecords },
      { name: 'Multiple Small Withdrawals', vulnerable: test2.vulnerable },
      { name: 'Rapid-Fire Requests', vulnerable: test3.vulnerable },
    ];

    const vulnerableCount = allVulnerabilities.filter(v => v.vulnerable).length;

    allVulnerabilities.forEach(v => {
      const status = v.vulnerable ? '🚨 VULNERABLE' : '✅ SECURE';
      const color = v.vulnerable ? 'red' : 'green';
      log(`${status}: ${v.name}`, color);
    });

    log('\n─────────────────────────────────────────────────────', 'cyan');

    if (vulnerableCount > 0) {
      log(`\n🚨 SECURITY RISK: ${vulnerableCount}/3 tests show vulnerabilities`, 'red');
      log('\n⚠️  RECOMMENDATIONS:', 'yellow');
      log('   1. Implement MongoDB transactions (atomic operations)', 'yellow');
      log('   2. Use distributed locks (Redis + Redlock)', 'yellow');
      log('   3. Add idempotency keys for all withdrawal requests', 'yellow');
      log('   4. Implement request throttling and rate limiting', 'yellow');
      log('\n📖 See: docs/COMMISSION_WALLET_SECURITY_AUDIT.md', 'cyan');
    } else {
      log('\n✅ ALL TESTS PASSED: No race condition detected', 'green');
      log('   System appears to be properly protected', 'green');
    }

    log('\n╚══════════════════════════════════════════════════════╝\n', 'bold');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log('🔌 Disconnected from database\n', 'cyan');
  }
}

// Run tests
main();
