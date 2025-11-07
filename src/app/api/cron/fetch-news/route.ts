import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NewsEvent from '@/models/NewsEvent';

/**
 * Helper: Map sentiment string to number (-1 to 1)
 */
function mapSentimentToNumber(sentiment: string): number {
  switch (sentiment?.toLowerCase()) {
    case 'bullish':
    case 'positive':
      return 0.7;
    case 'bearish':
    case 'negative':
      return -0.7;
    case 'neutral':
    default:
      return 0;
  }
}

/**
 * Helper: Map sentiment number to label
 */
function mapSentimentToLabel(sentiment: number): 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish' {
  if (sentiment >= 0.6) return 'very_bullish';
  if (sentiment >= 0.2) return 'bullish';
  if (sentiment <= -0.6) return 'very_bearish';
  if (sentiment <= -0.2) return 'bearish';
  return 'neutral';
}

/**
 * GET /api/cron/fetch-news
 * 
 * Cron job to automatically fetch and analyze news every 1 minute.
 * 
 * Process:
 * 1. Fetch news from /api/news (CryptoNews API)
 * 2. Analyze sentiment with DeepSeek AI
 * 3. Save to NewsEvent collection
 * 4. Remove duplicates and old news
 * 
 * Schedule: Every 1 minute via cron job
 * 
 * Protected: Internal cron only (check Authorization header)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization (Railway/Vercel cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-12345';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    console.log('🕐 [CRON] Starting news fetch job...');

    // 1. Fetch news from /api/news
    const newsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/news`, {
      cache: 'no-store',
    });

    if (!newsResponse.ok) {
      throw new Error('Failed to fetch from /api/news');
    }

    const newsData = await newsResponse.json();

    if (!newsData.success || !newsData.data) {
      throw new Error('Invalid response from /api/news');
    }

    console.log(`📰 Fetched ${newsData.data.length} articles from CryptoNews API`);

    // 2. Process each news article
    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const article of newsData.data) {
      try {
        // Check if news already exists (by URL)
        const existing = await NewsEvent.findOne({ url: article.url });

        if (existing) {
          // Update if sentiment changed or missing data
          const newSentiment = mapSentimentToNumber(article.sentiment);
          if (existing.sentiment !== newSentiment) {
            existing.sentiment = newSentiment;
            existing.sentimentLabel = mapSentimentToLabel(newSentiment);
            existing.confidence = 0.8; // Default confidence from CryptoNews API
            await existing.save();
            updatedCount++;
          } else {
            skippedCount++;
          }
          continue;
        }

        // 3. Analyze sentiment with DeepSeek AI (if API key available)
        let aiAnalysis = null;
        const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

        if (deepseekApiKey) {
          try {
            const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekApiKey}`,
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                  {
                    role: 'system',
                    content: `You are a crypto trading sentiment analyst. Analyze news articles and return JSON with:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "keyFactors": ["factor1", "factor2"],
  "tradingImpact": "positive|negative|neutral"
}`,
                  },
                  {
                    role: 'user',
                    content: `Analyze this crypto news:\n\nTitle: ${article.title}\n\nDescription: ${article.description}\n\nTags: ${article.tags?.join(', ') || 'none'}`,
                  },
                ],
                temperature: 0.3,
                max_tokens: 500,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices[0]?.message?.content;
              
              if (content) {
                // Try to parse JSON from response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  aiAnalysis = JSON.parse(jsonMatch[0]);
                }
              }
            }
          } catch (aiError) {
            console.warn('⚠️ DeepSeek AI analysis failed, using fallback:', aiError);
          }
        }

        // 4. Save to database
        const sentimentNumber = aiAnalysis?.sentiment ? mapSentimentToNumber(aiAnalysis.sentiment) : mapSentimentToNumber(article.sentiment);
        
        const newsEvent = new NewsEvent({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source,
          imageUrl: article.imageUrl,
          publishedAt: new Date(article.publishedAt),
          
          // Sentiment fields
          sentiment: sentimentNumber,
          sentimentLabel: mapSentimentToLabel(sentimentNumber),
          confidence: aiAnalysis?.confidence || 0.7,
          
          // Impact assessment
          impact: aiAnalysis?.tradingImpact === 'positive' || aiAnalysis?.tradingImpact === 'negative' ? 'medium' : 'low',
          impactScore: Math.abs(sentimentNumber) * 100,
          
          // Categorization
          keywords: article.tags || [],
          categories: article.categories || ['general'],
          mentionedSymbols: [], // Will be populated if we detect symbols in title/description
          
          // Metrics
          impactedDecisions: 0,
          relevanceScore: 0.5,
          
          // AI processing
          aiProcessedAt: aiAnalysis ? new Date() : undefined,
          aiProvider: aiAnalysis ? 'deepseek' : undefined,
          
          // Metadata
          language: 'en',
          region: 'global',
        });

        await newsEvent.save();
        newCount++;

      } catch (itemError: any) {
        errors.push(`Failed to process "${article.title}": ${itemError.message}`);
        console.error(`❌ Error processing article:`, itemError);
      }
    }

    // 5. Clean up old news (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deleteResult = await NewsEvent.deleteMany({
      publishedAt: { $lt: sevenDaysAgo },
    });

    console.log(`🧹 Deleted ${deleteResult.deletedCount} old news (>7 days)`);

    // 6. Return summary
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      processed: newsData.data.length,
      new: newCount,
      updated: updatedCount,
      skipped: skippedCount,
      deleted: deleteResult.deletedCount,
      errors: errors.length,
      errorDetails: errors.slice(0, 5), // Only first 5 errors
    };

    console.log(`✅ [CRON] News fetch completed:`, summary);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('❌ [CRON] News fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow manual trigger for testing (POST)
export async function POST(request: NextRequest) {
  // Manual trigger doesn't require auth (admin only via frontend)
  return GET(request);
}
