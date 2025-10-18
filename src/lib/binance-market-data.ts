/**
 * Binance Market Data API Client
 * 
 * Uses public market data endpoints that don't require authentication
 * Base URL: https://data-api.binance.vision
 */

const BINANCE_MARKET_DATA_BASE_URL = 'https://data-api.binance.vision';

// Fallback to main API if market data API is down
const BINANCE_API_BASE_URL = 'https://api.binance.com';

interface TickerPrice {
  symbol: string;
  price: string;
}

interface Ticker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

interface OrderBookLevel {
  price: string;
  quantity: string;
}

interface OrderBook {
  lastUpdateId: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

/**
 * Fetch data from Binance API with fallback
 */
async function fetchBinanceData(endpoint: string, useMarketDataAPI = true): Promise<any> {
  const baseUrl = useMarketDataAPI ? BINANCE_MARKET_DATA_BASE_URL : BINANCE_API_BASE_URL;
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If market data API fails, try main API
      if (useMarketDataAPI) {
        console.log('Market data API failed, trying main API...');
        return fetchBinanceData(endpoint, false);
      }
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Binance API fetch error:', error.message);
    throw error;
  }
}

/**
 * Get current price for a symbol
 */
export async function getCurrentPrice(symbol: string): Promise<TickerPrice> {
  const data = await fetchBinanceData(`/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`);
  return data;
}

/**
 * Get 24hr ticker statistics
 */
export async function get24hrTicker(symbol: string): Promise<Ticker24hr> {
  const data = await fetchBinanceData(`/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`);
  return data;
}

/**
 * Get multiple symbols 24hr tickers
 */
export async function getMultiple24hrTickers(symbols: string[]): Promise<Ticker24hr[]> {
  const symbolsParam = symbols.map(s => `"${s.toUpperCase()}"`).join(',');
  const data = await fetchBinanceData(`/api/v3/ticker/24hr?symbols=[${symbolsParam}]`);
  return data;
}

/**
 * Get kline/candlestick data
 */
export async function getKlines(
  symbol: string,
  interval: string = '1h',
  limit: number = 100
): Promise<Kline[]> {
  const data = await fetchBinanceData(
    `/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
  );
  
  // Transform array response to object format
  return data.map((kline: any[]) => ({
    openTime: kline[0],
    open: kline[1],
    high: kline[2],
    low: kline[3],
    close: kline[4],
    volume: kline[5],
    closeTime: kline[6],
    quoteAssetVolume: kline[7],
    numberOfTrades: kline[8],
    takerBuyBaseAssetVolume: kline[9],
    takerBuyQuoteAssetVolume: kline[10],
    ignore: kline[11],
  }));
}

/**
 * Get order book depth
 */
export async function getOrderBook(
  symbol: string,
  limit: number = 20
): Promise<OrderBook> {
  const data = await fetchBinanceData(
    `/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`
  );
  
  return {
    lastUpdateId: data.lastUpdateId,
    bids: data.bids.map((bid: string[]) => ({
      price: bid[0],
      quantity: bid[1],
    })),
    asks: data.asks.map((ask: string[]) => ({
      price: ask[0],
      quantity: ask[1],
    })),
  };
}

/**
 * Get average price
 */
export async function getAveragePrice(symbol: string): Promise<{ mins: number; price: string }> {
  const data = await fetchBinanceData(`/api/v3/avgPrice?symbol=${symbol.toUpperCase()}`);
  return data;
}

/**
 * Calculate RSI from kline data
 */
export function calculateRSI(klines: Kline[], period: number = 14): number {
  if (klines.length < period + 1) {
    return 50; // Default neutral if not enough data
  }

  const closes = klines.map(k => parseFloat(k.close));
  const changes = [];
  
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) {
      gains += changes[i];
    } else {
      losses -= changes[i];
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate subsequent values
  for (let i = period; i < changes.length; i++) {
    if (changes[i] >= 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - changes[i]) / period;
    }
  }

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 100) / 100;
}

/**
 * Calculate simple moving average
 */
export function calculateSMA(klines: Kline[], period: number): number {
  if (klines.length < period) {
    return 0;
  }

  const closes = klines.slice(-period).map(k => parseFloat(k.close));
  const sum = closes.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(klines: Kline[], period: number): number {
  if (klines.length < period) {
    return 0;
  }

  const closes = klines.map(k => parseFloat(k.close));
  const multiplier = 2 / (period + 1);
  
  // Start with SMA
  let ema = closes.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
  
  // Calculate EMA
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Detect trend from klines
 */
export function detectTrend(klines: Kline[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  if (klines.length < 3) return 'NEUTRAL';

  const recentKlines = klines.slice(-10);
  const closes = recentKlines.map(k => parseFloat(k.close));
  
  const firstPrice = closes[0];
  const lastPrice = closes[closes.length - 1];
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Calculate short and long EMAs
  const shortEMA = calculateEMA(klines, 9);
  const longEMA = calculateEMA(klines, 21);

  if (changePercent > 2 && shortEMA > longEMA) {
    return 'BULLISH';
  } else if (changePercent < -2 && shortEMA < longEMA) {
    return 'BEARISH';
  }
  
  return 'NEUTRAL';
}

/**
 * Get comprehensive market analysis for AI
 */
export async function getMarketAnalysis(
  symbol: string,
  interval: string = '1h'
): Promise<{
  symbol: string;
  currentPrice: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  rsi: number;
  sma20: number;
  ema9: number;
  ema21: number;
  trend: string;
  support: string[];
  resistance: string[];
  timestamp: number;
}> {
  try {
    // Fetch data in parallel
    const [ticker24hr, klines, orderBook] = await Promise.all([
      get24hrTicker(symbol),
      getKlines(symbol, interval, 100),
      getOrderBook(symbol, 20),
    ]);

    // Calculate indicators
    const rsi = calculateRSI(klines, 14);
    const sma20 = calculateSMA(klines, 20);
    const ema9 = calculateEMA(klines, 9);
    const ema21 = calculateEMA(klines, 21);
    const trend = detectTrend(klines);

    // Get support and resistance from order book
    const support = orderBook.bids.slice(0, 3).map(b => b.price);
    const resistance = orderBook.asks.slice(0, 3).map(a => a.price);

    return {
      symbol: ticker24hr.symbol,
      currentPrice: ticker24hr.lastPrice,
      priceChange24h: ticker24hr.priceChange,
      priceChangePercent24h: ticker24hr.priceChangePercent,
      high24h: ticker24hr.highPrice,
      low24h: ticker24hr.lowPrice,
      volume24h: ticker24hr.volume,
      rsi,
      sma20,
      ema9,
      ema21,
      trend,
      support,
      resistance,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('Market analysis error:', error.message);
    throw new Error(`Failed to get market analysis: ${error.message}`);
  }
}

/**
 * Format market data for AI consumption
 */
export function formatMarketDataForAI(analysis: Awaited<ReturnType<typeof getMarketAnalysis>>): string {
  const priceChangeSymbol = parseFloat(analysis.priceChangePercent24h) >= 0 ? '🟢' : '🔴';
  const trendEmoji = analysis.trend === 'BULLISH' ? '📈' : analysis.trend === 'BEARISH' ? '📉' : '➡️';

  return `
📊 **Live Market Data for ${analysis.symbol}**

**Current Price:** $${parseFloat(analysis.currentPrice).toLocaleString()} ${priceChangeSymbol}
**24h Change:** ${analysis.priceChange24h} (${analysis.priceChangePercent24h}%)
**24h High:** $${parseFloat(analysis.high24h).toLocaleString()}
**24h Low:** $${parseFloat(analysis.low24h).toLocaleString()}
**24h Volume:** ${parseFloat(analysis.volume24h).toLocaleString()} ${analysis.symbol.replace('USDT', '')}

**Technical Indicators:**
• RSI (14): ${analysis.rsi.toFixed(2)} ${analysis.rsi > 70 ? '(Overbought ⚠️)' : analysis.rsi < 30 ? '(Oversold 💰)' : '(Neutral)'}
• SMA (20): $${analysis.sma20.toFixed(2)}
• EMA (9): $${analysis.ema9.toFixed(2)}
• EMA (21): $${analysis.ema21.toFixed(2)}
• Trend: ${analysis.trend} ${trendEmoji}

**Key Levels:**
• Support: $${analysis.support.map(s => parseFloat(s).toFixed(2)).join(', $')}
• Resistance: $${analysis.resistance.map(r => parseFloat(r).toFixed(2)).join(', $')}

*Data updated: ${new Date(analysis.timestamp).toLocaleString()}*
`.trim();
}

/**
 * Get quick price info for AI
 */
export async function getQuickPriceInfo(symbol: string): Promise<string> {
  try {
    const ticker = await get24hrTicker(symbol);
    const changeSymbol = parseFloat(ticker.priceChangePercent) >= 0 ? '🟢' : '🔴';
    
    return `${symbol}: $${parseFloat(ticker.lastPrice).toLocaleString()} ${changeSymbol} (${ticker.priceChangePercent}% in 24h)`;
  } catch (error: any) {
    return `Unable to fetch price for ${symbol}: ${error.message}`;
  }
}
