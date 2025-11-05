/**
 * CSRF Protection Helper
 * 
 * Validates origin header matches host to prevent Cross-Site Request Forgery attacks
 * 
 * Usage:
 * ```typescript
 * import { validateCSRF } from '@/lib/csrf';
 * 
 * export async function POST(request: NextRequest) {
 *   if (!validateCSRF(request)) {
 *     return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
 *   }
 *   // ... rest of handler
 * }
 * ```
 */

import { NextRequest } from 'next/server';

export function validateCSRF(request: NextRequest): boolean {
  // Get origin and host headers
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Allow requests without origin (e.g., same-origin requests from server)
  if (!origin && !referer) {
    return true; // Same-origin request
  }

  // If origin exists, validate it
  if (origin) {
    try {
      const originUrl = new URL(origin);
      
      // Check if origin host matches current host
      if (originUrl.host === host) {
        return true;
      }
      
      // Allow localhost in development
      if (process.env.NODE_ENV === 'development') {
        if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
          return true;
        }
      }
      
      console.warn(`CSRF: Origin mismatch - Origin: ${originUrl.host}, Host: ${host}`);
      return false;
    } catch (error) {
      console.error('CSRF: Invalid origin URL', error);
      return false;
    }
  }

  // If referer exists, validate it
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      
      // Check if referer host matches current host
      if (refererUrl.host === host) {
        return true;
      }
      
      console.warn(`CSRF: Referer mismatch - Referer: ${refererUrl.host}, Host: ${host}`);
      return false;
    } catch (error) {
      console.error('CSRF: Invalid referer URL', error);
      return false;
    }
  }

  return false;
}

/**
 * Validate CSRF with custom allowed origins
 */
export function validateCSRFWithOrigins(
  request: NextRequest,
  allowedOrigins: string[] = []
): boolean {
  const origin = request.headers.get('origin');
  
  if (!origin) {
    return validateCSRF(request);
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return validateCSRF(request);
}

/**
 * Get CSRF token for forms (optional enhancement)
 */
export function generateCSRFToken(): string {
  return Buffer.from(
    `${Date.now()}-${Math.random().toString(36).substring(2)}`
  ).toString('base64');
}

/**
 * Validate CSRF token (optional enhancement)
 */
export function validateCSRFToken(
  token: string,
  maxAge: number = 3600000 // 1 hour
): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [timestamp] = decoded.split('-');
    const tokenAge = Date.now() - parseInt(timestamp);
    
    return tokenAge < maxAge;
  } catch {
    return false;
  }
}

export default validateCSRF;
