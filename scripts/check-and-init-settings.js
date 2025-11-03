require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  referralCommission: {
    bronze: {
      level1: { type: Number, default: 10 },
      level2: { type: Number, default: 5 },
      level3: { type: Number, default: 5 }
    },
    silver: {
      level1: { type: Number, default: 20 },
      level2: { type: Number, default: 5 },
      level3: { type: Number, default: 5 }
    },
    gold: {
      level1: { type: Number, default: 30 },
      level2: { type: Number, default: 5 },
      level3: { type: Number, default: 5 }
    },
    platinum: {
      level1: { type: Number, default: 40 },
      level2: { type: Number, default: 5 },
      level3: { type: Number, default: 5 }
    }
  },
  tradingCommission: {
    commissionRate: { type: Number, default: 20 }, // 20% dari profit
    minimumBalance: { type: Number, default: 10 } // Minimum $10 gas fee balance
  },
  tierCommissionRates: {
    bronze: {
      level1: { type: Number, default: 10 },
      level2: { type: Number, default: 5 },
      level3: { type: Number, default: 5 }
    },
    silver: {
      level1: { type: Number, default: 20 },
      level2: { type: Number, default: 5 },
      level3: { type: Number, default: 5 }
    },
    gold: {
      level1: { type: Number, default: 30 },
      level2: { type: Number, default: 5 },
      level3: { type: Number, default: 5 }
    },
    platinum: {
      level1: { type: Number, default: 40 },
      level2: { type: Number, default: 5 },
      level3: { type: Number, default: 5 }
    }
  }
}, { timestamps: true });

const Settings = mongoose.model('settings', settingsSchema);

async function checkAndInitSettings() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    console.log('🔍 Checking Settings collection...\n');

    let settings = await Settings.findOne();

    if (!settings) {
      console.log('❌ Settings document NOT FOUND!');
      console.log('📝 Creating default settings...\n');
      
      settings = await Settings.create({
        referralCommission: {
          bronze: { level1: 10, level2: 5, level3: 5 },
          silver: { level1: 20, level2: 5, level3: 5 },
          gold: { level1: 30, level2: 5, level3: 5 },
          platinum: { level1: 40, level2: 5, level3: 5 }
        },
        tradingCommission: {
          commissionRate: 20,
          minimumBalance: 10
        },
        tierCommissionRates: {
          bronze: { level1: 10, level2: 5, level3: 5 },
          silver: { level1: 20, level2: 5, level3: 5 },
          gold: { level1: 30, level2: 5, level3: 5 },
          platinum: { level1: 40, level2: 5, level3: 5 }
        }
      });

      console.log('✅ Settings created successfully!\n');
    } else {
      console.log('✅ Settings document found!\n');
    }

    // Display settings
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 CURRENT SETTINGS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🎖️ Referral Commission Rates (tierCommissionRates):');
    console.log('─────────────────────────────────────────────────────────────\n');
    
    if (settings.tierCommissionRates) {
      console.log('   Bronze Tier:');
      console.log(`   - Level 1: ${settings.tierCommissionRates.bronze?.level1 || 10}%`);
      console.log(`   - Level 2: ${settings.tierCommissionRates.bronze?.level2 || 5}%`);
      console.log(`   - Level 3: ${settings.tierCommissionRates.bronze?.level3 || 5}%`);
      console.log('');

      console.log('   Silver Tier:');
      console.log(`   - Level 1: ${settings.tierCommissionRates.silver?.level1 || 20}%`);
      console.log(`   - Level 2: ${settings.tierCommissionRates.silver?.level2 || 5}%`);
      console.log(`   - Level 3: ${settings.tierCommissionRates.silver?.level3 || 5}%`);
      console.log('');

      console.log('   Gold Tier:');
      console.log(`   - Level 1: ${settings.tierCommissionRates.gold?.level1 || 30}%`);
      console.log(`   - Level 2: ${settings.tierCommissionRates.gold?.level2 || 5}%`);
      console.log(`   - Level 3: ${settings.tierCommissionRates.gold?.level3 || 5}%`);
      console.log('');

      console.log('   Platinum Tier:');
      console.log(`   - Level 1: ${settings.tierCommissionRates.platinum?.level1 || 40}%`);
      console.log(`   - Level 2: ${settings.tierCommissionRates.platinum?.level2 || 5}%`);
      console.log(`   - Level 3: ${settings.tierCommissionRates.platinum?.level3 || 5}%`);
      console.log('');
    } else {
      console.log('   ❌ tierCommissionRates NOT FOUND!\n');
    }

    console.log('💰 Trading Commission Settings:');
    console.log('─────────────────────────────────────────────────────────────\n');
    
    if (settings.tradingCommission) {
      console.log(`   Commission Rate: ${settings.tradingCommission.commissionRate || 20}%`);
      console.log(`   Minimum Balance: $${settings.tradingCommission.minimumBalance || 10} USDT\n`);
    } else {
      console.log('   ❌ tradingCommission NOT FOUND!\n');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SETTINGS CHECK COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (settings.tierCommissionRates && settings.tierCommissionRates.bronze) {
      console.log('🎉 Settings are configured correctly!');
      console.log('📝 The referral commission system should work now.\n');
      console.log('🧪 TO TEST:');
      console.log('   1. Make a new deposit (user with referrer)');
      console.log('   2. Click "Check Deposit" button');
      console.log('   3. Run: node scripts/verify-referral-commission-fix.js');
      console.log('   4. You should see commission records!\n');
    } else {
      console.log('⚠️  Settings may need to be updated manually in /administrator/settings\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAndInitSettings();
