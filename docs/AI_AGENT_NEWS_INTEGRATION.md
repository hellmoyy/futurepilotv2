# AI Agent News Integration

## Overview
FuturePilot AI Agent now integrates real-time crypto news sentiment analysis to provide comprehensive trading recommendations that consider market news alongside technical analysis and live market data.

**Status:** ✅ Fully Implemented (January 2025)

## Architecture

### News Data Flow
```
RSS Feeds → News API → Crypto News Library → AI Agent API → Frontend UI
```

1. **RSS Aggregation** (`/src/app/api/news/route.ts`)
   - Aggregates news from 7 major crypto sources
   - 10-minute caching for performance
   - Built-in sentiment analysis

2. **News Processing** (`/src/lib/crypto-news.ts`)
   - Fetches and filters news
   - Calculates market sentiment (bullish/bearish/neutral)
   - Formats news for AI consumption
   - Provides trade alignment checks

3. **AI Integration** (`/src/app/api/ai/agent/route.ts`)
   - Auto-includes news in analysis
   - Pairs news with detected trading symbols
   - Appends news context to AI prompts

4. **Frontend Display** (`/src/app/dashboard/ai-agent/page.tsx`)
   - Transparent news inclusion (always on)
   - No manual toggle required

## News Sources

### Active RSS Feeds
1. **CoinDesk** - Breaking news and analysis
2. **CoinTelegraph** - Market insights and trends
3. **Decrypt** - Technology and adoption news
4. **The Block** - Institutional and regulatory updates
5. **CryptoPotato** - Price analysis and alerts
6. **U.Today** - Altcoin and ecosystem news
7. **Bitcoin.com News** - Bitcoin-focused coverage

### Coverage
- Bitcoin (BTC)
- Ethereum (ETH)
- Major altcoins (SOL, BNB, ADA, XRP, DOGE, MATIC, etc.)
- DeFi protocols
- NFT markets
- Regulatory updates
- Market sentiment shifts

## Features

### 1. Automatic News Fetching
```typescript
// In AI Agent API route
const news = await fetchCryptoNews(15); // Fetch latest 15 articles
```

### 2. Symbol-Specific Filtering
When user mentions specific trading pairs (e.g., "BTCUSDT", "ETH"), news is filtered to show relevant articles:
```typescript
// Example: User asks about BTCUSDT
// AI receives: Top 5 BTC-specific news + sentiment
```

### 3. Sentiment Analysis
Each news article is analyzed for sentiment:
- **Bullish Keywords:** pump, surge, rally, breakout, bullish, moon, ATH, adoption, institutional
- **Bearish Keywords:** dump, crash, plunge, bearish, sell-off, FUD, hack, scam, collapse

**Sentiment Calculation:**
```typescript
{
  bullish: 45.5,    // % of bullish articles
  bearish: 18.2,    // % of bearish articles
  neutral: 36.3,    // % of neutral articles
  overall: 'BULLISH' // Dominant sentiment
}
```

### 4. News Formatting for AI
News is formatted with:
- 📰 Clear section header
- 🟢 Bullish / 🔴 Bearish / ⚪ Neutral indicators
- ⏰ Time ago (e.g., "2 hours ago")
- 📊 Sentiment breakdown
- 🎯 Symbol-specific filtering

Example formatted output:
```
📰 RECENT CRYPTO NEWS (Bitcoin)

Recent Headlines (Top 5):
1. 🟢 Bitcoin Surges Past $50K as Institutions Buy - 2 hours ago
2. 🔴 SEC Warns on Crypto Regulations - 5 hours ago
3. ⚪ Ethereum Foundation Releases Update - 1 day ago
...

Market Sentiment: 📊 BULLISH (60% positive, 20% negative, 20% neutral)
```

### 5. Trade Alignment Check
System warns when news contradicts trade direction:
```typescript
isNewsSupportingTrade('BTC', 'long', newsData)
// Returns: true/false + warning if misaligned

// Example warning:
"⚠️ NEWS WARNING: Overall market sentiment is BEARISH (70%), 
but you're considering a LONG position. Recent negative news 
may impact your trade."
```

## Integration Points

### AI Agent API (`/src/app/api/ai/agent/route.ts`)

```typescript
// News is automatically included in all requests
const { includeNews = true } = await request.json();

// Fetched and formatted
const news = await fetchCryptoNews(15);
const newsContext = formatNewsForAI(news, 'BTCUSDT');

// Appended to AI prompt
const promptWithNews = message + marketDataContext + newsContext;
```

### Response Structure
```json
{
  "success": true,
  "response": "AI analysis here...",
  "hasMarketData": true,
  "hasNews": true,        // Indicates news was included
  "usage": { ... },
  "timestamp": "2025-01-09T10:30:00Z"
}
```

## Usage Examples

### Example 1: General Market Query
**User:** "What's the market sentiment today?"

**AI Response includes:**
- Live BTC/ETH prices
- 24h volume and changes
- Technical indicators (RSI, SMA, EMA)
- Latest crypto news sentiment
- Overall market analysis

### Example 2: Specific Trading Pair
**User:** "Should I long BTCUSDT?"

**AI receives:**
- BTCUSDT live data (price, volume, indicators)
- BTC-specific news (filtered)
- BTC sentiment analysis
- Support/resistance levels

**AI provides:**
- Technical analysis
- News sentiment consideration
- Risk assessment
- Entry/exit levels
- Stop-loss recommendations

### Example 3: Chart Analysis with News
**User:** *Uploads BTC chart* "Analyze this setup"

**AI receives:**
- Chart image (GPT-4o Vision)
- Live BTCUSDT market data
- Recent BTC news
- Current sentiment

**AI provides:**
- Chart pattern analysis
- Support/resistance confirmation
- News impact assessment
- Trade recommendation
- Risk management plan

## Configuration

### News Limits
```typescript
// In crypto-news.ts
const DEFAULT_NEWS_LIMIT = 15;  // Articles per fetch
const TOP_HEADLINES = 5;        // Shown to AI
```

### Cache Settings
```typescript
// In /src/app/api/news/route.ts
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
```

### Symbol Mapping
```typescript
// Supported symbols
const SYMBOL_MAP: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'BNB': 'Binance Coin',
  // ... more pairs
}
```

## Performance

### Caching Strategy
1. **API Level Cache:** 10-minute TTL for RSS feeds
2. **Deduplication:** Same headlines filtered out
3. **Limit Controls:** Max 15 articles fetched, top 5 shown

### Load Times
- News fetch: ~500-800ms (cached: ~50ms)
- Sentiment calculation: ~10-20ms
- Format for AI: ~5-10ms
- **Total overhead:** ~1 second (first request), ~100ms (cached)

### Error Handling
```typescript
try {
  const news = await fetchCryptoNews(15);
  newsContext = formatNewsForAI(news, symbol);
} catch (error) {
  console.error('News fetch failed:', error);
  // AI continues without news (graceful degradation)
}
```

## Benefits

### For Users
1. **Comprehensive Analysis** - Technical + fundamental data combined
2. **Sentiment Awareness** - Understand market mood before trading
3. **Risk Mitigation** - Warned of negative news before entering trades
4. **Contextual Decisions** - News explains price movements

### For AI Agent
1. **Better Recommendations** - More data = better advice
2. **News Justification** - Can cite recent events in analysis
3. **Sentiment Integration** - Combines TA with market psychology
4. **Timing Awareness** - Fresh news indicates momentum shifts

## Testing

### Manual Test Cases

**Test 1: News Fetch**
```bash
curl http://localhost:3001/api/news
# Should return 10+ articles with sentiment
```

**Test 2: AI with News**
```bash
curl -X POST http://localhost:3001/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Bitcoin sentiment?",
    "includeNews": true
  }'
# Response should mention recent news
```

**Test 3: Symbol-Specific News**
Query: "Analyze ETHUSDT"
Expected: ETH-specific news in AI response

**Test 4: News Warning**
Query: "Should I long BTC?" (when news is bearish)
Expected: AI warning about negative sentiment

### Validation Checks
- ✅ News API returns 10+ articles
- ✅ Sentiment analysis runs without errors
- ✅ News formatted with emojis and timestamps
- ✅ Symbol filtering works for BTC, ETH, SOL
- ✅ AI mentions news in responses
- ✅ Cache reduces load times

## Troubleshooting

### Issue: No News in AI Response
**Cause:** RSS feeds may be down or slow
**Solution:** Check `/api/news` endpoint directly
```bash
curl http://localhost:3001/api/news
```

### Issue: Wrong Symbol News
**Cause:** Symbol detection regex mismatch
**Solution:** Update `SYMBOL_MAP` in `crypto-news.ts`

### Issue: Sentiment Always Neutral
**Cause:** Keywords not matching article content
**Solution:** Review `analyzeSentiment()` in `/api/news/route.ts`

### Issue: Slow AI Responses
**Cause:** News fetch on every request
**Solution:** Verify caching works (check timestamps)

## Future Enhancements

### Planned Features
1. **Social Media Integration**
   - Twitter sentiment (X API)
   - Reddit trending topics
   - Telegram signal channels

2. **Advanced Sentiment**
   - ML-based sentiment (not just keywords)
   - Entity recognition (people, companies)
   - Event impact scoring

3. **News Alerts**
   - Real-time breaking news notifications
   - Price spike correlation
   - Unusual volume alerts

4. **Historical News**
   - Time-based news queries
   - Event backtesting
   - Sentiment history charts

5. **Custom Sources**
   - User-provided RSS feeds
   - Premium news subscriptions
   - Exchange announcements

## API Reference

### `fetchCryptoNews(limit?: number)`
Fetches latest crypto news articles.

**Parameters:**
- `limit` (optional): Max articles to return (default: 15)

**Returns:** `Promise<NewsArticle[]>`

**Example:**
```typescript
const news = await fetchCryptoNews(10);
```

---

### `formatNewsForAI(news: NewsArticle[], symbol?: string)`
Formats news for AI consumption with sentiment analysis.

**Parameters:**
- `news`: Array of news articles
- `symbol` (optional): Filter by trading symbol (e.g., 'BTCUSDT')

**Returns:** `string` (formatted text)

**Example:**
```typescript
const formatted = formatNewsForAI(news, 'BTCUSDT');
```

---

### `calculateMarketSentiment(news: NewsArticle[])`
Calculates sentiment percentages from news articles.

**Returns:**
```typescript
{
  bullish: number,    // % bullish
  bearish: number,    // % bearish
  neutral: number,    // % neutral
  overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
}
```

---

### `isNewsSupportingTrade(symbol: string, direction: 'long' | 'short', news: NewsArticle[])`
Checks if news sentiment aligns with trade direction.

**Returns:**
```typescript
{
  supported: boolean,
  warning?: string    // If misaligned
}
```

## Related Documentation
- [AI Agent Configuration](./AI_AGENT_CONFIGURATION.md)
- [Binance Market Data Integration](./BINANCE_INTEGRATION.md)
- [Live News Implementation](./LIVE_NEWS_IMPLEMENTATION.md)
- [OpenAI Integration](./OPENAI_INTEGRATION.md)

## Version History
- **v1.0** (Jan 2025) - Initial news integration with sentiment analysis
- **v1.1** (Planned) - Social media sentiment
- **v2.0** (Planned) - ML-based sentiment and event scoring

## Support
For issues or questions about news integration:
1. Check `/api/news` endpoint health
2. Review `crypto-news.ts` error logs
3. Verify RSS feed accessibility
4. Test with `includeNews: false` to isolate issues

---

**Last Updated:** January 9, 2025
**Status:** Production Ready ✅
