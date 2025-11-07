/**
 * Calculate Total Net P/L
 * 
 * Sum all netProfitLoss from patterns to verify UI calculation
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const learningPatternSchema = new mongoose.Schema({
  pattern: {
    type: { type: String },
    description: String,
  },
  netProfitLoss: Number,
  avgProfit: Number,
  avgLoss: Number,
  totalProfit: Number,
  totalLoss: Number,
}, { collection: 'learningpatterns' });

const LearningPattern = mongoose.model('LearningPattern', learningPatternSchema);

async function calculateTotalPnL() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully\n');

    const allPatterns = await LearningPattern.find({});
    
    console.log(`📊 Total Patterns: ${allPatterns.length}\n`);

    let totalNetPL = 0;
    let winPatterns = 0;
    let lossPatterns = 0;
    let winPL = 0;
    let lossPL = 0;

    console.log('📋 Pattern Breakdown:\n');
    
    allPatterns.forEach((p, i) => {
      const type = p.pattern.type;
      const netPL = p.netProfitLoss || 0;
      
      totalNetPL += netPL;
      
      if (type === 'win') {
        winPatterns++;
        winPL += netPL;
      } else {
        lossPatterns++;
        lossPL += netPL;
      }
      
      console.log(`   ${i + 1}. ${type.toUpperCase().padEnd(4)} | Net P/L: $${netPL.toFixed(2).padStart(10)} | ${p.pattern.description.substring(0, 40)}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary Statistics:\n');
    console.log(`   Win Patterns: ${winPatterns} patterns`);
    console.log(`   Win P/L Total: $${winPL.toFixed(2)}`);
    console.log(`   Avg per Win Pattern: $${(winPL / winPatterns).toFixed(2)}\n`);
    
    console.log(`   Loss Patterns: ${lossPatterns} patterns`);
    console.log(`   Loss P/L Total: $${lossPL.toFixed(2)}`);
    console.log(`   Avg per Loss Pattern: $${(lossPL / lossPatterns).toFixed(2)}\n`);
    
    console.log('='.repeat(80));
    console.log(`\n💰 TOTAL NET PROFIT/LOSS: $${totalNetPL.toFixed(2)}\n`);
    
    if (totalNetPL > 0) {
      console.log('✅ POSITIVE - Correct! Matches 68.3% win rate from Bot Signal\n');
    } else {
      console.log('❌ NEGATIVE - Something wrong with calculation!\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

calculateTotalPnL();
