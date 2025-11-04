import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/adminAuth';
import rateLimiter, { RateLimitConfigs, getClientIP } from '@/lib/rateLimit';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - admin login should be strictly limited
    const clientIP = getClientIP(request);
    const rateLimitCheck = rateLimiter.check(
      `admin-login:${clientIP}`,
      RateLimitConfigs.LOGIN
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many admin login attempts. Please try again in ${Math.ceil(rateLimitCheck.retryAfter! / 60)} minutes.`,
          retryAfter: rateLimitCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '1800',
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify admin credentials
    const isValid = await verifyAdminCredentials(email, password);

    if (!isValid) {
      // Don't reset rate limit on failed login
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    rateLimiter.reset(`admin-login:${clientIP}`);

    // Create JWT token for admin session
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const token = sign(
      {
        email,
        role: 'admin',
        loginTime: new Date().toISOString(),
      },
      secret,
      { expiresIn: '8h' } // Admin session expires in 8 hours
    );

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful',
      admin: {
        email,
        role: 'admin',
      },
    });

    // Set HTTP-only cookie for security
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/', // Set to root so it's accessible from all paths
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
