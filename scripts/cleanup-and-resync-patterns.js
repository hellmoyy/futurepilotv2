#!/usr/bin/env node

/**
 * Clean up and re-sync Bot Decision patterns
 * 
 * This script:
 * 1. Deletes all existing AI-imported patterns (source: 'ai_import')
 * 2. Triggers a fresh sync from Bot Signal
 * 3. Shows updated statistics
 * 
 * Usage:
 *   node scripts/cleanup-and-resync-patterns.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function cleanupAndResync() {
  try {
    console.log('🔄 Starting pattern cleanup and re-sync...\n');

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get LearningPattern model
    const LearningPattern = mongoose.model('learningpatterns', new mongoose.Schema({}, { strict: false }));

    // Step 1: Count existing patterns
    const totalPatterns = await LearningPattern.countDocuments();
    const aiPatterns = await LearningPattern.countDocuments({ source: 'ai_import' });
    const manualPatterns = totalPatterns - aiPatterns;

    console.log('📊 Current Pattern Statistics:');
    console.log(`   Total patterns: ${totalPatterns}`);
    console.log(`   AI-imported patterns: ${aiPatterns}`);
    console.log(`   Manual patterns: ${manualPatterns}\n`);

    if (aiPatterns === 0) {
      console.log('✅ No AI-imported patterns to clean up.');
      console.log('   Proceeding with fresh sync...\n');
    } else {
      // Step 2: Calculate current stats before deletion
      const patterns = await LearningPattern.find({ source: 'ai_import' });
      const totalProfit = patterns.reduce((sum, p) => sum + (p.pattern?.totalProfit || 0), 0);
      const totalLoss = patterns.reduce((sum, p) => sum + (p.pattern?.totalLoss || 0), 0);
      const netProfitLoss = patterns.reduce((sum, p) => sum + (p.pattern?.netProfitLoss || 0), 0);

      console.log('📉 Old Pattern Statistics (to be deleted):');
      console.log(`   Total Profit: $${totalProfit.toFixed(2)}`);
      console.log(`   Total Loss: $${totalLoss.toFixed(2)}`);
      console.log(`   Net Profit/Loss: $${netProfitLoss.toFixed(2)}`);
      console.log(`   Patterns count: ${aiPatterns}\n`);

      // Step 3: Delete AI-imported patterns
      console.log('🗑️  Deleting AI-imported patterns...');
      const deleteResult = await LearningPattern.deleteMany({ source: 'ai_import' });
      console.log(`✅ Deleted ${deleteResult.deletedCount} patterns\n`);
    }

    // Step 4: Trigger fresh sync
    console.log('🔄 Triggering fresh pattern sync from Bot Signal...\n');

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const syncUrl = `${APP_URL}/api/admin/bot-decision/sync-signal-patterns`;

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'backtest-learning',
        symbol: 'BTCUSDT',
        overwrite: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Sync API failed: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${errorText}`);
      process.exit(1);
    }

    const syncData = await response.json();

    if (!syncData.success) {
      console.error(`❌ Sync failed: ${syncData.error}`);
      process.exit(1);
    }

    console.log('✅ Pattern sync completed!\n');
    console.log('📊 Sync Results:');
    console.log(`   Created: ${syncData.created} patterns`);
    console.log(`   Updated: ${syncData.updated} patterns`);
    console.log(`   Skipped: ${syncData.skipped} patterns\n`);

    console.log('📈 Source Data:');
    console.log(`   Backtests: ${syncData.source.totalBacktests}`);
    console.log(`   Avg ROI: ${syncData.source.avgROI.toFixed(2)}%`);
    console.log(`   Win Rate: ${(syncData.source.winRate * 100).toFixed(2)}%`);
    console.log(`   Total Trades: ${syncData.source.totalTrades}\n`);

    console.log('💡 Insights:');
    syncData.insights.forEach((insight, i) => {
      console.log(`   ${i + 1}. ${insight}`);
    });
    console.log('');

    // Step 5: Verify new statistics
    console.log('🔍 Verifying new pattern statistics...\n');

    const newPatterns = await LearningPattern.find({ source: 'ai_import' });
    const newTotalProfit = newPatterns.reduce((sum, p) => sum + (p.pattern?.totalProfit || 0), 0);
    const newTotalLoss = newPatterns.reduce((sum, p) => sum + (p.pattern?.totalLoss || 0), 0);
    const newNetProfitLoss = newPatterns.reduce((sum, p) => sum + (p.pattern?.netProfitLoss || 0), 0);

    console.log('📊 New Pattern Statistics:');
    console.log(`   Total Patterns: ${newPatterns.length}`);
    console.log(`   Total Profit: $${newTotalProfit.toFixed(2)}`);
    console.log(`   Total Loss: $${newTotalLoss.toFixed(2)}`);
    console.log(`   Net Profit/Loss: $${newNetProfitLoss.toFixed(2)}`);
    
    if (newNetProfitLoss > 0) {
      console.log(`   ✅ Net P/L is POSITIVE (expected for 68% win rate)`);
    } else {
      console.log(`   ⚠️  Net P/L is NEGATIVE (unexpected, may need further investigation)`);
    }
    console.log('');

    // Step 6: Show sample patterns
    console.log('📋 Sample Patterns (first 3):');
    const samplePatterns = await LearningPattern.find({ source: 'ai_import' }).limit(3);
    samplePatterns.forEach((pattern, i) => {
      console.log(`\n   ${i + 1}. ${pattern.pattern?.description || 'No description'}`);
      console.log(`      Type: ${pattern.pattern?.type || 'N/A'}`);
      console.log(`      Total Profit: $${(pattern.pattern?.totalProfit || 0).toFixed(2)}`);
      console.log(`      Total Loss: $${(pattern.pattern?.totalLoss || 0).toFixed(2)}`);
      console.log(`      Net P/L: $${(pattern.pattern?.netProfitLoss || 0).toFixed(2)}`);
      console.log(`      Avg Loss: $${(pattern.pattern?.avgLoss || 0).toFixed(2)}`);
      console.log(`      Success Rate: ${((pattern.pattern?.successRate || 0) * 100).toFixed(2)}%`);
    });

    console.log('\n\n🎉 Cleanup and re-sync completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Refresh Bot Decision Learning tab in browser');
    console.log('   2. Verify Net Profit/Loss is positive');
    console.log('   3. Check pattern list shows correct data\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup and re-sync:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAndResync().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
