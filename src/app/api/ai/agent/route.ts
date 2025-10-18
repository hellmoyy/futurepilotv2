import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { 
  getSystemPrompt, 
  getModelConfig, 
  getErrorMessage,
  AI_AGENT_CONFIG 
} from '@/config/ai-agent-persona';
import { 
  getMarketAnalysis, 
  formatMarketDataForAI,
  getQuickPriceInfo 
} from '@/lib/binance-market-data';
import {
  fetchCryptoNews,
  formatNewsForAI,
} from '@/lib/crypto-news';

export async function POST(request: NextRequest) {
  let imageUrl: string | null = null;
  
  try {
    const requestBody = await request.json();
    const { 
      message, 
      conversationHistory = [], 
      imageUrl: requestImageUrl = null, 
      includeMarketData = true,
      includeNews = true 
    } = requestBody;
    
    imageUrl = requestImageUrl;

    if (!message || message.trim().length < AI_AGENT_CONFIG.settings.minQueryLength) {
      return NextResponse.json(
        { error: 'Message is required and must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Detect if user is asking about specific trading pairs
    const tradingPairRegex = /\b(BTC|ETH|BNB|SOL|ADA|XRP|DOGE|MATIC|AVAX|DOT|LINK|LTC)(?:USDT)?\b/gi;
    const mentionedPairs = message.match(tradingPairRegex);
    
    // Fetch real-time market data if pairs are mentioned
    let marketDataContext = '';
    if (includeMarketData && mentionedPairs && mentionedPairs.length > 0) {
      try {
        // Get unique pairs and ensure they have USDT suffix
        const pairSet = new Set<string>();
        mentionedPairs.forEach((pair: string) => {
          const symbol = pair.toUpperCase().replace('USDT', '');
          pairSet.add(`${symbol}USDT`);
        });
        const uniquePairs = Array.from(pairSet);

        // Fetch market data for first mentioned pair (or all if multiple)
        const marketDataPromises = uniquePairs.slice(0, 3).map(async (pair) => {
          try {
            const analysis = await getMarketAnalysis(pair, '1h');
            return formatMarketDataForAI(analysis);
          } catch (error) {
            console.error(`Failed to fetch data for ${pair}:`, error);
            return null;
          }
        });

        const marketDataResults = await Promise.all(marketDataPromises);
        const validResults = marketDataResults.filter(Boolean);
        
        if (validResults.length > 0) {
          marketDataContext = `\n\n🔴 LIVE MARKET DATA (Real-time from Binance):\n${validResults.join('\n\n')}\n\nIMPORTANT: Use this REAL market data in your analysis. These are actual current prices and indicators.`;
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        // Continue without market data
      }
    }

    // Fetch crypto news if enabled
    let newsContext = '';
    if (includeNews) {
      try {
        console.log('🗞️ Fetching crypto news...');
        const news = await fetchCryptoNews(15);
        console.log(`📰 Fetched ${news.length} news articles`);
        
        if (news.length > 0) {
          // If specific pairs mentioned, filter news for them
          if (mentionedPairs && mentionedPairs.length > 0) {
            const uniquePairs = Array.from(new Set<string>(mentionedPairs.map((p: string) => p.toUpperCase().replace('USDT', '') + 'USDT')));
            console.log(`🎯 Filtering news for: ${uniquePairs[0]}`);
            newsContext = formatNewsForAI(news, uniquePairs[0]);
          } else {
            // General market news
            console.log('🌍 Using general market news');
            newsContext = formatNewsForAI(news);
          }
          
          if (newsContext) {
            newsContext = `\n\n${newsContext}\n\nIMPORTANT: Consider this news sentiment and context in your trading analysis. News can significantly impact market movements.`;
            console.log(`✅ News context added (${newsContext.length} chars)`);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch news:', error);
        // Continue without news
      }
    }

    // Limit conversation history to prevent token overflow
    const maxHistory = AI_AGENT_CONFIG.settings.maxConversationHistory;
    const limitedHistory = conversationHistory.slice(-maxHistory);

    // Build messages array for OpenAI
    const messages: any[] = [
      {
        role: 'system' as const,
        content: getSystemPrompt(),
      },
      ...limitedHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Add user message with image if provided
    if (imageUrl) {
      // Validate image URL format
      if (!imageUrl.startsWith('data:image/')) {
        console.error('❌ Invalid image URL format:', imageUrl.substring(0, 50));
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid image format. Please upload a valid image file (PNG, JPG, WebP).'
          },
          { status: 400 }
        );
      }

      console.log('📸 Processing image upload...');
      console.log('Image format:', imageUrl.substring(0, 30));
      console.log('Image size:', Math.round(imageUrl.length / 1024), 'KB');
      
      // For image analysis, use vision capabilities with educational context
      const imageAnalysisText = message || 
        'Please analyze this cryptocurrency trading chart for educational and learning purposes only. Identify technical patterns, support and resistance levels, candlestick formations, and explain the market structure as you would teach a student. This is purely for educational understanding, not investment advice.';
      
      messages.push({
        role: 'user' as const,
        content: [
          {
            type: 'text',
            text: `[EDUCATIONAL TECHNICAL ANALYSIS REQUEST]\n\n${imageAnalysisText}${marketDataContext}${newsContext}\n\nPlease provide your analysis in an educational format, explaining concepts and patterns for learning purposes.`
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high' // Use high detail for better chart analysis
            }
          }
        ]
      });
    } else {
      // Regular text message with market data context if available
      messages.push({
        role: 'user' as const,
        content: message + marketDataContext + newsContext,
      });
    }

    const modelConfig = getModelConfig();

    // Call OpenAI API with persona configuration
    const completion = await openai.chat.completions.create({
      model: modelConfig.name,
      messages,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens,
      top_p: modelConfig.topP,
      frequency_penalty: modelConfig.frequencyPenalty,
      presence_penalty: modelConfig.presencePenalty,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({
      success: true,
      response: aiResponse,
      agent: {
        name: AI_AGENT_CONFIG.name,
        version: AI_AGENT_CONFIG.version,
      },
      hasImage: !!imageUrl,
      hasMarketData: marketDataContext.length > 0,
      hasNews: newsContext.length > 0,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('AI Agent API Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      status: error.status,
      hasImage: !!imageUrl
    });
    
    // Handle content policy rejection
    if (error.code === 'content_policy_violation' || 
        error.message?.includes("can't assist") ||
        error.message?.includes('content policy') ||
        error.message?.includes('safety') ||
        error.type === 'invalid_request_error') {
      
      console.error('🚫 Content policy or safety issue detected');
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Image Analysis Unavailable',
          details: `The AI couldn't process this image. This might be due to:
          
1. Image quality or format issue
2. Content detection false positive
3. Try re-uploading with text: "Analyze this crypto chart (educational)"

Technical details: ${error.message || 'Unknown error'}`
        },
        { status: 400 }
      );
    }
    
    // Handle specific error types
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          success: false,
          error: getErrorMessage('apiError'),
          details: 'OpenAI API quota exceeded'
        },
        { status: 429 }
      );
    }

    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { 
          success: false,
          error: getErrorMessage('rateLimited'),
          details: 'Too many requests'
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: getErrorMessage('apiError'),
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint untuk mendapatkan konfigurasi AI Agent (tanpa system prompt)
export async function GET() {
  return NextResponse.json({
    success: true,
    agent: {
      name: AI_AGENT_CONFIG.name,
      role: AI_AGENT_CONFIG.role,
      version: AI_AGENT_CONFIG.version,
      expertise: AI_AGENT_CONFIG.expertise,
      quickActions: AI_AGENT_CONFIG.quickActions,
      settings: {
        supportedPairs: AI_AGENT_CONFIG.settings.supportedPairs,
        supportedTimeframes: AI_AGENT_CONFIG.settings.supportedTimeframes,
        defaultRiskPercentage: AI_AGENT_CONFIG.settings.defaultRiskPercentage,
        defaultLeverage: AI_AGENT_CONFIG.settings.defaultLeverage,
      }
    }
  });
}
