# 🚀 Quick Start: News Validation Testing

## Setup API Keys (5 minutes)

### 1. Get CryptoNews API Key (Recommended)
```bash
# 1. Visit: https://cryptonews-api.com/
# 2. Click "Get API Key" or "Sign Up"
# 3. Choose free plan
# 4. Copy your API token
```

### 2. Add to Environment
```bash
# Edit .env file
nano .env

# Add this line:
CRYPTONEWS_API_KEY=your-actual-token-here

# Save: Ctrl+X, Y, Enter
```

### 3. Restart Development Server
```bash
# Stop current server: Ctrl+C
npm run dev
```

---

## Test Signal Generation

### Method 1: Via API Endpoint
```bash
# Generate signals with news validation
curl http://localhost:3000/api/signals/generate
```

**Expected Response:**
```json
{
  "signals": [
    {
      "symbol": "BTCUSDT",
      "action": "LONG",
      "confidence": 78.5,
      "newsValidation": {
        "isValid": true,
        "combinedScore": 77.0
      },
      "newsSentiment": {
        "overall": "bullish",
        "score": 30,
        "newsCount": 12
      }
    }
  ]
}
```

### Method 2: Via Live Signal Page
1. Open browser: `http://localhost:3000/dashboard/live-signal`
2. Click "🔄 Generate New Signal"
3. View signal with news sentiment card

---

## Verify News Integration

### Check Console Logs
```bash
# Look for these logs in terminal:
✅ Using CryptoNews API for BTC
📰 Fetched 15 news items from CryptoNews for BTC
✅ Signal validated: LONG with 78.5% confidence
```

### If You See Warnings
```bash
⚠️ Using mock news for BTC (no API keys configured)
```
**Action**: API key not configured. Check `.env` file.

---

## Test Different Scenarios

### Scenario 1: Bullish News + Bullish Technical
```javascript
// Expected: Signal APPROVED with high confidence
// Technical: 85% + News: 70% = Combined: 78%
```

### Scenario 2: Bullish News + Bearish Technical
```javascript
// Expected: Signal REJECTED
// Reason: "Bearish news conflicts with LONG signal"
```

### Scenario 3: No News Available
```javascript
// Expected: Signal approved but no news boost
// Confidence: Based on technical only
```

---

## Debug Mode

### Enable Detailed Logging
```typescript
// In src/lib/trading/NewsAnalyzer.ts
// Temporarily add console.logs to debug

async fetchCryptoNews(symbol: string) {
  console.log('🔍 Fetching news for:', symbol);
  const news = await this.fetchFromCryptoNews(symbol);
  console.log('📰 News items:', news.length);
  console.log('📋 First news:', news[0]);
  return news;
}
```

---

## Common Issues & Fixes

### Issue 1: 401 Unauthorized
```bash
CryptoNews API error: 401
```
**Fix**: Invalid API key. Check your token at https://cryptonews-api.com/

### Issue 2: 429 Rate Limit
```bash
CryptoNews API error: 429
```
**Fix**: Wait 1 minute or upgrade plan. Fallback to CryptoPanic will activate.

### Issue 3: No News Returned
```bash
📰 Fetched 0 news items from CryptoNews for XYZ
```
**Fix**: Coin not supported or no recent news. Try BTC, ETH instead.

---

## Test with cURL

### Test CryptoNews API Directly
```bash
# Replace YOUR_KEY with actual key
curl "https://cryptonews-api.com/api/v1?tickers=BTC&items=10&token=YOUR_KEY"
```

**Expected Response:**
```json
{
  "data": [
    {
      "news_url": "https://...",
      "title": "Bitcoin Surges Past $45,000",
      "text": "Bitcoin price action...",
      "source_name": "CoinTelegraph",
      "date": "2024-01-15T10:30:00Z",
      "sentiment": "Positive",
      "tickers": ["BTC"]
    }
  ]
}
```

---

## Performance Testing

### Generate Multiple Signals
```bash
# Test endpoint 5 times
for i in {1..5}; do
  echo "Test $i:"
  curl -s http://localhost:3000/api/signals/generate | jq '.signals | length'
  sleep 2
done
```

### Expected Output:
```
Test 1: 3 signals
Test 2: 2 signals
Test 3: 4 signals
Test 4: 3 signals
Test 5: 2 signals
```

---

## Verify Database Storage

### Check MongoDB
```javascript
// Use MongoDB Compass or CLI
use futurepilot

// View signals with news data
db.signals.find({
  "newsSentiment": { $exists: true }
}).limit(5).pretty()
```

**Expected Fields:**
```json
{
  "symbol": "BTCUSDT",
  "action": "LONG",
  "newsValidation": {
    "isValid": true,
    "fundamentalScore": 65.0
  },
  "newsSentiment": {
    "overall": "bullish",
    "score": 30,
    "reasons": [...]
  }
}
```

---

## UI Verification Checklist

- [ ] Live Signal page shows news sentiment card
- [ ] News sentiment color-coded (🟢 green = bullish)
- [ ] News reasons displayed clearly
- [ ] Recent news count shown
- [ ] Technical + Fundamental scores visible
- [ ] Signal confidence realistic (60-90%, not 100%)

---

## Optional: Setup CryptoPanic Fallback

### Get Free API Key
```bash
# 1. Visit: https://cryptopanic.com/developers/api/
# 2. Sign up free (1000 req/day)
# 3. Get auth token
```

### Add to .env
```bash
CRYPTOPANIC_API_KEY=your-cryptopanic-token
```

### Test Priority
```
1st Try: CryptoNews API (if key exists)
2nd Try: CryptoPanic API (if key exists)
3rd Try: Mock news (development only)
```

---

## Production Checklist

Before deploying to production:

- [ ] `CRYPTONEWS_API_KEY` configured
- [ ] `OPENAI_API_KEY` configured (for AI analysis)
- [ ] `validateWithNews: true` enabled
- [ ] `requireNewsAlignment: true` enabled
- [ ] `minConfidence` set to 60-70%
- [ ] Test signal generation endpoint
- [ ] Verify UI displays news data
- [ ] Check logs for errors
- [ ] Monitor API rate limits

---

## Next Steps

After successful testing:

1. **Monitor Performance**
   - Track signal accuracy
   - Measure API response times
   - Watch for rate limit issues

2. **Fine-Tune Parameters**
   - Adjust technical/fundamental weight
   - Optimize confidence thresholds
   - Test different minConfidence values

3. **Add More Features**
   - News alerts for breaking events
   - Historical news analysis
   - Sentiment trending graphs

---

## Support

### Documentation
- Full guide: `/docs/NEWS_VALIDATION_SYSTEM.md`
- Trading config: `/docs/TRADING_CONFIG_QUICKSTART.md`

### API Documentation
- CryptoNews: https://cryptonews-api.com/documentation
- CryptoPanic: https://cryptopanic.com/developers/api/

### Need Help?
Check console logs for detailed error messages and validation reasons.

---

## Quick Commands Reference

```bash
# Start dev server
npm run dev

# Test signal generation
curl http://localhost:3000/api/signals/generate

# Check environment
echo $CRYPTONEWS_API_KEY

# View logs
tail -f .next/server.log

# Test specific coin
curl "http://localhost:3000/api/signals/generate?symbol=BTCUSDT"
```

---

**Happy Testing! 🚀📰**
