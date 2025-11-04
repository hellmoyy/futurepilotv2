import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Centralized admin authentication checker
 * Throws error if user is not authenticated or not admin
 */
export async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('FORBIDDEN');
  }
  
  return session;
}

/**
 * Admin auth middleware wrapper
 * Returns NextResponse with proper error if not authorized
 */
export async function withAdminAuth() {
  try {
    const session = await checkAdminAuth();
    return { authorized: true, session };
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Unauthorized. Please login as administrator.' },
          { status: 401 }
        ),
      };
    }
    
    if (error.message === 'FORBIDDEN') {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Forbidden. Admin access required.' },
          { status: 403 }
        ),
      };
    }
    
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      ),
    };
  }
}
