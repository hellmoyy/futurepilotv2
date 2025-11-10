#!/usr/bin/env node
/**
 * 🔐 AUTO-GENERATE & SET WEBHOOK SECRET
 * Generate random webhook secret dan set ke Moralis stream via API
 * 
 * Usage: node scripts/auto-setup-webhook-secret.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

// Generate secure random secret
function generateWebhookSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Update stream via Moralis API
function updateStreamSecret(streamId, apiKey, secret) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      webhookUrl: process.env.NEXTAUTH_URL + '/api/webhook/moralis',
      webhookSecret: secret,
    });

    const options = {
      hostname: 'api.moralis-streams.com',
      path: `/streams/evm/${streamId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-API-Key': apiKey,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Update .env.local file
function updateEnvFile(secret) {
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  const secretRegex = /MORALIS_WEBHOOK_SECRET=.*/;

  if (secretRegex.test(envContent)) {
    envContent = envContent.replace(secretRegex, `MORALIS_WEBHOOK_SECRET=${secret}`);
  } else {
    // Add after MORALIS_BSC_STREAM_ID
    if (envContent.includes('MORALIS_BSC_STREAM_ID')) {
      envContent = envContent.replace(
        /MORALIS_BSC_STREAM_ID=.*/,
        (match) => `${match}\nMORALIS_WEBHOOK_SECRET=${secret}`
      );
    } else {
      envContent += `\nMORALIS_WEBHOOK_SECRET=${secret}\n`;
    }
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
}

// Main function
async function main() {
  header('🔐 AUTO-GENERATE & SET WEBHOOK SECRET');

  console.log('');
  info('Script ini akan:');
  console.log('  1. Generate random webhook secret (secure)');
  console.log('  2. Update Moralis stream via API');
  console.log('  3. Save secret ke .env.local');
  console.log('');

  // Check environment variables
  const apiKey = process.env.MORALIS_API_KEY;
  const streamId = process.env.MORALIS_BSC_STREAM_ID;

  if (!apiKey) {
    failure('MORALIS_API_KEY tidak ditemukan di .env.local');
    console.log('');
    info('Pastikan MORALIS_API_KEY sudah di-set di .env.local');
    process.exit(1);
  }

  if (!streamId) {
    failure('MORALIS_BSC_STREAM_ID tidak ditemukan di .env.local');
    console.log('');
    info('Pastikan MORALIS_BSC_STREAM_ID sudah di-set di .env.local');
    process.exit(1);
  }

  success('Environment variables found');
  info(`Stream ID: ${streamId}`);
  console.log('');

  // Generate secret
  log(colors.bright, '🔑 Generating webhook secret...');
  const secret = generateWebhookSecret(32);
  success(`Secret generated: ${secret.substring(0, 20)}... (64 chars)`);
  console.log('');

  // Update stream via API
  log(colors.bright, '📡 Updating Moralis stream via API...');
  
  try {
    const result = await updateStreamSecret(streamId, apiKey, secret);
    success('Stream updated successfully!');
    console.log('');
    info('Stream details:');
    console.log(`  - ID: ${result.id || streamId}`);
    console.log(`  - Webhook URL: ${result.webhookUrl || 'Updated'}`);
    console.log(`  - Webhook Secret: Set ✅`);
    console.log('');
  } catch (error) {
    failure('Failed to update stream via API');
    console.log('');
    warning('Error: ' + error.message);
    console.log('');
    
    if (error.message.includes('401')) {
      warning('MORALIS_API_KEY mungkin invalid atau expired');
      info('Cek API key di: https://admin.moralis.io/settings');
    } else if (error.message.includes('404')) {
      warning('Stream ID tidak ditemukan');
      info('Pastikan MORALIS_BSC_STREAM_ID benar');
    } else if (error.message.includes('403')) {
      warning('Tidak punya permission untuk update stream');
      info('Pastikan API key punya write access');
    }
    
    console.log('');
    warning('Tapi tenang, kita tetap bisa save secret ke .env.local');
    warning('Nanti Anda bisa set manual di Moralis dashboard');
    console.log('');
  }

  // Update .env.local
  log(colors.bright, '💾 Saving secret to .env.local...');
  
  try {
    updateEnvFile(secret);
    success('Secret saved to .env.local!');
    console.log('');
  } catch (error) {
    failure('Failed to update .env.local');
    console.log('');
    console.error(error);
    console.log('');
    info('Manual action required:');
    console.log('  1. Buka .env.local');
    console.log('  2. Tambahkan line:');
    console.log(`     MORALIS_WEBHOOK_SECRET=${secret}`);
    console.log('');
    process.exit(1);
  }

  // Summary
  header('✅ SETUP COMPLETE!');
  console.log('');
  
  log(colors.bright, '📋 SUMMARY:');
  console.log('');
  console.log(`  Generated Secret: ${secret.substring(0, 20)}...${secret.substring(secret.length - 10)}`);
  console.log(`  Length: ${secret.length} chars`);
  console.log(`  Saved to: .env.local`);
  console.log('');
  
  log(colors.bright, '🎯 NEXT STEPS:');
  console.log('');
  console.log('  1. Restart dev server:');
  console.log('     npm run dev');
  console.log('');
  console.log('  2. Verify webhook signature di Moralis dashboard:');
  console.log('     - Buka stream Anda');
  console.log('     - Scroll ke section "Webhook"');
  console.log('     - Pastikan webhook secret ter-set');
  console.log('     - Jika belum, copy secret ini:');
  console.log(`       ${secret}`);
  console.log('');
  console.log('  3. Test webhook signature:');
  console.log('     node scripts/test-webhook-signature.js');
  console.log('');
  console.log('  4. Send test webhook dari Moralis dashboard');
  console.log('     (Klik tombol "Test Your Stream")');
  console.log('');
  
  success('Webhook signature verification is now READY! 🔒');
  console.log('');
  
  log(colors.yellow, '⚠️  IMPORTANT:');
  console.log('  - Jangan share secret ini ke siapa pun');
  console.log('  - Jangan commit .env.local ke Git');
  console.log('  - Secret ini untuk production, simpan dengan aman');
  console.log('');
}

// Run
main().catch((error) => {
  console.error('');
  failure('Script failed:');
  console.error(error);
  process.exit(1);
});
