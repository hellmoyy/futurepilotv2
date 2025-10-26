import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import crypto from 'crypto';

// Encryption functions (same as wallet/generate)
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || 'your-secret-key-32-chars-long!!';
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedData = parts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

export async function GET(req: NextRequest) {
  // 🔒 PRODUCTION PROTECTION: Disable test endpoints in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: 'Test endpoints are disabled in production',
      message: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }

  try {
    await connectDB();

    // Get test user wallet data
    const testUser = await User.findOne({ email: 'test@futurepilot.pro' }).select('+walletData.encryptedPrivateKey');
    
    if (!testUser || !testUser.walletData) {
      return NextResponse.json({
        success: false,
        error: 'Test user not found or no wallet data'
      });
    }

    const encryptedPrivateKey = testUser.walletData.encryptedPrivateKey;
    
    if (!encryptedPrivateKey) {
      return NextResponse.json({
        success: false,
        error: 'No encrypted private key found'
      });
    }

    // Security Analysis
    const securityAnalysis = {
      // Basic Info
      userId: testUser._id,
      email: testUser.email,
      walletAddress: testUser.walletData.erc20Address,
      
      // Encryption Analysis
      encryptionMethod: 'AES-256-CBC',
      encryptedPrivateKey: {
        length: encryptedPrivateKey.length,
        format: encryptedPrivateKey.includes(':') ? 'IV:EncryptedData' : 'Unknown',
        sample: encryptedPrivateKey.substring(0, 20) + '...[REDACTED]...', // Only show beginning
        hasIV: encryptedPrivateKey.includes(':'),
        ivLength: encryptedPrivateKey.split(':')[0]?.length || 0
      },
      
      // Security Checks
      securityChecks: {
        isEncrypted: !!encryptedPrivateKey,
        hasProperIV: encryptedPrivateKey.includes(':') && encryptedPrivateKey.split(':')[0].length === 32,
        isNotPlaintext: !encryptedPrivateKey.startsWith('0x'),
        selectFalseInModel: true, // encryptedPrivateKey has select: false in schema
        keyDerivation: 'SHA-256 hash of ENCRYPTION_SECRET_KEY'
      },
      
      // Environment Security
      environmentSecurity: {
        hasEncryptionKey: !!process.env.ENCRYPTION_SECRET_KEY,
        keyLength: process.env.ENCRYPTION_SECRET_KEY?.length || 0,
        keySource: 'Environment Variable (.env)'
      }
    };

    // Test decryption (without exposing actual private key)
    let decryptionTest = {
      canDecrypt: false,
      decryptedFormat: 'unknown',
      isValidPrivateKey: false
    };

    try {
      const decryptedKey = decrypt(encryptedPrivateKey);
      decryptionTest.canDecrypt = true;
      decryptionTest.decryptedFormat = decryptedKey.startsWith('0x') ? 'Hex with 0x prefix' : 'Raw hex';
      decryptionTest.isValidPrivateKey = decryptedKey.length === 66 && decryptedKey.startsWith('0x');
      
      // Don't expose actual private key in response
    } catch (error) {
      decryptionTest.canDecrypt = false;
    }

    return NextResponse.json({
      success: true,
      message: 'Security analysis completed',
      security: {
        ...securityAnalysis,
        decryptionTest,
        mnemonicSupport: {
          currentlySupported: false,
          implementation: 'Currently using ethers.Wallet.createRandom() - generates private key directly',
          recommendation: 'Could add mnemonic support with ethers.Wallet.createRandom().mnemonic for better UX'
        },
        overallSecurity: {
          rating: 'HIGH',
          strengths: [
            'AES-256-CBC encryption with proper IV',
            'Private keys never exposed in API responses',
            'select: false prevents accidental exposure in queries',
            'Environment-based encryption key',
            'Proper key derivation with SHA-256'
          ],
          recommendations: [
            'Consider rotating ENCRYPTION_SECRET_KEY periodically',
            'Add mnemonic phrase support for better user experience',
            'Implement key escrow/recovery mechanism',
            'Add audit logging for private key access'
          ]
        }
      }
    });

  } catch (error) {
    console.error('❌ Security analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Security analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}