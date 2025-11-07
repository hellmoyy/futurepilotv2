require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function checkNewsAge() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const NewsEvent = mongoose.model('NewsEvent', new mongoose.Schema({}, { strict: false, collection: 'newsevents' }));

    const now = new Date();
    const tier1Cutoff = new Date(now - 6 * 60 * 60 * 1000); // 6h ago
    const tier2Cutoff = new Date(now - 24 * 60 * 60 * 1000); // 24h ago
    const tier3Cutoff = new Date(now - 72 * 60 * 60 * 1000); // 72h ago

    // Count news by age
    const ultra = await NewsEvent.countDocuments({ publishedAt: { $gte: tier1Cutoff } });
    const recent = await NewsEvent.countDocuments({ publishedAt: { $gte: tier2Cutoff, $lt: tier1Cutoff } });
    const background = await NewsEvent.countDocuments({ publishedAt: { $gte: tier3Cutoff, $lt: tier2Cutoff } });

    console.log('\n📊 News by Age:');
    console.log('Ultra-Recent (0-6h):', ultra);
    console.log('Recent (6-24h):', recent);
    console.log('Background (24-72h):', background);

    // Check oldest news
    const oldest = await NewsEvent.findOne().sort({ publishedAt: 1 });
    if (oldest) {
      const age = (now - oldest.publishedAt) / (1000 * 60 * 60); // hours
      console.log('\n�� Oldest News:');
      console.log('Published:', oldest.publishedAt);
      console.log('Age:', age.toFixed(1), 'hours');
      console.log('Title:', oldest.title?.substring(0, 80) + '...');
    }

    // Check high-impact news in 24-72h range
    const highImpactOld = await NewsEvent.countDocuments({
      publishedAt: { $gte: tier3Cutoff, $lt: tier2Cutoff },
      impact: 'high'
    });
    console.log('\n🔴 High-Impact News (24-72h):', highImpactOld);

    // Check all impact levels in 24-72h
    const impactStats = await NewsEvent.aggregate([
      { $match: { publishedAt: { $gte: tier3Cutoff, $lt: tier2Cutoff } } },
      { $group: { _id: '$impact', count: { $sum: 1 } } }
    ]);
    console.log('\n📈 Impact Breakdown (24-72h):', impactStats);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkNewsAge();
