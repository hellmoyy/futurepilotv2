import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import crypto from 'crypto';
import { ethers } from 'ethers';

// Encryption functions with DUAL KEY SUPPORT for backward compatibility
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || 'your-secret-key-32-chars-long!!';
const ENCRYPTION_KEY_LEGACY = process.env.ENCRYPTION_SECRET_KEY_LEGACY; // For old wallets

// Create 32-byte keys from the provided keys
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const keyLegacy = ENCRYPTION_KEY_LEGACY 
  ? crypto.createHash('sha256').update(ENCRYPTION_KEY_LEGACY).digest()
  : null;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedData = parts.join(':');
  
  // Try with new key first
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // If new key fails and legacy key exists, try legacy key
    if (keyLegacy) {
      try {
        console.log('⚠️  Trying legacy encryption key for backward compatibility...');
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyLegacy, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log('✅ Successfully decrypted with legacy key');
        return decrypted;
      } catch (legacyError) {
        console.error('❌ Both keys failed to decrypt');
        throw new Error('Failed to decrypt with both new and legacy keys');
      }
    }
    // No legacy key available, throw original error
    throw error;
  }
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
        balance: user.walletData.balance || 0
      });
    }

    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const address = wallet.address;

    // Encrypt private key
    const encryptedPrivateKey = encrypt(privateKey);

    // Update user with wallet data
    const walletData = {
      erc20Address: address,
      bep20Address: address, // Same address works for both networks
      encryptedPrivateKey: encryptedPrivateKey,
      balance: 0,
      mainnetBalance: 0,
      createdAt: new Date()
    };

    await User.findByIdAndUpdate(user._id, {
      walletData: walletData
    });

    console.log('✅ Wallet generated for user:', session.user.email);
    console.log('📝 Address:', address);

    return NextResponse.json({
      erc20Address: address,
      bep20Address: address,
      balance: 0
    });

  } catch (error) {
    console.error('❌ Error generating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to generate wallet' },
      { status: 500 }
    );
  }
}