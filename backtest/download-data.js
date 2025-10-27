/**
 * 📥 DATA DOWNLOADER & CACHE MANAGER
 * 
 * Download dan simpan data historical untuk multiple coins
 * Struktur folder:
 * data/
 *   BTCUSDT/
 *     1w_1m.json
 *     1w_3m.json
 *     1w_5m.json
 *     1m_1m.json
 *     ...
 *   ETHUSDT/
 *     ...
 * 
 * Usage:
 *   node download-data.js --coin BTC --all
 *   node download-data.js --coin ETH --period 1w
 *   node download-data.js --all-coins
 */

const fs = require('fs');
const path = require('path');
const BinanceDataFetcher = require('./BinanceDataFetcher');

const COINS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'DOGEUSDT',
  'MATICUSDT',
  'LINKUSDT',
  'LTCUSDT',
  'AVAXUSDT'
];

const PERIODS = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180
};

const TIMEFRAMES = ['1m', '3m', '5m'];

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Download data for specific coin and period
async function downloadCoinData(coin, period, days) {
  const coinDir = path.join(dataDir, coin);
  if (!fs.existsSync(coinDir)) {
    fs.mkdirSync(coinDir, { recursive: true });
  }

  console.log(`\n📊 Downloading ${coin} - ${period} (${days} days)...`);

  const fetcher = new BinanceDataFetcher();
  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);

  for (const tf of TIMEFRAMES) {
    const filename = `${period}_${tf}.json`;
    const filepath = path.join(coinDir, filename);

    try {
      console.log(`  ⏳ Fetching ${tf} data...`);
      const data = await fetcher.fetchPeriod(coin, tf, new Date(startTime), new Date(endTime));
      
      // Save to file
      fs.writeFileSync(filepath, JSON.stringify({
        coin,
        period,
        timeframe: tf,
        days,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        candles: data.length,
        data
      }, null, 2));

      console.log(`  ✅ ${tf}: ${data.length} candles saved to ${filename}`);
    } catch (error) {
      console.error(`  ❌ Error fetching ${tf}:`, error.message);
    }

    // Small delay to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Load cached data
function loadCachedData(coin, period, timeframe) {
  const filepath = path.join(dataDir, coin, `${period}_${timeframe}.json`);
  
  if (!fs.existsSync(filepath)) {
    return null;
  }

  try {
    const cached = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    // Check if data is recent (less than 1 day old)
    const cacheAge = Date.now() - new Date(cached.endTime).getTime();
    const isRecent = cacheAge < (24 * 60 * 60 * 1000);
    
    return {
      ...cached,
      isRecent,
      cacheAge: Math.floor(cacheAge / (60 * 60 * 1000)) + 'h'
    };
  } catch (error) {
    console.error(`Error loading cached data: ${error.message}`);
    return null;
  }
}

// Check cache status
function checkCacheStatus(coin, period) {
  console.log(`\n📂 Cache status for ${coin} - ${period}:`);
  
  for (const tf of TIMEFRAMES) {
    const cached = loadCachedData(coin, period, tf);
    if (cached) {
      console.log(`  ✅ ${tf}: ${cached.candles} candles (age: ${cached.cacheAge})${cached.isRecent ? ' 🔥' : ' ⚠️ OLD'}`);
    } else {
      console.log(`  ❌ ${tf}: No cache`);
    }
  }
}

// List all cached data
function listAllCache() {
  console.log(`\n📂 CACHE OVERVIEW\n${'='.repeat(70)}\n`);
  
  if (!fs.existsSync(dataDir)) {
    console.log('No cache directory found.');
    return;
  }

  const coins = fs.readdirSync(dataDir).filter(f => {
    return fs.statSync(path.join(dataDir, f)).isDirectory();
  });

  if (coins.length === 0) {
    console.log('No cached data found.');
    return;
  }

  for (const coin of coins) {
    console.log(`\n${coin}:`);
    const coinDir = path.join(dataDir, coin);
    const files = fs.readdirSync(coinDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filepath = path.join(coinDir, file);
      const stats = fs.statSync(filepath);
      const size = (stats.size / 1024).toFixed(2) + ' KB';
      const modified = new Date(stats.mtime);
      const age = Math.floor((Date.now() - modified.getTime()) / (60 * 60 * 1000));
      
      console.log(`  ${file.padEnd(20)} ${size.padEnd(12)} ${age}h ago`);
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let coin = null;
  let period = null;
  let downloadAll = false;
  let allCoins = false;
  let checkCache = false;
  let listCache = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--coin') coin = args[i + 1] + 'USDT';
    if (args[i] === '--period') period = args[i + 1];
    if (args[i] === '--all') downloadAll = true;
    if (args[i] === '--all-coins') allCoins = true;
    if (args[i] === '--check') checkCache = true;
    if (args[i] === '--list') listCache = true;
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📥 BACKTEST DATA MANAGER`);
  console.log(`${'='.repeat(70)}`);

  // List cache
  if (listCache) {
    listAllCache();
    return;
  }

  // Check specific cache
  if (checkCache && coin && period) {
    checkCacheStatus(coin, period);
    return;
  }

  // Download all coins, all periods
  if (allCoins) {
    console.log(`\n🚀 Downloading ALL COINS, ALL PERIODS...`);
    console.log(`Coins: ${COINS.length}`);
    console.log(`Periods: ${Object.keys(PERIODS).length}`);
    console.log(`Timeframes: ${TIMEFRAMES.length}`);
    console.log(`Total downloads: ${COINS.length * Object.keys(PERIODS).length * TIMEFRAMES.length}\n`);
    
    for (const c of COINS) {
      for (const [p, days] of Object.entries(PERIODS)) {
        await downloadCoinData(c, p, days);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n✅ All data downloaded!`);
    listAllCache();
    return;
  }

  // Download specific coin, all periods
  if (coin && downloadAll) {
    for (const [p, days] of Object.entries(PERIODS)) {
      await downloadCoinData(coin, p, days);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log(`\n✅ ${coin} - All periods downloaded!`);
    return;
  }

  // Download specific coin and period
  if (coin && period) {
    const days = PERIODS[period];
    if (!days) {
      console.error(`Invalid period: ${period}. Use: ${Object.keys(PERIODS).join(', ')}`);
      return;
    }
    await downloadCoinData(coin, period, days);
    console.log(`\n✅ ${coin} - ${period} downloaded!`);
    return;
  }

  // Show usage
  console.log(`
Usage:

  📥 Download specific coin and period:
     node download-data.js --coin BTC --period 1w
     node download-data.js --coin ETH --period 3m

  📥 Download all periods for one coin:
     node download-data.js --coin BTC --all

  📥 Download ALL coins and ALL periods:
     node download-data.js --all-coins

  📂 Check cache status:
     node download-data.js --coin BTC --period 1w --check

  📂 List all cached data:
     node download-data.js --list

Available coins:
  ${COINS.map(c => c.replace('USDT', '')).join(', ')}

Available periods:
  1w  - 1 week (7 days)
  1m  - 1 month (30 days)
  3m  - 3 months (90 days)
  6m  - 6 months (180 days)
  `);
}

main().catch(console.error);

// Export for use in other scripts
module.exports = {
  loadCachedData,
  downloadCoinData,
  COINS,
  PERIODS,
  TIMEFRAMES
};
