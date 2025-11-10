require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const botInstanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  botId: Number,
  botName: String,
  symbol: String,
  status: String,
  config: Object,
  exchangeConnectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeConnection' },
  startedAt: Date,
  stoppedAt: Date,
  statistics: Object,
}, { collection: 'botinstances', timestamps: true });

const BotInstance = mongoose.model('BotInstance', botInstanceSchema);

async function checkActiveBots() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const userEmail = 'helmi.andito@gmail.com';
    const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'futurepilotcols' }));
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log(`👤 User: ${userEmail} (ID: ${user._id})\n`);

    // Check all bot instances for this user
    const allBots = await BotInstance.find({ userId: user._id }).sort({ createdAt: -1 });
    console.log(`📊 Total Bot Instances: ${allBots.length}\n`);

    if (allBots.length === 0) {
      console.log('✅ No bot instances found (clean state)');
      return;
    }

    // Group by status
    const activeBots = allBots.filter(b => b.status === 'ACTIVE');
    const stoppedBots = allBots.filter(b => b.status === 'STOPPED');
    const errorBots = allBots.filter(b => b.status === 'ERROR');

    console.log('📋 Bot Instances Breakdown:');
    console.log(`   ACTIVE: ${activeBots.length}`);
    console.log(`   STOPPED: ${stoppedBots.length}`);
    console.log(`   ERROR: ${errorBots.length}\n`);

    // Show ACTIVE bots (these block new bot starts)
    if (activeBots.length > 0) {
      console.log('⚠️ ACTIVE BOTS (blocking new starts):');
      activeBots.forEach((bot, i) => {
        console.log(`   ${i + 1}. Bot ID: ${bot.botId}, Name: ${bot.botName}`);
        console.log(`      Instance ID: ${bot._id}`);
        console.log(`      Symbol: ${bot.symbol}`);
        console.log(`      Status: ${bot.status}`);
        console.log(`      Started: ${bot.startedAt}`);
        console.log(`      Exchange: ${bot.exchangeConnectionId}`);
        console.log('');
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛠️ SOLUTION:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('You need to STOP these bots before starting new ones.\n');
      console.log('Option 1: Use Stop Bot button in UI');
      console.log('Option 2: Delete them manually:');
      activeBots.forEach(bot => {
        console.log(`   db.botinstances.deleteOne({ _id: ObjectId("${bot._id}") })`);
      });
      console.log('\nOr delete ALL active bots:');
      console.log(`   db.botinstances.deleteMany({ userId: ObjectId("${user._id}"), status: "ACTIVE" })`);
    } else {
      console.log('✅ No active bots - you can start new bots now!');
    }

    // Show recent STOPPED bots
    if (stoppedBots.length > 0) {
      console.log('\n📜 Recent STOPPED Bots (last 5):');
      stoppedBots.slice(0, 5).forEach((bot, i) => {
        console.log(`   ${i + 1}. Bot ID: ${bot.botId}, Stopped: ${bot.stoppedAt || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkActiveBots();
