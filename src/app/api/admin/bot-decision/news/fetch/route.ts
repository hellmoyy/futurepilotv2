import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import NewsEvent from '@/models/NewsEvent';
import DeepSeekClient from '@/lib/ai-bot/DeepSeekClient';

/**
 * POST /api/admin/bot-decision/news/fetch
 * 
 * Fetch news dari /api/news (CryptoNews API), analisis sentiment dengan DeepSeek,
 * dan save ke NewsEvent collection untuk digunakan di Bot Decision Layer.
 * 
 * Protected: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    console.log('📰 Fetching news from /api/news...');

    // Fetch dari existing news API
    const newsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/news`, {
      cache: 'no-store',
    });

    if (!newsResponse.ok) {
      throw new Error('Failed to fetch from /api/news');
    }

    const newsData = await newsResponse.json();

    if (!newsData.success || !Array.isArray(newsData.data)) {
      throw new Error('Invalid news data structure');
    }

    console.log(`✅ Fetched ${newsData.data.length} articles from CryptoNews API`);

    const client = new DeepSeekClient();
    const results: any[] = [];
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const article of newsData.data) {
      try {
        const url = article.url;
        const title = article.title || 'No title';
        const description = article.description || '';
        const source = article.source || 'CryptoNews';
        const publishedAt = new Date(article.publishedAt);

        // Check if already exists
        const existing = await NewsEvent.findOne({ url });

        if (existing && existing.aiProcessedAt) {
          // Already processed, skip
          skipped++;
          results.push({ url, status: 'skipped', reason: 'already_processed' });
          continue;
        }

        // Analyze sentiment dengan DeepSeek
        console.log(`🤖 Analyzing sentiment for: ${title.slice(0, 50)}...`);

        const systemPrompt = `You are a crypto news sentiment analyzer. Analyze the title and description, then return ONLY valid JSON with these exact keys:
{
  "sentiment": number between -1 (very bearish) and 1 (very bullish),
  "label": one of "very_bearish" | "bearish" | "neutral" | "bullish" | "very_bullish",
  "confidence": number between 0 and 1,
  "impact": one of "low" | "medium" | "high",
  "impactScore": number between 0 and 100,
  "keywords": array of relevant keywords (max 5),
  "categories": array of categories like ["regulation", "adoption", "technology"] (max 3),
  "mentionedSymbols": array of trading pairs mentioned like ["BTCUSDT", "ETHUSDT"] (extract from tags if available)
}`;

        const userPrompt = `Analyze this crypto news article:

TITLE: ${title}

DESCRIPTION: ${description}

TAGS: ${article.tags?.join(', ') || 'none'}

Provide sentiment analysis in JSON format.`;

        const analysis = await client.prompt(systemPrompt, userPrompt, { 
          maxTokens: 400,
          temperature: 0.3,
        });

        let sentimentData: any = {
          sentiment: 0,
          label: 'neutral',
          confidence: 0.5,
          impact: 'low',
          impactScore: 30,
          keywords: article.tags?.slice(0, 5) || [],
          categories: article.categories?.slice(0, 3) || ['News'],
          mentionedSymbols: [],
        };

        // Parse DeepSeek response
        if (analysis.success && analysis.response) {
          try {
            const parsed = JSON.parse(analysis.response.trim());
            sentimentData = {
              sentiment: parsed.sentiment ?? sentimentData.sentiment,
              label: parsed.label || sentimentData.label,
              confidence: parsed.confidence ?? sentimentData.confidence,
              impact: parsed.impact || sentimentData.impact,
              impactScore: parsed.impactScore ?? sentimentData.impactScore,
              keywords: Array.isArray(parsed.keywords) ? parsed.keywords : sentimentData.keywords,
              categories: Array.isArray(parsed.categories) ? parsed.categories : sentimentData.categories,
              mentionedSymbols: Array.isArray(parsed.mentionedSymbols) ? parsed.mentionedSymbols : sentimentData.mentionedSymbols,
            };
          } catch (parseError) {
            console.warn('⚠️ Failed to parse DeepSeek response, using fallback:', parseError);
            
            // Fallback: Use CryptoNews API sentiment
            if (article.sentiment === 'bullish') {
              sentimentData.sentiment = 0.6;
              sentimentData.label = 'bullish';
              sentimentData.confidence = 0.7;
            } else if (article.sentiment === 'bearish') {
              sentimentData.sentiment = -0.6;
              sentimentData.label = 'bearish';
              sentimentData.confidence = 0.7;
            }
          }
        }

        // Upsert ke NewsEvent
        if (existing) {
          // Update existing
          existing.title = title;
          existing.description = description;
          existing.content = description; // CryptoNews doesn't provide full content
          existing.source = source;
          existing.publishedAt = publishedAt;
          existing.sentiment = sentimentData.sentiment;
          existing.sentimentLabel = sentimentData.label as any;
          existing.confidence = sentimentData.confidence;
          existing.impact = sentimentData.impact as any;
          existing.impactScore = sentimentData.impactScore;
          existing.keywords = sentimentData.keywords;
          existing.categories = sentimentData.categories;
          existing.mentionedSymbols = sentimentData.mentionedSymbols;
          existing.imageUrl = article.imageUrl;
          existing.aiProcessedAt = new Date();
          existing.aiProvider = 'deepseek';
          existing.aiCost = analysis.cost || 0.001;
          await existing.save();
          
          updated++;
          results.push({ url, status: 'updated', sentiment: sentimentData.label });
        } else {
          // Create new
          await NewsEvent.create({
            title,
            description,
            content: description,
            url,
            imageUrl: article.imageUrl,
            source,
            publishedAt,
            sentiment: sentimentData.sentiment,
            sentimentLabel: sentimentData.label as any,
            confidence: sentimentData.confidence,
            impact: sentimentData.impact as any,
            impactScore: sentimentData.impactScore,
            keywords: sentimentData.keywords,
            categories: sentimentData.categories,
            mentionedSymbols: sentimentData.mentionedSymbols,
            impactedDecisions: 0,
            relevanceScore: sentimentData.confidence,
            aiProcessedAt: new Date(),
            aiProvider: 'deepseek',
            aiCost: analysis.cost || 0.001,
            language: 'en',
            region: 'global',
          });
          
          added++;
          results.push({ url, status: 'created', sentiment: sentimentData.label });
        }

        console.log(`✅ Processed: ${title.slice(0, 40)}... [${sentimentData.label}]`);
        
      } catch (err: any) {
        console.error('❌ Error processing article:', err);
        results.push({ 
          url: article.url || null, 
          status: 'error', 
          error: err.message || String(err) 
        });
      }
    }

    console.log(`✅ Sync complete: ${added} added, ${updated} updated, ${skipped} skipped`);

    return NextResponse.json({ 
      success: true, 
      added, 
      updated, 
      skipped,
      total: newsData.data.length,
      results,
      message: `Synced ${added + updated} articles from CryptoNews API`,
    });
    
  } catch (error: any) {
    console.error('❌ POST /api/admin/bot-decision/news/fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error) 
    }, { status: 500 });
  }
}
