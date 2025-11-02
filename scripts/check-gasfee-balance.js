const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  gasFeeBalance: Number,
  walletData: {
    balance: Number,
  }
});

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);

async function checkGasFeeBalance() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'helmi.andito@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User: helmi.andito@gmail.com');
    console.log('━'.repeat(50));
    console.log(`gasFeeBalance: $${user.gasFeeBalance || 0}`);
    console.log(`walletData.balance: $${user.walletData?.balance || 0}`);
    console.log('━'.repeat(50));

    if (!user.gasFeeBalance || user.gasFeeBalance === 0) {
      console.log('\n⚠️  gasFeeBalance is 0 or undefined');
      console.log('💡 This is normal - gasFeeBalance is for gas fees, separate from trading balance');
      console.log('   walletData.balance ($420) is for trading/deposits');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

checkGasFeeBalance();
