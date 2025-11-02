#!/usr/bin/env node

/**
 * 🤖 Upstash QStash - Balance Check Schedule Setup
 * 
 * This script creates a schedule in Upstash QStash for balance check cron
 * 
 * Prerequisites:
 * 1. Upstash account: https://upstash.com
 * 2. QStash token from: https://console.upstash.com/qstash
 * 3. Add QSTASH_TOKEN to .env.local
 * 
 * Usage:
 *   node scripts/setup-upstash-balance-check.js
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

// ============================================================================
// 🔧 CONFIGURATION
// ============================================================================

const CONFIG = {
  qstashToken: process.env.QSTASH_TOKEN,
  cronSecret: process.env.CRON_SECRET,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  scheduleName: 'balance-check-hourly',
  cronExpression: '0 * * * *', // Every hour at minute 0
};

// ============================================================================
// 📋 VALIDATION
// ============================================================================

function validateConfig() {
  console.log('🔍 Validating configuration...\n');

  const errors = [];

  if (!CONFIG.qstashToken) {
    errors.push('❌ QSTASH_TOKEN not found in .env.local');
    errors.push('   Get it from: https://console.upstash.com/qstash');
    errors.push('   Add to .env.local: QSTASH_TOKEN=your-token-here\n');
  }

  if (!CONFIG.cronSecret) {
    errors.push('❌ CRON_SECRET not found in .env.local');
    errors.push('   Generate: openssl rand -base64 32');
    errors.push('   Add to .env.local: CRON_SECRET=your-secret-here\n');
  }

  if (!CONFIG.appUrl || CONFIG.appUrl === 'http://localhost:3000') {
    console.log('⚠️  Warning: APP_URL is localhost (development mode)');
    console.log('   For production, set: NEXT_PUBLIC_APP_URL=https://yourdomain.com\n');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration Error:\n');
    errors.forEach(err => console.error(err));
    console.error('\n💡 Steps to fix:');
    console.error('1. Go to https://console.upstash.com/qstash');
    console.error('2. Copy your QStash Token');
    console.error('3. Add to .env.local: QSTASH_TOKEN=your-token-here');
    console.error('4. Run this script again\n');
    process.exit(1);
  }

  console.log('✅ Configuration valid!\n');
}

// ============================================================================
// 📊 CREATE QSTASH SCHEDULE
// ============================================================================

function createSchedule() {
  return new Promise((resolve, reject) => {
    // Ensure URL has proper scheme
    let baseUrl = CONFIG.appUrl;
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    const endpoint = `${baseUrl}/api/cron/balance-check?token=${CONFIG.cronSecret}`;
    
    // QStash API v2 format
    const data = JSON.stringify({
      destination: endpoint,
      cron: CONFIG.cronExpression,
    });

    const options = {
      hostname: 'qstash.upstash.io',
      port: 443,
      path: '/v2/schedules',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.qstashToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    console.log('📋 Schedule Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name:        ${CONFIG.scheduleName}`);
    console.log(`Endpoint:    ${endpoint}`);
    console.log(`Cron:        ${CONFIG.cronExpression} (every hour)`);
    console.log(`Method:      POST`);
    console.log(`Retries:     3`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🚀 Creating schedule in Upstash QStash...\n');

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Schedule created successfully!\n');
            console.log('📊 Schedule Details:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Schedule ID:  ${response.scheduleId || response.id || 'N/A'}`);
            console.log(`Destination:  ${response.destination || endpoint}`);
            console.log(`Cron:         ${response.cron || CONFIG.cronExpression}`);
            console.log(`Created:      ${new Date().toISOString()}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            console.log('🔗 Useful Links:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Dashboard:  https://console.upstash.com/qstash');
            console.log('Logs:       https://console.upstash.com/qstash/logs');
            console.log('Schedules:  https://console.upstash.com/qstash/schedules');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            console.log('✅ Next Steps:');
            console.log('1. ✅ Schedule created (this step)');
            console.log('2. 🔍 Go to Upstash Console and verify schedule');
            console.log('3. 🧪 Test schedule with "Send Now" button');
            console.log('4. 📊 Monitor logs for successful execution');
            console.log('5. ✅ Wait for first hourly execution\n');

            resolve(response);
          } else {
            console.error('❌ Failed to create schedule\n');
            console.error(`Status Code: ${res.statusCode}`);
            console.error(`Response: ${responseData}\n`);
            
            if (res.statusCode === 401) {
              console.error('💡 Fix: Invalid QSTASH_TOKEN');
              console.error('   1. Go to https://console.upstash.com/qstash');
              console.error('   2. Copy your QStash Token');
              console.error('   3. Update QSTASH_TOKEN in .env.local\n');
            }
            
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          console.error('Response:', responseData);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      console.error('\n💡 Possible issues:');
      console.error('- No internet connection');
      console.error('- Firewall blocking HTTPS requests');
      console.error('- Invalid QStash token\n');
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// ============================================================================
// 🧪 TEST ENDPOINT
// ============================================================================

function testEndpoint() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${CONFIG.appUrl}/api/cron/balance-check?token=${CONFIG.cronSecret}`);
    
    console.log('🧪 Testing endpoint before creating schedule...\n');
    console.log(`Testing: ${url.href}\n`);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const client = url.protocol === 'https:' ? https : require('http');
    
    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Endpoint is accessible!\n');
          resolve(true);
        } else {
          console.log(`⚠️  Endpoint returned status ${res.statusCode}`);
          console.log('Response:', responseData);
          console.log('\n⚠️  Warning: Endpoint may not be ready, but continuing...\n');
          resolve(true); // Continue anyway for localhost
        }
      });
    });

    req.on('error', (error) => {
      if (CONFIG.appUrl.includes('localhost')) {
        console.log('⚠️  Localhost not responding (dev server not running?)');
        console.log('   This is OK - schedule will work when deployed\n');
        resolve(true);
      } else {
        console.error('❌ Endpoint test failed:', error.message);
        reject(error);
      }
    });

    req.setTimeout(5000, () => {
      console.log('⚠️  Request timeout (5s)');
      console.log('   This is OK if server not running locally\n');
      resolve(true);
    });

    req.end();
  });
}

// ============================================================================
// 🚀 MAIN
// ============================================================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║      🤖 Upstash QStash - Balance Check Schedule Setup 🤖        ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Validate configuration
    validateConfig();

    // Step 2: Test endpoint (optional, non-blocking)
    try {
      await testEndpoint();
    } catch (error) {
      console.log('⚠️  Endpoint test failed, but continuing...\n');
    }

    // Step 3: Create schedule
    await createSchedule();

    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                  ║');
    console.log('║                  ✅ SETUP COMPLETE! ✅                           ║');
    console.log('║                                                                  ║');
    console.log('║  Balance check cron will run every hour automatically! 🎉       ║');
    console.log('║                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n📚 Need help? Check documentation:');
    console.error('   - docs/BALANCE_CHECK_CRON_SETUP.md');
    console.error('   - docs/BALANCE_CHECK_QUICK_REFERENCE.md\n');
    process.exit(1);
  }
}

// Run main function
main();
