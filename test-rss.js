const Parser = require('rss-parser');

const RSS_FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
  'https://cryptonews.com/news/feed/',
];

async function testRSS() {
  const parser = new Parser({ timeout: 10000 });
  
  for (const feedUrl of RSS_FEEDS) {
    try {
      console.log(`\n📡 Testing: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);
      console.log(`✅ Success: ${feed.title} - ${feed.items.length} articles`);
      console.log(`   First article: ${feed.items[0]?.title}`);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }
}

testRSS();
