#!/usr/bin/env node

/**
 * 🔍 Verify BotSettings User
 * 
 * Checks if the user in botsettings collection is:
 * - A test/demo user (DELETE botsettings)
 * - A production user (KEEP botsettings)
 * 
 * Usage:
 *   node scripts/verify-botsettings-user.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function verifyBotSettingsUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🔍 VERIFYING BOTSETTINGS USER');
    console.log('━'.repeat(80));
    console.log('');

    // Get botsettings
    const botSettings = await db.collection('botsettings').findOne({});
    
    if (!botSettings) {
      console.log('✅ No botsettings found - collection is clean!');
      return;
    }

    console.log('📋 Found BotSettings:');
    console.log(`   User ID: ${botSettings.userId}`);
    console.log(`   Bot ID: ${botSettings.botId}`);
    console.log(`   Leverage: ${botSettings.leverage}x`);
    console.log(`   Stop Loss: ${botSettings.stopLoss}%`);
    console.log(`   Take Profit: ${botSettings.takeProfit}%`);
    console.log(`   Created: ${botSettings.createdAt}`);
    console.log('');

    // Check if user exists
    const user = await db.collection('futurepilotcols').findOne({
      _id: new mongoose.Types.ObjectId(botSettings.userId)
    });

    if (!user) {
      console.log('⚠️  USER NOT FOUND IN DATABASE!');
      console.log('   This botsettings is orphaned (user was deleted)');
      console.log('');
      console.log('🗑️  Recommended Action: DELETE botsettings');
      console.log('   Command: db.botsettings.deleteMany({ userId: "' + botSettings.userId + '" })');
      console.log('');

      // Auto-delete orphaned botsettings
      console.log('⏳ Auto-deleting orphaned botsettings in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = await db.collection('botsettings').deleteMany({
        userId: botSettings.userId
      });
      
      console.log(`✅ Deleted ${result.deletedCount} orphaned botsettings`);
      console.log('');
      return;
    }

    // User exists - show details
    console.log('👤 USER DETAILS:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role || 'user'}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log('');
    console.log('💰 WALLET DATA:');
    console.log(`   Balance: $${user.walletData?.balance || 0} USDT`);
    console.log(`   Mainnet Balance: $${user.walletData?.mainnetBalance || 0} USDT`);
    console.log(`   ERC20 Address: ${user.walletData?.erc20Address || 'N/A'}`);
    console.log(`   BEP20 Address: ${user.walletData?.bep20Address || 'N/A'}`);
    console.log('');
    console.log('📊 TRADING DATA:');
    console.log(`   Total Deposits: $${user.totalPersonalDeposit || 0}`);
    console.log(`   Total Earnings: $${user.totalEarnings || 0}`);
    console.log(`   Total Withdrawn: $${user.totalWithdrawn || 0}`);
    console.log(`   Referral Code: ${user.referralCode || 'N/A'}`);
    console.log(`   Referred By: ${user.referredBy || 'None'}`);
    console.log('');

    // Determine if test or production user
    const isTestUser = (
      user.email.includes('test') ||
      user.email.includes('demo') ||
      user.email.includes('example') ||
      user.name?.toLowerCase().includes('test') ||
      (user.totalPersonalDeposit === 0 && user.walletData?.balance === 0)
    );

    if (isTestUser) {
      console.log('⚠️  ASSESSMENT: TEST/DEMO USER');
      console.log('   Indicators:');
      console.log('   - Email contains "test", "demo", or "example"');
      console.log('   - No deposits or balance');
      console.log('');
      console.log('🗑️  Recommended Action: DELETE botsettings');
      console.log('   Command: db.botsettings.deleteMany({ userId: "' + botSettings.userId + '" })');
      console.log('');
      console.log('   Or run this script to auto-delete:');
      console.log('   node scripts/delete-test-botsettings.js');
    } else {
      console.log('✅ ASSESSMENT: PRODUCTION USER');
      console.log('   Indicators:');
      console.log('   - Real email address');
      console.log('   - Active trading data');
      console.log('');
      console.log('✅ Recommended Action: KEEP botsettings');
      console.log('   This is a legitimate user configuration');
    }

    console.log('');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  verifyBotSettingsUser()
    .then(() => {
      console.log('\n✅ Verification completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyBotSettingsUser };
