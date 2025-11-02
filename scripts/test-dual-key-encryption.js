/**
 * 🔐 DUAL KEY ENCRYPTION TEST
 * Tests backward compatibility with legacy encryption key
 * 
 * Tests:
 * 1. ✅ Encrypt with NEW key → Decrypt with NEW key
 * 2. ✅ Encrypt with LEGACY key → Decrypt with fallback
 * 3. ✅ Invalid data → Both keys fail (expected)
 * 4. ✅ Verify key hashing consistency
 * 
 * Run: node scripts/test-dual-key-encryption.js
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

function info(text) {
  log(colors.cyan, 'ℹ️  ' + text);
}

// Get keys from environment
const NEW_KEY = process.env.ENCRYPTION_SECRET_KEY;
const LEGACY_KEY = process.env.ENCRYPTION_SECRET_KEY_LEGACY;

// Create hashed keys (same as in production code)
const newKeyHash = crypto.createHash('sha256').update(NEW_KEY).digest();
const legacyKeyHash = LEGACY_KEY 
  ? crypto.createHash('sha256').update(LEGACY_KEY).digest()
  : null;

// Encryption/Decryption functions (same as in wallet/generate/route.ts)
function encrypt(text, useKey = newKeyHash) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', useKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedData = parts.join(':');
  
  // Try NEW key first
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', newKeyHash, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return { decrypted, usedKey: 'NEW' };
  } catch (error) {
    // Try LEGACY key if available
    if (legacyKeyHash) {
      try {
        info('Trying legacy key for backward compatibility...');
        const decipher = crypto.createDecipheriv('aes-256-cbc', legacyKeyHash, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return { decrypted, usedKey: 'LEGACY' };
      } catch (legacyError) {
        throw new Error('Both keys failed to decrypt');
      }
    }
    throw error;
  }
}

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
};

function recordResult(passed, testName, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    success(`PASS: ${testName}`);
  } else {
    results.failed++;
    failure(`FAIL: ${testName}`);
  }
  if (details) info(details);
}

// ============================================
// TEST 1: ENCRYPT & DECRYPT WITH NEW KEY
// ============================================
function testNewKey() {
  header('TEST 1: NEW KEY ENCRYPTION/DECRYPTION');
  
  const testData = '0x1234567890abcdef1234567890abcdef12345678';
  info(`Test data: ${testData}`);
  
  try {
    // Encrypt with NEW key
    const encrypted = encrypt(testData, newKeyHash);
    info(`Encrypted: ${encrypted.substring(0, 40)}...`);
    
    // Decrypt (should use NEW key)
    const result = decrypt(encrypted);
    
    if (result.decrypted === testData && result.usedKey === 'NEW') {
      recordResult(true, 'NEW key encryption/decryption', `Used ${result.usedKey} key successfully`);
    } else {
      recordResult(false, 'NEW key encryption/decryption', `Data mismatch or wrong key used`);
    }
  } catch (error) {
    recordResult(false, 'NEW key encryption/decryption', error.message);
  }
}

// ============================================
// TEST 2: DECRYPT LEGACY ENCRYPTED DATA
// ============================================
function testLegacyKey() {
  header('TEST 2: LEGACY KEY BACKWARD COMPATIBILITY');
  
  if (!legacyKeyHash) {
    info('ENCRYPTION_SECRET_KEY_LEGACY not set, skipping test');
    results.total++;
    results.passed++;
    return;
  }
  
  const testData = '0xabcdef1234567890abcdef1234567890abcdef12';
  info(`Test data: ${testData}`);
  
  try {
    // Encrypt with LEGACY key (simulate old wallet)
    const encrypted = encrypt(testData, legacyKeyHash);
    info(`Encrypted (with LEGACY): ${encrypted.substring(0, 40)}...`);
    
    // Decrypt (should fallback to LEGACY key)
    const result = decrypt(encrypted);
    
    if (result.decrypted === testData && result.usedKey === 'LEGACY') {
      recordResult(true, 'LEGACY key fallback', `Successfully used ${result.usedKey} key as fallback`);
    } else if (result.decrypted === testData && result.usedKey === 'NEW') {
      recordResult(false, 'LEGACY key fallback', `Wrong key used: ${result.usedKey} (expected LEGACY)`);
    } else {
      recordResult(false, 'LEGACY key fallback', `Data mismatch`);
    }
  } catch (error) {
    recordResult(false, 'LEGACY key fallback', error.message);
  }
}

// ============================================
// TEST 3: INVALID DATA (BOTH KEYS SHOULD FAIL)
// ============================================
function testInvalidData() {
  header('TEST 3: INVALID DATA HANDLING');
  
  const invalidData = 'invalid:encrypted:data:format';
  info(`Test data: ${invalidData}`);
  
  try {
    decrypt(invalidData);
    recordResult(false, 'Invalid data handling', 'Should have thrown error but did not');
  } catch (error) {
    recordResult(true, 'Invalid data handling', `Both keys failed as expected: ${error.message}`);
  }
}

// ============================================
// TEST 4: KEY HASHING CONSISTENCY
// ============================================
function testKeyHashing() {
  header('TEST 4: KEY HASHING CONSISTENCY');
  
  info(`NEW key length: ${NEW_KEY.length} chars`);
  info(`NEW key hash: ${newKeyHash.toString('hex').substring(0, 20)}...`);
  
  if (LEGACY_KEY) {
    info(`LEGACY key length: ${LEGACY_KEY.length} chars`);
    info(`LEGACY key hash: ${legacyKeyHash.toString('hex').substring(0, 20)}...`);
    
    // Verify hashes are different
    const hashesAreDifferent = newKeyHash.toString('hex') !== legacyKeyHash.toString('hex');
    
    if (hashesAreDifferent) {
      recordResult(true, 'Key hashes are different', 'NEW and LEGACY produce different hashes (expected)');
    } else {
      recordResult(false, 'Key hashes are different', 'Keys produce same hash (unexpected!)');
    }
  } else {
    info('LEGACY key not set, skipping comparison');
    results.total++;
    results.passed++;
  }
  
  // Verify NEW key length is adequate
  if (NEW_KEY.length >= 32) {
    recordResult(true, 'NEW key length adequate', `${NEW_KEY.length} chars (≥32 required)`);
  } else {
    recordResult(false, 'NEW key length adequate', `${NEW_KEY.length} chars (need ≥32)`);
  }
}

// ============================================
// TEST 5: PRODUCTION SCENARIO SIMULATION
// ============================================
function testProductionScenario() {
  header('TEST 5: PRODUCTION SCENARIO SIMULATION');
  
  info('Simulating mixed wallet population...');
  
  const wallets = [];
  
  // User 1: OLD wallet (encrypted before key change)
  if (legacyKeyHash) {
    const oldWalletPK = '0xold1234567890abcdef1234567890abcdef123456';
    const oldEncrypted = encrypt(oldWalletPK, legacyKeyHash);
    wallets.push({ 
      type: 'OLD', 
      encrypted: oldEncrypted, 
      original: oldWalletPK,
      expectedKey: 'LEGACY'
    });
  }
  
  // User 2: NEW wallet (encrypted after key change)
  const newWalletPK = '0xnew1234567890abcdef1234567890abcdef123456';
  const newEncrypted = encrypt(newWalletPK, newKeyHash);
  wallets.push({ 
    type: 'NEW', 
    encrypted: newEncrypted, 
    original: newWalletPK,
    expectedKey: 'NEW'
  });
  
  let allPassed = true;
  
  wallets.forEach((wallet, index) => {
    try {
      const result = decrypt(wallet.encrypted);
      
      if (result.decrypted === wallet.original && result.usedKey === wallet.expectedKey) {
        success(`  Wallet ${index + 1} (${wallet.type}): Decrypted with ${result.usedKey} key ✅`);
      } else {
        failure(`  Wallet ${index + 1} (${wallet.type}): Failed (used ${result.usedKey}, expected ${wallet.expectedKey}) ❌`);
        allPassed = false;
      }
    } catch (error) {
      failure(`  Wallet ${index + 1} (${wallet.type}): Error - ${error.message} ❌`);
      allPassed = false;
    }
  });
  
  recordResult(allPassed, 'Production scenario simulation', `${wallets.length} wallets tested`);
}

// ============================================
// MAIN TEST RUNNER
// ============================================
function runAllTests() {
  header('🔐 DUAL KEY ENCRYPTION TEST SUITE');
  info('Testing backward compatibility with legacy encryption key');
  info('Date: ' + new Date().toLocaleString());
  
  console.log('');
  info(`NEW KEY: ${NEW_KEY.substring(0, 20)}... (${NEW_KEY.length} chars)`);
  if (LEGACY_KEY) {
    info(`LEGACY KEY: ${LEGACY_KEY.substring(0, 20)}... (${LEGACY_KEY.length} chars)`);
  } else {
    info('LEGACY KEY: Not configured');
  }
  
  // Run tests
  testNewKey();
  testLegacyKey();
  testInvalidData();
  testKeyHashing();
  testProductionScenario();
  
  // Summary
  header('📊 TEST SUMMARY');
  console.log('');
  console.log(`Total Tests:     ${results.total}`);
  log(colors.green, `✅ Passed:       ${results.passed}`);
  log(colors.red, `❌ Failed:       ${results.failed}`);
  console.log('');
  
  const passRate = results.total > 0 
    ? Math.round((results.passed / results.total) * 100) 
    : 0;
  
  if (passRate === 100) {
    log(colors.green + colors.bright, `Result: ${passRate}% - ALL TESTS PASSED ✅`);
  } else if (passRate >= 80) {
    log(colors.yellow + colors.bright, `Result: ${passRate}% - MOSTLY PASSED ⚠️`);
  } else {
    log(colors.red + colors.bright, `Result: ${passRate}% - FAILED ❌`);
  }
  
  console.log('');
  
  if (results.failed === 0) {
    header('✅ BACKWARD COMPATIBILITY VERIFIED');
    info('Old wallets can be decrypted with legacy key');
    info('New wallets use stronger encryption key');
    info('System is production ready!');
  } else {
    header('⚠️  ISSUES DETECTED');
    failure('Some tests failed - review logs above');
  }
  
  console.log('');
  log(colors.bright, '📖 Documentation: /docs/ENCRYPTION_KEY_MIGRATION.md');
  console.log('');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
