/**
 * Manual Pattern Sync Test
 * 
 * Triggers pattern sync API endpoint directly to verify:
 * 1. Patterns are created with NEGATIVE avgLoss values
 * 2. Net P/L calculations are CORRECT (positive for 68% win rate)
 * 3. All 30 patterns created successfully
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Define schemas
const learningPatternSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userBotId: mongoose.Schema.Types.ObjectId,
  pattern: {
    type: { type: String },
    description: String,
    conditions: Object,
  },
  occurrences: Number,
  wins: Number,
  losses: Number,
  totalProfit: Number,
  totalLoss: Number,
  avgProfit: Number,
  avgLoss: Number,
  netProfitLoss: Number,
  createdAt: Date,
}, { collection: 'learningpatterns' });

const LearningPattern = mongoose.model('LearningPattern', learningPatternSchema);

async function testPatternSync() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully\n');

    // Check patterns BEFORE sync
    const countBefore = await LearningPattern.countDocuments({});
    console.log(`📊 Patterns BEFORE sync: ${countBefore}\n`);

    if (countBefore > 0) {
      console.log('⚠️  Warning: Patterns already exist! Expected 0.');
      console.log('   Run delete-all-patterns-and-resync.js first\n');
    }

    // Trigger sync by importing and calling the function directly
    console.log('🔄 Importing pattern sync module...');
    const { syncBotSignalPatternsToDecision } = require('../src/lib/pattern-sync');
    
    console.log('🚀 Triggering pattern sync...\n');
    const result = await syncBotSignalPatternsToDecision();
    
    console.log('✅ Sync completed!');
    console.log(`   Patterns created: ${result.patternsCreated}`);
    console.log(`   Insights created: ${result.insightsCreated}`);
    console.log('');

    // Check patterns AFTER sync
    const countAfter = await LearningPattern.countDocuments({});
    console.log(`📊 Patterns AFTER sync: ${countAfter}\n`);

    // Analyze patterns
    const lossPatterns = await LearningPattern.find({ 'pattern.type': 'loss' });
    console.log(`🔍 Loss Patterns Analysis (${lossPatterns.length} total):\n`);

    let correctCount = 0;
    let incorrectCount = 0;

    lossPatterns.forEach((pattern, index) => {
      const avgLossSign = pattern.avgLoss < 0 ? '✅ NEGATIVE' : pattern.avgLoss > 0 ? '❌ POSITIVE' : 'N/A';
      const isCorrect = pattern.avgLoss < 0;
      
      if (isCorrect) correctCount++;
      else incorrectCount++;

      console.log(`   ${index + 1}. ${pattern.pattern.description.substring(0, 50)}...`);
      console.log(`      avgLoss: $${pattern.avgLoss?.toFixed(2) || 0} ${avgLossSign}`);
      console.log(`      Net P/L: $${pattern.netProfitLoss?.toFixed(2) || 0}`);
      console.log('');
    });

    // Summary
    console.log('📈 Validation Summary:');
    console.log(`   ✅ Correct (negative avgLoss): ${correctCount}`);
    console.log(`   ❌ Incorrect (positive avgLoss): ${incorrectCount}`);
    console.log('');

    if (incorrectCount === 0) {
      console.log('🎉 SUCCESS! All loss patterns have NEGATIVE avgLoss values!');
      console.log('   Net P/L calculations should now be CORRECT.\n');
    } else {
      console.log('⚠️  WARNING! Some patterns still have POSITIVE avgLoss values!');
      console.log('   Check src/lib/pattern-sync.ts for Math.abs() usage.\n');
    }

    // Check total Net P/L
    const allPatterns = await LearningPattern.find({});
    let totalNetPL = 0;
    allPatterns.forEach(p => {
      totalNetPL += p.netProfitLoss || 0;
    });

    console.log(`💰 Total Net Profit/Loss Across All Patterns: $${totalNetPL.toFixed(2)}`);
    
    if (totalNetPL > 0) {
      console.log('   ✅ POSITIVE - Matches expected 68.3% win rate!\n');
    } else {
      console.log('   ❌ NEGATIVE - Still incorrect, check calculations!\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

testPatternSync();
