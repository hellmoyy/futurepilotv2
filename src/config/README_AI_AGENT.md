# 🤖 AI Agent Persona Configuration Guide

## Quick Start

File ini (`ai-agent-persona.ts`) adalah file konfigurasi utama untuk mengatur perilaku AI Trading Agent Anda.

## 📝 Cara Mengubah Persona

### 1. Ubah Identitas Dasar

```typescript
export const AI_AGENT_CONFIG = {
  name: "FuturePilot AI",           // ← Ganti nama AI Agent
  role: "Expert Futures Trading Assistant",  // ← Ganti peran
  version: "2.0",                   // ← Update versi
```

### 2. Ubah Area Keahlian

```typescript
expertise: [
  "Cryptocurrency Futures Trading",
  "Technical Analysis",
  // Tambahkan keahlian baru di sini
  "Your New Expertise",
],
```

### 3. Modifikasi System Prompt

System prompt adalah bagian TERPENTING yang menentukan bagaimana AI berperilaku:

```typescript
systemPrompt: `You are FuturePilot AI...`
```

**Tips Menulis System Prompt:**

1. **Jelaskan Identitas**
   ```
   You are [Name], a [Role] specialized in [Focus Area]
   ```

2. **Tetapkan Keahlian**
   ```
   ## YOUR EXPERTISE:
   1. Technical Analysis
      - What you can do
      - How you analyze
   ```

3. **Atur Gaya Komunikasi**
   ```
   ## YOUR COMMUNICATION STYLE:
   - Clear & Concise
   - Data-Driven
   ```

4. **Buat Format Respons**
   ```
   ## YOUR RESPONSE FORMAT:
   **📊 Analysis:**
   [Content here]
   
   **🎯 Recommendation:**
   [Content here]
   ```

5. **Tetapkan Aturan**
   ```
   ## IMPORTANT RULES:
   1. ✅ ALWAYS do this
   2. ❌ NEVER do that
   ```

### 4. Sesuaikan Model Configuration

```typescript
model: {
  name: "gpt-4o",              // Model OpenAI
  temperature: 0.7,            // Kreativitas (0-1)
  maxTokens: 1500,             // Panjang respons
  frequencyPenalty: 0.3,       // Anti-repetisi
  presencePenalty: 0.3,        // Topik baru
}
```

**Model Options:**
- `gpt-4o` - Paling pintar, paling mahal (RECOMMENDED untuk trading)
- `gpt-4-turbo` - Cepat dan pintar
- `gpt-3.5-turbo` - Murah dan cepat

**Temperature Guide:**
- `0.0-0.3` - Sangat konsisten, faktual (untuk data analysis)
- `0.4-0.7` - Seimbang (RECOMMENDED untuk trading advice)
- `0.8-1.0` - Sangat kreatif (untuk brainstorming)

### 5. Customisasi Pesan Sambutan

```typescript
welcomeMessage: `👋 Hello! I'm **FuturePilot AI**...

Ubah pesan ini sesuai keinginan Anda.`,
```

### 6. Ubah Quick Actions

```typescript
quickActions: [
  {
    icon: "📊",                    // Emoji icon
    label: "Analyze BTC Futures",   // Label tombol
    query: "Analyze BTCUSDT..."    // Query yang dikirim
  },
  // Tambahkan action baru
  {
    icon: "💰",
    label: "Portfolio Check",
    query: "Check my portfolio and suggest improvements"
  }
],
```

### 7. Konfigurasi Settings

```typescript
settings: {
  // Trading pairs yang didukung
  supportedPairs: [
    "BTCUSDT", "ETHUSDT", "BNBUSDT",
    // Tambahkan pairs baru
  ],
  
  // Timeframes yang didukung
  supportedTimeframes: [
    "1m", "5m", "15m", "30m", 
    "1h", "4h", "1d", "1w"
  ],

  // Default risk parameters
  defaultRiskPercentage: 2,      // 2% risk per trade
  defaultLeverage: 5,            // 5x leverage default
  minimumRiskRewardRatio: 2,     // Minimum 1:2 RR
  
  // Conversation limits
  maxConversationHistory: 10,    // Jumlah chat history
}
```

## 🎯 Use Cases & Examples

### Use Case 1: Aggressive Day Trader AI

```typescript
systemPrompt: `You are an aggressive day trader AI...
- Focus on 1m, 5m, 15m timeframes
- High leverage recommendations (10-20x)
- Quick scalping strategies
- Fast entry and exit signals
...`

model: {
  temperature: 0.5,  // Lower for consistent entries
  maxTokens: 1000,   // Shorter responses
}

settings: {
  supportedTimeframes: ["1m", "5m", "15m"],
  defaultLeverage: 15,
  defaultRiskPercentage: 1,  // Lower risk per trade
}
```

### Use Case 2: Conservative Swing Trader AI

```typescript
systemPrompt: `You are a conservative swing trader AI...
- Focus on 4h, 1d, 1w timeframes
- Low leverage recommendations (2-5x)
- Long-term position holding
- Risk management priority
...`

model: {
  temperature: 0.6,
  maxTokens: 1500,
}

settings: {
  supportedTimeframes: ["4h", "1d", "1w"],
  defaultLeverage: 3,
  defaultRiskPercentage: 2,
}
```

### Use Case 3: Educational Trading Mentor AI

```typescript
systemPrompt: `You are a patient trading mentor...
- Explain every concept in detail
- Teach risk management principles
- Provide step-by-step guidance
- Answer newbie questions
...`

model: {
  temperature: 0.7,  // More creative explanations
  maxTokens: 2000,   // Longer educational content
}

quickActions: [
  {
    icon: "🎓",
    label: "Learn Futures",
    query: "Teach me the basics of futures trading"
  },
  {
    icon: "📚",
    label: "Risk Management",
    query: "Explain risk management for beginners"
  },
]
```

## 🔄 Testing Your Changes

Setelah mengubah konfigurasi:

1. **Simpan file** `ai-agent-persona.ts`
2. **Restart development server** (jika diperlukan)
3. **Buka** `http://localhost:3001/dashboard/ai-agent`
4. **Test** dengan berbagai pertanyaan
5. **Iterate** berdasarkan hasil

## ⚠️ Important Notes

1. **System Prompt adalah Kunci**
   - 80% dari perilaku AI ditentukan oleh system prompt
   - Tulis dengan jelas dan spesifik
   - Gunakan examples jika perlu

2. **Temperature Matters**
   - Untuk trading analysis: 0.5-0.7
   - Untuk creative content: 0.7-0.9
   - Untuk factual data: 0.3-0.5

3. **Token Limits**
   - Prompt + Response tidak boleh melebihi model limit
   - GPT-4o: 128K context, 4K output
   - Monitor token usage di response

4. **Cost Awareness**
   - GPT-4o: ~$0.03 per 1K tokens
   - Limit conversation history untuk save costs
   - Use GPT-3.5 untuk testing

## 🚀 Advanced Tips

### Tip 1: Add Examples to System Prompt

```typescript
systemPrompt: `...

## EXAMPLE RESPONSES:

User: "Analyze BTCUSDT"
You: "📊 BTCUSDT Analysis:
Current Price: $67,234
Trend: Bullish on 4H
Support: $65,000
Resistance: $70,000
..."
`
```

### Tip 2: Use Conditional Logic

```typescript
systemPrompt: `...

## CONDITIONAL RESPONSES:

If user asks about high leverage (>10x):
- Warn about liquidation risk
- Emphasize risk management
- Suggest lower leverage

If user asks about new coin:
- Check if it's in supported pairs
- Warn about volatility
- Suggest starting with major coins
`
```

### Tip 3: Personality Traits

```typescript
systemPrompt: `...

## YOUR PERSONALITY:
- Professional but friendly
- Encouraging but realistic
- Educational yet concise
- Confident but humble
- Use emojis sparingly: 📊💰⚠️🎯
`
```

## 📞 Need Help?

Jika Anda mengalami kesulitan dalam mengkonfigurasi AI Agent:

1. Cek dokumentasi lengkap: `docs/AI_AGENT_INTEGRATION.md`
2. Review system prompt examples di atas
3. Test dengan temperature berbeda
4. Monitor console untuk errors

## 🎉 Example Configurations

Lihat folder `examples/ai-persona-configs/` untuk contoh konfigurasi:
- `aggressive-trader.ts` - For day trading
- `conservative-investor.ts` - For swing trading
- `educational-mentor.ts` - For learning
- `risk-manager.ts` - Focus on risk management

---

**Happy Trading! 🚀📈**
