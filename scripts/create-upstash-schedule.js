#!/usr/bin/env node

/**
 * 🚀 Create Upstash QStash Schedule for News Fetcher
 * 
 * Usage: node scripts/create-upstash-schedule.js
 */

require('dotenv').config({ path: '.env' });
const { Client } = require('@upstash/qstash');

async function createSchedule() {
  try {
    console.log('🚀 Creating Upstash QStash Schedule...\n');

    // Validate environment variables
    const token = process.env.QSTASH_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const cronSecret = process.env.CRON_SECRET;

    if (!token) {
      console.error('❌ Error: QSTASH_TOKEN not found in .env');
      process.exit(1);
    }

    if (!appUrl) {
      console.error('❌ Error: NEXT_PUBLIC_APP_URL not found in .env');
      process.exit(1);
    }

    if (!cronSecret) {
      console.error('❌ Error: CRON_SECRET not found in .env');
      process.exit(1);
    }

    // Initialize QStash client
    const client = new Client({ token });

    // Schedule configuration
    const destination = `${appUrl}/api/cron/fetch-news`;
    const cron = '*/5 * * * *'; // Every 5 minutes (FREE TIER)

    console.log('📋 Configuration:');
    console.log(`   URL: ${destination}`);
    console.log(`   Cron: ${cron} (every 5 minutes)`);
    console.log(`   Auth: Bearer ${cronSecret.substring(0, 10)}...`);
    console.log('');

    // Create schedule
    console.log('⏳ Creating schedule...');
    
    const schedule = await client.schedules.create({
      destination: destination,
      cron: cron,
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
      retries: 3,
    });

    console.log('\n✅ Schedule created successfully!');
    console.log('');
    console.log('📊 Schedule Details:');
    console.log(JSON.stringify(schedule, null, 2));
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Verify at: https://console.upstash.com/qstash');
    console.log('   2. Wait 5 minutes for first execution');
    console.log('   3. Check logs: railway logs --tail');
    console.log('   4. Monitor: https://futurepilot.pro/administrator/bot-decision');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error creating schedule:');
    console.error(error.message);
    
    if (error.response) {
      console.error('\nAPI Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\n💡 Try these solutions:');
    console.error('   1. Verify QSTASH_TOKEN in .env is correct');
    console.error('   2. Check NEXT_PUBLIC_APP_URL is accessible (https://...)');
    console.error('   3. Verify Upstash account has QStash enabled');
    console.error('   4. Use manual setup: https://console.upstash.com/qstash');
    
    process.exit(1);
  }
}

// Run
createSchedule();
