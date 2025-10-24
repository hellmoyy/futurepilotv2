import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Verify token
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;

    // Check if token is valid and user is admin
    if (decoded.role === 'admin' && decoded.email === process.env.ADMIN_EMAIL) {
      return NextResponse.json({
        authenticated: true,
        admin: {
          email: decoded.email,
          role: decoded.role,
          loginTime: decoded.loginTime,
        },
      });
    }

    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );

  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
