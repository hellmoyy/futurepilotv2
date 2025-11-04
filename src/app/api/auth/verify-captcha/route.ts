import { NextRequest, NextResponse } from 'next/server';
import { verifyFriendlyCaptcha } from '@/lib/friendlyCaptcha';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { solution } = body;

    if (!solution) {
      return NextResponse.json(
        { error: 'CAPTCHA solution is required' },
        { status: 400 }
      );
    }

    // Verify CAPTCHA
    const result = await verifyFriendlyCaptcha(solution);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid CAPTCHA' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ CAPTCHA verification error:', error);
    return NextResponse.json(
      { error: 'CAPTCHA verification failed' },
      { status: 500 }
    );
  }
}
