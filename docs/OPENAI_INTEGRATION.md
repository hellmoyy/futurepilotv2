# OpenAI Integration Guide

## Setup

### 1. Install Dependencies
```bash
npm install openai
```

### 2. Configure Environment Variables
Add your OpenAI API key to `.env`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

## API Endpoints

### 1. AI Chat (`/api/ai/chat`)
Conversational AI for trading insights and questions.

**Request:**
```typescript
POST /api/ai/chat
Content-Type: application/json

{
  "message": "What's the current trend for BTC?",
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI response text...",
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 456,
    "total_tokens": 579
  }
}
```

### 2. Market Analysis (`/api/ai/analyze`)
Technical analysis for trading pairs.

**Request:**
```typescript
POST /api/ai/analyze
Content-Type: application/json

{
  "symbol": "BTC/USDT",
  "timeframe": "1h",
  "indicators": ["RSI", "MACD", "Moving Averages"]
}
```

**Response:**
```json
{
  "success": true,
  "symbol": "BTC/USDT",
  "timeframe": "1h",
  "analysis": "Detailed AI analysis...",
  "timestamp": "2025-10-05T12:00:00Z"
}
```

## Components

### AIChat Component
Interactive chat interface with AI assistant.

**Usage:**
```tsx
import AIChat from '@/components/AIChat';

export default function Page() {
  return <AIChat />;
}
```

**Features:**
- Real-time conversation
- Message history
- Loading states
- Error handling

### MarketAnalyzer Component
Market analysis tool with AI insights.

**Usage:**
```tsx
import MarketAnalyzer from '@/components/MarketAnalyzer';

export default function Page() {
  return <MarketAnalyzer />;
}
```

**Features:**
- Symbol selection (popular pairs + custom)
- Timeframe selection
- Technical indicator analysis
- Real-time results

## Configuration

### OpenAI Library (`src/lib/openai.ts`)

**Available Models:**
- `GPT4O` - GPT-4 Optimized (recommended)
- `GPT4` - GPT-4 Turbo Preview
- `GPT35` - GPT-3.5 Turbo

**System Prompt:**
The AI is configured as a trading assistant specializing in:
- Technical analysis
- Market sentiment
- Risk management
- Trade recommendations
- Portfolio optimization

## Demo Page

Visit `/ai-demo` to see both components in action:
- Chat with AI assistant
- Analyze any trading pair
- Get real-time insights

## Error Handling

All API endpoints include proper error handling:
- Missing API key validation
- Request validation
- OpenAI API error handling
- Proper HTTP status codes

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to Git
- Keep your OpenAI API key secure
- Use environment variables in production
- Monitor API usage and costs
- Implement rate limiting in production

## Cost Optimization

**Tips to reduce costs:**
1. Use `gpt-3.5-turbo` for simple queries
2. Set appropriate `max_tokens` limits
3. Implement caching for repeated queries
4. Add rate limiting per user
5. Monitor usage with OpenAI dashboard

## Next Steps

1. ✅ OpenAI API integrated
2. ✅ Chat interface created
3. ✅ Market analyzer built
4. ✅ Demo page ready

**Future enhancements:**
- Add streaming responses
- Implement chat history persistence
- Add more technical indicators
- Create preset analysis templates
- Add voice input/output
- Implement sentiment analysis
