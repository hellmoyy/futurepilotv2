import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface AdminSession {
  email: string;
  role: 'admin';
  loginTime: Date;
}

export interface AdminAuthResult {
  authenticated: boolean;
  admin?: {
    email: string;
    role: string;
    loginTime?: number;
  };
  error?: string;
}

// Verify admin credentials from environment variables
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Admin credentials not configured in environment variables');
    return false;
  }

  // Check if email matches
  if (email !== adminEmail) {
    return false;
  }

  // Compare password directly (plain text for now, will be hashed in production)
  return password === adminPassword;
}

// Check if user is authenticated as admin from session
export function isAdminAuthenticated(session: any): boolean {
  return session?.user?.role === 'admin' && session?.user?.email === process.env.ADMIN_EMAIL;
}

// Create admin session data
export function createAdminSession(email: string): AdminSession {
  return {
    email,
    role: 'admin',
    loginTime: new Date(),
  };
}

/**
 * Verify admin token dari cookie (untuk API endpoints)
 * @param request NextRequest object
 * @returns AdminAuthResult dengan authenticated status
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // Get token from cookie
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return {
        authenticated: false,
        error: 'No admin token found',
      };
    }

    // Verify JWT token
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;

    // Check if token is valid and user is admin
    if (decoded.role === 'admin' && decoded.email === process.env.ADMIN_EMAIL) {
      return {
        authenticated: true,
        admin: {
          email: decoded.email,
          role: decoded.role,
          loginTime: decoded.loginTime,
        },
      };
    }

    return {
      authenticated: false,
      error: 'Invalid admin credentials',
    };

  } catch (error: any) {
    console.error('Admin auth verification error:', error.message);
    return {
      authenticated: false,
      error: 'Token verification failed',
    };
  }
}
