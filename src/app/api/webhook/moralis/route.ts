import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { processMoralisWebhookPayload } from '@/lib/webhookProcessors/moralis';
import { WebhookRetryManager } from '@/lib/webhookRetry';
import { Web3 } from 'web3';

/**
 * Moralis Webhook Handler
 * Receives real-time notifications when USDT transfers occur
 * 
 * Moralis will POST to this endpoint when:
 * - User receives USDT on their ERC-20 address
 * - User receives USDT on their BEP-20 address
 * 
 * ✅ Security: Webhook signature verification enabled (Keccak-256)
 * ✅ Reliability: Automatic retry with exponential backoff
 */

// Initialize Web3 for signature verification
const web3 = new Web3();

// Cache for Moralis secret key (avoid fetching on every request)
let cachedSecretKey: string | null = null;

/**
 * Fetch Moralis account secret key from API
 * This secret is used to verify webhook signatures
 * Cached to avoid repeated API calls
 */
async function getMoralisSecretKey(): Promise<string> {
  if (cachedSecretKey) {
    return cachedSecretKey;
  }

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new Error('MORALIS_API_KEY not configured');
  }

  try {
    console.log('🔑 Fetching Moralis secret key from API...');
    const response = await fetch('https://api.moralis-streams.com/settings', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Moralis secret: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    cachedSecretKey = data.secretKey;
    console.log('✅ Moralis secret key cached');
    return cachedSecretKey as string;
  } catch (error) {
    console.error('❌ Error fetching Moralis secret:', error);
    throw error;
  }
}

/**
 * ✅ WEBHOOK SIGNATURE VERIFICATION (Moralis Official Method)
 * 
 * Algorithm: Keccak-256 (web3.utils.sha3)
 * Formula: sha3(JSON.stringify(body) + secret)
 * 
 * Docs: https://docs.moralis.com/streams-api/evm/webhook-security
 */
async function verifyMoralisSignature(
  payload: string, 
  signature: string | null
): Promise<boolean> {
  if (!signature) {
    console.warn('⚠️ No signature provided in webhook');
    return false;
  }

  try {
    // Get the secret key from Moralis API
    const secret = await getMoralisSecretKey();

    // Generate signature using Keccak-256
    // Formula: web3.utils.sha3(JSON.stringify(body) + secret)
    const generatedSignature = web3.utils.sha3(payload + secret);

    console.log('🔐 Signature verification:', {
      provided: signature.substring(0, 20) + '...',
      generated: generatedSignature?.substring(0, 20) + '...',
      match: generatedSignature === signature,
    });

    return generatedSignature === signature;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

interface MoralisERC20Transfer {
  transactionHash: string;
  contract: string; // USDT contract address
  from: string;
  to: string; // User's wallet address
  value: string; // Amount in smallest unit (6 decimals for USDT)
  tokenName: string;
  tokenSymbol: string;
  valueWithDecimals: string;
}

interface MoralisWebhookPayload {
  confirmed: boolean;
  chainId: string; // "0x1" for Ethereum, "0x38" for BSC
  abi: any[];
  streamId: string;
  tag: string;
  retries: number;
  block: {
    number: string;
    hash: string;
    timestamp: string;
  };
  logs: any[];
  txs: any[];
  erc20Transfers: MoralisERC20Transfer[];
}

// USDT Contract Addresses (support both mainnet and testnet)
const USDT_CONTRACTS = {
  // Mainnet
  ETHEREUM_MAINNET: process.env.USDT_ERC20_CONTRACT?.toLowerCase() || '0xdac17f958d2ee523a2206206994597c13d831ec7',
  BSC_MAINNET: process.env.USDT_BEP20_CONTRACT?.toLowerCase() || '0x55d398326f99059ff775485246999027b3197955',
  // Testnet
  ETHEREUM_TESTNET: process.env.TESTNET_USDT_ERC20_CONTRACT?.toLowerCase() || '0x46484aee842a735fbf4c05af7e371792cf52b498',
  BSC_TESTNET: process.env.TESTNET_USDT_BEP20_CONTRACT?.toLowerCase() || '0x46484aee842a735fbf4c05af7e371792cf52b498',
};

// Chain ID mapping
const CHAIN_NETWORKS = {
  '0x1': 'ERC20', // Ethereum Mainnet
  '0x38': 'BEP20', // BSC Mainnet
  '0xaa36a7': 'ERC20', // Sepolia Testnet
  '0x61': 'BEP20', // BSC Testnet
} as const;

export async function POST(request: NextRequest) {
  let rawBody = '';
  let payload: any = null;
  
  try {
    console.log('🔔 Moralis webhook received');

    // ✅ WEBHOOK SIGNATURE VERIFICATION (Keccak-256)
    const signature = request.headers.get('x-signature');
    
    // Get raw body for signature verification
    rawBody = await request.text();
    
    // Verify signature (required for security)
    const isValid = await verifyMoralisSignature(rawBody, signature);
    
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 403 }
      );
    }
    
    console.log('✅ Webhook signature verified');
    
    // Parse the body after verification
    payload = JSON.parse(rawBody);
    
    // ✅ RETRY-ENABLED PROCESSING
    try {
      await processMoralisWebhookPayload(payload);
      
      return NextResponse.json({ 
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (processingError) {
      // Save for retry with exponential backoff
      console.error('❌ Error processing webhook, saving for retry:', processingError);
      
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      await WebhookRetryManager.saveForRetry({
        webhookType: 'moralis',
        payload,
        headers,
        error: processingError instanceof Error ? processingError : new Error(String(processingError)),
        sourceIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      });
      
      // Return 200 to Moralis (we'll retry internally)
      return NextResponse.json({
        success: true,
        message: 'Webhook received, saved for retry'
      });
    }
  } catch (error) {
    console.error('❌ Critical webhook error:', error);
    
    // If we have payload, try to save for retry
    if (payload) {
      try {
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
          headers[key] = value;
        });
        
        await WebhookRetryManager.saveForRetry({
          webhookType: 'moralis',
          payload,
          headers,
          error: error instanceof Error ? error : new Error(String(error))
        });
      } catch (retryError) {
        console.error('❌ Failed to save webhook for retry:', retryError);
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method for testing/health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Moralis webhook endpoint is active',
    timestamp: new Date().toISOString(),
    supportedNetworks: Object.keys(CHAIN_NETWORKS),
  });
}
