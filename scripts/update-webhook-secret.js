#!/usr/bin/env node
/**
 * 🔐 UPDATE MORALIS WEBHOOK SECRET
 * Helper script untuk update webhook secret di .env.local
 * 
 * Usage:
 * 1. Copy webhook secret dari Moralis dashboard
 * 2. Run: node scripts/update-webhook-secret.js
 * 3. Paste secret ketika diminta
 * 4. Done! ✅
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

function warning(text) {
  log(colors.yellow, '⚠️  ' + text);
}

function info(text) {
  log(colors.cyan, 'ℹ️  ' + text);
}

// Main function
async function main() {
  header('🔐 UPDATE MORALIS WEBHOOK SECRET');
  
  console.log('');
  info('Script ini akan membantu Anda update webhook secret di .env.local');
  console.log('');
  
  // Check if .env.local exists
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log(colors.red, '❌ File .env.local tidak ditemukan!');
    console.log('');
    info('Path: ' + envPath);
    process.exit(1);
  }
  
  success('File .env.local ditemukan');
  console.log('');
  
  // Instructions
  log(colors.bright, '📋 LANGKAH-LANGKAH:');
  console.log('');
  console.log('1. Buka Moralis dashboard di browser');
  console.log('2. Scroll ke atas halaman stream Anda');
  console.log('3. Cari section "Webhook" atau "Webhook Configuration"');
  console.log('4. Klik tombol "Show" atau "Copy" di field "Webhook Secret"');
  console.log('5. Copy secret tersebut');
  console.log('6. Paste di sini (di terminal ini)');
  console.log('');
  
  log(colors.yellow, '⚠️  TIPS:');
  console.log('   - Secret biasanya format: abc123def456... (30-50 chars)');
  console.log('   - Jangan include spasi atau newline');
  console.log('   - Jika tidak ketemu, scroll ke atas atau cek tab Settings');
  console.log('');
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Prompt user
  rl.question(log(colors.bright, '🔑 Paste Webhook Secret dari Moralis (atau ketik "skip" untuk skip): '), (secret) => {
    console.log('');
    
    // Trim whitespace
    secret = secret.trim();
    
    // Handle skip
    if (secret.toLowerCase() === 'skip' || secret === '') {
      warning('Skipping webhook secret update');
      console.log('');
      info('Anda bisa run script ini lagi kapan saja:');
      console.log('   node scripts/update-webhook-secret.js');
      console.log('');
      warning('REMINDER: Webhook signature verification TIDAK akan aktif');
      warning('System masih aman tapi less secure (bisa terima webhook tanpa verifikasi)');
      console.log('');
      rl.close();
      process.exit(0);
      return;
    }
    
    // Validate secret format
    if (secret.length < 20) {
      log(colors.red, '❌ Secret terlalu pendek (< 20 chars)');
      console.log('');
      info('Secret seharusnya string random panjang (30-50 chars)');
      info('Contoh: abc123def456ghi789jkl012mno345pqr678');
      console.log('');
      warning('Mungkin Anda copy yang salah?');
      console.log('');
      rl.close();
      process.exit(1);
      return;
    }
    
    if (secret.includes(' ') || secret.includes('\n')) {
      warning('Secret mengandung spasi atau newline, cleaning...');
      secret = secret.replace(/\s+/g, '');
    }
    
    info(`Secret length: ${secret.length} chars`);
    info(`Secret preview: ${secret.substring(0, 20)}...`);
    console.log('');
    
    // Read .env.local
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if MORALIS_WEBHOOK_SECRET already exists
    const secretRegex = /MORALIS_WEBHOOK_SECRET=.*/;
    
    if (secretRegex.test(envContent)) {
      // Replace existing
      info('Updating existing MORALIS_WEBHOOK_SECRET...');
      envContent = envContent.replace(
        secretRegex,
        `MORALIS_WEBHOOK_SECRET=${secret}`
      );
    } else {
      // Add new line
      info('Adding MORALIS_WEBHOOK_SECRET to .env.local...');
      
      // Find MORALIS_BSC_TESTNET_STREAM_ID line and add after it
      if (envContent.includes('MORALIS_BSC_TESTNET_STREAM_ID')) {
        envContent = envContent.replace(
          /MORALIS_BSC_TESTNET_STREAM_ID=.*/,
          (match) => `${match}\nMORALIS_WEBHOOK_SECRET=${secret}`
        );
      } else {
        // Add at end
        envContent += `\nMORALIS_WEBHOOK_SECRET=${secret}\n`;
      }
    }
    
    // Write back to file
    try {
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('');
      success('Webhook secret berhasil disimpan ke .env.local!');
      console.log('');
      
      log(colors.bright, '✅ NEXT STEPS:');
      console.log('');
      console.log('1. Restart dev server:');
      console.log('   npm run dev');
      console.log('');
      console.log('2. Test webhook signature:');
      console.log('   node scripts/test-webhook-signature.js');
      console.log('');
      console.log('3. Atau send test webhook dari Moralis dashboard');
      console.log('   (di section "Test Your Stream")');
      console.log('');
      
      success('DONE! Webhook signature verification sekarang AKTIF 🔒');
      console.log('');
      
    } catch (error) {
      log(colors.red, '❌ Error writing to .env.local:');
      console.error(error);
      process.exit(1);
    }
    
    rl.close();
  });
}

// Run
main().catch(error => {
  console.error('');
  log(colors.red, '❌ Error:');
  console.error(error);
  process.exit(1);
});
