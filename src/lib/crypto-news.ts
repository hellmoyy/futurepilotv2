/**
 * Crypto News Fetcher for AI Agent
 * 
 * Fetches recent crypto news with sentiment analysis
 * to provide market context for AI trading recommendations
 */

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  tags: string[];
  summary?: string;
}

interface NewsResponse {
  success: boolean;
  news: NewsItem[];
  cached: boolean;
  timestamp: number;
}

/**
 * Fetch recent crypto news from internal API
 */
export async function fetchCryptoNews(limit: number = 10): Promise<NewsItem[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/news`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Use cache for better performance
      next: { revalidate: 600 } // 10 minutes
    });

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }

    const data: NewsResponse = await response.json();
    
    if (!data.success || !data.news) {
      throw new Error('Invalid news response');
    }

    // Return limited number of news items
    return data.news.slice(0, limit);
  } catch (error: any) {
    console.error('Failed to fetch crypto news:', error.message);
    return [];
  }
}

/**
 * Filter news by specific cryptocurrency
 */
export function filterNewsBySymbol(news: NewsItem[], symbol: string): NewsItem[] {
  const searchTerms = getSymbolSearchTerms(symbol);
  
  return news.filter(item => {
    const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
    return searchTerms.some(term => text.includes(term.toLowerCase()));
  });
}

/**
 * Get search terms for a symbol
 */
function getSymbolSearchTerms(symbol: string): string[] {
  const symbolMap: { [key: string]: string[] } = {
    'BTCUSDT': ['bitcoin', 'btc'],
    'ETHUSDT': ['ethereum', 'eth', 'ether'],
    'BNBUSDT': ['binance', 'bnb'],
    'SOLUSDT': ['solana', 'sol'],
    'ADAUSDT': ['cardano', 'ada'],
    'XRPUSDT': ['ripple', 'xrp'],
    'DOGEUSDT': ['dogecoin', 'doge'],
    'MATICUSDT': ['polygon', 'matic'],
    'AVAXUSDT': ['avalanche', 'avax'],
    'DOTUSDT': ['polkadot', 'dot'],
    'LINKUSDT': ['chainlink', 'link'],
    'LTCUSDT': ['litecoin', 'ltc'],
  };

  // Remove USDT suffix if present
  const cleanSymbol = symbol.replace('USDT', '');
  
  // Try exact match first
  if (symbolMap[symbol]) {
    return symbolMap[symbol];
  }
  
  // Try with USDT suffix
  if (symbolMap[`${cleanSymbol}USDT`]) {
    return symbolMap[`${cleanSymbol}USDT`];
  }
  
  // Fallback to symbol itself
  return [cleanSymbol.toLowerCase()];
}

/**
 * Calculate overall market sentiment from news
 */
export function calculateMarketSentiment(news: NewsItem[]): {
  overall: 'bullish' | 'bearish' | 'neutral';
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  percentage: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
} {
  const bullishCount = news.filter(n => n.sentiment === 'bullish').length;
  const bearishCount = news.filter(n => n.sentiment === 'bearish').length;
  const neutralCount = news.filter(n => n.sentiment === 'neutral').length;
  const total = news.length || 1;

  const bullishPercentage = Math.round((bullishCount / total) * 100);
  const bearishPercentage = Math.round((bearishCount / total) * 100);
  const neutralPercentage = Math.round((neutralCount / total) * 100);

  let overall: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  if (bullishCount > bearishCount && bullishPercentage > 40) {
    overall = 'bullish';
  } else if (bearishCount > bullishCount && bearishPercentage > 40) {
    overall = 'bearish';
  }

  return {
    overall,
    bullishCount,
    bearishCount,
    neutralCount,
    percentage: {
      bullish: bullishPercentage,
      bearish: bearishPercentage,
      neutral: neutralPercentage,
    }
  };
}

/**
 * Detect major market events from news title
 */
function detectMajorEvent(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  // Critical events that need highlighting
  const majorEvents = [
    { keywords: ['fed', 'federal reserve', 'interest rate', 'powell'], icon: '🏦', label: 'FED NEWS' },
    { keywords: ['crash', 'market crash', 'sell-off', 'plunge'], icon: '📉', label: 'MARKET CRASH' },
    { keywords: ['sec charges', 'sec lawsuit', 'enforcement'], icon: '⚖️', label: 'SEC ACTION' },
    { keywords: ['hack', 'exploit', 'vulnerability', 'breach'], icon: '🚨', label: 'SECURITY' },
    { keywords: ['etf approved', 'etf approval'], icon: '✅', label: 'ETF APPROVED' },
    { keywords: ['bankruptcy', 'insolvent', 'collapse'], icon: '💥', label: 'BANKRUPTCY' },
    { keywords: ['regulation', 'ban', 'crackdown'], icon: '⚠️', label: 'REGULATION' },
    { keywords: ['all-time high', 'ath', 'record high'], icon: '🚀', label: 'ATH' },
    { keywords: ['halving', 'halvening'], icon: '⚡', label: 'HALVING' },
  ];
  
  for (const event of majorEvents) {
    if (event.keywords.some(keyword => lowerTitle.includes(keyword))) {
      return `${event.icon} ${event.label}`;
    }
  }
  
  return null;
}

/**
 * Format news for AI consumption
 */
export function formatNewsForAI(
  news: NewsItem[],
  symbol?: string
): string {
  if (news.length === 0) {
    return 'No recent news available.';
  }

  // Filter by symbol if provided
  const relevantNews = symbol ? filterNewsBySymbol(news, symbol) : news;
  
  if (relevantNews.length === 0 && symbol) {
    return `No recent news specifically about ${symbol}.`;
  }

  // Use filtered news if available, otherwise all news
  const newsToDisplay = relevantNews.length > 0 ? relevantNews : news;
  
  // Calculate sentiment
  const sentiment = calculateMarketSentiment(newsToDisplay);
  
  // Detect major events in top news
  const majorEventsDetected = newsToDisplay
    .slice(0, 5)
    .map(item => detectMajorEvent(item.title))
    .filter(Boolean);
  
  const hasMajorEvents = majorEventsDetected.length > 0;
  
  // Format sentiment emoji
  const sentimentEmoji = 
    sentiment.overall === 'bullish' ? '🟢' :
    sentiment.overall === 'bearish' ? '🔴' :
    '⚪';

  let output = `\n📰 **RECENT CRYPTO NEWS** ${symbol ? `(${symbol})` : '(General Market)'}\n\n`;
  
  // Highlight major events if detected
  if (hasMajorEvents) {
    output += `🚨 **MAJOR EVENTS DETECTED:** ${Array.from(new Set(majorEventsDetected)).join(', ')}\n\n`;
  }
  
  output += `**Market Sentiment from News:** ${sentiment.overall.toUpperCase()} ${sentimentEmoji}\n`;
  output += `• Bullish: ${sentiment.percentage.bullish}% (${sentiment.bullishCount} articles)\n`;
  output += `• Bearish: ${sentiment.percentage.bearish}% (${sentiment.bearishCount} articles)\n`;
  output += `• Neutral: ${sentiment.percentage.neutral}% (${sentiment.neutralCount} articles)\n\n`;
  
  output += `**Recent Headlines (Last ${Math.min(newsToDisplay.length, 5)} articles):**\n\n`;
  
  // Show top 5 most recent news
  newsToDisplay.slice(0, 5).forEach((item, index) => {
    const sentimentIcon = 
      item.sentiment === 'bullish' ? '🟢' :
      item.sentiment === 'bearish' ? '🔴' :
      '⚪';
    
    const majorEventLabel = detectMajorEvent(item.title);
    const timeAgo = getTimeAgo(new Date(item.pubDate));
    
    output += `${index + 1}. ${sentimentIcon} **${item.title}**`;
    if (majorEventLabel) {
      output += ` [${majorEventLabel}]`;
    }
    output += `\n`;
    output += `   _${item.source} • ${timeAgo}_\n`;
    if (item.tags.length > 0) {
      output += `   Tags: ${item.tags.join(', ')}\n`;
    }
    output += `\n`;
  });

  output += `\n💡 **Consider this news context in your analysis:**\n`;
  
  if (sentiment.overall === 'bullish') {
    output += `• Market news is predominantly positive - could support bullish setups\n`;
    output += `• Watch for momentum continuation if price action confirms\n`;
  } else if (sentiment.overall === 'bearish') {
    output += `• Market news is predominantly negative - exercise caution with longs\n`;
    output += `• Consider defensive strategies or short positions\n`;
    if (hasMajorEvents) {
      output += `• ⚠️ Major events detected - expect higher volatility and risk\n`;
    }
  } else {
    output += `• Market news sentiment is mixed - rely more on technical analysis\n`;
    output += `• Wait for clear price action signals\n`;
  }

  return output.trim();
}

/**
 * Get time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get news summary for specific symbol
 */
export async function getNewsForSymbol(symbol: string): Promise<string> {
  try {
    const news = await fetchCryptoNews(20);
    return formatNewsForAI(news, symbol);
  } catch (error: any) {
    console.error('Failed to get news for symbol:', error.message);
    return `Unable to fetch news: ${error.message}`;
  }
}

/**
 * Get general market news summary
 */
export async function getGeneralMarketNews(): Promise<string> {
  try {
    const news = await fetchCryptoNews(15);
    return formatNewsForAI(news);
  } catch (error: any) {
    console.error('Failed to get general market news:', error.message);
    return `Unable to fetch news: ${error.message}`;
  }
}

/**
 * Check if news sentiment aligns with trade direction
 */
export function isNewsSupportingTrade(
  sentiment: 'bullish' | 'bearish' | 'neutral',
  tradeDirection: 'long' | 'short'
): { aligned: boolean; confidence: 'high' | 'medium' | 'low'; warning?: string } {
  if (sentiment === 'neutral') {
    return {
      aligned: true,
      confidence: 'medium',
      warning: 'News sentiment is neutral - rely on technical analysis'
    };
  }

  const aligned = 
    (sentiment === 'bullish' && tradeDirection === 'long') ||
    (sentiment === 'bearish' && tradeDirection === 'short');

  if (aligned) {
    return {
      aligned: true,
      confidence: 'high',
    };
  } else {
    return {
      aligned: false,
      confidence: 'low',
      warning: `⚠️ News sentiment (${sentiment}) conflicts with ${tradeDirection} position. Exercise extra caution!`
    };
  }
}
