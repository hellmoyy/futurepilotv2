import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/adminAuth';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

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
