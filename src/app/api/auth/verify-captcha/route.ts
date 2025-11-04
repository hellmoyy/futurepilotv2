import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/turnstile';
import { getClientIP } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'CAPTCHA token is required' },
        { status: 400 }
      );
    }

    // Get client IP for additional verification
    const clientIP = getClientIP(request);

    // Verify CAPTCHA with Cloudflare Turnstile
    const result = await verifyTurnstile(token, undefined, clientIP);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid CAPTCHA' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      challengeTs: result.challengeTs,
      hostname: result.hostname,
    });
  } catch (error) {
    console.error('❌ Turnstile verification error:', error);
    return NextResponse.json(
      { error: 'CAPTCHA verification failed' },
      { status: 500 }
    );
  }
}
