import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
import rateLimiter, { RateLimitConfigs } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Rate limiting - 1 request per 5 minutes
    const rateLimitCheck = rateLimiter.check(
      `resend-verification:${clientIP}`,
      {
        maxAttempts: 1, // Only 1 resend per window
        windowMs: 5 * 60 * 1000, // 5 minutes
        blockDurationMs: 5 * 60 * 1000, // 5 minutes block
      }
    );

    if (!rateLimitCheck.allowed) {
      const retryAfterSeconds = rateLimitCheck.retryAfter ? Math.ceil(rateLimitCheck.retryAfter / 1000) : 300;
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many requests. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` 
        },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json(
        { success: true, message: 'If the email exists, a verification link has been sent.' },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send verification email (pass token, not URL - function will build URL internally)
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
