import { NextRequest, NextResponse } from 'next/server';

// In-memory cache
let newsCache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 30 * 1000; // 30 seconds cache for real-time news updates

export async function GET(request: NextRequest) {
  try {
    // Check cache
    if (newsCache && Date.now() - newsCache.timestamp < CACHE_DURATION) {
      console.log('✅ Returning cached news');
      return NextResponse.json({
        success: true,
        data: newsCache.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - newsCache.timestamp) / 1000),
      });
    }

    console.log('🔄 Fetching news from CryptoNews API...');

    const apiKey = process.env.CRYPTONEWS_API_KEY;
    if (!apiKey) {
      throw new Error('CRYPTONEWS_API_KEY not configured');
    }

    // Fetch all crypto news using category endpoint
    // Using alltickers section for comprehensive coverage
    const url = `https://cryptonews-api.com/api/v1/category?section=alltickers&items=50&page=1&token=${apiKey}`;
    
    console.log(`📡 Fetching from: ${url.replace(apiKey, '***')}`);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      console.error(`❌ CryptoNews API error: ${response.status} ${response.statusText}`);
      throw new Error(`CryptoNews API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response from CryptoNews API');
    }

    console.log(`✅ Received ${data.data.length} articles from API`);

    // Transform to our format
    const allNews = data.data.map((item: any) => {
      const sentiment = item.sentiment?.toLowerCase() || 'neutral';
      
      return {
        id: item.news_url || `news-${Date.now()}-${Math.random()}`,
        title: item.title || 'Untitled',
        description: (item.text || item.title || '').substring(0, 250) + '...',
        source: item.source_name || 'CryptoNews',
        sourceImage: undefined,
        url: item.news_url || '#',
        imageUrl: item.image_url,
        publishedAt: item.date || new Date().toISOString(),
        sentiment: sentiment === 'positive' ? 'bullish' : 
                   sentiment === 'negative' ? 'bearish' : 'neutral',
        tags: item.tickers || [],
        categories: item.topics || ['News'],
      };
    });

    // Sort by date (newest first) and take top 50
    const sortedNews = allNews
      .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 50);

    // Update cache
    newsCache = {
      data: sortedNews,
      timestamp: Date.now(),
    };

    console.log(`✅ Fetched ${sortedNews.length} articles from CryptoNews API`);

    return NextResponse.json({
      success: true,
      data: sortedNews,
      cached: false,
      count: sortedNews.length,
      source: 'cryptonews-api',
    });

  } catch (error) {
    console.error('❌ Error fetching news:', error);
    
    // Return cached data if available, even if expired
    if (newsCache) {
      console.log('⚠️ Returning stale cache due to error');
      return NextResponse.json({
        success: true,
        data: newsCache.data,
        cached: true,
        stale: true,
        error: 'Failed to fetch fresh data, returning cached data',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
