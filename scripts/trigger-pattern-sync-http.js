/**
 * Trigger Pattern Sync via HTTP
 * 
 * Calls the sync API endpoint directly to re-create patterns
 * with corrected avgLoss calculation
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const https = require('https');

async function triggerPatternSync() {
  console.log('\n🚀 Triggering pattern sync via HTTP...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/bot-decision/sync-signal-patterns',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}\n`);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Response:');
          console.log(JSON.stringify(jsonData, null, 2));
          console.log('');
          resolve(jsonData);
        } catch (error) {
          console.log('📄 Raw Response:');
          console.log(data);
          console.log('');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Run
triggerPatternSync()
  .then(() => {
    console.log('\n🎉 Pattern sync completed!\n');
    console.log('📝 Next: Run check-patterns-detail.js to verify avgLoss is NEGATIVE\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    console.log('\n⚠️  Note: Make sure Next.js dev server is running (npm run dev)\n');
    process.exit(1);
  });
