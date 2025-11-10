/**
 * 🔐 WEBHOOK SIGNATURE TEST
 * Test Moralis webhook signature generation & verification
 * 
 * Purpose:
 * - Verify MORALIS_WEBHOOK_SECRET is configured
 * - Test signature generation (HMAC-SHA256)
 * - Simulate webhook request
 * 
 * Run: node scripts/test-webhook-signature.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const crypto = require('crypto');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
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

// Get webhook secret
const WEBHOOK_SECRET = process.env.MORALIS_WEBHOOK_SECRET;

// ============================================
// TEST 1: CHECK SECRET EXISTS
// ============================================
function testSecretExists() {
  header('TEST 1: CHECK WEBHOOK SECRET');
  
  if (!WEBHOOK_SECRET) {
    failure('MORALIS_WEBHOOK_SECRET not found in .env.local');
    warning('Please add to .env.local:');
    console.log('   MORALIS_WEBHOOK_SECRET=your_secret_from_moralis_dashboard');
    console.log('');
    warning('See docs/HOW_TO_GET_MORALIS_WEBHOOK_SECRET.md for guide');
    return false;
  }
  
  success('MORALIS_WEBHOOK_SECRET is configured');
  info(`Secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);
  info(`Length: ${WEBHOOK_SECRET.length} characters`);
  
  return true;
}

// ============================================
// TEST 2: SIGNATURE GENERATION
// ============================================
function testSignatureGeneration() {
  header('TEST 2: SIGNATURE GENERATION (HMAC-SHA256)');
  
  if (!WEBHOOK_SECRET) {
    warning('Skipped (no secret configured)');
    return false;
  }
  
  // Test payload (same structure as Moralis sends)
  const testPayload = {
    confirmed: true,
    chainId: '0x61', // BSC Testnet (use 0x38 for mainnet)
    streamId: process.env.MORALIS_BSC_STREAM_ID || 'test-stream',
    block: {
      number: '12345',
      hash: '0xabc123',
      timestamp: '1234567890'
    },
    erc20Transfers: [
      {
        transactionHash: '0xtest1234567890abcdef',
        contract: '0x46484Aee842A735Fbf4C05Af7e371792cf52b498',
        from: '0xsender1234567890abcdef',
        to: '0xrecipient1234567890',
        value: '100000000000000000000',
        valueWithDecimals: '100'
      }
    ]
  };
  
  const payloadString = JSON.stringify(testPayload);
  
  info('Test payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('');
  
  // Generate signature (same as Moralis does)
  try {
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
    
    success('Signature generated successfully');
    info(`Signature: ${signature}`);
    console.log('');
    
    // Verify by generating again
    const verifySignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
    
    if (signature === verifySignature) {
      success('Signature verification: CONSISTENT ✅');
      info('Same payload produces same signature (deterministic)');
    } else {
      failure('Signature verification: INCONSISTENT ❌');
    }
    
    return true;
  } catch (error) {
    failure(`Signature generation failed: ${error.message}`);
    return false;
  }
}

// ============================================
// TEST 3: SIGNATURE VERIFICATION FUNCTION
// ============================================
function testSignatureVerification() {
  header('TEST 3: SIGNATURE VERIFICATION FUNCTION');
  
  if (!WEBHOOK_SECRET) {
    warning('Skipped (no secret configured)');
    return false;
  }
  
  // Function dari production code
  function verifyMoralisSignature(payload, signature, secret) {
    if (!signature) {
      return false;
    }
    
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }
  
  // Test Case 1: Valid signature
  const validPayload = '{"test":"data"}';
  const validSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(validPayload)
    .digest('hex');
  
  const result1 = verifyMoralisSignature(validPayload, validSignature, WEBHOOK_SECRET);
  
  if (result1) {
    success('Test Case 1: Valid signature → ACCEPTED ✅');
  } else {
    failure('Test Case 1: Valid signature → REJECTED ❌');
  }
  
  // Test Case 2: Invalid signature
  const invalidSignature = 'fake_signature_12345';
  const result2 = verifyMoralisSignature(validPayload, invalidSignature, WEBHOOK_SECRET);
  
  if (!result2) {
    success('Test Case 2: Invalid signature → REJECTED ✅');
  } else {
    failure('Test Case 2: Invalid signature → ACCEPTED ❌ (SECURITY ISSUE!)');
  }
  
  // Test Case 3: Tampered payload
  const tamperedPayload = '{"test":"tampered"}';
  const result3 = verifyMoralisSignature(tamperedPayload, validSignature, WEBHOOK_SECRET);
  
  if (!result3) {
    success('Test Case 3: Tampered payload → REJECTED ✅');
  } else {
    failure('Test Case 3: Tampered payload → ACCEPTED ❌ (SECURITY ISSUE!)');
  }
  
  return result1 && !result2 && !result3;
}

// ============================================
// TEST 4: CURL COMMAND GENERATOR
// ============================================
function generateCurlCommand() {
  header('TEST 4: CURL COMMAND FOR MANUAL TEST');
  
  if (!WEBHOOK_SECRET) {
    warning('Skipped (no secret configured)');
    return;
  }
  
  const webhookUrl = 'http://localhost:3000/api/webhook/moralis';
  const testPayload = {
    confirmed: true,
    chainId: '0x61', // BSC Testnet (use 0x38 for mainnet)
    streamId: process.env.MORALIS_BSC_STREAM_ID || 'test-stream',
    erc20Transfers: [
      {
        transactionHash: '0xtest_manual_webhook_' + Date.now(),
        contract: '0x46484Aee842A735Fbf4C05Af7e371792cf52b498',
        from: '0x0000000000000000000000000000000000000001',
        to: '0x0000000000000000000000000000000000000002',
        value: '100000000000000000000',
        valueWithDecimals: '100',
        tokenName: 'Tether USD',
        tokenSymbol: 'USDT'
      }
    ]
  };
  
  const payloadString = JSON.stringify(testPayload);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex');
  
  info('Copy & paste this command to test webhook:');
  console.log('');
  console.log(colors.yellow + 'curl -X POST \\' + colors.reset);
  console.log(colors.yellow + `  "${webhookUrl}" \\` + colors.reset);
  console.log(colors.yellow + '  -H "Content-Type: application/json" \\' + colors.reset);
  console.log(colors.yellow + `  -H "x-signature: ${signature}" \\` + colors.reset);
  console.log(colors.yellow + `  -d '${payloadString}'` + colors.reset);
  console.log('');
  
  info('Expected response: {"success": true, ...}');
  info('Check server logs for "✅ Webhook signature verified"');
}

// ============================================
// MAIN
// ============================================
function runTests() {
  header('🔐 MORALIS WEBHOOK SIGNATURE TEST');
  info('Testing webhook signature generation & verification');
  info('Date: ' + new Date().toLocaleString());
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Test 1
  results.total++;
  if (testSecretExists()) {
    results.passed++;
  } else {
    results.failed++;
    
    // If no secret, show guide and exit
    console.log('');
    header('📖 HOW TO GET MORALIS WEBHOOK SECRET');
    console.log('');
    info('Follow these steps:');
    console.log('');
    console.log('1. Login to Moralis Dashboard: https://admin.moralis.io/');
    console.log('2. Navigate: Dashboard → Streams');
    console.log('3. Find stream ID: ' + (process.env.MORALIS_BSC_STREAM_ID || 'YOUR_STREAM_ID'));
    console.log('4. Click stream name to open details');
    console.log('5. Find "Webhook Secret" section');
    console.log('6. Click "Show" or "Copy" button');
    console.log('7. Paste to .env.local:');
    console.log('   MORALIS_WEBHOOK_SECRET=<your_secret_here>');
    console.log('8. Restart server: npm run dev');
    console.log('');
    info('Full guide: docs/HOW_TO_GET_MORALIS_WEBHOOK_SECRET.md');
    console.log('');
    
    process.exit(1);
  }
  
  // Test 2
  results.total++;
  if (testSignatureGeneration()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 3
  results.total++;
  if (testSignatureVerification()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 4 (info only)
  generateCurlCommand();
  
  // Summary
  header('📊 TEST SUMMARY');
  console.log('');
  console.log(`Total Tests:     ${results.total}`);
  log(colors.green, `✅ Passed:       ${results.passed}`);
  log(colors.red, `❌ Failed:       ${results.failed}`);
  console.log('');
  
  if (results.failed === 0) {
    log(colors.green + colors.bright, '✅ ALL TESTS PASSED - WEBHOOK SIGNATURE READY!');
    console.log('');
    info('Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Use curl command above to test webhook');
    console.log('3. Or send test webhook from Moralis dashboard');
    console.log('4. Check server logs for signature verification');
  } else {
    log(colors.red + colors.bright, '❌ SOME TESTS FAILED');
    warning('Fix issues above before deploying');
  }
  
  console.log('');
  log(colors.bright, '📖 Documentation: docs/HOW_TO_GET_MORALIS_WEBHOOK_SECRET.md');
  console.log('');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests();
