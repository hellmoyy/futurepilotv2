#!/usr/bin/env node

/**
 * 🗑️ Delete Test BotSettings
 * 
 * Deletes botsettings for test/demo users only.
 * 
 * Usage:
 *   node scripts/delete-test-botsettings.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function deleteTestBotSettings() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🗑️  DELETE TEST BOTSETTINGS');
    console.log('━'.repeat(80));
    console.log('');

    // Get botsettings
    const botSettings = await db.collection('botsettings').findOne({});
    
    if (!botSettings) {
      console.log('✅ No botsettings found - collection is already clean!');
      return;
    }

    console.log('📋 BotSettings to delete:');
    console.log(`   User ID: ${botSettings.userId}`);
    console.log('');

    // Get user info
    const user = await db.collection('futurepilotcols').findOne({
      _id: new mongoose.Types.ObjectId(botSettings.userId)
    });

    if (user) {
      console.log('👤 User: ' + user.email);
      console.log('');
    }

    console.log('⚠️  WARNING: This will permanently delete botsettings!');
    console.log('⏳ Deleting in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const result = await db.collection('botsettings').deleteMany({
      userId: botSettings.userId
    });

    console.log(`✅ Deleted ${result.deletedCount} botsettings`);
    console.log('');
    console.log('━'.repeat(80));

    // Verify deletion
    const remaining = await db.collection('botsettings').countDocuments();
    console.log(`\n✅ Verification: ${remaining} botsettings remaining`);

  } catch (error) {
    console.error('❌ Error during deletion:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  deleteTestBotSettings()
    .then(() => {
      console.log('\n✅ Deletion completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Deletion failed:', error);
      process.exit(1);
    });
}

module.exports = { deleteTestBotSettings };
