import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendVerificationEmail } from '@/lib/resend';
import rateLimiter, { RateLimitConfigs, getClientIP } from '@/lib/rateLimit';
import { validatePassword } from '@/lib/passwordValidation';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - by IP
    const clientIP = getClientIP(request);
    const rateLimitCheck = rateLimiter.check(
      `register:${clientIP}`,
      RateLimitConfigs.REGISTER
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
          retryAfter: rateLimitCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': RateLimitConfigs.REGISTER.maxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitCheck.resetAt.toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { name, email, password, referralCode } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Strong password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if referral code exists
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      provider: 'credentials',
      verificationToken,
      verificationTokenExpiry,
      emailVerified: false,
      referredBy: referrer?._id,
      membershipLevel: 'bronze',
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Reset rate limit on successful registration
    rateLimiter.reset(`register:${clientIP}`);

    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: false,
        },
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': RateLimitConfigs.REGISTER.maxAttempts.toString(),
          'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
          'X-RateLimit-Reset': rateLimitCheck.resetAt.toISOString(),
        },
      }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
