/**
 * Update Transaction Types
 * Adds type='deposit' to all existing transactions in database
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function updateTransactionTypes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Transaction model
    const Transaction = mongoose.connection.collection('transactions');

    // Count transactions without type
    const missingTypeCount = await Transaction.countDocuments({ type: { $exists: false } });
    console.log(`\n📊 Found ${missingTypeCount} transactions without type field`);

    if (missingTypeCount === 0) {
      console.log('✅ All transactions already have type field');
      process.exit(0);
    }

    // Update all transactions without type to 'deposit'
    const result = await Transaction.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'deposit' } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} transactions`);
    console.log('   - Set type = "deposit" for all existing transactions');

    // Verify update
    const verifyCount = await Transaction.countDocuments({ type: 'deposit' });
    console.log(`\n✅ Verification: ${verifyCount} transactions now have type='deposit'`);

    console.log('\n🎉 Transaction types updated successfully!');

  } catch (error) {
    console.error('❌ Error updating transaction types:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the update
updateTransactionTypes();
