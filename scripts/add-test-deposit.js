/**
 * Script to add test deposit for current logged-in user
 * This will create a test deposit transaction to verify membership progress display
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// Define schemas
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

// Get email from command line argument
const testEmail = process.argv[2] || 'helmi.andito@gmail.com';
const depositAmount = parseFloat(process.argv[3]) || 500; // Default $500

function calculateTier(totalDeposit) {
  if (totalDeposit >= 10000) return 'platinum';
  if (totalDeposit >= 2000) return 'gold';
  if (totalDeposit >= 1000) return 'silver';
  return 'bronze';
}

async function addTestDeposit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.error(`❌ User not found: ${testEmail}`);
      process.exit(1);
    }

    console.log(`👤 User: ${user.email}`);
    console.log(`   Current: $${(user.totalPersonalDeposit || 0).toFixed(2)} (${user.membershipLevel})`);

    // Create test deposit transaction
    const transaction = new Transaction({
      userId: user._id,
      type: 'deposit',
      amount: depositAmount,
      status: 'confirmed',
      source: 'ERC20',
      transactionHash: `TEST_DEPOSIT_${Date.now()}`,
      createdAt: new Date(),
    });

    await transaction.save();
    console.log(`\n✅ Created test deposit: $${depositAmount.toFixed(2)}`);

    // Calculate new total
    const deposits = await Transaction.find({
      userId: user._id,
      type: 'deposit',
      status: 'confirmed',
    });

    const newTotal = deposits.reduce((sum, tx) => sum + tx.amount, 0);
    const newTier = calculateTier(newTotal);

    // Update user
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          totalPersonalDeposit: newTotal,
          membershipLevel: newTier
        } 
      }
    );

    console.log(`\n✅ Updated user:`);
    console.log(`   New Total: $${newTotal.toFixed(2)}`);
    console.log(`   New Tier: ${newTier}`);
    console.log(`   Total Deposits: ${deposits.length} transactions`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test deposit added successfully!');
    console.log('🔄 Refresh your referral page to see the progress update');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Show usage if no arguments
if (process.argv.length < 3) {
  console.log('\n📖 Usage:');
  console.log('   node scripts/add-test-deposit.js <email> <amount>');
  console.log('\n📝 Examples:');
  console.log('   node scripts/add-test-deposit.js helmi.andito@gmail.com 500');
  console.log('   node scripts/add-test-deposit.js test@test.com 1500');
  console.log('   node scripts/add-test-deposit.js user@example.com 5000');
  console.log('\n💡 Tier thresholds:');
  console.log('   Bronze:   $0 - $999');
  console.log('   Silver:   $1,000 - $1,999');
  console.log('   Gold:     $2,000 - $9,999');
  console.log('   Platinum: $10,000+\n');
}

// Run the script
addTestDeposit();
