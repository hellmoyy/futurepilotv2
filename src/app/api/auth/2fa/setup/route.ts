import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { generateTwoFactorSecret, generateBackupCodes, hashBackupCode } from '@/lib/twoFactor';

// POST - Setup 2FA (generate secret and QR code)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 }
      );
    }

    // Generate secret and QR code
    const twoFactorData = await generateTwoFactorSecret(session.user.email);

    // Store secret temporarily (will be confirmed in verify endpoint)
    user.twoFactorSecret = twoFactorData.secret;
    await user.save();

    return NextResponse.json({
      success: true,
      secret: twoFactorData.secret,
      qrCode: twoFactorData.qr_code,
      message: 'Scan the QR code with your authenticator app',
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}
