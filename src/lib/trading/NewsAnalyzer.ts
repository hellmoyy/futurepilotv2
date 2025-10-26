/**
 * 📰 NEWS ANALYZER
 * 
 * Fetch and analyze crypto news untuk fundamental analysis
 * Combines dengan technical signals untuk validasi
 */

import OpenAI from 'openai';

// ============================================================================
// 📊 INTERFACES
// ============================================================================

export interface NewsItem {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface NewsSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number; // -100 to +100
  confidence: number; // 0-100
  reasons: string[];
  newsCount: number;
  recentNews: NewsItem[];
}

export interface SignalValidation {
  isValid: boolean;
  reasons: string[];
  warnings: string[];
  fundamentalScore: number; // 0-100
  technicalScore: number; // 0-100
  combinedScore: number; // 0-100
  sentiment: NewsSentiment;
}

// ============================================================================
// 📰 NEWS ANALYZER CLASS
// ============================================================================

export class NewsAnalyzer {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  // ==========================================================================
  // 📰 Fetch Crypto News
  // ==========================================================================

  async fetchCryptoNews(symbol: string): Promise<NewsItem[]> {
    try {
      // Extract base currency (BTCUSDT -> BTC)
      const baseCurrency = symbol.replace('USDT', '').replace('BUSD', '');
      
      // Try CryptoNews API first (best quality + sentiment included)
      if (process.env.CRYPTONEWS_API_KEY) {
        const news = await this.fetchFromCryptoNews(baseCurrency);
        if (news.length > 0) {
          console.log(`✅ Using CryptoNews API for ${baseCurrency}`);
          return news;
        }
      }
      
      // Fallback to CryptoPanic API
      if (process.env.CRYPTOPANIC_API_KEY) {
        const news = await this.fetchFromCryptoPanic(baseCurrency);
        if (news.length > 0) {
          console.log(`✅ Using CryptoPanic API for ${baseCurrency}`);
          return news;
        }
      }
      
      // Final fallback: Generate mock news for development
      console.log(`⚠️ Using mock news for ${baseCurrency} (no API keys configured)`);
      return this.getMockNews(baseCurrency);
      
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  // ==========================================================================
  // 🌟 Fetch from CryptoNews API (Primary Source)
  // ==========================================================================
  // Features: Pre-analyzed sentiment, curated content, multiple sources
  // NEW Endpoint: https://cryptonews-api.com/api/v1/category?section=alltickers&items=50&token=KEY

  private async fetchFromCryptoNews(currency: string): Promise<NewsItem[]> {
    try {
      const apiKey = process.env.CRYPTONEWS_API_KEY;
      if (!apiKey) {
        console.log('⚠️ CRYPTONEWS_API_KEY not configured');
        return [];
      }

      // Fetch all crypto news from category endpoint
      // Using alltickers section to get comprehensive crypto news
      const url = `https://cryptonews-api.com/api/v1/category?section=alltickers&items=50&page=1&token=${apiKey}`;
      
      console.log(`📡 Fetching news from CryptoNews API...`);
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 180 } // Cache 3 minutes for fresher news
      });

      if (!response.ok) {
        console.error(`❌ CryptoNews API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        console.log('⚠️ Invalid response from CryptoNews API');
        return [];
      }

      // Filter news relevant to the currency
      const relevantNews = data.data.filter((item: any) => {
        const text = `${item.title} ${item.text || ''}`.toLowerCase();
        const currencyLower = currency.toLowerCase();
        // Check if news mentions the currency
        return text.includes(currencyLower) || 
               (item.tickers && item.tickers.includes(currency.toUpperCase()));
      });

      // Transform to NewsItem format
      const newsItems: NewsItem[] = relevantNews
        .filter((item: any) => item.title && item.news_url) // Filter valid items
        .slice(0, 15) // Limit to 15 most recent
        .map((item: any) => ({
          title: item.title,
          description: item.text || item.title,
          source: item.source_name || 'CryptoNews',
          publishedAt: item.date || new Date().toISOString(),
          url: item.news_url,
          // CryptoNews provides sentiment: 'Positive', 'Negative', 'Neutral'
          sentiment: (item.sentiment?.toLowerCase() || 'neutral') as 'positive' | 'negative' | 'neutral',
        }));

      console.log(`📰 Fetched ${newsItems.length} relevant news items for ${currency} (from ${data.data.length} total)`);
      return newsItems;
      
    } catch (error) {
      console.error('Error fetching from CryptoNews:', error);
      return [];
    }
  }

  // ==========================================================================
  // 🔍 Fetch from CryptoPanic API (Fallback Source)
  // ==========================================================================

  private async fetchFromCryptoPanic(currency: string): Promise<NewsItem[]> {
    try {
      const apiKey = process.env.CRYPTOPANIC_API_KEY;
      if (!apiKey) {
        return [];
      }

      const response = await fetch(
        `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&currencies=${currency}&filter=hot&public=true`,
        { next: { revalidate: 300 } } // Cache 5 minutes
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      return data.results?.slice(0, 10).map((item: any) => ({
        title: item.title,
        description: item.title,
        source: item.source?.title || 'CryptoPanic',
        publishedAt: item.published_at,
        url: item.url,
        sentiment: this.detectBasicSentiment(item.title),
      })) || [];
      
    } catch (error) {
      console.error('Error fetching from CryptoPanic:', error);
      return [];
    }
  }

  // ==========================================================================
  // 🤖 Analyze News with AI
  // ==========================================================================

  // NEW: Get sentiment without technical signal context
  async getSentiment(news: NewsItem[], symbol: string): Promise<NewsSentiment> {
    if (!this.openai || news.length === 0) {
      return {
        overall: 'neutral',
        score: 0,
        confidence: 0,
        reasons: ['No news available for analysis'],
        newsCount: 0,
        recentNews: [],
      };
    }

    try {
      const baseCurrency = symbol.replace('USDT', '').replace('BUSD', '');
      
      // Prepare news context
      const newsContext = news
        .slice(0, 5)
        .map((item, i) => `${i + 1}. ${item.title} (${item.source})`)
        .join('\n');

      const prompt = `Analyze these recent crypto news about ${baseCurrency} and determine the overall market sentiment:

Recent News:
${newsContext}

Provide analysis in JSON format:
{
  "overall": "bullish|bearish|neutral",
  "score": -100 to +100 (-100 = very bearish, +100 = very bullish),
  "confidence": 0-100 (how confident you are in this assessment),
  "reasons": ["reason 1", "reason 2", ...],
  "summary": "brief explanation"
}

Focus on:
1. Major events (hacks, regulations, partnerships, adoption)
2. Market-moving news vs noise
3. Overall sentiment (bullish/bearish/neutral)
4. Urgency level`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a crypto fundamental analyst. Analyze news sentiment objectively.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse AI response
      const analysis = JSON.parse(aiResponse);

      return {
        overall: analysis.overall,
        score: analysis.score,
        confidence: analysis.confidence,
        reasons: analysis.reasons || [],
        newsCount: news.length,
        recentNews: news.slice(0, 3),
      };
      
    } catch (error) {
      console.error('Error analyzing news with AI:', error);
      
      // Fallback to basic sentiment
      return this.analyzeNewsBasic(news);
    }
  }

  async analyzeNewsWithAI(
    symbol: string,
    news: NewsItem[],
    technicalSignal: 'LONG' | 'SHORT' | 'HOLD'
  ): Promise<NewsSentiment> {
    if (!this.openai || news.length === 0) {
      return {
        overall: 'neutral',
        score: 0,
        confidence: 0,
        reasons: ['No news available for analysis'],
        newsCount: 0,
        recentNews: [],
      };
    }

    try {
      const baseCurrency = symbol.replace('USDT', '').replace('BUSD', '');
      
      // Prepare news context
      const newsContext = news
        .slice(0, 5)
        .map((item, i) => `${i + 1}. ${item.title} (${item.source})`)
        .join('\n');

      const prompt = `Analyze these recent crypto news about ${baseCurrency} and determine if they support a ${technicalSignal} trading signal:

Recent News:
${newsContext}

Technical Signal: ${technicalSignal}

Provide analysis in JSON format:
{
  "overall": "bullish|bearish|neutral",
  "score": -100 to +100,
  "confidence": 0-100,
  "reasons": ["reason 1", "reason 2", ...],
  "conflictsWithTechnical": true|false,
  "summary": "brief explanation"
}

Focus on:
1. Does news sentiment align with technical signal?
2. Any major events (regulations, partnerships, hacks, etc)?
3. Market-moving news vs noise
4. Recent momentum (bullish/bearish)`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a crypto fundamental analyst. Analyze news sentiment and validate trading signals.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse AI response
      const analysis = JSON.parse(aiResponse);

      return {
        overall: analysis.overall,
        score: analysis.score,
        confidence: analysis.confidence,
        reasons: analysis.reasons || [],
        newsCount: news.length,
        recentNews: news.slice(0, 3),
      };
      
    } catch (error) {
      console.error('Error analyzing news with AI:', error);
      
      // Fallback to basic sentiment
      return this.analyzeNewsBasic(news);
    }
  }

  // ==========================================================================
  // 📊 Basic News Sentiment Analysis (Fallback)
  // ==========================================================================

  private analyzeNewsBasic(news: NewsItem[]): NewsSentiment {
    let positiveCount = 0;
    let negativeCount = 0;
    const reasons: string[] = [];

    news.forEach((item) => {
      if (item.sentiment === 'positive') positiveCount++;
      if (item.sentiment === 'negative') negativeCount++;
    });

    const score = ((positiveCount - negativeCount) / news.length) * 100;
    let overall: 'bullish' | 'bearish' | 'neutral' = 'neutral';

    if (score > 20) {
      overall = 'bullish';
      reasons.push(`📰 ${positiveCount} positive news vs ${negativeCount} negative`);
    } else if (score < -20) {
      overall = 'bearish';
      reasons.push(`📰 ${negativeCount} negative news vs ${positiveCount} positive`);
    } else {
      reasons.push('📰 Mixed news sentiment - no clear direction');
    }

    return {
      overall,
      score,
      confidence: Math.min((news.length / 5) * 50, 70), // Max 70% for basic analysis
      reasons,
      newsCount: news.length,
      recentNews: news.slice(0, 3),
    };
  }

  // ==========================================================================
  // ✅ Validate Signal with News
  // ==========================================================================

  async validateSignal(
    symbol: string,
    technicalSignal: 'LONG' | 'SHORT' | 'HOLD',
    technicalConfidence: number,
    technicalReasons: string[]
  ): Promise<SignalValidation> {
    // Fetch news
    const news = await this.fetchCryptoNews(symbol);
    
    // Analyze sentiment
    const sentiment = await this.analyzeNewsWithAI(symbol, news, technicalSignal);

    const reasons: string[] = [...technicalReasons];
    const warnings: string[] = [];
    let isValid = true;

    // Calculate scores
    const technicalScore = technicalConfidence;
    const fundamentalScore = Math.min((sentiment.confidence * Math.abs(sentiment.score)) / 100, 100);

    // Check alignment
    if (technicalSignal === 'LONG' && sentiment.overall === 'bearish') {
      isValid = false;
      warnings.push('⚠️ Technical signal LONG conflicts with BEARISH news sentiment');
      warnings.push(`📰 News sentiment: ${sentiment.score.toFixed(0)} (bearish)`);
    } else if (technicalSignal === 'SHORT' && sentiment.overall === 'bullish') {
      isValid = false;
      warnings.push('⚠️ Technical signal SHORT conflicts with BULLISH news sentiment');
      warnings.push(`📰 News sentiment: ${sentiment.score.toFixed(0)} (bullish)`);
    } else if (technicalSignal !== 'HOLD') {
      // Aligned or neutral
      if (sentiment.overall === technicalSignal.toLowerCase()) {
        reasons.push(...sentiment.reasons);
        reasons.push(`✅ News sentiment confirms ${technicalSignal} signal`);
      } else if (sentiment.overall === 'neutral') {
        warnings.push('⚠️ News sentiment neutral - proceed with caution');
      }
    }

    // Combined score (weighted: 60% technical, 40% fundamental)
    let combinedScore = (technicalScore * 0.6) + (fundamentalScore * 0.4);

    // Penalize conflicting signals
    if (!isValid) {
      combinedScore *= 0.5; // 50% penalty
    }

    return {
      isValid,
      reasons,
      warnings,
      fundamentalScore,
      technicalScore,
      combinedScore,
      sentiment,
    };
  }

  // ==========================================================================
  // 🔤 Helper: Get Coin Name
  // ==========================================================================

  private getCoinName(symbol: string): string {
    const names: { [key: string]: string } = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      BNB: 'Binance Coin',
      SOL: 'Solana',
      XRP: 'Ripple',
      ADA: 'Cardano',
      DOGE: 'Dogecoin',
      DOT: 'Polkadot',
      MATIC: 'Polygon',
      AVAX: 'Avalanche',
    };
    return names[symbol] || symbol;
  }

  // ==========================================================================
  // 🎭 Helper: Basic Sentiment Detection
  // ==========================================================================

  private detectBasicSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['surge', 'rally', 'bullish', 'gains', 'soar', 'breakthrough', 'adoption', 'partnership', 'launch', 'success'];
    const negativeWords = ['crash', 'plunge', 'bearish', 'losses', 'dump', 'hack', 'scam', 'ban', 'warning', 'lawsuit'];

    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // ==========================================================================
  // 🎭 Mock News for Development
  // ==========================================================================

  private getMockNews(currency: string): NewsItem[] {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return [
      {
        title: `${currency} shows strong momentum as adoption increases`,
        description: 'Market analysis suggests continued growth',
        source: 'CryptoNews',
        publishedAt: hourAgo.toISOString(),
        url: '#',
        sentiment: 'positive',
      },
      {
        title: `${currency} trading volume reaches new high`,
        description: 'Increased institutional interest detected',
        source: 'CoinDesk',
        publishedAt: dayAgo.toISOString(),
        url: '#',
        sentiment: 'positive',
      },
    ];
  }
}

export default NewsAnalyzer;
