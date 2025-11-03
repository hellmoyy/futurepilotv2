/**
 * Fix Encrypted API Keys
 * Re-encrypt all API keys with current encryption key
 * Use this if encryption key changed or keys are corrupted
 * 
 * Usage: node scripts/fix-encrypted-keys.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const MONGODB_URI = process.env.MONGODB_URI;
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || 'your-secret-key-change-this-in-production';

// Exchange Connection Schema
const exchangeConnectionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  exchange: String,
  apiKey: String,
  apiSecret: String,
  nickname: String,
  isActive: Boolean,
  testnet: Boolean,
}, { collection: 'exchangeconnections' });

const ExchangeConnection = mongoose.models.ExchangeConnection || 
  mongoose.model('ExchangeConnection', exchangeConnectionSchema);

// Encryption functions
function encryptApiKey(apiKey) {
  try {
    const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Error encrypting API key:', error);
    throw new Error('Failed to encrypt API key');
  }
}

function decryptApiKey(encryptedKey) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (plainText && plainText.length > 0) {
      return plainText;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fixEncryptedKeys() {
  try {
    console.log('🔧 Starting encrypted keys fix...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all exchange connections
    const connections = await ExchangeConnection.find({});
    console.log(`📋 Found ${connections.length} exchange connection(s)\n`);

    if (connections.length === 0) {
      console.log('ℹ️  No exchange connections found. Nothing to fix.');
      await mongoose.disconnect();
      return;
    }

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const conn of connections) {
      const display = `${conn.exchange} (${conn.nickname || 'unnamed'})`;
      console.log(`\n🔍 Processing: ${display}`);
      console.log(`   User ID: ${conn.userId}`);
      console.log(`   Active: ${conn.isActive ? '✅' : '❌'}`);

      try {
        // Try to decrypt current keys
        const decryptedKey = decryptApiKey(conn.apiKey);
        const decryptedSecret = decryptApiKey(conn.apiSecret);

        if (decryptedKey && decryptedSecret) {
          console.log('   ✅ Keys are already valid (can be decrypted)');
          console.log(`   📊 API Key length: ${decryptedKey.length} chars`);
          console.log(`   📊 API Secret length: ${decryptedSecret.length} chars`);
          
          // Re-encrypt to ensure using latest format
          const reEncryptedKey = encryptApiKey(decryptedKey);
          const reEncryptedSecret = encryptApiKey(decryptedSecret);
          
          if (reEncryptedKey !== conn.apiKey || reEncryptedSecret !== conn.apiSecret) {
            await ExchangeConnection.updateOne(
              { _id: conn._id },
              { 
                $set: { 
                  apiKey: reEncryptedKey, 
                  apiSecret: reEncryptedSecret 
                } 
              }
            );
            console.log('   🔄 Re-encrypted with current key format');
            fixedCount++;
          } else {
            console.log('   ⏭️  Already using latest encryption');
            skippedCount++;
          }
        } else {
          console.log('   ❌ Keys are corrupted (cannot be decrypted)');
          console.log('   ⚠️  MANUAL ACTION REQUIRED:');
          console.log('      User needs to reconnect their exchange account');
          console.log(`      Connection ID: ${conn._id}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error processing: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Fixed/Re-encrypted: ${fixedCount}`);
    console.log(`⏭️  Already valid: ${skippedCount}`);
    console.log(`❌ Corrupted (need manual fix): ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  IMPORTANT:');
      console.log('Users with corrupted keys need to:');
      console.log('1. Go to /trading-account');
      console.log('2. Delete old connection');
      console.log('3. Add new connection with correct API keys');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done! Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the fix
fixEncryptedKeys();
