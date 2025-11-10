#!/usr/bin/env node

/**
 * 🧹 Complete Database Cleanup for Mainnet
 * 
 * This script cleans ALL testnet data in one go:
 * - Transactions (remaining 2)
 * - Notifications (2475)
 * - Bot instances (1)
 * - Signals (16822)
 * - Referral commissions (26)
 * - Trade logs (9)
 * - AI decisions (3)
 * - User bots (10)
 * - Learning patterns (50)
 * - Chat histories (14)
 * 
 * Usage:
 *   node scripts/cleanup-complete-mainnet.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function cleanupComplete() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🧹 COMPLETE MAINNET DATABASE CLEANUP');
    console.log('━'.repeat(80));
    console.log(`Network Mode: ${process.env.NETWORK_MODE || 'testnet'}`);
    console.log('');

    const cleanupTasks = [
      { name: 'transactions', reason: 'Testnet transaction data' },
      { name: 'notifications', reason: 'Old notifications' },
      { name: 'botinstances', reason: 'Testnet bot instances' },
      { name: 'signals', reason: 'Old testnet signals' },
      { name: 'referralcommissions', reason: 'Testnet commission records' },
      { name: 'tradelogs', reason: 'Old trade logs' },
      { name: 'aidecisions', reason: 'Old AI decisions' },
      { name: 'userbots', reason: 'Test user bots' },
      { name: 'learningpatterns', reason: 'Test learning data' },
      { name: 'chathistories', reason: 'Old chat histories' },
      { name: 'signalcenter_signals', reason: 'Old signal center signals' },
      { name: 'webhookretries', reason: 'Old webhook retries' },
    ];

    console.log('⚠️  WARNING: This will DELETE data from the following collections:');
    console.log('');
    cleanupTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.name} - ${task.reason}`);
    });
    console.log('');
    console.log('✅ Will KEEP:');
    console.log('   ✓ User accounts (futurepilotcols)');
    console.log('   ✓ Settings and configurations');
    console.log('   ✓ Trading bot configs');
    console.log('   ✓ News events (keep for reference)');
    console.log('   ✓ Backtest results (keep for reference)');
    console.log('');

    console.log('⏳ Starting cleanup in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const results = {
      deleted: {},
      total: 0,
    };

    for (const task of cleanupTasks) {
      try {
        const collection = db.collection(task.name);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`\n🗑️  Deleting ${task.name} (${count} documents)...`);
          const result = await collection.deleteMany({});
          console.log(`   ✅ Deleted ${result.deletedCount} documents`);
          results.deleted[task.name] = result.deletedCount;
          results.total += result.deletedCount;
        } else {
          console.log(`\n⏭️  Skipping ${task.name} (already empty)`);
          results.deleted[task.name] = 0;
        }
      } catch (error) {
        console.error(`   ❌ Error deleting ${task.name}:`, error.message);
        results.deleted[task.name] = -1;
      }
    }

    // Verify cleanup
    console.log('\n\n✅ Verifying cleanup...');
    for (const task of cleanupTasks) {
      const count = await db.collection(task.name).countDocuments();
      if (count === 0) {
        console.log(`   ✓ ${task.name}: Clean (0 documents)`);
      } else {
        console.log(`   ⚠️  ${task.name}: ${count} documents remaining`);
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log(`Total documents deleted: ${results.total}`);
    console.log('');
    console.log('Breakdown:');
    Object.entries(results.deleted).forEach(([name, count]) => {
      if (count > 0) {
        console.log(`   ✓ ${name}: ${count} deleted`);
      } else if (count === 0) {
        console.log(`   - ${name}: already empty`);
      } else {
        console.log(`   ✗ ${name}: error`);
      }
    });

    console.log('\n✅ Database is now clean for mainnet production!');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  cleanupComplete()
    .then(() => {
      console.log('\n✅ Cleanup script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupComplete };
