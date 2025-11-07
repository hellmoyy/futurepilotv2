#!/usr/bin/env node

/**
 * 🚀 Setup ALL Upstash QStash Schedules for FuturePilot
 * 
 * Cron Jobs:
 * 1. News Fetcher - Every 5 minutes
 * 2. Signal Generator - Every 1 minute
 * 3. Balance Check - Every 1 hour
 * 4. Deposit Monitor - Every 5 minutes
 * 5. Auto Fix Commissions - Daily at midnight
 * 
 * Usage: node scripts/setup-all-cron-jobs.js
 */

require('dotenv').config({ path: '.env' });
const { Client } = require('@upstash/qstash');

// Cron job definitions
const CRON_JOBS = [
  {
    name: 'news-fetcher',
    endpoint: '/api/cron/fetch-news',
    cron: '*/5 * * * *',
    description: 'Fetch crypto news every 5 minutes',
    retries: 3,
    timeout: 60,
  },
  {
    name: 'signal-generator',
    endpoint: '/api/cron/generate-signals',
    cron: '* * * * *',
    description: 'Generate trading signals every 1 minute',
    retries: 3,
    timeout: 30,
  },
  {
    name: 'balance-check',
    endpoint: '/api/cron/balance-check',
    cron: '0 * * * *',
    description: 'Check user balances every hour',
    retries: 3,
    timeout: 120,
  },
  {
    name: 'deposit-monitor',
    endpoint: '/api/cron/monitor-deposits',
    cron: '*/5 * * * *',
    description: 'Monitor deposits every 5 minutes',
    retries: 3,
    timeout: 60,
  },
  {
    name: 'auto-fix-commissions',
    endpoint: '/api/cron/auto-fix-commissions',
    cron: '0 0 * * *',
    description: 'Auto-fix commission discrepancies daily at midnight',
    retries: 2,
    timeout: 180,
  },
];

async function setupAllCronJobs() {
  try {
    console.log('🚀 FuturePilot - Upstash QStash Setup');
    console.log('=====================================\n');

    // Validate environment variables
    const token = process.env.QSTASH_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const cronSecret = process.env.CRON_SECRET;

    if (!token) {
      console.error('❌ Error: QSTASH_TOKEN not found in .env');
      console.error('   Get token at: https://console.upstash.com/qstash');
      process.exit(1);
    }

    if (!appUrl) {
      console.error('❌ Error: NEXT_PUBLIC_APP_URL not found in .env');
      console.error('   Example: https://futurepilot.pro');
      process.exit(1);
    }

    if (!cronSecret) {
      console.error('❌ Error: CRON_SECRET not found in .env');
      process.exit(1);
    }

    console.log('✅ Environment validated');
    console.log(`   App URL: ${appUrl}`);
    console.log(`   Cron Secret: ${cronSecret.substring(0, 10)}...`);
    console.log(`   Jobs to create: ${CRON_JOBS.length}\n`);

    // Initialize QStash client
    const client = new Client({ token });

    // Get existing schedules
    console.log('📋 Fetching existing schedules...');
    let existingSchedules = [];
    try {
      existingSchedules = await client.schedules.list();
      console.log(`   Found ${existingSchedules.length} existing schedules\n`);
    } catch (error) {
      console.log('   No existing schedules found\n');
    }

    // Create schedules
    const results = {
      created: [],
      skipped: [],
      failed: [],
    };

    for (const job of CRON_JOBS) {
      const destination = `${appUrl}${job.endpoint}`;
      
      console.log(`\n📦 Processing: ${job.name}`);
      console.log(`   Description: ${job.description}`);
      console.log(`   URL: ${destination}`);
      console.log(`   Cron: ${job.cron}`);

      // Check if schedule already exists
      const existing = existingSchedules.find(s => 
        s.destination === destination || 
        (s.scheduleId && s.scheduleId.includes(job.name))
      );

      if (existing) {
        console.log(`   ⏭️  Schedule already exists (ID: ${existing.scheduleId || 'unknown'})`);
        results.skipped.push(job.name);
        continue;
      }

      try {
        console.log('   ⏳ Creating schedule...');
        
        const schedule = await client.schedules.create({
          destination: destination,
          cron: job.cron,
          headers: {
            'Authorization': `Bearer ${cronSecret}`,
            'Content-Type': 'application/json',
          },
          retries: job.retries,
          timeout: job.timeout,
        });

        console.log(`   ✅ Created successfully!`);
        console.log(`   Schedule ID: ${schedule.scheduleId || 'N/A'}`);
        results.created.push(job.name);

      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        results.failed.push({ name: job.name, error: error.message });
      }
    }

    // Summary
    console.log('\n\n📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Created: ${results.created.length}`);
    if (results.created.length > 0) {
      results.created.forEach(name => console.log(`   - ${name}`));
    }
    
    console.log(`\n⏭️  Skipped: ${results.skipped.length}`);
    if (results.skipped.length > 0) {
      results.skipped.forEach(name => console.log(`   - ${name} (already exists)`));
    }
    
    console.log(`\n❌ Failed: ${results.failed.length}`);
    if (results.failed.length > 0) {
      results.failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
    }

    // Next steps
    console.log('\n\n🎯 NEXT STEPS');
    console.log('=============');
    console.log('1. Verify schedules at: https://console.upstash.com/qstash');
    console.log('2. Monitor executions in Upstash Dashboard');
    console.log('3. Check Railway logs: railway logs --tail');
    console.log('4. View schedules:');
    CRON_JOBS.forEach(job => {
      console.log(`   - ${job.name}: ${job.cron} (${job.description})`);
    });

    console.log('\n\n💰 COST ESTIMATION (FREE TIER: 500 req/day)');
    console.log('===========================================');
    console.log('signal-generator:    1440 req/day (1 min)  → PAID REQUIRED');
    console.log('news-fetcher:        288 req/day (5 min)   → FREE ✅');
    console.log('deposit-monitor:     288 req/day (5 min)   → FREE ✅');
    console.log('balance-check:       24 req/day (1 hour)   → FREE ✅');
    console.log('auto-fix-commissions: 1 req/day (daily)    → FREE ✅');
    console.log('-------------------------------------------');
    console.log('TOTAL:              ~2041 req/day          → PAID PLAN NEEDED (~$10/mo)');
    console.log('\nℹ️  Recommendation: Upgrade to Upstash Pro for reliable 1-min signal generation');

    console.log('\n✅ Setup complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:');
    console.error(error);
    process.exit(1);
  }
}

// Run
setupAllCronJobs();
