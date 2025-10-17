import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

// RSS Feed sources
const RSS_FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
  'https://cryptonews.com/news/feed/',
  'https://decrypt.co/feed',
  // Bitcoin Magazine blocked - using alternative
  'https://www.theblockcrypto.com/rss.xml',
  'https://cryptopotato.com/feed/',
  'https://u.today/rss',
];

// In-memory cache
let newsCache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (longer since RSS is free)

// Simple sentiment analysis based on keywords
function analyzeSentiment(title: string, body: string): 'bullish' | 'bearish' | 'neutral' {
  const text = (title + ' ' + body).toLowerCase();
  
  const bullishKeywords = [
    'surge', 'rally', 'bullish', 'pump', 'moon', 'ath', 'all-time high',
    'breakout', 'soar', 'skyrocket', 'gain', 'rise', 'up', 'growth',
    'institutional', 'adoption', 'upgrade', 'innovation', 'partnership'
  ];
  
  const bearishKeywords = [
    'crash', 'dump', 'bearish', 'plunge', 'drop', 'fall', 'decline',
    'down', 'loss', 'fear', 'concern', 'warning', 'risk', 'regulation',
    'hack', 'scam', 'fraud', 'investigation', 'lawsuit', 'ban'
  ];
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  bullishKeywords.forEach(keyword => {
    if (text.includes(keyword)) bullishScore++;
  });
  
  bearishKeywords.forEach(keyword => {
    if (text.includes(keyword)) bearishScore++;
  });
  
  if (bullishScore > bearishScore && bullishScore > 0) return 'bullish';
  if (bearishScore > bullishScore && bearishScore > 0) return 'bearish';
  return 'neutral';
}

// Extract tags from title and content
function extractTags(title: string, content: string): string[] {
  const text = (title + ' ' + content).toLowerCase();
  const tags: string[] = [];
  
  const cryptoKeywords = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain',
    'defi', 'nft', 'altcoin', 'trading', 'market', 'price',
    'solana', 'sol', 'cardano', 'ada', 'polygon', 'matic'
  ];
  
  cryptoKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword.toUpperCase());
    }
  });
  
  // Remove duplicates and return max 5 tags
  const uniqueTags = Array.from(new Set(tags));
  return uniqueTags.slice(0, 5);
}

// Extract image from RSS item
function extractImage(item: any): string | undefined {
  // Try different RSS image formats
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
  if (item.image?.url) return item.image.url;
  
  // Try to find image in content
  const content = item.content || item['content:encoded'] || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];
  
  return undefined;
}

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

    console.log('🔄 Fetching news from RSS feeds...');

    const parser = new Parser({
      timeout: 10000,
      customFields: {
        item: [
          ['media:content', 'media:content'],
          ['media:thumbnail', 'media:thumbnail'],
          ['content:encoded', 'content:encoded'],
        ],
      },
    });

    const allNews: any[] = [];
    const feedPromises = RSS_FEEDS.map(async (feedUrl) => {
      try {
        console.log(`📡 Fetching from: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);
        
        feed.items.forEach((item: any) => {
          const title = item.title || 'Untitled';
          const description = item.contentSnippet || item.summary || item.content || '';
          const cleanDescription = description
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .substring(0, 250) + '...';
          
          allNews.push({
            id: item.guid || item.link || `${feed.title}-${Date.now()}-${Math.random()}`,
            title: title.trim(),
            description: cleanDescription.trim(),
            source: feed.title || 'Crypto News',
            sourceImage: feed.image?.url || feed.favicon,
            url: item.link || '#',
            imageUrl: extractImage(item),
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            sentiment: analyzeSentiment(title, description),
            tags: extractTags(title, description),
            categories: item.categories || ['News'],
          });
        });
        
        console.log(`✅ ${feed.title}: ${feed.items.length} articles`);
      } catch (error) {
        console.error(`❌ Error fetching ${feedUrl}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    });

    await Promise.all(feedPromises);

    // Sort by date (newest first) and take top 30
    const sortedNews = allNews
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 30);

    // Update cache
    newsCache = {
      data: sortedNews,
      timestamp: Date.now(),
    };

    console.log(`✅ Fetched ${sortedNews.length} articles from ${RSS_FEEDS.length} sources`);

    return NextResponse.json({
      success: true,
      data: sortedNews,
      cached: false,
      count: sortedNews.length,
      sources: RSS_FEEDS.length,
      source: 'rss',
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
