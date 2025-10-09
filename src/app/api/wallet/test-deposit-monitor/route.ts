import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { cronSecret } = await req.json();
    
    if (!cronSecret) {
      return NextResponse.json({
        success: false,
        error: 'cronSecret is required'
      }, { status: 400 });
    }

    console.log('🧪 Testing deposit monitoring endpoint...');

    // Test the deposit monitoring endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const testUrl = `${baseUrl}/api/cron/monitor-deposits`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Deposit monitoring test completed',
      testUrl,
      response: {
        status: response.status,
        statusText: response.statusText,
        data
      }
    });

  } catch (error) {
    console.error('❌ Deposit monitoring test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}