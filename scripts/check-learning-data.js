require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function checkLearningData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check LearningPattern collection
    const LearningPattern = mongoose.model('LearningPattern', new mongoose.Schema({}, { strict: false, collection: 'learningpatterns' }));
    const patternCount = await LearningPattern.countDocuments();
    console.log('\n📚 LearningPattern Collection:');
    console.log('Total patterns:', patternCount);

    if (patternCount > 0) {
      const samples = await LearningPattern.find().limit(3);
      console.log('\nSample patterns:');
      samples.forEach((p, i) => {
        console.log(`${i + 1}. Type: ${p.pattern?.type}, Strength: ${p.strength}, Occurrences: ${p.occurrences}`);
      });
    }

    // Check AIDecision collection
    const AIDecision = mongoose.model('AIDecision', new mongoose.Schema({}, { strict: false, collection: 'aidecisions' }));
    const decisionCount = await AIDecision.countDocuments();
    console.log('\n🤖 AIDecision Collection:');
    console.log('Total decisions:', decisionCount);

    if (decisionCount > 0) {
      const samples = await AIDecision.find().limit(3);
      console.log('\nSample decisions:');
      samples.forEach((d, i) => {
        console.log(`${i + 1}. Action: ${d.action}, Executed: ${d.executed}, Outcome: ${d.outcome?.result}`);
      });
    }

    // Check if pattern learning system is enabled
    console.log('\n⚙️ System Status:');
    console.log('Pattern learning requires:');
    console.log('1. User bots with trade history');
    console.log('2. Pattern analysis run (cron or manual)');
    console.log('3. Sufficient historical data (min 10 trades)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLearningData();
