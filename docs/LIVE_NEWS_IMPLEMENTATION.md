# Live News Implementation

## Current Status

**Status**: Using fallback data (demo mode)  
**Reason**: Free crypto news APIs have strict rate limits

## API Options Evaluated

### 1. ❌ CryptoCompare (REJECTED)
- **Issue**: Rate limit exceeded (50K/month free tier)
- **Limit**: 300 calls/minute, 7,500 calls/day
- **Cost**: $39/month for unlimited
- **Endpoint**: `https://min-api.cryptocompare.com/data/v2/news/`

### 2. ✅ NewsAPI.org (RECOMMENDED for Production)
- **Free Tier**: 100 requests/day
- **Paid**: $449/month for unlimited
- **Endpoint**: `https://newsapi.org/v2/everything?q=cryptocurrency`
- **Features**: 
  - Search by keyword
  - Filter by source, date, language
  - Full article content
  - Image URLs

### 3. ✅ CoinGecko (ALTERNATIVE)
- **Free Tier**: No official news API
- **Alternative**: Use status updates endpoint
- **Rate Limit**: 30 calls/minute (free)
- **Endpoint**: `/coins/{id}/status_updates`

### 4. ✅ RSS Feed Aggregator (FREE)
- **Sources**:
  - CoinDesk: https://www.coindesk.com/arc/outboundfeeds/rss/
  - CoinTelegraph: https://cointelegraph.com/rss
  - Bitcoin Magazine: https://bitcoinmagazine.com/feed
  - Decrypt: https://decrypt.co/feed
- **Pros**: Completely free, no limits
- **Cons**: Need to parse RSS/XML, no sentiment data

## Current Implementation

**File**: `/src/app/api/news/route.ts`

### Features:
- ✅ Server-side caching (5 minutes)
- ✅ Fallback to demo data
- ✅ Sentiment analysis
- ✅ Error handling
- ✅ Auto-refresh on client

### Fallback Data:
```typescript
FALLBACK_NEWS = [
  // 5 curated news items with images
  // Rotated timestamps for freshness appearance
]
```

## Production Implementation Options

### Option A: NewsAPI.org (Easiest)

**Steps**:
1. Sign up at https://newsapi.org/
2. Get API key (100 free requests/day)
3. Update `/src/app/api/news/route.ts`:

```typescript
const response = await fetch(
  `https://newsapi.org/v2/everything?q=cryptocurrency+bitcoin+ethereum&sortBy=publishedAt&language=en&apiKey=${process.env.NEWSAPI_KEY}`,
  { next: { revalidate: 300 } }
);

const data = await response.json();
const transformedNews = data.articles.slice(0, 20).map((item: any) => ({
  id: item.url,
  title: item.title,
  description: item.description || item.content?.substring(0, 200) + '...',
  source: item.source.name,
  url: item.url,
  imageUrl: item.urlToImage,
  publishedAt: item.publishedAt,
  sentiment: analyzeSentiment(item.title, item.description || ''),
  tags: ['Crypto', 'News'],
  categories: ['Market'],
}));
```

4. Add to `.env`:
```bash
NEWSAPI_KEY=your_api_key_here
```

**Cost**: 
- FREE: 100 requests/day (sufficient with 5-min cache)
- With cache: ~288 requests/day max → Need paid plan ($449/month)

### Option B: RSS Feed Aggregator (FREE & Unlimited)

**Steps**:
1. Install RSS parser:
```bash
npm install rss-parser
```

2. Update API route:
```typescript
import Parser from 'rss-parser';

const parser = new Parser();
const feeds = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
  'https://bitcoinmagazine.com/feed',
];

const allNews = [];
for (const feedUrl of feeds) {
  const feed = await parser.parseURL(feedUrl);
  feed.items.forEach(item => {
    allNews.push({
      id: item.guid || item.link,
      title: item.title,
      description: item.contentSnippet || item.content?.substring(0, 200),
      source: feed.title,
      url: item.link,
      imageUrl: item.enclosure?.url || item['media:content']?.url,
      publishedAt: item.pubDate,
      sentiment: analyzeSentiment(item.title, item.contentSnippet || ''),
    });
  });
}

// Sort by date and take latest 20
const sortedNews = allNews.sort((a, b) => 
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
).slice(0, 20);
```

**Pros**:
- ✅ Completely FREE
- ✅ Unlimited requests
- ✅ Multiple reputable sources
- ✅ Real-time updates

**Cons**:
- ⚠️ Need to parse XML/RSS
- ⚠️ Image URLs might be inconsistent
- ⚠️ No built-in sentiment

### Option C: Hybrid Approach (BEST)

1. Use RSS for primary data (free)
2. Use OpenAI for sentiment analysis (already integrated)
3. Cache aggressively (30 minutes)

```typescript
// Fetch from RSS
const rssNews = await fetchFromRSS();

// Analyze sentiment with OpenAI (batched)
const newsWithSentiment = await analyzeSentimentBatch(rssNews);

// Cache for 30 minutes
newsCache = {
  data: newsWithSentiment,
  timestamp: Date.now(),
};
```

**Cost**: FREE (OpenAI already paid)

## Recommended Action

**For Development/Demo**: 
- ✅ Current implementation (fallback data) is fine

**For Production**:
1. **Phase 1** (FREE): Implement RSS aggregator
2. **Phase 2** (Optional): Add OpenAI sentiment if needed
3. **Phase 3** (Paid): Switch to NewsAPI.org if traffic is high

## Implementation Checklist

- [x] Create `/api/news` endpoint
- [x] Add server-side caching
- [x] Add fallback data
- [x] Add sentiment analysis
- [x] Create Live News page UI
- [ ] Implement RSS parser (production)
- [ ] Add OpenAI sentiment (optional)
- [ ] Add news images from Unsplash API (free)
- [ ] Add admin panel to manage news sources

## Testing

**Local**: 
```bash
curl http://localhost:3000/api/news | jq
```

**Expected Response**:
```json
{
  "success": true,
  "data": [...],
  "cached": false,
  "count": 5,
  "source": "fallback"
}
```

## Notes

- Cache duration: 5 minutes (configurable)
- Fallback data: 5 news items (manually curated)
- Sentiment keywords: 15 bullish, 15 bearish
- Auto-refresh: Every 5 minutes on client
