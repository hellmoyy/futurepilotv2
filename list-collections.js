require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function listCollections() {
  console.log('🔍 Listing All Collections in Database\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log(`📡 Connecting to: ${mongoUri.split('@')[1]?.split('?')[0]}\n`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📋 Total Collections: ${collections.length}\n`);
    console.log('=' .repeat(80));
    
    for (const collection of collections) {
      console.log(`\n📦 Collection: ${collection.name}`);
      
      // Count documents in each collection
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   Documents: ${count}`);
      
      if (count > 0) {
        // Show sample document
        const sample = await db.collection(collection.name).findOne();
        console.log(`   Sample keys: ${Object.keys(sample).join(', ')}`);
        
        // If it looks like a user collection, show emails
        if (sample.email) {
          const users = await db.collection(collection.name).find({}).limit(5).toArray();
          console.log(`   \n   📧 Emails in this collection:`);
          users.forEach(u => {
            console.log(`      - ${u.email}${u.walletData ? ' (has wallet)' : ' (no wallet)'}`);
          });
        }
      }
      console.log('   ' + '-'.repeat(76));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

listCollections();
