/**
 * 🤖 DeepSeek API Client
 * 
 * OpenAI-compatible API client for DeepSeek AI.
 * Cost: $0.001 per request (100x cheaper than GPT-4)
 * 
 * Documentation: https://platform.deepseek.com/api-docs/
 */

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DeepSeekResult {
  success: boolean;
  response?: string;
  tokensUsed?: number;
  cost?: number;
  error?: string;
  rawResponse?: DeepSeekResponse;
}

class DeepSeekClient {
  private apiKey: string;
  private baseURL: string = 'https://api.deepseek.com/v1';
  private model: string = 'deepseek-chat';
  private costPerToken: number = 0.000001; // $0.001 per ~1000 tokens
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('❌ DEEPSEEK_API_KEY not found in environment variables');
    }
  }
  
  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }
  
  /**
   * Send chat completion request to DeepSeek
   */
  async chat(
    messages: DeepSeekMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  ): Promise<DeepSeekResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'DeepSeek API key not configured',
      };
    }
    
    try {
      const requestBody: DeepSeekRequest = {
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 1,
      };
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DeepSeek API error:', response.status, errorText);
        
        return {
          success: false,
          error: `DeepSeek API error: ${response.status} - ${errorText}`,
        };
      }
      
      const data: DeepSeekResponse = await response.json();
      
      // Calculate cost (approximate)
      const tokensUsed = data.usage?.total_tokens || 0;
      const cost = tokensUsed * this.costPerToken;
      
      const responseText = data.choices[0]?.message?.content || '';
      
      return {
        success: true,
        response: responseText,
        tokensUsed,
        cost,
        rawResponse: data,
      };
    } catch (error: any) {
      console.error('❌ DeepSeek client error:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
  
  /**
   * Simple prompt-based chat (single message)
   */
  async prompt(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<DeepSeekResult> {
    const messages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
    
    return this.chat(messages, options);
  }
  
  /**
   * Analyze trading signal (specialized method)
   */
  async analyzeSignal(
    signal: any,
    context: {
      newsSentiment?: number;
      recentWinRate?: number;
      lossPatterns?: string[];
    }
  ): Promise<DeepSeekResult> {
    const systemPrompt = `You are an expert crypto trading analyst for FuturePilot.
Your job is to evaluate trading signals and decide if they should be executed.

IMPORTANT GUIDELINES:
- You receive signals with 75-85% technical confidence
- You can adjust confidence by ±18% based on:
  * News sentiment: ±10%
  * Recent performance: ±5%
  * Loss patterns: ±3%
- EXECUTE signal only if final confidence ≥ 82%
- Provide clear reasoning for your decision

Respond in JSON format:
{
  "decision": "EXECUTE" or "SKIP",
  "confidenceAdjustment": number (-0.18 to 0.18),
  "finalConfidence": number (0 to 1),
  "reasoning": "Clear explanation",
  "newsImpact": number (-0.10 to 0.10),
  "backtestImpact": number (-0.05 to 0.05),
  "learningImpact": number (-0.03 to 0.03)
}`;
    
    const userPrompt = `Analyze this trading signal:

SIGNAL:
Symbol: ${signal.symbol}
Action: ${signal.action}
Technical Confidence: ${(signal.confidence * 100).toFixed(1)}%
Entry: $${signal.entryPrice}
Stop Loss: $${signal.stopLoss}
Take Profit: $${signal.takeProfit}
Indicators:
- RSI: ${signal.indicators?.rsi || 'N/A'}
- MACD: ${signal.indicators?.macd || 'N/A'}
- ADX: ${signal.indicators?.adx || 'N/A'}

CONTEXT:
News Sentiment: ${context.newsSentiment !== undefined ? (context.newsSentiment * 100).toFixed(1) + '%' : 'Neutral'}
Recent Win Rate: ${context.recentWinRate !== undefined ? (context.recentWinRate * 100).toFixed(1) + '%' : 'No history'}
Loss Patterns Detected: ${context.lossPatterns && context.lossPatterns.length > 0 ? context.lossPatterns.join(', ') : 'None'}

Should this signal be executed?`;
    
    return this.prompt(systemPrompt, userPrompt, {
      temperature: 0.3, // Lower = more consistent
      maxTokens: 500,
    });
  }
  
  /**
   * Get model information
   */
  getModelInfo() {
    return {
      model: this.model,
      costPerToken: this.costPerToken,
      estimatedCostPer1000Tokens: this.costPerToken * 1000,
      baseURL: this.baseURL,
    };
  }
}

// Singleton instance
let deepseekClient: DeepSeekClient | null = null;

export function getDeepSeekClient(): DeepSeekClient {
  if (!deepseekClient) {
    deepseekClient = new DeepSeekClient();
  }
  return deepseekClient;
}

export default DeepSeekClient;
