import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_MODELS } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { symbol, timeframe = '1h', indicators = [] } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const analysisPrompt = `Analyze ${symbol} on ${timeframe} timeframe.
    
Consider:
- Current market trend
- Support and resistance levels
- Volume analysis
- ${indicators.length > 0 ? `Technical indicators: ${indicators.join(', ')}` : 'Key technical indicators'}

Provide:
1. Market outlook (Bullish/Bearish/Neutral)
2. Key price levels
3. Trade recommendations
4. Risk management suggestions`;

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.GPT4O,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical analyst for cryptocurrency and forex markets.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const analysis = completion.choices[0]?.message?.content || 'Analysis not available';

    return NextResponse.json({
      success: true,
      symbol,
      timeframe,
      analysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Market Analysis Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze market',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
