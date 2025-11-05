/**
 * 🕯️ Binance Candle Fetcher for Signal Generation
 * 
 * Fetch multi-timeframe candles from Binance Futures API
 * Used by Signal Generator to analyze market conditions
 */

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MultiTimeframeCandles {
  '1m': Candle[];
  '3m': Candle[];
  '5m': Candle[];
}

/**
 * Fetch candles for multiple timeframes from Binance Futures
 * @param symbol Trading pair (e.g., 'BTCUSDT')
 * @param limit Number of candles per timeframe (default: 100)
 * @returns Candles for 1m, 3m, 5m timeframes
 */
export async function fetchMultiTimeframeCandles(
  symbol: string,
  limit: number = 100
): Promise<MultiTimeframeCandles> {
  const baseUrl = 'https://fapi.binance.com/fapi';
  const timeframes = ['1m', '3m', '5m'] as const;
  
  try {
    // Fetch all timeframes in parallel
    const promises = timeframes.map(interval =>
      fetchCandlesForTimeframe(baseUrl, symbol, interval, limit)
    );
    
    const [candles1m, candles3m, candles5m] = await Promise.all(promises);
    
    return {
      '1m': candles1m,
      '3m': candles3m,
      '5m': candles5m,
    };
  } catch (error: any) {
    console.error('❌ Error fetching multi-timeframe candles:', error.message);
    throw new Error(`Failed to fetch candles: ${error.message}`);
  }
}

/**
 * Fetch candles for a single timeframe
 */
async function fetchCandlesForTimeframe(
  baseUrl: string,
  symbol: string,
  interval: string,
  limit: number
): Promise<Candle[]> {
  const url = `${baseUrl}/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Transform Binance kline format to our Candle interface
    return data.map((kline: any[]) => ({
      timestamp: kline[0], // Open time
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  } catch (error: any) {
    console.error(`❌ Error fetching ${interval} candles for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Fetch candles with retry logic (for production reliability)
 * @param symbol Trading pair
 * @param limit Number of candles
 * @param maxRetries Maximum retry attempts (default: 3)
 * @param retryDelay Delay between retries in ms (default: 1000)
 */
export async function fetchMultiTimeframeCandlesWithRetry(
  symbol: string,
  limit: number = 100,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<MultiTimeframeCandles> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📊 Fetching candles for ${symbol} (attempt ${attempt}/${maxRetries})...`);
      const candles = await fetchMultiTimeframeCandles(symbol, limit);
      console.log(`✅ Successfully fetched candles for ${symbol}`);
      return candles;
    } catch (error: any) {
      lastError = error;
      console.error(`⚠️ Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw new Error(`Failed to fetch candles after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Validate candles data quality
 * @param candles Candles to validate
 * @returns true if candles are valid
 */
export function validateCandles(candles: Candle[]): boolean {
  if (!candles || candles.length === 0) {
    console.error('❌ No candles data');
    return false;
  }
  
  // Check minimum data points (need at least 50 for indicators)
  if (candles.length < 50) {
    console.error(`❌ Insufficient candles: ${candles.length} (need at least 50)`);
    return false;
  }
  
  // Check for invalid values
  const hasInvalidValues = candles.some(candle => {
    return (
      !candle.open || !candle.high || !candle.low || !candle.close ||
      candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0 ||
      candle.high < candle.low // High should be >= Low
    );
  });
  
  if (hasInvalidValues) {
    console.error('❌ Candles contain invalid values');
    return false;
  }
  
  return true;
}

/**
 * Get latest candle from array
 */
export function getLatestCandle(candles: Candle[]): Candle | null {
  if (!candles || candles.length === 0) return null;
  return candles[candles.length - 1];
}

/**
 * Get current price from latest candle
 */
export function getCurrentPrice(candles: Candle[]): number | null {
  const latest = getLatestCandle(candles);
  return latest?.close || null;
}
