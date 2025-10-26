import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { protectTestEndpoints } from './middleware/testEndpointProtection';

export function middleware(request: NextRequest) {
  // Protect test endpoints in production
  const testProtection = protectTestEndpoints(request);
  if (testProtection) {
    return testProtection;
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // API routes
    '/api/:path*',
    // Test pages
    '/test-:path*',
    '/ai-demo/:path*',
  ],
};
