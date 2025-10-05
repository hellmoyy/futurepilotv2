// OpenAI Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  success: boolean;
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
  details?: string;
}

export interface AnalyzeRequest {
  symbol: string;
  timeframe?: string;
  indicators?: string[];
}

export interface AnalyzeResponse {
  success: boolean;
  symbol: string;
  timeframe: string;
  analysis: string;
  timestamp: string;
  error?: string;
  details?: string;
}
