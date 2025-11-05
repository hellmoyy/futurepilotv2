import { NextResponse } from 'next/server';
import { priceAggregator } from '@/lib/price-aggregator';

/**
 * GET /api/prices/aggregated
 * 
 * Returns aggregated Binance prices from shared cache
 * All users get same data from single fetch = no rate limit issues
 */
export async function GET() {
  try {
    // Get prices from aggregator (cached, shared across all users)
    const allPrices = await priceAggregator.getAllPrices();

    // Filter top coins for dashboard display
    const topCoins = [
      'BTCUSDT', 
      'ETHUSDT', 
      'BNBUSDT', 
      'SOLUSDT', 
      'XRPUSDT', 
      'ADAUSDT', 
      'DOGEUSDT', 
      'MATICUSDT'
    ];

    const coinNames: { [key: string]: string } = {
      'BTCUSDT': 'Bitcoin',
      'ETHUSDT': 'Ethereum',
      'BNBUSDT': 'BNB',
      'SOLUSDT': 'Solana',
      'XRPUSDT': 'Ripple',
      'ADAUSDT': 'Cardano',
      'DOGEUSDT': 'Dogecoin',
      'MATICUSDT': 'Polygon'
    };

    const filtered = allPrices
      .filter((item: any) => topCoins.includes(item.symbol))
      .map((item: any) => ({
        symbol: item.symbol,
        name: coinNames[item.symbol] || item.symbol,
        price: parseFloat(item.lastPrice).toFixed(2),
        priceChangePercent: parseFloat(item.priceChangePercent).toFixed(2),
        volume: (parseFloat(item.volume) / 1000000).toFixed(2) + 'M'
      }));

    return NextResponse.json(filtered, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch aggregated prices:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch market prices',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
