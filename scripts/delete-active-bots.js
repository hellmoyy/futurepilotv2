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

async function deleteAllActiveBots() {
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

    // Delete all ACTIVE bots
    const result = await BotInstance.deleteMany({ 
      userId: user._id, 
      status: 'ACTIVE' 
    });

    console.log(`🗑️ Deleted ${result.deletedCount} active bot(s)\n`);

    // Verify
    const remaining = await BotInstance.countDocuments({ userId: user._id, status: 'ACTIVE' });
    console.log(`✅ Remaining active bots: ${remaining}`);
    
    if (remaining === 0) {
      console.log('\n🎉 Success! You can now start a new bot.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

deleteAllActiveBots();
