require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Define User Schema
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  isBanned: { type: Boolean, default: false },
  bannedAt: Date,
  banReason: String,
}, { 
  strict: false,
  timestamps: true 
});

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema, 'futurepilotcol');

async function addIsBannedField() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name).join(', '));
    console.log('');

    // Find all users - use direct collection access
    const userCount = await mongoose.connection.db.collection('futurepilotcols').countDocuments();
    console.log(`📊 Found ${userCount} users in futurepilotcols collection\n`);

    // Update all users to add isBanned: false by default
    console.log('🔧 Adding isBanned field to all users...');
    
    const result = await mongoose.connection.db.collection('futurepilotcols').updateMany(
      { 
        $or: [
          { isBanned: { $exists: false } },
          { isBanned: null }
        ]
      },
      { 
        $set: { 
          isBanned: false
        } 
      }
    );

    console.log(`✅ Matched ${result.matchedCount} users`);
    console.log(`✅ Modified ${result.modifiedCount} users`);

    // Verify
    console.log('\n🔍 Verifying...');
    const samples = await mongoose.connection.db.collection('futurepilotcols')
      .find({})
      .limit(5)
      .toArray();
    
    console.log('\n📋 Sample users:');
    samples.forEach(u => {
      console.log(`  - ${u.email}: isBanned=${u.isBanned}, bannedAt=${u.bannedAt || 'null'}`);
    });

    // Count users with and without ban field
    const withBanField = await mongoose.connection.db.collection('futurepilotcols')
      .countDocuments({ isBanned: { $exists: true } });
    const withoutBanField = await mongoose.connection.db.collection('futurepilotcols')
      .countDocuments({ isBanned: { $exists: false } });

    console.log(`\n✅ Users with isBanned field: ${withBanField}`);
    console.log(`⚠️  Users without isBanned field: ${withoutBanField}`);

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

addIsBannedField();
