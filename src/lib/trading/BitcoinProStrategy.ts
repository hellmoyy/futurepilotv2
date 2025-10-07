import { TradingEngine, TradingConfig, TradeSignal } from './TradingEngine';
import { openai } from '../openai';

export class BitcoinProStrategy extends TradingEngine {
  constructor(userId: string, apiKey: string, apiSecret: string, botInstanceId?: string) {
    const config: TradingConfig = {
      symbol: 'BTCUSDT',
      leverage: 10,
      stopLossPercent: 3,
      takeProfitPercent: 6,
      positionSizePercent: 10, // Use 10% of balance per trade
      maxDailyLoss: 100, // $100 max daily loss
    };

    super(userId, config, apiKey, apiSecret, botInstanceId);
  }

  /**
   * Main analysis method for Bitcoin Pro strategy
   * Uses technical indicators + AI analysis
   */
  async analyze(): Promise<TradeSignal> {
    try {
      // Get market data
      const marketData = await this.getMarketData('BTCUSDT', '15m', 100);
      const prices = marketData.map((candle) => candle.close);

      // Calculate technical indicators
      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      const ema20 = this.calculateEMA(prices, 20);
      const ema50 = this.calculateEMA(prices, 50);
      const ema200 = this.calculateEMA(prices, 200);

      const currentPrice = prices[prices.length - 1];

      // Determine trend
      let trend = 'NEUTRAL';
      if (ema20 > ema50 && ema50 > ema200) {
        trend = 'STRONG_UPTREND';
      } else if (ema20 > ema50) {
        trend = 'UPTREND';
      } else if (ema20 < ema50 && ema50 < ema200) {
        trend = 'STRONG_DOWNTREND';
      } else if (ema20 < ema50) {
        trend = 'DOWNTREND';
      }

      // Technical analysis logic
      let technicalSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let confidence = 50;
      let reason = 'Analyzing market conditions...';

      // RSI Strategy
      const isOversold = rsi < 30;
      const isOverbought = rsi > 70;
      const rsiNeutral = rsi >= 40 && rsi <= 60;

      // MACD Strategy
      const macdBullish = macd.histogram > 0 && macd.macd > macd.signal;
      const macdBearish = macd.histogram < 0 && macd.macd < macd.signal;

      // EMA Strategy
      const priceAboveEMA = currentPrice > ema20 && currentPrice > ema50;
      const priceBelowEMA = currentPrice < ema20 && currentPrice < ema50;

      // Buy Signal Logic
      if (
        (isOversold || (rsi >= 30 && rsi <= 45)) &&
        macdBullish &&
        (trend === 'UPTREND' || trend === 'STRONG_UPTREND' || (trend === 'NEUTRAL' && priceAboveEMA))
      ) {
        technicalSignal = 'BUY';
        confidence = 75;
        reason = `Strong BUY signal: RSI (${rsi.toFixed(2)}) oversold/recovering, MACD bullish, ${trend}`;

        if (trend === 'STRONG_UPTREND') {
          confidence = 85;
        }
      }
      // Sell Signal Logic
      else if (
        (isOverbought || (rsi >= 55 && rsi <= 70)) &&
        macdBearish &&
        (trend === 'DOWNTREND' || trend === 'STRONG_DOWNTREND' || (trend === 'NEUTRAL' && priceBelowEMA))
      ) {
        technicalSignal = 'SELL';
        confidence = 75;
        reason = `Strong SELL signal: RSI (${rsi.toFixed(2)}) overbought/declining, MACD bearish, ${trend}`;

        if (trend === 'STRONG_DOWNTREND') {
          confidence = 85;
        }
      }
      // Moderate signals
      else if (macdBullish && !isOverbought && (trend === 'UPTREND' || trend === 'NEUTRAL')) {
        technicalSignal = 'BUY';
        confidence = 65;
        reason = `Moderate BUY: MACD bullish, RSI (${rsi.toFixed(2)}) favorable, ${trend}`;
      } else if (macdBearish && !isOversold && (trend === 'DOWNTREND' || trend === 'NEUTRAL')) {
        technicalSignal = 'SELL';
        confidence = 65;
        reason = `Moderate SELL: MACD bearish, RSI (${rsi.toFixed(2)}) favorable, ${trend}`;
      } else {
        reason = `HOLD: Mixed signals - RSI: ${rsi.toFixed(2)}, MACD: ${macd.histogram > 0 ? 'Bullish' : 'Bearish'}, Trend: ${trend}`;
      }

      // Get AI confirmation for high confidence signals
      if (confidence >= 70 && technicalSignal !== 'HOLD') {
        const aiConfirmation = await this.getAIConfirmation(
          marketData,
          {
            rsi,
            macd,
            ema: { ema20, ema50, ema200 },
            trend,
          },
          technicalSignal
        );

        // Adjust confidence based on AI
        if (aiConfirmation.agrees) {
          confidence = Math.min(95, confidence + 10);
          reason += ` | AI confirms: ${aiConfirmation.reason}`;
        } else {
          confidence = Math.max(50, confidence - 15);
          reason += ` | AI caution: ${aiConfirmation.reason}`;
          if (confidence < 70) {
            technicalSignal = 'HOLD';
          }
        }
      }

      return {
        action: technicalSignal,
        confidence,
        reason,
        indicators: {
          rsi,
          macd,
          ema: { ema20, ema50, ema200 },
          trend,
        },
      };
    } catch (error: any) {
      console.error('Error in Bitcoin Pro analysis:', error);
      return {
        action: 'HOLD',
        confidence: 0,
        reason: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Get AI confirmation for trading signal
   */
  private async getAIConfirmation(
    marketData: any[],
    indicators: any,
    signal: 'BUY' | 'SELL'
  ): Promise<{ agrees: boolean; reason: string }> {
    try {
      const recentCandles = marketData.slice(-20);
      const prompt = `You are an expert Bitcoin trading analyst. Analyze this data and confirm if the ${signal} signal is valid.

Recent Price Action (Last 20 candles, 15m timeframe):
${recentCandles.map((c, i) => `${i + 1}. Open: ${c.open}, Close: ${c.close}, High: ${c.high}, Low: ${c.low}, Volume: ${c.volume}`).join('\n')}

Technical Indicators:
- RSI: ${indicators.rsi.toFixed(2)} ${indicators.rsi < 30 ? '(Oversold)' : indicators.rsi > 70 ? '(Overbought)' : '(Neutral)'}
- MACD: ${indicators.macd.macd.toFixed(2)}, Signal: ${indicators.macd.signal.toFixed(2)}, Histogram: ${indicators.macd.histogram.toFixed(2)}
- EMA20: ${indicators.ema.ema20.toFixed(2)}
- EMA50: ${indicators.ema.ema50.toFixed(2)}
- EMA200: ${indicators.ema.ema200.toFixed(2)}
- Trend: ${indicators.trend}

Technical Signal: ${signal}

Question: Do you AGREE with this ${signal} signal? Consider:
1. Is the trend supporting this direction?
2. Are the indicators aligned?
3. Is there any divergence or warning signs?
4. What's the risk/reward ratio?

Respond in JSON format:
{
  "agrees": true/false,
  "confidence": 0-100,
  "reason": "Brief explanation (max 100 chars)"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Bitcoin trading analyst. Provide concise, actionable analysis. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const aiAnalysis = JSON.parse(response);

      return {
        agrees: aiAnalysis.agrees || false,
        reason: aiAnalysis.reason || 'No reason provided',
      };
    } catch (error) {
      console.error('Error getting AI confirmation:', error);
      return {
        agrees: true, // Default to agreeing if AI fails
        reason: 'AI unavailable, using technical analysis only',
      };
    }
  }
}
