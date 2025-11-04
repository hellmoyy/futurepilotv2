/**
 * Script to sync totalPersonalDeposit from Transaction records
 * This ensures all users have correct totalPersonalDeposit value
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// Define schemas inline to avoid model conflicts
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  totalPersonalDeposit: { type: Number, default: 0 },
  membershipLevel: { type: String, default: 'bronze' },
  walletData: {
    balance: { type: Number, default: 0 },
    mainnetBalance: { type: Number, default: 0 },
  }
}, { collection: 'futurepilotcols' });

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  status: String,
  source: String,
  transactionHash: String,
  createdAt: Date,
}, { collection: 'transactions' });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

// Determine tier based on total deposit
function calculateTier(totalDeposit) {
  if (totalDeposit >= 10000) return 'platinum';
  if (totalDeposit >= 2000) return 'gold';
  if (totalDeposit >= 1000) return 'silver';
  return 'bronze';
}

async function syncTotalPersonalDeposit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('email name totalPersonalDeposit membershipLevel');
    console.log(`\n📊 Found ${users.length} users\n`);

    let updatedCount = 0;
    let tierChangedCount = 0;

    for (const user of users) {
      // Calculate total deposits from transactions (including undefined type)
      const deposits = await Transaction.find({
        userId: user._id,
        $or: [
          { type: 'deposit', status: 'confirmed' },
          { type: { $in: [null, undefined] }, status: 'confirmed' } // Include old transactions without type
        ]
      });

      const totalDeposit = deposits.reduce((sum, tx) => sum + tx.amount, 0);
      const currentTotal = user.totalPersonalDeposit || 0;
      const newTier = calculateTier(totalDeposit);
      const tierChanged = user.membershipLevel !== newTier;

      // Update if different
      if (currentTotal !== totalDeposit || tierChanged) {
        await User.updateOne(
          { _id: user._id },
          { 
            $set: { 
              totalPersonalDeposit: totalDeposit,
              membershipLevel: newTier
            } 
          }
        );

        console.log(`✅ Updated: ${user.email}`);
        console.log(`   Old: $${currentTotal.toFixed(2)} (${user.membershipLevel})`);
        console.log(`   New: $${totalDeposit.toFixed(2)} (${newTier})`);
        console.log(`   Deposits: ${deposits.length} transactions\n`);

        updatedCount++;
        if (tierChanged) tierChangedCount++;
      } else {
        console.log(`✓ Already synced: ${user.email} - $${totalDeposit.toFixed(2)} (${user.membershipLevel})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Sync completed!`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Tier changes: ${tierChangedCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
syncTotalPersonalDeposit();
