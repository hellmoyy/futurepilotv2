/**
 * 📰 Auto News Fetcher
 * 
 * Automatically fetch and analyze crypto news every 1 minute (or custom interval).
 * Runs in background using setInterval.
 */

let fetcherInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let lastFetchTime: Date | null = null;
let fetchCount = 0;
let errorCount = 0;
let lastError: string | null = null;

/**
 * Start auto news fetcher
 */
export async function startNewsFetcher(intervalSeconds: number = 60) {
  if (isRunning) {
    throw new Error('News fetcher is already running');
  }

  console.log(`🚀 Starting auto news fetcher (every ${intervalSeconds} seconds)...`);

  // Initial fetch
  await fetchNewsNow();

  // Start interval
  fetcherInterval = setInterval(async () => {
    await fetchNewsNow();
  }, intervalSeconds * 1000);

  isRunning = true;

  console.log(`✅ Auto news fetcher started successfully`);
}

/**
 * Stop auto news fetcher
 */
export function stopNewsFetcher() {
  if (!isRunning) {
    throw new Error('News fetcher is not running');
  }

  if (fetcherInterval) {
    clearInterval(fetcherInterval);
    fetcherInterval = null;
  }

  isRunning = false;

  console.log('🛑 Auto news fetcher stopped');
}

/**
 * Get fetcher status
 */
export function getFetcherStatus() {
  return {
    isRunning,
    lastFetchTime,
    fetchCount,
    errorCount,
    lastError,
    uptime: lastFetchTime ? Date.now() - lastFetchTime.getTime() : 0,
  };
}

/**
 * Fetch news immediately (called by interval)
 */
async function fetchNewsNow() {
  try {
    console.log('📰 [NEWS-FETCHER] Fetching news...');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-12345';

    const response = await fetch(`${baseUrl}/api/cron/fetch-news`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'News fetch failed');
    }

    lastFetchTime = new Date();
    fetchCount++;
    lastError = null;

    console.log(`✅ [NEWS-FETCHER] Success: ${result.new} new, ${result.updated} updated, ${result.skipped} skipped`);

  } catch (error: any) {
    errorCount++;
    lastError = error.message;
    console.error('❌ [NEWS-FETCHER] Error:', error.message);
  }
}

/**
 * Reset statistics
 */
export function resetFetcherStats() {
  fetchCount = 0;
  errorCount = 0;
  lastError = null;
}
