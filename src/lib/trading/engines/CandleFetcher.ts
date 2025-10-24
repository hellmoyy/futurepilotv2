/**
 * 🕯️ BINANCE CANDLE FETCHER
 * 
 * Helper untuk fetch historical candles dari Binance API
 */

import { Candle } from '../engines/TechnicalAnalyzer';

export type BinanceInterval = 
  | '1m' | '3m' | '5m' | '15m' | '30m' 
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M';

export interface BinanceCandleResponse {
  symbol: string;
  interval: BinanceInterval;
  candles: Candle[];
  timestamp: number;
}

/**
 * Fetch historical candles from Binance
 */
export async function fetchBinanceCandles(
  symbol: string,
  interval: BinanceInterval = '15m',
  limit: number = 100
): Promise<Candle[]> {
  try {
    const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Binance API error (${response.status}): ${text.substring(0, 100)}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
    }
    
    const data = await response.json();
    
    // Validate response is an array
    if (!Array.isArray(data)) {
      throw new Error(`Expected array from Binance API but got: ${typeof data}`);
    }
    
    // Transform Binance kline format to our Candle format
    const candles: Candle[] = data.map((kline: any[]) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
    
    return candles;
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch candles for multiple symbols
 */
export async function fetchMultipleCandles(
  symbols: string[],
  interval: BinanceInterval = '15m',
  limit: number = 100
): Promise<Map<string, Candle[]>> {
  const results = new Map<string, Candle[]>();
  
  // Fetch in parallel but with rate limiting
  const batchSize = 5; // 5 requests at a time
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    
    const promises = batch.map(async (symbol) => {
      try {
        const candles = await fetchBinanceCandles(symbol, interval, limit);
        results.set(symbol, candles);
      } catch (error) {
        console.error(`Failed to fetch candles for ${symbol}:`, error);
      }
    });
    
    await Promise.all(promises);
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

/**
 * Get current price from Binance
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    const url = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get 24h price change
 */
export async function get24hStats(symbol: string): Promise<{
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
}> {
  try {
    const url = `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      volume: parseFloat(data.volume),
      quoteVolume: parseFloat(data.quoteVolume),
    };
  } catch (error) {
    console.error(`Error fetching 24h stats for ${symbol}:`, error);
    throw error;
  }
}

const CandleFetcher = {
  fetchBinanceCandles,
  fetchMultipleCandles,
  getCurrentPrice,
  get24hStats,
};

export default CandleFetcher;
