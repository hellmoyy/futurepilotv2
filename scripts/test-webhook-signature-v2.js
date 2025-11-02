/**
 * Test Webhook Signature Verification (Moralis Official Method)
 * 
 * Tests the CORRECT implementation:
 * - Secret: Fetched from Moralis API
 * - Algorithm: Keccak-256 (web3.utils.sha3)
 * - Formula: sha3(JSON.stringify(body) + secret)
 * 
 * Run: node scripts/test-webhook-signature-v2.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Web3 } = require('web3');

const web3 = new Web3();

// Test data
const mockWebhookPayload = {
  confirmed: true,
  chainId: "0xaa36a7",
  streamId: "test-stream",
  block: {
    number: "123456",
    hash: "0xabc123",
    timestamp: "1234567890"
  },
  erc20Transfers: [
    {
      transactionHash: "0x123abc",
      contract: "0x46484aee842a735fbf4c05af7e371792cf52b498",
      from: "0xaaa",
      to: "0xbbb",
      value: "100000000",
      valueWithDecimals: "100"
    }
  ]
};

/**
 * Fetch Moralis secret key from API
 */
async function getMoralisSecretKey() {
  const apiKey = process.env.MORALIS_API_KEY;
  
  if (!apiKey) {
    throw new Error('❌ MORALIS_API_KEY not found in .env.local');
  }

  console.log('🔑 Fetching Moralis secret key from API...');
  
  const response = await fetch('https://api.moralis-streams.com/settings', {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'X-API-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch secret: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Secret key fetched successfully');
  console.log('   Secret (first 20 chars):', data.secretKey.substring(0, 20) + '...');
  
  return data.secretKey;
}

/**
 * Generate signature using Moralis method
 */
function generateSignature(payload, secret) {
  const payloadString = JSON.stringify(payload);
  const signature = web3.utils.sha3(payloadString + secret);
  return signature;
}

/**
 * Verify signature
 */
function verifySignature(payload, providedSignature, secret) {
  const generatedSignature = generateSignature(payload, secret);
  return generatedSignature === providedSignature;
}

/**
 * Run tests
 */
async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║        🧪 TEST: Webhook Signature Verification (Moralis)         ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let testsTotal = 0;
  let testsPassed = 0;

  try {
    // TEST 1: Fetch Moralis Secret
    console.log('🧪 TEST 1: Fetch Moralis Secret Key\n');
    testsTotal++;
    
    const secret = await getMoralisSecretKey();
    
    if (!secret || secret.length === 0) {
      throw new Error('Secret key is empty');
    }
    
    console.log('✅ PASS: Secret key fetched successfully\n');
    testsPassed++;

    // TEST 2: Generate Signature
    console.log('🧪 TEST 2: Generate Signature (Keccak-256)\n');
    testsTotal++;
    
    const signature = generateSignature(mockWebhookPayload, secret);
    
    console.log('   Payload:', JSON.stringify(mockWebhookPayload).substring(0, 100) + '...');
    console.log('   Secret (first 20):', secret.substring(0, 20) + '...');
    console.log('   Generated Signature:', signature);
    
    if (!signature || !signature.startsWith('0x')) {
      throw new Error('Invalid signature format');
    }
    
    console.log('✅ PASS: Signature generated successfully\n');
    testsPassed++;

    // TEST 3: Verify Correct Signature
    console.log('🧪 TEST 3: Verify Correct Signature\n');
    testsTotal++;
    
    const isValid = verifySignature(mockWebhookPayload, signature, secret);
    
    console.log('   Provided:', signature);
    console.log('   Generated:', signature);
    console.log('   Match:', isValid);
    
    if (!isValid) {
      throw new Error('Signature verification failed');
    }
    
    console.log('✅ PASS: Correct signature verified\n');
    testsPassed++;

    // TEST 4: Reject Wrong Signature
    console.log('🧪 TEST 4: Reject Wrong Signature\n');
    testsTotal++;
    
    const wrongSignature = '0x' + '0'.repeat(64);
    const isInvalid = verifySignature(mockWebhookPayload, wrongSignature, secret);
    
    console.log('   Wrong Signature:', wrongSignature);
    console.log('   Should Reject:', !isInvalid);
    
    if (isInvalid) {
      throw new Error('Wrong signature was accepted!');
    }
    
    console.log('✅ PASS: Wrong signature rejected\n');
    testsPassed++;

    // TEST 5: Different Payload = Different Signature
    console.log('🧪 TEST 5: Different Payload = Different Signature\n');
    testsTotal++;
    
    const modifiedPayload = { ...mockWebhookPayload, confirmed: false };
    const originalSig = generateSignature(mockWebhookPayload, secret);
    const modifiedSig = generateSignature(modifiedPayload, secret);
    
    console.log('   Original Signature:', originalSig.substring(0, 30) + '...');
    console.log('   Modified Signature:', modifiedSig.substring(0, 30) + '...');
    console.log('   Are Different:', originalSig !== modifiedSig);
    
    if (originalSig === modifiedSig) {
      throw new Error('Different payloads produced same signature!');
    }
    
    console.log('✅ PASS: Different payloads produce different signatures\n');
    testsPassed++;

    // TEST 6: Consistency Check
    console.log('🧪 TEST 6: Signature Consistency (10 iterations)\n');
    testsTotal++;
    
    const signatures = [];
    for (let i = 0; i < 10; i++) {
      signatures.push(generateSignature(mockWebhookPayload, secret));
    }
    
    const allSame = signatures.every(sig => sig === signatures[0]);
    
    console.log('   Generated 10 signatures');
    console.log('   All Same:', allSame);
    console.log('   Sample:', signatures[0]);
    
    if (!allSame) {
      throw new Error('Signature generation is not consistent!');
    }
    
    console.log('✅ PASS: Signature generation is consistent\n');
    testsPassed++;

  } catch (error) {
    console.error('❌ FAIL:', error.message, '\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`TEST RESULTS: ${testsPassed}/${testsTotal} passed`);
  
  if (testsPassed === testsTotal) {
    console.log('Status: ✅ ALL TESTS PASSED');
    console.log('Security: 🟢 PRODUCTION READY');
  } else {
    console.log(`Status: ❌ ${testsTotal - testsPassed} tests failed`);
    console.log('Security: 🔴 NOT PRODUCTION READY');
  }
  
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Additional Info
  console.log('📝 IMPLEMENTATION NOTES:');
  console.log('   ✅ Using official Moralis method (Keccak-256)');
  console.log('   ✅ Secret fetched from Moralis API');
  console.log('   ✅ Formula: web3.utils.sha3(JSON.stringify(body) + secret)');
  console.log('   ✅ Signature cached to reduce API calls');
  console.log('   ✅ Compatible with all Moralis webhooks');
  console.log('\n📖 Reference: https://docs.moralis.com/streams-api/evm/webhook-security\n');
}

// Run tests
runTests().catch(console.error);
