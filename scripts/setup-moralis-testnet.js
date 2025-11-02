/**
 * Setup Moralis Stream for BSC Testnet
 * Run: node scripts/setup-moralis-testnet.js
 */

const Moralis = require('moralis').default;
require('dotenv').config();

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL + '/api/webhook/moralis';
const TESTNET_USDT_BEP20 = process.env.TESTNET_USDT_BEP20_CONTRACT;

// BSC Testnet Chain ID
const BSC_TESTNET_CHAIN_ID = '0x61'; // 97 in decimal

async function setupMoralisStream() {
  try {
    console.log('🚀 Starting Moralis Stream setup for BSC Testnet...\n');

    // Initialize Moralis
    if (!MORALIS_API_KEY) {
      throw new Error('MORALIS_API_KEY not found in .env');
    }

    await Moralis.start({
      apiKey: MORALIS_API_KEY,
    });

    console.log('✅ Moralis initialized\n');

    // Create Stream
    console.log('📡 Creating Moralis Stream...');
    console.log('   Network: BSC Testnet');
    console.log('   Chain ID:', BSC_TESTNET_CHAIN_ID);
    console.log('   Webhook URL:', WEBHOOK_URL);
    console.log('   USDT Contract:', TESTNET_USDT_BEP20);
    console.log('');

    const stream = await Moralis.Streams.add({
      chains: [BSC_TESTNET_CHAIN_ID],
      description: 'FuturePilot USDT Deposits (BSC Testnet)',
      tag: 'usdt_bsc_testnet',
      webhookUrl: WEBHOOK_URL,
      includeNativeTxs: false,
      includeContractLogs: true,
      includeInternalTxs: false,
      includeAllTxLogs: false,
      getNativeBalances: [],
      abi: [
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' }
          ],
          name: 'Transfer',
          type: 'event'
        }
      ],
      topic0: ['Transfer(address,address,uint256)'],
      advancedOptions: [
        {
          topic0: 'Transfer(address,address,uint256)',
          filter: {
            eq: ['contract_address', TESTNET_USDT_BEP20]
          },
          includeNativeTxs: false
        }
      ]
    });

    const streamData = stream.toJSON();
    const streamId = streamData.id;

    console.log('✅ Stream created successfully!');
    console.log('   Stream ID:', streamId);
    console.log('');

    // Save stream ID untuk reference
    console.log('💾 Save this Stream ID to your .env:');
    console.log(`   MORALIS_BSC_TESTNET_STREAM_ID=${streamId}`);
    console.log('');

    console.log('📋 Next steps:');
    console.log('   1. Add wallet addresses to monitor');
    console.log('   2. Test with a testnet USDT transfer');
    console.log('   3. Check webhook logs');
    console.log('');

    return streamId;

  } catch (error) {
    console.error('❌ Error setting up Moralis stream:', error);
    throw error;
  }
}

// Add wallet address to stream
async function addWalletToStream(streamId, walletAddress) {
  try {
    console.log(`\n📍 Adding wallet to stream...`);
    console.log(`   Stream ID: ${streamId}`);
    console.log(`   Wallet: ${walletAddress}`);

    await Moralis.Streams.addAddress({
      id: streamId,
      address: [walletAddress],
    });

    console.log('✅ Wallet added successfully!');

  } catch (error) {
    console.error('❌ Error adding wallet:', error);
    throw error;
  }
}

// List all streams
async function listStreams() {
  try {
    await Moralis.start({
      apiKey: MORALIS_API_KEY,
    });

    const streams = await Moralis.Streams.getAll({
      limit: 100,
    });

    const streamList = streams.toJSON();

    console.log(`\n📊 Found ${streamList.result.length} streams:\n`);

    streamList.result.forEach((stream, index) => {
      console.log(`${index + 1}. ${stream.tag || 'Unnamed'}`);
      console.log(`   ID: ${stream.id}`);
      console.log(`   Chains: ${stream.chains.join(', ')}`);
      console.log(`   Status: ${stream.status}`);
      console.log(`   Webhook: ${stream.webhookUrl}`);
      console.log('');
    });

    return streamList.result;

  } catch (error) {
    console.error('❌ Error listing streams:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'setup':
        await setupMoralisStream();
        break;

      case 'add-wallet':
        const streamId = args[1];
        const wallet = args[2];
        if (!streamId || !wallet) {
          console.error('Usage: node setup-moralis-testnet.js add-wallet <stream-id> <wallet-address>');
          process.exit(1);
        }
        await Moralis.start({ apiKey: MORALIS_API_KEY });
        await addWalletToStream(streamId, wallet);
        break;

      case 'list':
        await listStreams();
        break;

      default:
        console.log('📖 Moralis Stream Setup Script\n');
        console.log('Usage:');
        console.log('  node scripts/setup-moralis-testnet.js setup');
        console.log('  node scripts/setup-moralis-testnet.js list');
        console.log('  node scripts/setup-moralis-testnet.js add-wallet <stream-id> <wallet-address>');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/setup-moralis-testnet.js setup');
        console.log('  node scripts/setup-moralis-testnet.js list');
        console.log('  node scripts/setup-moralis-testnet.js add-wallet abc123 0x1234...');
        process.exit(0);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
