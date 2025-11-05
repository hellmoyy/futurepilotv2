import { NextResponse } from 'next/server';
import { priceAggregator } from '@/lib/price-aggregator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/price-cache-stats
 * 
 * Monitor price aggregator performance
 * Admin only
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin check
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Get aggregator stats
    const stats = priceAggregator.getStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Failed to get cache stats:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get stats',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/price-cache-stats
 * 
 * Clear price cache (force refresh)
 * Admin only
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin check
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Clear cache
    priceAggregator.clearCache();

    return NextResponse.json({
      success: true,
      message: 'Price cache cleared successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Failed to clear cache:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to clear cache',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
