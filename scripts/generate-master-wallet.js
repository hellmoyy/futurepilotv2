/**
 * Generate Master Wallet Script
 * Run: node scripts/generate-master-wallet.js
 * 
 * ⚠️  SECURITY:
 * - Run this ONLY ONCE
 * - Save output in secure password manager
 * - Add to .env
 * - NEVER commit to git
 */

const { ethers } = require('ethers');

function generateMasterWallet() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          🔑 MASTER WALLET GENERATOR                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('⚠️  WARNING: Keep these credentials EXTREMELY SECURE!');
  console.log('⚠️  This wallet will hold ALL user funds!\n');
  
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✅ Master Wallet Generated\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📝 Address:');
  console.log(wallet.address);
  console.log('');
  
  console.log('🔐 Private Key:');
  console.log(wallet.privateKey);
  console.log('');
  
  console.log('💬 Mnemonic Phrase (12 words):');
  console.log(wallet.mnemonic.phrase);
  console.log('');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📋 Add to .env (Production):');
  console.log(`MASTER_WALLET_PRIVATE_KEY=${wallet.privateKey}`);
  console.log(`MASTER_WALLET_ADDRESS=${wallet.address}`);
  console.log('');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✅ NEXT STEPS:');
  console.log('');
  console.log('1. SAVE credentials in secure password manager (1Password, LastPass)');
  console.log('2. ADD to .env file');
  console.log('3. FUND wallet dengan BNB/ETH untuk gas fees');
  console.log('4. VERIFY dengan: node scripts/check-master-wallet.js');
  console.log('5. NEVER commit .env to git!');
  console.log('');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
}

// Run
generateMasterWallet();
