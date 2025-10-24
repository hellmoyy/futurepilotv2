import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { verifyTwoFactorToken, generateBackupCodes, hashBackupCode } from '@/lib/twoFactor';

// POST - Verify 2FA token and enable 2FA
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token || token.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select('+twoFactorSecret');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Please setup 2FA first' },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = verifyTwoFactorToken(token, user.twoFactorSecret);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => hashBackupCode(code))
    );

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    return NextResponse.json({
      success: true,
      backupCodes: backupCodes,
      message: '2FA enabled successfully. Save your backup codes in a safe place!',
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
}
