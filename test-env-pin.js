#!/usr/bin/env node

/**
 * Test Environment Variable Loading
 * Tests if PIN_SIGNAL_CONFIGURATION is properly loaded
 */

const path = require('path');

console.log('🔍 Testing Environment Variable Loading...\n');

// Test 1: Load from .env
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1: Load .env with dotenv');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Environment Variables:');
console.log('  - PIN_SIGNAL_CONFIGURATION:', process.env.PIN_SIGNAL_CONFIGURATION);
console.log('  - Type:', typeof process.env.PIN_SIGNAL_CONFIGURATION);
console.log('  - Length:', process.env.PIN_SIGNAL_CONFIGURATION?.length);
console.log('  - Is "366984"?', process.env.PIN_SIGNAL_CONFIGURATION === '366984');
console.log('  - NETWORK_MODE:', process.env.NETWORK_MODE);
console.log('  - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

// Test 2: Check .env file existence
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 2: Check .env file existence');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const fs = require('fs');
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

console.log('Files:');
console.log('  - .env exists:', fs.existsSync(envPath) ? '✅' : '❌');
console.log('  - .env.local exists:', fs.existsSync(envLocalPath) ? '⚠️ (should not exist)' : '✅ (good)');

// Test 3: Read .env file directly
if (fs.existsSync(envPath)) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 3: Read .env file directly');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const pinLine = envContent.split('\n').find(line => line.startsWith('PIN_SIGNAL_CONFIGURATION'));
  
  console.log('PIN line in .env:');
  console.log('  ', pinLine || 'NOT FOUND');
  
  if (pinLine) {
    const pinValue = pinLine.split('=')[1]?.trim();
    console.log('\nParsed value:', pinValue);
    console.log('Matches expected:', pinValue === '366984' ? '✅' : '❌');
  }
}

// Test 4: Check for .env.local override
if (fs.existsSync(envLocalPath)) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 4: Check .env.local for conflicts');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf-8');
  const pinLineLocal = envLocalContent.split('\n').find(line => line.startsWith('PIN_SIGNAL_CONFIGURATION'));
  
  if (pinLineLocal) {
    console.log('⚠️ WARNING: PIN_SIGNAL_CONFIGURATION found in .env.local!');
    console.log('  ', pinLineLocal);
    console.log('\n❌ This will override .env value!');
    console.log('Solution: Remove PIN from .env.local or delete .env.local');
  } else {
    console.log('✅ No PIN in .env.local (good)');
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (process.env.PIN_SIGNAL_CONFIGURATION === '366984') {
  console.log('✅ PIN correctly loaded: 366984');
  console.log('✅ Environment is ready!');
} else if (process.env.PIN_SIGNAL_CONFIGURATION) {
  console.log('❌ PIN loaded but incorrect:', process.env.PIN_SIGNAL_CONFIGURATION);
  console.log('Expected: 366984');
} else {
  console.log('❌ PIN not loaded from environment');
  console.log('Check:');
  console.log('  1. Is PIN_SIGNAL_CONFIGURATION in .env?');
  console.log('  2. Is .env in the correct location?');
  console.log('  3. Restart dev server after adding PIN');
}

console.log('\n🔄 Next Steps:');
console.log('  1. Fix any issues above');
console.log('  2. Restart dev server: npm run dev');
console.log('  3. Test PIN in UI: http://localhost:3001/administrator/signal-center');
console.log('  4. Enter PIN: 366984\n');
