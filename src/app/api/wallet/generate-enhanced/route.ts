import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import crypto from 'crypto';
import { ethers } from 'ethers';

// Enhanced encryption functions
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || 'your-secret-key-32-chars-long!!';
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { includeMnemonic = false } = await request.json();

    await connectDB();

    // Check if user already has wallet
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if wallet already exists
    if (user.walletData?.erc20Address) {
      return NextResponse.json({
        erc20Address: user.walletData.erc20Address,
        bep20Address: user.walletData.bep20Address,
        mainnetBalance: user.walletData.mainnetBalance || 0,
        message: 'Wallet already exists'
      });
    }

    // Generate new wallet with optional mnemonic
    let wallet: ethers.HDNodeWallet | ethers.Wallet;
    let mnemonic: string | null = null;
    
    if (includeMnemonic) {
      // Generate wallet with mnemonic for better user experience
      const randomWallet = ethers.Wallet.createRandom();
      const mnemonicObj = randomWallet.mnemonic;
      if (mnemonicObj) {
        mnemonic = mnemonicObj.phrase;
        wallet = ethers.Wallet.fromPhrase(mnemonic);
      } else {
        // Fallback to regular wallet
        wallet = randomWallet;
      }
    } else {
      // Standard wallet generation (current method)
      wallet = ethers.Wallet.createRandom();
    }

    const privateKey = wallet.privateKey;
    const address = wallet.address;

    // Encrypt private key and mnemonic
    const encryptedPrivateKey = encrypt(privateKey);
    const encryptedMnemonic = mnemonic ? encrypt(mnemonic) : null;

    // Enhanced wallet data structure
    const walletData = {
      erc20Address: address,
      bep20Address: address, // Same address works for both networks
      encryptedPrivateKey: encryptedPrivateKey,
      encryptedMnemonic: encryptedMnemonic, // New field for mnemonic
      balance: 0,
      mainnetBalance: 0,
      createdAt: new Date(),
      hasRecoveryPhrase: !!mnemonic
    };

    await User.findByIdAndUpdate(user._id, {
      walletData: walletData
    });

    console.log('✅ Enhanced wallet generated for user:', session.user.email);
    console.log('📝 Address:', address);
    console.log('🔐 Has mnemonic:', !!mnemonic);

    return NextResponse.json({
      erc20Address: address,
      bep20Address: address,
      balance: 0,
      hasRecoveryPhrase: !!mnemonic,
      security: {
        encryption: 'AES-256-CBC',
        keyDerivation: 'SHA-256',
        ivGenerated: true,
        selectFalse: true
      }
    });

  } catch (error) {
    console.error('❌ Error generating enhanced wallet:', error);
    return NextResponse.json(
      { error: 'Failed to generate wallet' },
      { status: 500 }
    );
  }
}