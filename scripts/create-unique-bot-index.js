require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function createUniqueIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('botinstances');

    console.log('📊 Checking existing indexes...');
    const existingIndexes = await collection.indexes();
    console.log('Current indexes:', existingIndexes.map(idx => idx.name).join(', '));
    console.log('');

    // Check if our unique index already exists
    const uniqueIndexName = 'userId_1_botId_1_status_1';
    const indexExists = existingIndexes.some(idx => idx.name === uniqueIndexName);

    if (indexExists) {
      console.log(`⚠️ Index "${uniqueIndexName}" already exists. Dropping it first...`);
      await collection.dropIndex(uniqueIndexName);
      console.log('✅ Old index dropped\n');
    }

    // Create unique compound index
    console.log('🔨 Creating unique index to prevent duplicate ACTIVE bots...');
    await collection.createIndex(
      { userId: 1, botId: 1, status: 1 },
      { 
        unique: true,
        partialFilterExpression: { status: 'ACTIVE' }, // Only ACTIVE bots must be unique
        name: uniqueIndexName
      }
    );
    console.log('✅ Unique index created successfully!\n');

    // Verify
    const newIndexes = await collection.indexes();
    console.log('📋 Updated indexes:');
    newIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      if (idx.unique) {
        console.log(`     → Unique: true`);
      }
      if (idx.partialFilterExpression) {
        console.log(`     → Partial filter: ${JSON.stringify(idx.partialFilterExpression)}`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Unique index created. Now:');
    console.log('1. Each user can only have 1 ACTIVE bot per botId');
    console.log('2. Duplicate ACTIVE bot creation will be rejected');
    console.log('3. STOPPED/ERROR bots are not affected by this constraint');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createUniqueIndex();
