import { NextRequest, NextResponse } from 'next/server';
import { priceAggregator } from '@/lib/price-aggregator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/prices/symbol/[symbol]
 * 
 * Get specific symbol price for trading bot
 * Uses aggregated cache = no rate limit issues
 * 
 * Example: /api/prices/symbol/BTCUSDT
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    // Authentication required for bot usage
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { symbol } = params;

    // Validate symbol format
    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { error: 'Invalid symbol' },
        { status: 400 }
      );
    }

    // Get from aggregated cache (shared across all bots)
    const price = await priceAggregator.getSymbolPrice(symbol.toUpperCase());

    if (!price) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: 404 }
      );
    }

    // Return full price data for bot trading
    return NextResponse.json({
      symbol: price.symbol,
      price: parseFloat(price.lastPrice),
      priceChange: parseFloat(price.priceChange || '0'),
      priceChangePercent: parseFloat(price.priceChangePercent || '0'),
      high24h: parseFloat(price.highPrice || '0'),
      low24h: parseFloat(price.lowPrice || '0'),
      volume: parseFloat(price.volume || '0'),
      quoteVolume: parseFloat(price.quoteVolume || '0'),
      openTime: price.openTime,
      closeTime: price.closeTime,
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch symbol price:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch price',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
