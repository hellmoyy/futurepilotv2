require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  walletData: {
    balance: Number,
    mainnetBalance: Number,
  }
});

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('email walletData.balance walletData.mainnetBalance');
    
    console.log(`📊 Total Users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      const testnetBalance = user.walletData?.balance || 0;
      const mainnetBalance = user.walletData?.mainnetBalance || 0;
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Testnet Balance: $${testnetBalance}`);
      console.log(`   Mainnet Balance: $${mainnetBalance}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
