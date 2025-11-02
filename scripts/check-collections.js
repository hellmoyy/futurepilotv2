require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkCollections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const collectionsToCheck = ['futurepilotcol', 'futurepilotcols', 'users'];

    for (const collName of collectionsToCheck) {
      const count = await mongoose.connection.db.collection(collName).countDocuments();
      console.log(`📊 Collection "${collName}": ${count} documents`);
      
      if (count > 0) {
        const sample = await mongoose.connection.db.collection(collName).findOne({});
        console.log(`   Sample: ${sample.email || sample.name || 'N/A'}`);
        console.log(`   Has isBanned: ${sample.isBanned !== undefined}`);
        console.log('');
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

checkCollections();
