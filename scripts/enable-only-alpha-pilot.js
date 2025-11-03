/**
 * Enable Only Alpha Pilot Bot
 * This script sets all bots to inactive except Alpha Pilot
 * Usage: node scripts/enable-only-alpha-pilot.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const TradingBotConfigSchema = new mongoose.Schema({
  botId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { strict: false });

const TradingBotConfig = mongoose.models.TradingBotConfig || mongoose.model('TradingBotConfig', TradingBotConfigSchema);

async function enableOnlyAlphaPilot() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // First, set all bots to inactive
    console.log('🔄 Setting all bots to inactive...');
    const deactivateResult = await TradingBotConfig.updateMany(
      {},
      { $set: { isActive: false } }
    );
    console.log(`✅ Deactivated ${deactivateResult.modifiedCount} bots\n`);

    // Then, activate only Alpha Pilot
    console.log('🚀 Activating Alpha Pilot...');
    const activateResult = await TradingBotConfig.updateOne(
      { name: 'Alpha Pilot' },
      { $set: { isActive: true } }
    );

    if (activateResult.matchedCount === 0) {
      console.log('⚠️  Alpha Pilot bot not found in database!');
      console.log('   Run: node scripts/seed-trading-bots.js first');
    } else {
      console.log(`✅ Alpha Pilot activated (${activateResult.modifiedCount} updated)\n`);
    }

    // Show current status
    console.log('📊 Current Bot Status:');
    const bots = await TradingBotConfig.find({}).sort({ botId: 1 });
    
    if (bots.length === 0) {
      console.log('❌ No bots found in database!');
      console.log('💡 Run: node scripts/seed-trading-bots.js to create default bots\n');
    } else {
      console.log('─'.repeat(60));
      bots.forEach(bot => {
        const status = bot.isActive ? '🟢 ACTIVE' : '⚪ INACTIVE';
        console.log(`${status} | Bot ${bot.botId}: ${bot.name}`);
      });
      console.log('─'.repeat(60));
      
      const activeCount = bots.filter(b => b.isActive).length;
      console.log(`\n✅ Total Active: ${activeCount}/${bots.length}`);
    }

    console.log('\n✅ Done! Refresh http://localhost:3000/automation to see changes.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

enableOnlyAlphaPilot();
