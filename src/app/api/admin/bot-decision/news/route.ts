import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import NewsEvent from '@/models/NewsEvent';

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const url = new URL(request.url);
    const params = url.searchParams;
    const limit = parseInt(params.get('limit') || '50', 10);
    const sentiment = params.get('sentiment') || undefined;
    const impact = params.get('impact') || undefined;
    const symbol = params.get('symbol') || undefined;

    const news = await NewsEvent.getRecentNews({ limit, sentiment, impact, symbol });
    const agg = await NewsEvent.getAggregateSentiment(symbol, 24);

    return NextResponse.json({ success: true, news, aggregate: agg });
  } catch (error: any) {
    console.error('GET /api/admin/bot-decision/news error', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
