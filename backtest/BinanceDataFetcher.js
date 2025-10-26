/**
 * 📊 Binance Data Fetcher
 * 
 * Fetch historical candlestick data dari Binance Futures API (GRATIS!)
 * No API key needed untuk historical data
 */

const https = require('https');

class BinanceDataFetcher {
  constructor() {
    this.baseUrl = 'fapi.binance.com';
    this.endpoint = '/fapi/v1/klines';
  }

  /**
   * Fetch historical klines/candlesticks
   * 
   * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
   * @param {string} interval - Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
   * @param {number} startTime - Start timestamp (milliseconds)
   * @param {number} endTime - End timestamp (milliseconds)
   * @param {number} limit - Max 1500 per request (default 1000)
   * @returns {Promise<Array>} Array of candles
   */
  async fetchKlines(symbol, interval, startTime, endTime, limit = 1000) {
    const params = new URLSearchParams({
      symbol,
      interval,
      startTime,
      endTime,
      limit
    });

    const url = `${this.endpoint}?${params.toString()}`;

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: url,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            
            // Binance returns array of arrays, convert to objects
            const candles = parsed.map(k => ({
              openTime: k[0],
              open: parseFloat(k[1]),
              high: parseFloat(k[2]),
              low: parseFloat(k[3]),
              close: parseFloat(k[4]),
              volume: parseFloat(k[5]),
              closeTime: k[6],
              quoteVolume: parseFloat(k[7]),
              trades: k[8],
              takerBuyBaseVolume: parseFloat(k[9]),
              takerBuyQuoteVolume: parseFloat(k[10])
            }));

            resolve(candles);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Fetch historical data for a period (auto-handles pagination)
   * 
   * @param {string} symbol - Trading pair
   * @param {string} interval - Timeframe
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} All candles in period
   */
  async fetchPeriod(symbol, interval, startDate, endDate) {
    console.log(`\n📊 Fetching ${symbol} ${interval} data from ${startDate.toISOString()} to ${endDate.toISOString()}...`);
    
    const allCandles = [];
    let currentStart = startDate.getTime();
    const end = endDate.getTime();
    const intervalMs = this.getIntervalMs(interval);
    const maxCandles = 1500; // Binance max limit
    
    let requestCount = 0;

    while (currentStart < end) {
      const currentEnd = Math.min(currentStart + (maxCandles * intervalMs), end);
      
      try {
        const candles = await this.fetchKlines(
          symbol,
          interval,
          currentStart,
          currentEnd,
          maxCandles
        );

        if (candles.length === 0) break;

        allCandles.push(...candles);
        requestCount++;
        
        // Progress indicator
        const progress = ((currentEnd - startDate.getTime()) / (end - startDate.getTime()) * 100).toFixed(1);
        process.stdout.write(`\r📈 Progress: ${progress}% (${allCandles.length} candles fetched)`);

        // Move to next batch
        currentStart = candles[candles.length - 1].closeTime + 1;

        // Rate limiting (avoid being blocked)
        if (requestCount % 5 === 0) {
          await this.sleep(200); // 200ms delay every 5 requests
        }

      } catch (error) {
        console.error(`\n❌ Error fetching data: ${error.message}`);
        throw error;
      }
    }

    console.log(`\n✅ Fetched ${allCandles.length} candles in ${requestCount} requests\n`);
    
    return allCandles;
  }

  /**
   * Get interval in milliseconds
   */
  getIntervalMs(interval) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };

    const value = parseInt(interval);
    const unit = interval.slice(-1);

    return value * units[unit];
  }

  /**
   * Helper to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get date range presets
   */
  static getDateRange(preset) {
    const now = new Date();
    const ranges = {
      '1w': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '2w': new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      '1m': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '3m': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '6m': new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };

    return {
      start: ranges[preset] || ranges['3m'],
      end: now
    };
  }
}

module.exports = BinanceDataFetcher;
