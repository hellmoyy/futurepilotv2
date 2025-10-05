import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_MODELS, TRADING_SYSTEM_PROMPT } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build messages array for OpenAI
    const messages = [
      {
        role: 'system' as const,
        content: TRADING_SYSTEM_PROMPT,
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.GPT4O,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({
      success: true,
      response: aiResponse,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get AI response',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
