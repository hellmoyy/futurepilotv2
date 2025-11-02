import Moralis from 'moralis';

/**
 * Moralis Helper Functions
 * Utility functions untuk manage Moralis Streams
 */

let isMoralisInitialized = false;

/**
 * Initialize Moralis SDK
 */
export async function initializeMoralis() {
  if (isMoralisInitialized) {
    return;
  }

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new Error('MORALIS_API_KEY is not set');
  }

  try {
    await Moralis.start({
      apiKey,
    });
    isMoralisInitialized = true;
    console.log('✅ Moralis initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Moralis:', error);
    throw error;
  }
}

/**
 * Create a Moralis Stream for monitoring USDT deposits
 * 
 * @param walletAddress - The wallet address to monitor
 * @param network - 'ethereum' or 'bsc'
 * @param webhookUrl - Your webhook endpoint URL
 */
export async function createMoralisStream(
  walletAddress: string,
  network: 'ethereum' | 'bsc',
  webhookUrl: string
) {
  await initializeMoralis();

  const chainId = network === 'ethereum' ? '0x1' : '0x38'; // Mainnet chain IDs
  const usdtContract = network === 'ethereum' 
    ? process.env.USDT_ERC20_CONTRACT 
    : process.env.USDT_BEP20_CONTRACT;

  try {
    const stream = await Moralis.Streams.add({
      chains: [chainId],
      description: `USDT Deposits for ${walletAddress}`,
      tag: `usdt_${network}_${walletAddress.slice(0, 10)}`,
      webhookUrl,
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
            and: [
              { eq: ['to', walletAddress] },
              { eq: ['contract_address', usdtContract] }
            ]
          },
          includeNativeTxs: false
        }
      ]
    });

    const streamId = stream.toJSON().id;

    console.log('✅ Moralis stream created:', {
      id: streamId,
      network,
      wallet: walletAddress,
    });

    // Add address to stream
    await Moralis.Streams.addAddress({
      id: streamId,
      address: [walletAddress],
    });

    return stream;
  } catch (error) {
    console.error('❌ Failed to create Moralis stream:', error);
    throw error;
  }
}

/**
 * Get all existing Moralis streams
 */
export async function getMoralisStreams() {
  await initializeMoralis();

  try {
    const streams = await Moralis.Streams.getAll({
      limit: 100,
    });

    return streams;
  } catch (error) {
    console.error('❌ Failed to get Moralis streams:', error);
    throw error;
  }
}

/**
 * Delete a Moralis stream
 */
export async function deleteMoralisStream(streamId: string) {
  await initializeMoralis();

  try {
    await Moralis.Streams.delete({
      id: streamId,
    });

    console.log('✅ Moralis stream deleted:', streamId);
  } catch (error) {
    console.error('❌ Failed to delete Moralis stream:', error);
    throw error;
  }
}

/**
 * Add wallet address to existing stream
 */
export async function addAddressToStream(streamId: string, address: string) {
  await initializeMoralis();

  try {
    await Moralis.Streams.addAddress({
      id: streamId,
      address: [address],
    });

    console.log('✅ Address added to stream:', {
      streamId,
      address,
    });
  } catch (error) {
    console.error('❌ Failed to add address to stream:', error);
    throw error;
  }
}

/**
 * Get stream status and info
 */
export async function getStreamInfo(streamId: string) {
  await initializeMoralis();

  try {
    const stream = await Moralis.Streams.getById({
      id: streamId,
    });

    return stream;
  } catch (error) {
    console.error('❌ Failed to get stream info:', error);
    throw error;
  }
}
