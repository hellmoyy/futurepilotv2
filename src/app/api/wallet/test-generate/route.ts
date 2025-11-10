import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import crypto from 'crypto';
import { ethers } from 'ethers';

// Encryption functions (same as in wallet/generate)
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || 'your-secret-key-32-chars-long!!';
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export async function POST(req: NextRequest) {
  // 🔒 PRODUCTION PROTECTION: Disable test endpoints in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: 'Test endpoints are disabled in production',
      message: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }

  try {
    const { network = 'ethereum' } = await req.json();
    
    console.log('🧪 Creating test user and generating wallet...');
    
    await connectDB();

    // Create or find test user
    let testUser = await User.findOne({ email: 'test@futurepilot.pro' });
    
    if (!testUser) {
      testUser = new User({
        email: 'test@futurepilot.pro',
        name: 'Test User',
        password: 'test123456',
        gasFeeBalance: 0,
        emailVerified: true
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }

    // Generate wallet for both networks
    const wallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = encrypt(wallet.privateKey);

    // Update user with wallet data based on existing model structure
    testUser.walletData = {
      erc20Address: wallet.address,  // Same address for both networks
      bep20Address: wallet.address,  // Same address for both networks  
      encryptedPrivateKey: encryptedPrivateKey,
      mainnetBalance: 0,
      createdAt: new Date()
    };

    await testUser.save();

    // Get RPC provider to test connection
    const rpcUrl = network === 'ethereum' 
      ? process.env.ETHEREUM_RPC_URL 
      : process.env.BSC_RPC_URL;
    
    let providerStatus = 'unknown';
    let currentBlock = 0;
    
    if (rpcUrl) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        currentBlock = await provider.getBlockNumber();
        providerStatus = 'connected';
      } catch (error) {
        providerStatus = 'failed';
        console.error('Provider connection failed:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test wallet generated successfully',
      data: {
        userId: testUser._id,
        network,
        address: wallet.address,
        rpcUrl,
        providerStatus,
        currentBlock,
        walletData: {
          hasErc20Address: !!testUser.walletData?.erc20Address,
          hasBep20Address: !!testUser.walletData?.bep20Address,
          mainnetBalance: testUser.walletData?.mainnetBalance || 0,
          gasFeeBalance: testUser.gasFeeBalance
        }
      }
    });

  } catch (error) {
    console.error('❌ Test wallet generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate test wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}