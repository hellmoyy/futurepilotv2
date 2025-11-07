/**
 * Force Delete ALL Patterns
 * 
 * Direct MongoDB deletion with verbose logging
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function forceDeleteAllPatterns() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    console.log(`   Database: ${process.env.MONGODB_URI.split('@')[1].split('?')[0]}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully\n');

    // Get the raw collection
    const db = mongoose.connection.db;
    const collection = db.collection('learningpatterns');
    
    // Count before
    const countBefore = await collection.countDocuments({});
    console.log(`📊 Patterns BEFORE deletion: ${countBefore}\n`);

    if (countBefore === 0) {
      console.log('✅ No patterns to delete');
      await mongoose.disconnect();
      return;
    }

    // Show sample documents
    const samples = await collection.find({}).limit(3).toArray();
    console.log('🔍 Sample patterns to be deleted:');
    samples.forEach((doc, i) => {
      console.log(`   ${i + 1}. ID: ${doc._id}`);
      console.log(`      User: ${doc.userId}`);
      console.log(`      Created: ${doc.createdAt}`);
    });
    console.log('');

    // Force delete with raw MongoDB driver
    console.log('🗑️  Force deleting ALL patterns using raw MongoDB driver...');
    const deleteResult = await collection.deleteMany({});
    
    console.log(`✅ Delete result:`);
    console.log(`   Acknowledged: ${deleteResult.acknowledged}`);
    console.log(`   Deleted count: ${deleteResult.deletedCount}\n`);

    // Count after
    const countAfter = await collection.countDocuments({});
    console.log(`📊 Patterns AFTER deletion: ${countAfter}\n`);

    if (countAfter === 0) {
      console.log('✅ SUCCESS! All patterns deleted!\n');
    } else {
      console.log(`⚠️  WARNING! ${countAfter} patterns still remain!\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

forceDeleteAllPatterns();
