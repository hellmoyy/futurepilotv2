/**
 * Fix Pending Gas Fee Commissions
 * 
 * Purpose: Update all pending gas_fee_topup commissions to 'paid' status
 * These should have been auto-paid when created but were set to 'pending' due to a bug
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const referralCommissionSchema = new mongoose.Schema({}, { strict: false, collection: 'referralcommissions' });
const ReferralCommission = mongoose.models.referralcommissions || mongoose.model('referralcommissions', referralCommissionSchema);

async function fixPendingGasFeeCommissions() {
  try {
    console.log('🔧 Fixing Pending Gas Fee Commissions...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all pending gas_fee_topup commissions
    const pendingCommissions = await ReferralCommission.find({
      source: 'gas_fee_topup',
      status: 'pending',
    }).lean();

    console.log(`📊 Found ${pendingCommissions.length} pending gas_fee_topup commissions\n`);

    if (pendingCommissions.length === 0) {
      console.log('✅ No pending commissions to fix!');
      await mongoose.disconnect();
      return;
    }

    // Show commissions that will be updated
    console.log('Commissions to be updated:');
    console.log('=' .repeat(80));
    let totalAmount = 0;
    pendingCommissions.forEach((commission, index) => {
      console.log(`${index + 1}. Amount: $${commission.amount.toFixed(2)} | Level: ${commission.referralLevel} | Date: ${new Date(commission.createdAt).toLocaleDateString()}`);
      totalAmount += commission.amount;
    });
    console.log('=' .repeat(80));
    console.log(`Total Commission Amount: $${totalAmount.toFixed(2)}\n`);

    // Ask for confirmation (in production, remove this or use --force flag)
    console.log('⚠️  WARNING: This will update all the above commissions to "paid" status.');
    console.log('Continuing in 3 seconds...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update all to 'paid'
    const result = await ReferralCommission.updateMany(
      {
        source: 'gas_fee_topup',
        status: 'pending',
      },
      {
        $set: {
          status: 'paid',
          paidAt: new Date(),
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} commissions to "paid" status\n`);

    // Also fix NULL status records (if any)
    const nullStatusCount = await ReferralCommission.countDocuments({ status: null });
    
    if (nullStatusCount > 0) {
      console.log(`⚠️  Found ${nullStatusCount} records with NULL status!`);
      console.log('Fixing NULL status records...\n');

      const nullResult = await ReferralCommission.updateMany(
        { status: null },
        {
          $set: {
            status: 'paid',
            paidAt: new Date(),
          }
        }
      );

      console.log(`✅ Fixed ${nullResult.modifiedCount} NULL status records\n`);
    }

    // Fix NULL referralLevel records (if any)
    const nullLevelCount = await ReferralCommission.countDocuments({ referralLevel: null });
    
    if (nullLevelCount > 0) {
      console.log(`⚠️  Found ${nullLevelCount} records with NULL referralLevel!`);
      console.log('⚠️  These records need manual review - cannot auto-fix referralLevel\n');
    }

    // Verify fix
    const remainingPending = await ReferralCommission.countDocuments({
      source: 'gas_fee_topup',
      status: 'pending',
    });

    console.log('Verification:');
    console.log('=' .repeat(80));
    console.log(`Remaining pending gas_fee_topup commissions: ${remainingPending}`);
    
    const paidCount = await ReferralCommission.countDocuments({
      source: 'gas_fee_topup',
      status: 'paid',
    });
    console.log(`Total paid gas_fee_topup commissions: ${paidCount}`);
    console.log('=' .repeat(80));
    console.log();

    if (remainingPending === 0) {
      console.log('🎉 All gas_fee_topup commissions are now "paid"!\n');
    } else {
      console.log('⚠️  Some commissions are still pending. Please check manually.\n');
    }

    console.log('✅ Fix Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixPendingGasFeeCommissions();
