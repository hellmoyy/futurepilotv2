import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import crypto from 'crypto';
import { ethers } from 'ethers';

// ✅ CRITICAL: Force encryption key to be set - NO DEFAULT FALLBACK
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY;
const ENCRYPTION_KEY_LEGACY = process.env.ENCRYPTION_SECRET_KEY_LEGACY; // For old wallets

if (!ENCRYPTION_KEY) {
  throw new Error(
    '🚨 CRITICAL SECURITY ERROR: ENCRYPTION_SECRET_KEY environment variable is not set!\n\n' +
    'This is REQUIRED for wallet security to protect user private keys.\n\n' +
    'To fix:\n' +
    '1. Generate a strong key: openssl rand -hex 32\n' +
    '2. Add to .env.local: ENCRYPTION_SECRET_KEY=<your_generated_key>\n' +
    '3. Restart the server\n\n' +
    'NEVER use a default or weak key in production!'
  );
}

// ✅ Validate key strength
if (ENCRYPTION_KEY.length < 32) {
  throw new Error(
    `🚨 CRITICAL SECURITY ERROR: ENCRYPTION_SECRET_KEY is too short!\n\n` +
    `Current length: ${ENCRYPTION_KEY.length} characters\n` +
    `Required: At least 32 characters\n\n` +
    `Generate a strong key: openssl rand -hex 32`
  );
}

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
    // ✅ CSRF Protection
    const { validateCSRF } = await import('@/lib/csrf');
    if (!validateCSRF(request)) {
      return NextResponse.json(
        { error: 'CSRF validation failed. Request origin not allowed.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ✅ CRITICAL: Rate limiting to prevent abuse
    const rateLimiter = (await import('@/lib/rateLimit')).default;
    const { RateLimitConfigs } = await import('@/lib/rateLimit');
    const rateLimitResult = rateLimiter.check(
      session.user.email,
      RateLimitConfigs.WALLET_GENERATE
    );

    if (!rateLimitResult.allowed) {
      const waitTime = rateLimitResult.retryAfter 
        ? Math.ceil(rateLimitResult.retryAfter / 1000) 
        : 60;
      
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Please wait ${waitTime} seconds before generating a wallet again.`,
          retryAfter: waitTime,
          rateLimitExceeded: true
        },
        { status: 429 }
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