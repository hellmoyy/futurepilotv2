# AI Agent Integration - FuturePilot v2

## 📋 Overview

FuturePilot AI Agent adalah asisten trading cryptocurrency futures yang didukung oleh OpenAI GPT-4. AI Agent ini dirancang khusus untuk membantu trader dalam menganalisis pasar, manajemen risiko, dan strategi trading futures.

## 🎯 Fitur Utama

### 1. **Analisis Pasar Real-time**
   - Technical analysis untuk BTC, ETH, dan major altcoins
   - Support/Resistance level identification
   - Trend analysis dan market structure
   - Volume profile analysis

### 2. **Futures Trading Expertise**
   - Long & Short position recommendations
   - Leverage management (1x - 125x)
   - Liquidation price calculations
   - Funding rate analysis
   - Position sizing strategies

### 3. **Risk Management**
   - Stop loss placement strategies
   - Take profit optimization
   - Risk/Reward ratio calculations
   - Portfolio risk assessment
   - Maximum 2-3% risk per trade recommendations

### 4. **Educational Assistant**
   - Trading psychology guidance
   - Technical indicators explanation
   - Risk management principles
   - Market structure education

## 🏗️ Architecture

### File Structure

```
src/
├── config/
│   └── ai-agent-persona.ts          # AI Agent persona configuration
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── agent/
│   │           └── route.ts          # AI Agent API endpoint
│   └── dashboard/
│       └── ai-agent/
│           └── page.tsx              # AI Agent UI page
```

### Configuration File: `ai-agent-persona.ts`

File ini adalah pusat konfigurasi untuk mengatur persona dan perilaku AI Agent:

```typescript
export const AI_AGENT_CONFIG = {
  name: "FuturePilot AI",
  role: "Expert Futures Trading Assistant",
  
  // System prompt yang menentukan perilaku AI
  systemPrompt: "...",
  
  // Model configuration
  model: {
    name: "gpt-4o",
    temperature: 0.7,
    maxTokens: 1500,
    // ...
  },
  
  // Quick actions untuk UI
  quickActions: [...],
  
  // Settings
  settings: {
    supportedPairs: ["BTCUSDT", "ETHUSDT", ...],
    defaultRiskPercentage: 2,
    defaultLeverage: 5,
    // ...
  }
}
```

## 🔧 Cara Mengubah Persona AI Agent

### 1. Edit System Prompt

Buka file `/src/config/ai-agent-persona.ts` dan edit bagian `systemPrompt`:

```typescript
systemPrompt: `You are FuturePilot AI, an expert cryptocurrency futures trading assistant...

## YOUR CORE IDENTITY:
- Name: [Ganti nama di sini]
- Specialization: [Ganti spesialisasi]
- Focus: [Ganti fokus trading]

## YOUR EXPERTISE:
[Tambahkan atau ubah keahlian]

## YOUR COMMUNICATION STYLE:
[Ubah gaya komunikasi]
...`
```

### 2. Ubah Model Configuration

```typescript
model: {
  name: "gpt-4o",              // Ganti model: "gpt-4-turbo", "gpt-3.5-turbo"
  temperature: 0.7,            // 0.0-1.0: rendah=konsisten, tinggi=kreatif
  maxTokens: 1500,             // Panjang maksimum respons
  frequencyPenalty: 0.3,       // Mengurangi pengulangan kata
  presencePenalty: 0.3,        // Mendorong topik baru
}
```

### 3. Custom Quick Actions

```typescript
quickActions: [
  {
    icon: "📊",
    label: "Your Label",
    query: "The question that will be asked to AI"
  },
  // Tambahkan lebih banyak quick actions
]
```

### 4. Update Trading Pairs

```typescript
settings: {
  supportedPairs: [
    "BTCUSDT", "ETHUSDT", "BNBUSDT",
    // Tambahkan pairs baru
    "ADAUSDT", "SOLUSDT", ...
  ],
}
```

## 🚀 API Endpoints

### POST `/api/ai/agent`

Request AI Agent untuk analisis atau jawaban.

**Request Body:**
```json
{
  "message": "Analyze BTCUSDT for a long position",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI Agent response here...",
  "agent": {
    "name": "FuturePilot AI",
    "version": "2.0"
  },
  "usage": {
    "promptTokens": 150,
    "completionTokens": 300,
    "totalTokens": 450
  },
  "timestamp": "2025-10-18T10:30:00.000Z"
}
```

### GET `/api/ai/agent`

Mendapatkan konfigurasi AI Agent.

**Response:**
```json
{
  "success": true,
  "agent": {
    "name": "FuturePilot AI",
    "role": "Expert Futures Trading Assistant",
    "version": "2.0",
    "expertise": [...],
    "quickActions": [...],
    "settings": {...}
  }
}
```

## 💡 Best Practices

### 1. System Prompt Design

- **Be Specific**: Jelaskan dengan detail apa yang harus dilakukan AI
- **Set Boundaries**: Tetapkan apa yang BOLEH dan TIDAK BOLEH dilakukan
- **Add Context**: Berikan context tentang domain (futures trading)
- **Define Format**: Tentukan format respons yang diinginkan

### 2. Temperature Settings

- **0.0 - 0.3**: Sangat konsisten, untuk data faktual
- **0.4 - 0.7**: Seimbang antara konsisten & kreatif (RECOMMENDED)
- **0.8 - 1.0**: Sangat kreatif, untuk brainstorming

### 3. Token Management

- **maxTokens**: Sesuaikan dengan panjang respons yang diinginkan
  - Short answers: 500-800 tokens
  - Medium answers: 800-1500 tokens
  - Long analysis: 1500-2000 tokens

### 4. Conversation History

- Batasi history untuk menghindari token overflow
- `maxConversationHistory: 10` (default)
- Simpan hanya pesan yang relevan

## 🔒 Security Considerations

1. **API Key Protection**
   - OpenAI API key harus di environment variable
   - Jangan pernah expose API key di frontend

2. **Rate Limiting**
   - Implementasikan rate limiting untuk mencegah abuse
   - Handle error rate limit dengan gracefully

3. **Input Validation**
   - Validasi input sebelum dikirim ke OpenAI
   - Filter konten yang tidak pantas

4. **Error Handling**
   - Jangan expose error detail ke user
   - Log error untuk debugging

## 📊 Usage Examples

### Example 1: Market Analysis

**User Input:**
```
Analyze BTCUSDT for a potential long position with 5x leverage
```

**AI Response:**
```
📊 BTCUSDT Market Analysis:

Current Market Structure:
- Trend: Bullish on 4H timeframe
- Price: $67,234
- Support: $65,000 (strong)
- Resistance: $70,000

🎯 Long Position Setup:
- Entry: $67,000 - $67,500
- Take Profit 1: $69,000 (+3%)
- Take Profit 2: $70,500 (+5.2%)
- Stop Loss: $65,500 (-2.2%)
- Leverage: 5x
- Risk/Reward: 1:2.3

⚠️ Risk Management (5x Leverage):
- Position Size: 20% of capital
- Max Loss: 2% of total account
- Liquidation Price: $53,788 (safety margin: 20%)

💡 Key Considerations:
- Wait for price to hold above $66,800
- Volume should increase on breakout
- Watch for funding rate (currently neutral)
...
```

### Example 2: Risk Calculation

**User Input:**
```
Help me calculate position size for $1000 account with 2% risk
```

**AI Response:**
```
💰 Position Sizing Calculator:

Account Details:
- Total Capital: $1,000
- Risk Per Trade: 2%
- Max Loss Amount: $20

Calculation Example:
For a trade with 3% stop loss distance:
- Without Leverage: $666.67 position size
- With 3x Leverage: $2,000 position size (controlled exposure)
- With 5x Leverage: $3,333 position size

Recommendation:
Position Size Formula:
(Account × Risk%) / Stop Loss%

For your $1,000 account:
- Conservative (1-2x): $400-800 per trade
- Moderate (3-5x): $1,000-2,000 per trade
- Aggressive (5-10x): $2,000-4,000 per trade

⚠️ Remember:
- Never risk more than 2-3% per trade
- Keep liquidation price far (>20% away)
- Use proper stop losses always
```

## 🐛 Troubleshooting

### Problem: AI tidak merespons

**Solutions:**
1. Check OpenAI API key di `.env`
2. Verify API endpoint accessible
3. Check console untuk error messages
4. Verify OpenAI account quota

### Problem: Respons terlalu lambat

**Solutions:**
1. Kurangi `maxTokens` di config
2. Limit conversation history
3. Gunakan model lebih cepat (gpt-3.5-turbo)

### Problem: Respons tidak sesuai harapan

**Solutions:**
1. Edit `systemPrompt` lebih spesifik
2. Tambahkan examples di system prompt
3. Adjust temperature (lower = more focused)
4. Provide more context in user query

## 📈 Future Enhancements

1. **Real-time Market Data Integration**
   - Connect to Binance API for live prices
   - Display real-time charts in responses

2. **Trading Signal Generation**
   - Automated signal detection
   - Alert system for opportunities

3. **Backtesting Integration**
   - Test AI recommendations against historical data
   - Performance metrics tracking

4. **Multi-language Support**
   - Support for Indonesian, English, Chinese
   - Language detection

5. **Voice Input/Output**
   - Voice commands for hands-free trading
   - Text-to-speech for responses

## 📝 Notes

- AI Agent menggunakan OpenAI GPT-4o sebagai default model
- Conversation history disimpan di frontend (client-side)
- Tidak ada persistent storage untuk chat history (refresh = reset)
- Token usage di-track untuk monitoring costs

## 🔗 Related Documentation

- [OpenAI Integration](./OPENAI_INTEGRATION.md)
- [Trading Algorithms Config](./TRADING_ALGORITHMS_CONFIG.md)
- [Risk Management Guide](./SECURITY_POLICY_USER_ADMIN.md)

---

**Last Updated:** October 18, 2025
**Version:** 2.0
**Maintainer:** FuturePilot Development Team
