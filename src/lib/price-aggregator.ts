/**
 * Price Aggregator - Centralized Binance API Fetcher
 * 
 * Problem: Multiple users fetching prices simultaneously = rate limit
 * Solution: Single fetch, shared cache, all users get same data
 * 
 * Benefits:
 * - 1000 users → 1 API call (instead of 1000)
 * - No Binance rate limit issues
 * - Faster response (cached data)
 * - Better for trading bot (consistent prices across users)
 */

interface PriceData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  [key: string]: any;
}

interface CacheEntry {
  data: PriceData[];
  timestamp: number;
  fetchCount: number;
}

class PriceAggregator {
  private cache: Map<string, CacheEntry> = new Map();
  private isFetching: Map<string, boolean> = new Map();
  private fetchPromises: Map<string, Promise<PriceData[]>> = new Map();
  
  // Configuration
  private readonly CACHE_DURATION = 10000; // 10 seconds (good for trading)
  private readonly TIMEOUT = 5000; // 5 second timeout
  private readonly MAX_RETRIES = 2;

  /**
   * Get 24hr ticker for all symbols
   * Uses cache if available, fetches if needed
   * Prevents duplicate concurrent fetches
   */
  async getAllPrices(): Promise<PriceData[]> {
    return this.getPrices('all');
  }

  /**
   * Get specific symbol price
   */
  async getSymbolPrice(symbol: string): Promise<PriceData | null> {
    const allPrices = await this.getAllPrices();
    return allPrices.find(p => p.symbol === symbol) || null;
  }

  /**
   * Core fetch logic with caching and deduplication
   */
  private async getPrices(key: string): Promise<PriceData[]> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached data if fresh
    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      console.log(`✅ Price cache hit (age: ${Math.round((now - cached.timestamp) / 1000)}s, requests served: ${cached.fetchCount})`);
      cached.fetchCount++;
      return cached.data;
    }

    // If another request is already fetching, wait for it
    const existingPromise = this.fetchPromises.get(key);
    if (existingPromise) {
      console.log('⏳ Waiting for existing price fetch...');
      return existingPromise;
    }

    // Create new fetch promise
    const fetchPromise = this.fetchWithRetry(key);
    this.fetchPromises.set(key, fetchPromise);

    try {
      const data = await fetchPromise;
      
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: now,
        fetchCount: 1,
      });

      console.log(`🔄 Fetched fresh prices from Binance (${data.length} symbols)`);
      return data;
    } finally {
      // Clean up promise
      this.fetchPromises.delete(key);
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(key: string, attempt = 1): Promise<PriceData[]> {
    try {
      return await this.fetchFromBinance();
    } catch (error: any) {
      if (attempt < this.MAX_RETRIES) {
        console.warn(`⚠️ Binance fetch failed (attempt ${attempt}/${this.MAX_RETRIES}), retrying...`);
        await this.sleep(1000 * attempt); // Exponential backoff
        return this.fetchWithRetry(key, attempt + 1);
      }

      // All retries failed, return cached data if available
      const cached = this.cache.get(key);
      if (cached) {
        console.warn('⚠️ Binance API failed, serving stale cache');
        return cached.data;
      }

      // No cache available, throw error
      throw new Error(`Failed to fetch prices after ${this.MAX_RETRIES} attempts: ${error.message}`);
    }
  }

  /**
   * Actual Binance API fetch with timeout
   */
  private async fetchFromBinance(): Promise<PriceData[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
      }

      const data: PriceData[] = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from Binance');
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Binance API timeout (5s exceeded)');
      }
      
      throw error;
    }
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getStats() {
    const stats = {
      cacheSize: this.cache.size,
      activeFetches: this.fetchPromises.size,
      entries: [] as any[],
    };

    this.cache.forEach((entry, key) => {
      const age = Math.round((Date.now() - entry.timestamp) / 1000);
      stats.entries.push({
        key,
        age: `${age}s`,
        requestsServed: entry.fetchCount,
        symbolCount: entry.data.length,
      });
    });

    return stats;
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Price cache cleared');
  }

  /**
   * Prefetch prices (warm up cache)
   */
  async warmupCache() {
    console.log('🔥 Warming up price cache...');
    await this.getAllPrices();
  }

  /**
   * Helper: Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance - shared across all requests
export const priceAggregator = new PriceAggregator();

// Auto-warmup on server start
if (typeof window === 'undefined') {
  // Server-side only
  priceAggregator.warmupCache().catch(err => {
    console.error('Failed to warm up price cache:', err);
  });
}

export default priceAggregator;
