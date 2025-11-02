const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { ethers } = require('ethers');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  walletData: {
    balance: Number,
    mainnetBalance: Number,
    erc20Address: String,
    bep20Address: String,
  }
});

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: String,
  type: String,
  createdAt: Date
});

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
const Transaction = mongoose.models.transactions || mongoose.model('transactions', transactionSchema);

async function checkBalanceDiscrepancy() {
  try {
    console.log('🔍 Checking balance discrepancy...\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const networkMode = process.env.NETWORK_MODE || 'testnet';
    console.log(`📡 Network Mode: ${networkMode}\n`);

    // Get helmi.andito@gmail.com user
    const user = await User.findOne({ email: 'helmi.andito@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User Info:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Database Balance (testnet): $${user.walletData?.balance || 0}`);
    console.log(`   Database Balance (mainnet): $${user.walletData?.mainnetBalance || 0}`);
    console.log(`   ERC20 Address: ${user.walletData?.erc20Address}`);
    console.log(`   BEP20 Address: ${user.walletData?.bep20Address}\n`);

    // Get all confirmed deposit transactions
    const transactions = await Transaction.find({
      userId: user._id,
      type: 'deposit',
      status: 'confirmed'
    }).sort({ createdAt: 1 });

    console.log(`📊 Confirmed Deposit Transactions (${transactions.length} total):`);
    let totalFromTransactions = 0;
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. $${tx.amount} - ${tx.createdAt.toISOString()}`);
      totalFromTransactions += tx.amount;
    });
    console.log(`   Total from transactions: $${totalFromTransactions}\n`);

    // Scan blockchain balances
    console.log('⛓️  Scanning Blockchain Balances...\n');

    let ethProvider, bscProvider, ethUsdtContract, bscUsdtContract;
    let ethUsdtAddress, bscUsdtAddress, ethDecimals, bscDecimals;

    if (networkMode === 'mainnet') {
      ethProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      bscProvider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
      ethUsdtAddress = process.env.USDT_ERC20_CONTRACT;
      bscUsdtAddress = process.env.USDT_BEP20_CONTRACT;
      ethDecimals = parseInt(process.env.USDT_ERC20_DECIMAL || '6');
      bscDecimals = parseInt(process.env.USDT_BEP20_DECIMAL || '18');
    } else {
      ethProvider = new ethers.JsonRpcProvider(process.env.TESTNET_ETHEREUM_RPC_URL);
      bscProvider = new ethers.JsonRpcProvider(process.env.TESTNET_BSC_RPC_URL);
      ethUsdtAddress = process.env.TESTNET_USDT_ERC20_CONTRACT;
      bscUsdtAddress = process.env.TESTNET_USDT_BEP20_CONTRACT;
      ethDecimals = parseInt(process.env.TESTNET_USDT_ERC20_DECIMAL || '18');
      bscDecimals = parseInt(process.env.TESTNET_USDT_BEP20_DECIMAL || '18');
    }

    console.log(`🔧 Contract Configuration (${networkMode}):`);
    console.log(`   ETH RPC: ${networkMode === 'mainnet' ? process.env.ETHEREUM_RPC_URL : process.env.TESTNET_ETHEREUM_RPC_URL}`);
    console.log(`   BSC RPC: ${networkMode === 'mainnet' ? process.env.BSC_RPC_URL : process.env.TESTNET_BSC_RPC_URL}`);
    console.log(`   ETH USDT: ${ethUsdtAddress} (decimals: ${ethDecimals})`);
    console.log(`   BSC USDT: ${bscUsdtAddress} (decimals: ${bscDecimals})\n`);

    const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
    ethUsdtContract = new ethers.Contract(ethUsdtAddress, erc20Abi, ethProvider);
    bscUsdtContract = new ethers.Contract(bscUsdtAddress, erc20Abi, bscProvider);

    // Get ERC20 balance
    let erc20Balance = 0;
    if (user.walletData?.erc20Address) {
      try {
        const balance = await ethUsdtContract.balanceOf(user.walletData.erc20Address);
        erc20Balance = parseFloat(ethers.formatUnits(balance, ethDecimals));
        console.log(`   ERC20 (Ethereum): $${erc20Balance}`);
      } catch (error) {
        console.error(`   ❌ ERC20 Error:`, error.message);
      }
    }

    // Get BEP20 balance
    let bep20Balance = 0;
    if (user.walletData?.bep20Address) {
      try {
        const balance = await bscUsdtContract.balanceOf(user.walletData.bep20Address);
        bep20Balance = parseFloat(ethers.formatUnits(balance, bscDecimals));
        console.log(`   BEP20 (BSC): $${bep20Balance}`);
      } catch (error) {
        console.error(`   ❌ BEP20 Error:`, error.message);
      }
    }

    const blockchainTotal = erc20Balance + bep20Balance;
    console.log(`   Total from Blockchain: $${blockchainTotal}\n`);

    // Summary
    console.log('📝 SUMMARY:');
    console.log('━'.repeat(50));
    console.log(`Database Balance:     $${user.walletData?.balance || 0}`);
    console.log(`Transaction Total:    $${totalFromTransactions}`);
    console.log(`Blockchain Total:     $${blockchainTotal}`);
    console.log('━'.repeat(50));
    
    const dbVsTransaction = (user.walletData?.balance || 0) - totalFromTransactions;
    const dbVsBlockchain = (user.walletData?.balance || 0) - blockchainTotal;
    const transactionVsBlockchain = totalFromTransactions - blockchainTotal;

    console.log(`\n💡 Differences:`);
    console.log(`   Database vs Transactions: $${dbVsTransaction.toFixed(2)}`);
    console.log(`   Database vs Blockchain:   $${dbVsBlockchain.toFixed(2)}`);
    console.log(`   Transactions vs Blockchain: $${transactionVsBlockchain.toFixed(2)}`);

    if (Math.abs(transactionVsBlockchain) > 0.01) {
      console.log('\n⚠️  DISCREPANCY DETECTED!');
      if (blockchainTotal > totalFromTransactions) {
        console.log(`   📈 Blockchain has $${(blockchainTotal - totalFromTransactions).toFixed(2)} MORE than transactions`);
        console.log('   Possible causes:');
        console.log('   1. User deposited directly to wallet (bypassing deposit detection)');
        console.log('   2. Missing transaction records in database');
        console.log('   3. Deposit detection system missed some deposits');
      } else {
        console.log(`   📉 Database has $${(totalFromTransactions - blockchainTotal).toFixed(2)} MORE than blockchain`);
        console.log('   Possible causes:');
        console.log('   1. User withdrew funds (not tracked)');
        console.log('   2. Funds swept to master wallet');
        console.log('   3. Transaction records incorrect');
      }
    } else {
      console.log('\n✅ All balances match!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkBalanceDiscrepancy();
