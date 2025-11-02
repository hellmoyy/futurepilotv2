const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: String,
  type: String,
  network: String,
  txHash: String,
  createdAt: Date
});

const Transaction = mongoose.models.transactions || mongoose.model('transactions', transactionSchema);

async function compareBlockchainVsDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Blockchain transactions (dari scan sebelumnya)
    const blockchainTxs = [
      { network: 'BEP20', amount: 125, txHash: '0x123f023230ded5b01636372043a3c390982aeb9d3d6ab30e2400e9d420bfc80d', date: '2025-11-02T04:57:36.000Z' },
      { network: 'BEP20', amount: 25, txHash: '0x74ec7a4109623874bffc4bb675dc3cfd85f56ca382580ffa92f15f5e0d37a33c', date: '2025-11-02T05:30:43.000Z' },
      { network: 'BEP20', amount: 35, txHash: '0x49cf4450ff1c2af17faba9d471c951ef1a4ec37df1302786345a577a9c5de295', date: '2025-11-02T05:50:33.000Z' },
      { network: 'BEP20', amount: 10, txHash: '0xe00da6c3202585534fd893adc42e9dd508749dd484aa76fe47b8aa1f9002e63c', date: '2025-11-02T06:17:13.000Z' },
      { network: 'ERC20', amount: 50, txHash: '0xc7fc10e51a1305cef4c370856a421cfd4f538108b114dcdf24ea50da381e1353', date: '2025-11-02T05:44:00.000Z' },
      { network: 'ERC20', amount: 15, txHash: '0x4529c3bbb171d6fa99e9fce2a3d3887727af096e1bca9dc56ab505310e3e7a8e', date: '2025-11-02T05:50:12.000Z' },
      { network: 'ERC20', amount: 60, txHash: '0xabd1772ccb2863fa2fe8ad8ab800669a4a8ee752a3b2fd4379d22872993255df', date: '2025-11-02T06:11:00.000Z' },
      { network: 'ERC20', amount: 100, txHash: '0x90b42fb6ff2cc272f0b7d2d008d8a1fac2ef9cb5a2eabeea84f9e98960b99f42', date: '2025-11-02T06:11:48.000Z' },
    ];
    
    console.log('⛓️  BLOCKCHAIN TRANSACTIONS (8 total):');
    console.log('━'.repeat(80));
    let blockchainTotal = 0;
    blockchainTxs.forEach((tx, index) => {
      console.log(`${index + 1}. [${tx.network}] $${tx.amount} - ${tx.txHash}`);
      blockchainTotal += tx.amount;
    });
    console.log(`Total: $${blockchainTotal}\n`);
    
    // Database transactions
    const dbTxs = await Transaction.find({
      type: 'deposit',
      status: 'confirmed'
    }).sort({ createdAt: 1 });
    
    console.log('💾 DATABASE TRANSACTIONS (${dbTxs.length} total):');
    console.log('━'.repeat(80));
    let dbTotal = 0;
    dbTxs.forEach((tx, index) => {
      console.log(`${index + 1}. $${tx.amount} - ${tx.txHash}`);
      dbTotal += tx.amount;
    });
    console.log(`Total: $${dbTotal}\n`);
    
    // Compare
    console.log('🔍 COMPARISON:');
    console.log('━'.repeat(80));
    
    const blockchainHashes = blockchainTxs.map(tx => tx.txHash.toLowerCase());
    const dbHashes = dbTxs.map(tx => tx.txHash?.toLowerCase()).filter(Boolean);
    
    // Find missing in database
    const missingInDb = blockchainTxs.filter(btx => 
      !dbHashes.includes(btx.txHash.toLowerCase())
    );
    
    // Find extra in database (manual credits)
    const manualCredits = dbTxs.filter(dtx => 
      dtx.txHash && dtx.txHash.includes('MANUAL_CREDIT')
    );
    
    if (missingInDb.length > 0) {
      console.log('\n❌ Missing in Database:');
      missingInDb.forEach(tx => {
        console.log(`   [${tx.network}] $${tx.amount} - ${tx.txHash}`);
      });
    }
    
    if (manualCredits.length > 0) {
      console.log('\n📝 Manual Credits (not on blockchain):');
      manualCredits.forEach(tx => {
        console.log(`   $${tx.amount} - ${tx.txHash}`);
      });
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Blockchain Total: $${blockchainTotal}`);
    console.log(`   Database Total: $${dbTotal}`);
    console.log(`   Difference: $${dbTotal - blockchainTotal}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

compareBlockchainVsDatabase();
