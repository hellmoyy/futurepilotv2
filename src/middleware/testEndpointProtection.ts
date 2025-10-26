/**
 * Test Endpoint Protection Middleware
 * Blocks access to test endpoints in production environment
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TEST_ENDPOINTS = [
  '/api/wallet/test-transactions',
  '/api/wallet/test-transactions-get',
  '/api/wallet/test-get',
  '/api/wallet/test-topup',
  '/api/wallet/test-generate',
  '/api/wallet/security-analysis',
];

const TEST_PAGES = [
  '/test-transactions',
  '/test-topup',
  '/test-news',
  '/ai-demo',
];

export function isTestEndpoint(pathname: string): boolean {
  return TEST_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint)) ||
         TEST_PAGES.some(page => pathname.startsWith(page));
}

export function protectTestEndpoints(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if it's a test endpoint
  if (isTestEndpoint(pathname)) {
    // Allow in development
    if (process.env.NODE_ENV === 'development') {
      return null; // Continue
    }
    
    // Block in production
    return NextResponse.json(
      {
        success: false,
        error: 'Test endpoints are disabled in production',
        message: 'This endpoint is only available in development mode'
      },
      { status: 403 }
    );
  }
  
  return null; // Continue
}
