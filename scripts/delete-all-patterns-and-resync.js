/**
 * Delete ALL Patterns and Re-sync
 * 
 * Simple solution:
 * 1. Delete ALL patterns unconditionally
 * 2. Trigger fresh sync from Bot Signal with corrected avgLoss calculation
 * 
 * No need for 'source' field - just delete everything and start fresh
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Define minimal LearningPattern schema
const learningPatternSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userBotId: mongoose.Schema.Types.ObjectId,
  pattern: Object,
  createdAt: Date,
}, { collection: 'learningpatterns' });

const LearningPattern = mongoose.model('LearningPattern', learningPatternSchema);

async function deleteAllPatternsAndResync() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully\n');

    // Count before deletion
    const countBefore = await LearningPattern.countDocuments({});
    console.log(`📊 Current Patterns: ${countBefore}\n`);

    if (countBefore === 0) {
      console.log('❌ No patterns to delete');
      await mongoose.disconnect();
      return;
    }

    // Show sample before deletion
    const sampleBefore = await LearningPattern.findOne({ 'pattern.type': 'loss' });
    if (sampleBefore) {
      console.log('🔍 Sample Pattern BEFORE deletion:');
      console.log(`   Description: ${sampleBefore.pattern.description}`);
      console.log(`   Created: ${sampleBefore.createdAt}`);
      console.log('');
    }

    // DELETE ALL PATTERNS (no filter)
    console.log('🗑️  Deleting ALL patterns...');
    const deleteResult = await LearningPattern.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} patterns\n`);

    // Verify deletion
    const countAfter = await LearningPattern.countDocuments({});
    console.log(`📊 Patterns After Deletion: ${countAfter}\n`);

    if (countAfter === 0) {
      console.log('✅ All patterns successfully deleted!\n');
      console.log('📝 Next Steps:');
      console.log('   1. Go to Bot Decision > Learning Insights tab');
      console.log('   2. Click "Sync from Bot Signal" button');
      console.log('   3. Patterns will be re-created with CORRECTED avgLoss (negative values)');
      console.log('   4. Net P/L should now be POSITIVE (matching 68.3% win rate)\n');
    } else {
      console.log('⚠️  Warning: Some patterns still remain');
      console.log(`   Remaining: ${countAfter} patterns\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Execute
deleteAllPatternsAndResync();
