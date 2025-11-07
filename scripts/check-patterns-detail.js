/**
 * Check Pattern Details
 * 
 * Inspects current patterns in database to understand:
 * - Total count
 * - Which users they belong to
 * - Creation dates
 * - Sample pattern data
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Define minimal LearningPattern schema
const learningPatternSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userBotId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserBot' },
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
  updatedAt: Date,
}, { collection: 'learningpatterns' });

const LearningPattern = mongoose.model('LearningPattern', learningPatternSchema);

async function checkPatternDetails() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully\n');

    // Get total count
    const totalCount = await LearningPattern.countDocuments({});
    console.log(`📊 Total Patterns: ${totalCount}\n`);

    if (totalCount === 0) {
      console.log('❌ No patterns found in database');
      return;
    }

    // Get unique users
    const uniqueUsers = await LearningPattern.distinct('userId');
    console.log(`👥 Unique Users: ${uniqueUsers.length}`);
    uniqueUsers.forEach((userId, index) => {
      console.log(`   ${index + 1}. ${userId}`);
    });
    console.log('');

    // Get patterns by user
    for (const userId of uniqueUsers) {
      const userPatterns = await LearningPattern.countDocuments({ userId });
      console.log(`   User ${userId}: ${userPatterns} patterns`);
    }
    console.log('');

    // Get date range
    const oldest = await LearningPattern.findOne({}).sort({ createdAt: 1 });
    const newest = await LearningPattern.findOne({}).sort({ createdAt: -1 });
    
    if (oldest && newest) {
      console.log(`📅 Date Range:`);
      console.log(`   Oldest: ${oldest.createdAt}`);
      console.log(`   Newest: ${newest.createdAt}`);
      console.log('');
    }

    // Get sample loss pattern to check avgLoss
    const lossPattern = await LearningPattern.findOne({ 'pattern.type': 'loss' });
    if (lossPattern) {
      console.log(`🔍 Sample Loss Pattern:`);
      console.log(`   Type: ${lossPattern.pattern.type}`);
      console.log(`   Description: ${lossPattern.pattern.description}`);
      console.log(`   Occurrences: ${lossPattern.occurrences}`);
      console.log(`   Wins: ${lossPattern.wins}, Losses: ${lossPattern.losses}`);
      console.log(`   Avg Profit: $${lossPattern.avgProfit?.toFixed(2) || 0}`);
      console.log(`   Avg Loss: $${lossPattern.avgLoss?.toFixed(2) || 0} ⚠️`);
      console.log(`   Net P/L: $${lossPattern.netProfitLoss?.toFixed(2) || 0}`);
      console.log('');

      // Check if avgLoss is positive (bug) or negative (correct)
      if (lossPattern.avgLoss && lossPattern.avgLoss > 0) {
        console.log('❌ BUG DETECTED: avgLoss is POSITIVE (should be NEGATIVE)');
        console.log('   This pattern has incorrect Math.abs() calculation');
      } else if (lossPattern.avgLoss && lossPattern.avgLoss < 0) {
        console.log('✅ CORRECT: avgLoss is NEGATIVE (as expected)');
      }
      console.log('');
    }

    // Get all patterns summary
    console.log(`📋 All Patterns Summary:`);
    const allPatterns = await LearningPattern.find({}).select('pattern.type pattern.description avgLoss netProfitLoss').limit(30);
    allPatterns.forEach((p, i) => {
      const avgLossSign = p.avgLoss > 0 ? '⚠️ POSITIVE' : p.avgLoss < 0 ? '✅ NEGATIVE' : 'N/A';
      console.log(`   ${i + 1}. ${p.pattern.type} | ${p.pattern.description.substring(0, 40)}... | avgLoss: $${p.avgLoss?.toFixed(2) || 0} ${avgLossSign} | Net: $${p.netProfitLoss?.toFixed(2) || 0}`);
    });

    console.log('\n✅ Pattern inspection complete\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

checkPatternDetails();
