import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    // Server-side env vars
    hasSiteKey: !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    hasSecretKey: !!process.env.TURNSTILE_SECRET_KEY,
    siteKeyLength: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.length || 0,
    // Don't expose full keys, just prefix for verification
    siteKeyPrefix: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.substring(0, 10) || 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    // All NEXT_PUBLIC_ vars
    allPublicVars: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, key) => {
        acc[key] = process.env[key]?.substring(0, 20) + '...' || 'MISSING';
        return acc;
      }, {} as Record<string, string>),
  });
}
