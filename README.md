# FuturePilot v2

A modern Next.js application with Tailwind CSS for beautiful, responsive web development.

## Features

### Core Framework
- **Next.js 14+** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe development
- **ESLint** - Code linting and formatting

### Trading Features
- **AI-Powered Trading Assistant** - Chat with OpenAI GPT-3.5 for market insights
- **Live Signal Generation** - Automated technical analysis with confidence scoring
- **News Validation System** - Combines technical + fundamental analysis using real-time crypto news
- **Smart Signal Filtering** - Rejects conflicting signals (e.g., bullish technical + bearish news)
- **Real-Time Market Data** - Live crypto prices from Binance (10s refresh)
- **Customizable Bot Settings** - Adjust leverage, stop loss, take profit per user
- **Trading Automation** - Start/stop trading bots with custom strategies

### AI & Analysis
- **Technical Indicators** - RSI, MACD, EMA, Bollinger Bands, Volume, ATR
- **News Sentiment Analysis** - AI-powered sentiment from CryptoNews & CryptoPanic APIs
- **Multi-Source News** - CryptoNews (primary), CryptoPanic (fallback), AI analysis
- **Confidence Scoring** - Realistic 60-90% scores (never 100%), quality validation
- **Signal Validation** - Minimum score requirements, indicator agreement, news alignment

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd futurepilotv2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Then edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Project Structure

```
futurepilotv2/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ai/
│   │   │       ├── chat/
│   │   │       └── analyze/
│   │   ├── ai-demo/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AIChat.tsx
│   │   └── MarketAnalyzer.tsx
│   └── lib/
│       └── openai.ts
├── .github/
│   └── copilot-instructions.md
├── docs/
│   └── OPENAI_INTEGRATION.md
├── .env
├── .env.example
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
├── tsconfig.json
└── README.md
```

## Development Guidelines

- Use functional components with React hooks
- Follow Next.js best practices for routing and data fetching
- Use Tailwind CSS utility classes for styling
- Maintain clean, readable code with proper TypeScript types

## Quick Start Guide

### 1. Setup Environment Variables
```bash
# Copy example file
cp .env.example .env

# Required variables:
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=sk-xxxxx
BINANCE_API_KEY=your-key
BINANCE_API_SECRET=your-secret

# Optional (for news validation):
CRYPTONEWS_API_KEY=your-token        # Recommended for best quality
CRYPTOPANIC_API_KEY=your-token       # Fallback option
```

### 2. Get API Keys

#### CryptoNews API (Recommended)
1. Visit https://cryptonews-api.com/
2. Sign up for free account
3. Get API token
4. Add to `.env`: `CRYPTONEWS_API_KEY=your-token`

#### OpenAI API
1. Visit https://platform.openai.com/api-keys
2. Create API key
3. Add to `.env`: `OPENAI_API_KEY=sk-xxxxx`

### 3. Test News Validation
```bash
# Start dev server
npm run dev

# Test signal generation
curl http://localhost:3000/api/signals/generate

# Or visit: http://localhost:3000/dashboard/live-signal
```

## Documentation

- 📰 **[News Validation System](docs/NEWS_VALIDATION_SYSTEM.md)** - Complete guide on news-based signal filtering
- 🚀 **[Quick Start: News Validation](docs/QUICKSTART_NEWS_VALIDATION.md)** - 5-minute setup guide
- 🤖 **[OpenAI Integration](docs/OPENAI_INTEGRATION.md)** - AI chat and analysis features
- 📊 **[Trading Config](docs/TRADING_CONFIG_QUICKSTART.md)** - Configure trading strategies
- ⏰ **[Cron Setup](docs/QUICKSTART_CRON.md)** - Automated signal generation
- 🚂 **[Railway Deployment](docs/RAILWAY_DEPLOYMENT.md)** - Deploy to production

## Key Features Explained

### 🎯 Live Signal Engine
Generates trading signals using technical indicators (RSI, MACD, EMA, etc.) with realistic confidence scores (60-90%). Includes quality validation and minimum requirements.

### 📰 News Validation System
**NEW!** Combines technical + fundamental analysis:
- Fetches real-time crypto news from CryptoNews/CryptoPanic APIs
- AI-powered sentiment analysis using OpenAI GPT-3.5
- Validates signal alignment (e.g., LONG signal must have bullish news)
- Rejects conflicting signals automatically
- Combined scoring: 60% technical + 40% fundamental

### 🤖 AI Trading Assistant
Chat with AI for:
- Market insights and predictions
- Technical analysis explanations
- Trading strategy recommendations
- Risk management advice

### 📊 Real-Time Dashboard
- Live crypto prices (BTC, ETH, BNB, SOL, XRP, ADA, DOGE, MATIC)
- 24h price changes with color coding
- Bot management and monitoring
- Signal history and performance

## Learn More

See [OpenAI Integration Guide](./docs/OPENAI_INTEGRATION.md) for detailed documentation.

### Next.js Resources

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.