#!/usr/bin/env node

/**
 * 🔍 Database Cleanup Checker
 * 
 * This script checks all collections and identifies data that should be cleaned
 * before deploying to mainnet production.
 * 
 * Usage:
 *   node scripts/check-cleanup-needed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function checkAllCollections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('📊 DATABASE CLEANUP ANALYSIS');
    console.log('━'.repeat(80));
    console.log(`Network Mode: ${process.env.NETWORK_MODE || 'testnet'}`);
    console.log(`Total Collections: ${collections.length}\n`);

    const cleanupReport = {
      needsCleanup: [],
      keepAsIs: [],
      checkManually: [],
    };

    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      
      console.log(`\n📁 Collection: ${collectionName}`);
      console.log(`   Documents: ${count}`);

      if (count === 0) {
        console.log(`   Status: ✅ EMPTY (Already Clean)`);
        cleanupReport.keepAsIs.push({ name: collectionName, reason: 'Empty' });
        continue;
      }

      // Get sample document
      const sample = await db.collection(collectionName).findOne();
      
      // Analyze based on collection name and content
      switch (collectionName) {
        // TRANSACTIONS - SHOULD BE CLEANED
        case 'transactions':
          const depositCount = await db.collection(collectionName).countDocuments({ type: 'deposit' });
          const withdrawalCount = await db.collection(collectionName).countDocuments({ type: 'withdrawal' });
          const commissionCount = await db.collection(collectionName).countDocuments({ type: 'commission' });
          const tradingCount = await db.collection(collectionName).countDocuments({ 
            type: { $in: ['trading_profit', 'trading_loss', 'trading_commission'] } 
          });
          const otherCount = count - depositCount - withdrawalCount - commissionCount - tradingCount;
          
          console.log(`   Breakdown:`);
          console.log(`     - Deposits: ${depositCount}`);
          console.log(`     - Withdrawals: ${withdrawalCount}`);
          console.log(`     - Commissions: ${commissionCount}`);
          console.log(`     - Trading: ${tradingCount}`);
          console.log(`     - Other/null: ${otherCount}`);
          
          if (count > 0) {
            console.log(`   Status: ⚠️  NEEDS CLEANUP`);
            console.log(`   Action: Delete all transactions (fresh start for mainnet)`);
            cleanupReport.needsCleanup.push({
              name: collectionName,
              count,
              reason: 'Testnet transaction data',
              action: 'DELETE ALL',
            });
          }
          break;

        // WITHDRAWALS - SHOULD BE CLEANED
        case 'withdrawals':
          console.log(`   Status: ⚠️  NEEDS CLEANUP`);
          console.log(`   Action: Delete all withdrawal records`);
          cleanupReport.needsCleanup.push({
            name: collectionName,
            count,
            reason: 'Testnet withdrawal data',
            action: 'DELETE ALL',
          });
          break;

        // USER DATA - NEEDS REVIEW
        case 'futurepilotcols':
        case 'users':
          const usersWithBalance = await db.collection(collectionName).countDocuments({
            $or: [
              { 'walletData.balance': { $gt: 0 } },
              { 'walletData.mainnetBalance': { $gt: 0 } }
            ]
          });
          const usersWithDeposits = await db.collection(collectionName).countDocuments({
            totalPersonalDeposit: { $gt: 0 }
          });
          
          console.log(`   Breakdown:`);
          console.log(`     - Total users: ${count}`);
          console.log(`     - With balance: ${usersWithBalance}`);
          console.log(`     - With deposits: ${usersWithDeposits}`);
          
          if (usersWithBalance > 0 || usersWithDeposits > 0) {
            console.log(`   Status: ⚠️  NEEDS CLEANUP`);
            console.log(`   Action: Reset balances and deposit totals (keep accounts)`);
            cleanupReport.needsCleanup.push({
              name: collectionName,
              count,
              reason: 'Users have testnet balances',
              action: 'RESET BALANCES (keep accounts & referral structure)',
            });
          } else {
            console.log(`   Status: ✅ CLEAN`);
            cleanupReport.keepAsIs.push({ name: collectionName, reason: 'No balances' });
          }
          break;

        // BOT INSTANCES - SHOULD BE CLEANED
        case 'botinstances':
          const activeBots = await db.collection(collectionName).countDocuments({ status: 'ACTIVE' });
          const stoppedBots = await db.collection(collectionName).countDocuments({ status: 'STOPPED' });
          
          console.log(`   Breakdown:`);
          console.log(`     - Active: ${activeBots}`);
          console.log(`     - Stopped: ${stoppedBots}`);
          
          if (count > 0) {
            console.log(`   Status: ⚠️  NEEDS CLEANUP`);
            console.log(`   Action: Delete all bot instances (fresh start)`);
            cleanupReport.needsCleanup.push({
              name: collectionName,
              count,
              reason: 'Testnet bot instances',
              action: 'DELETE ALL',
            });
          }
          break;

        // SIGNALS - SHOULD BE CLEANED
        case 'signals':
          console.log(`   Status: ⚠️  NEEDS CLEANUP`);
          console.log(`   Action: Delete all old signals`);
          cleanupReport.needsCleanup.push({
            name: collectionName,
            count,
            reason: 'Old testnet signals',
            action: 'DELETE ALL',
          });
          break;

        // TRADES - SHOULD BE CLEANED
        case 'trades':
          console.log(`   Status: ⚠️  NEEDS CLEANUP`);
          console.log(`   Action: Delete all trade history`);
          cleanupReport.needsCleanup.push({
            name: collectionName,
            count,
            reason: 'Testnet trade history',
            action: 'DELETE ALL',
          });
          break;

        // REFERRAL COMMISSIONS - SHOULD BE CLEANED
        case 'referralcommissions':
          console.log(`   Status: ⚠️  NEEDS CLEANUP`);
          console.log(`   Action: Delete all commission records`);
          cleanupReport.needsCleanup.push({
            name: collectionName,
            count,
            reason: 'Testnet commission data',
            action: 'DELETE ALL',
          });
          break;

        // NOTIFICATIONS - SHOULD BE CLEANED
        case 'notifications':
          console.log(`   Status: ⚠️  NEEDS CLEANUP`);
          console.log(`   Action: Delete all notifications`);
          cleanupReport.needsCleanup.push({
            name: collectionName,
            count,
            reason: 'Old notifications',
            action: 'DELETE ALL',
          });
          break;

        // CONFIGURATION - KEEP
        case 'settings':
        case 'tradingbotconfigs':
        case 'signalcenterconfigs':
          console.log(`   Status: ✅ KEEP`);
          console.log(`   Action: No cleanup needed (configuration data)`);
          cleanupReport.keepAsIs.push({ name: collectionName, reason: 'Configuration' });
          break;

        // NEWS - KEEP IF RECENT
        case 'news':
          const recentNews = await db.collection(collectionName).countDocuments({
            publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          });
          console.log(`   Recent news (7 days): ${recentNews}`);
          
          if (count > 1000) {
            console.log(`   Status: ⚠️  CONSIDER CLEANUP`);
            console.log(`   Action: Delete news older than 30 days (optional)`);
            cleanupReport.checkManually.push({
              name: collectionName,
              count,
              reason: 'Large collection',
              action: 'OPTIONAL: Delete old news',
            });
          } else {
            console.log(`   Status: ✅ KEEP`);
            cleanupReport.keepAsIs.push({ name: collectionName, reason: 'Recent news' });
          }
          break;

        // EXCHANGE CONNECTIONS - CHECK MANUALLY
        case 'exchangeconnections':
          console.log(`   Status: ⚠️  CHECK MANUALLY`);
          console.log(`   Action: Verify all connections are valid for mainnet`);
          cleanupReport.checkManually.push({
            name: collectionName,
            count,
            reason: 'Need to verify API keys are for mainnet',
            action: 'VERIFY: Ensure testnet=false in all connections',
          });
          break;

        // UNKNOWN - CHECK MANUALLY
        default:
          console.log(`   Status: ⚠️  UNKNOWN`);
          console.log(`   Action: Manual review required`);
          console.log(`   Sample:`, JSON.stringify(sample, null, 2).substring(0, 200) + '...');
          cleanupReport.checkManually.push({
            name: collectionName,
            count,
            reason: 'Unknown collection type',
            action: 'MANUAL REVIEW',
          });
      }
    }

    // Print Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📋 CLEANUP SUMMARY');
    console.log('='.repeat(80));

    console.log('\n⚠️  NEEDS CLEANUP (' + cleanupReport.needsCleanup.length + ' collections):');
    cleanupReport.needsCleanup.forEach(item => {
      console.log(`   ❌ ${item.name} (${item.count} docs)`);
      console.log(`      Reason: ${item.reason}`);
      console.log(`      Action: ${item.action}\n`);
    });

    console.log('\n⚠️  CHECK MANUALLY (' + cleanupReport.checkManually.length + ' collections):');
    cleanupReport.checkManually.forEach(item => {
      console.log(`   ⚠️  ${item.name} (${item.count} docs)`);
      console.log(`      Reason: ${item.reason}`);
      console.log(`      Action: ${item.action}\n`);
    });

    console.log('\n✅ KEEP AS IS (' + cleanupReport.keepAsIs.length + ' collections):');
    cleanupReport.keepAsIs.forEach(item => {
      console.log(`   ✓ ${item.name} - ${item.reason}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDED ACTIONS:');
    console.log('='.repeat(80));
    console.log('\n1. Run cleanup scripts:');
    console.log('   node scripts/cleanup-all-deposits.js     # ✅ DONE');
    console.log('   node scripts/cleanup-all-withdrawals.js  # ✅ DONE');
    console.log('   node scripts/cleanup-bot-instances.js    # TODO');
    console.log('   node scripts/cleanup-signals.js          # TODO');
    console.log('   node scripts/cleanup-trades.js           # TODO');
    console.log('   node scripts/cleanup-commissions.js      # TODO');
    console.log('   node scripts/cleanup-notifications.js    # TODO');
    
    console.log('\n2. Manual verification:');
    console.log('   - Check all exchange connections use mainnet');
    console.log('   - Verify settings are production-ready');
    console.log('   - Review user accounts (keep or delete test users)');

    console.log('\n3. Final check:');
    console.log('   node scripts/check-cleanup-needed.js     # Run again\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  checkAllCollections()
    .then(() => {
      console.log('\n✅ Analysis complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAllCollections };
