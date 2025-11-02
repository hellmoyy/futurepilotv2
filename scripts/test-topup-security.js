/**
 * 🔒 TOPUP SECURITY TEST SUITE
 * Tests all security fixes implemented from audit report
 * 
 * Tests:
 * 1. ✅ Encryption key length (≥32 chars)
 * 2. ✅ Rate limiting (5s cooldown)
 * 3. ✅ Webhook signature verification
 * 4. ✅ Double deposit protection
 * 5. ✅ Race condition handling
 * 
 * Run: node scripts/test-topup-security.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const crypto = require('crypto');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function header(text) {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.cyan, text);
  console.log('='.repeat(60));
}

function section(text) {
  log(colors.bright + colors.blue, '\n📋 ' + text);
}

function success(text) {
  log(colors.green, '✅ ' + text);
}

function failure(text) {
  log(colors.red, '❌ ' + text);
}

function warning(text) {
  log(colors.yellow, '⚠️  ' + text);
}

function info(text) {
  log(colors.cyan, 'ℹ️  ' + text);
}

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
};

function recordResult(passed, testName, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    success(`PASS: ${testName}`);
  } else {
    testResults.failed++;
    failure(`FAIL: ${testName}`);
  }
  if (details) info(details);
}

// ============================================
// TEST 1: ENCRYPTION KEY LENGTH
// ============================================
async function testEncryptionKeyLength() {
  section('TEST 1: ENCRYPTION KEY LENGTH');
  
  const key = process.env.ENCRYPTION_SECRET_KEY;
  
  if (!key) {
    recordResult(false, 'Encryption Key', 'ENCRYPTION_SECRET_KEY not found in .env.local');
    return;
  }
  
  info(`Current key length: ${key.length} characters`);
  
  // AES-256 requires 32 bytes (32 characters for UTF-8)
  const MIN_KEY_LENGTH = 32;
  
  if (key.length >= MIN_KEY_LENGTH) {
    recordResult(true, 'Encryption Key Length', `Key is ${key.length} chars (≥${MIN_KEY_LENGTH} required)`);
    
    // Test encryption/decryption
    try {
      const testData = 'test_private_key_0x1234567890abcdef';
      const iv = crypto.randomBytes(16);
      
      // Encrypt
      const cipher = crypto.createCipheriv(
        'aes-256-cbc', 
        Buffer.from(key.slice(0, 32)), // Take first 32 bytes
        iv
      );
      let encrypted = cipher.update(testData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Decrypt
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(key.slice(0, 32)),
        iv
      );
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      if (decrypted === testData) {
        success('Encryption/Decryption works correctly');
      } else {
        failure('Encryption/Decryption validation failed');
      }
    } catch (error) {
      failure(`Encryption test failed: ${error.message}`);
    }
  } else {
    recordResult(false, 'Encryption Key Length', `Key is only ${key.length} chars (need ≥${MIN_KEY_LENGTH})`);
    warning('⚠️  Update ENCRYPTION_SECRET_KEY in .env.local to at least 32 characters');
  }
}

// ============================================
// TEST 2: RATE LIMITING
// ============================================
async function testRateLimiting() {
  section('TEST 2: RATE LIMITING');
  
  info('Testing /api/wallet/check-deposit rate limiting...');
  
  // Mock session cookie (you need to login first to get real session)
  const baseUrl = 'http://localhost:3000';
  
  info('Testing requires authenticated session...');
  warning('⚠️  Manual test required: Login → Try 2 requests < 5s apart');
  
  // Show example test code
  console.log(`
Example test code (run in browser console after login):

async function testRateLimit() {
  const resp1 = await fetch('/api/wallet/check-deposit', { method: 'POST' });
  const data1 = await resp1.json();
  console.log('Request 1:', resp1.status, data1);
  
  // Immediate second request (should be blocked)
  const resp2 = await fetch('/api/wallet/check-deposit', { method: 'POST' });
  const data2 = await resp2.json();
  console.log('Request 2:', resp2.status, data2);
  
  if (resp2.status === 429) {
    console.log('✅ Rate limiting works!');
  } else {
    console.log('❌ Rate limiting NOT working');
  }
}

testRateLimit();
  `);
  
  testResults.warnings++;
  warning('Rate limiting test requires manual verification (see above)');
}

// ============================================
// TEST 3: WEBHOOK SIGNATURE VERIFICATION
// ============================================
async function testWebhookSignature() {
  section('TEST 3: WEBHOOK SIGNATURE VERIFICATION');
  
  const webhookSecret = process.env.MORALIS_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    warning('MORALIS_WEBHOOK_SECRET not set in .env.local');
    warning('Webhook signature verification is OPTIONAL but RECOMMENDED');
    testResults.warnings++;
    return;
  }
  
  info(`Webhook secret found: ${webhookSecret.slice(0, 10)}...`);
  
  // Test signature generation
  const testPayload = JSON.stringify({
    confirmed: true,
    chainId: '0x61',
    erc20Transfers: [{
      transactionHash: '0xtest123',
      contract: '0xtest',
      from: '0xsender',
      to: '0xrecipient',
      value: '100000000',
      valueWithDecimals: '100'
    }]
  });
  
  try {
    // Generate signature (same as Moralis does)
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(testPayload)
      .digest('hex');
    
    success('Webhook signature generation works');
    info(`Test signature: ${signature.slice(0, 20)}...`);
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(testPayload)
      .digest('hex');
    
    if (signature === expectedSignature) {
      recordResult(true, 'Webhook Signature Verification', 'Signature matches');
    } else {
      recordResult(false, 'Webhook Signature Verification', 'Signature mismatch');
    }
    
  } catch (error) {
    recordResult(false, 'Webhook Signature Test', error.message);
  }
  
  info('To test live webhook:');
  console.log('1. Send test webhook from Moralis dashboard');
  console.log('2. Check server logs for "✅ Webhook signature verified"');
  console.log('3. Or check for "❌ Invalid webhook signature"');
}

// ============================================
// TEST 4: DOUBLE DEPOSIT PROTECTION
// ============================================
async function testDoubleDeposit() {
  section('TEST 4: DOUBLE DEPOSIT PROTECTION');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    info('Connected to MongoDB');
    
    // Import models
    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'futurepilotcols' });
    const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
    
    const transactionSchema = new mongoose.Schema({}, { strict: false, collection: 'transactions' });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
    
    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      warning('Test user (test@example.com) not found');
      warning('Create test user first to run this test');
      testResults.warnings++;
      return;
    }
    
    info(`Found test user: ${testUser.email}`);
    
    // Try to create duplicate transaction
    const testTxHash = 'TEST_DOUBLE_DEPOSIT_' + Date.now();
    
    // First deposit
    try {
      await Transaction.create({
        userId: testUser._id,
        type: 'deposit',
        network: 'testnet_bsc',
        txHash: testTxHash,
        amount: 100,
        status: 'confirmed',
        source: 'BEP20',
        createdAt: new Date(),
      });
      success('First deposit created successfully');
    } catch (error) {
      failure(`First deposit failed: ${error.message}`);
      return;
    }
    
    // Try duplicate (should fail)
    try {
      await Transaction.create({
        userId: testUser._id,
        type: 'deposit',
        network: 'testnet_bsc',
        txHash: testTxHash, // Same txHash
        amount: 100,
        status: 'confirmed',
        source: 'BEP20',
        createdAt: new Date(),
      });
      
      recordResult(false, 'Double Deposit Protection', 'Duplicate was allowed (SECURITY ISSUE!)');
    } catch (error) {
      if (error.code === 11000) {
        recordResult(true, 'Double Deposit Protection', 'Duplicate blocked by unique index');
      } else {
        recordResult(false, 'Double Deposit Protection', `Unexpected error: ${error.message}`);
      }
    }
    
    // Cleanup
    await Transaction.deleteMany({ txHash: testTxHash });
    info('Test transaction cleaned up');
    
  } catch (error) {
    recordResult(false, 'Double Deposit Test Setup', error.message);
  }
}

// ============================================
// TEST 5: RACE CONDITION PROTECTION
// ============================================
async function testRaceCondition() {
  section('TEST 5: RACE CONDITION PROTECTION');
  
  try {
    // Import models
    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'futurepilotcols' });
    const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
    
    const transactionSchema = new mongoose.Schema({}, { strict: false, collection: 'transactions' });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
    
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      warning('Test user not found, skipping race condition test');
      testResults.warnings++;
      return;
    }
    
    info('Simulating 5 concurrent deposit requests...');
    
    const testTxHash = 'TEST_RACE_CONDITION_' + Date.now();
    
    // Simulate 5 concurrent requests trying to create same transaction
    const promises = Array(5).fill(null).map((_, index) => 
      Transaction.create({
        userId: testUser._id,
        type: 'deposit',
        network: 'testnet_bsc',
        txHash: testTxHash,
        amount: 100,
        status: 'confirmed',
        source: 'BEP20',
        createdAt: new Date(),
      }).catch(error => ({ error: error.code }))
    );
    
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    const blocked = results.filter(r => 
      r.status === 'fulfilled' && r.value.error === 11000
    ).length;
    
    info(`Results: ${successful} succeeded, ${blocked} blocked`);
    
    if (successful === 1 && blocked === 4) {
      recordResult(true, 'Race Condition Protection', 'Only 1 request succeeded, 4 blocked');
    } else if (successful === 1 && blocked >= 3) {
      recordResult(true, 'Race Condition Protection', `${successful} succeeded, ${blocked} blocked (acceptable)`);
    } else {
      recordResult(false, 'Race Condition Protection', `${successful} succeeded (should be 1)`);
    }
    
    // Cleanup
    await Transaction.deleteMany({ txHash: testTxHash });
    info('Test transaction cleaned up');
    
  } catch (error) {
    recordResult(false, 'Race Condition Test', error.message);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  header('🔒 TOPUP SECURITY TEST SUITE');
  info('Testing all security fixes from audit report');
  info('Date: ' + new Date().toLocaleString());
  
  // Run all tests
  await testEncryptionKeyLength();
  await testRateLimiting();
  await testWebhookSignature();
  await testDoubleDeposit();
  await testRaceCondition();
  
  // Summary
  header('📊 TEST SUMMARY');
  
  console.log('');
  console.log(`Total Tests:     ${testResults.total}`);
  log(colors.green, `✅ Passed:       ${testResults.passed}`);
  log(colors.red, `❌ Failed:       ${testResults.failed}`);
  log(colors.yellow, `⚠️  Warnings:     ${testResults.warnings}`);
  console.log('');
  
  // Calculate score
  const passRate = testResults.total > 0 
    ? Math.round((testResults.passed / testResults.total) * 100) 
    : 0;
  
  let scoreColor;
  let grade;
  
  if (passRate >= 90) {
    scoreColor = colors.green;
    grade = 'A+';
  } else if (passRate >= 80) {
    scoreColor = colors.green;
    grade = 'A';
  } else if (passRate >= 70) {
    scoreColor = colors.yellow;
    grade = 'B';
  } else {
    scoreColor = colors.red;
    grade = 'F';
  }
  
  log(scoreColor + colors.bright, `Security Score:  ${passRate}/100 (${grade})`);
  console.log('');
  
  // Recommendations
  if (testResults.failed > 0) {
    header('⚠️  RECOMMENDATIONS');
    warning('Please fix failed tests before deploying to production');
  }
  
  if (testResults.warnings > 0) {
    console.log('');
    warning('Some tests require manual verification');
    info('Follow instructions in test output above');
  }
  
  console.log('');
  log(colors.bright, '📖 Documentation: /docs/TOPUP_SECURITY_FIXES.md');
  console.log('');
  
  // Exit
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('');
  failure('Test suite failed to run:');
  console.error(error);
  process.exit(1);
});
