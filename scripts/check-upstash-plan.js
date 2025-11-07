#!/usr/bin/env node

/**
 * 🔍 Check Upstash QStash Account Info & Limits
 */

require('dotenv').config({ path: '.env' });

async function checkUpstashPlan() {
  try {
    const token = process.env.QSTASH_TOKEN;

    if (!token) {
      console.error('❌ QSTASH_TOKEN not found in .env');
      process.exit(1);
    }

    console.log('🔍 Checking Upstash QStash Account...\n');

    // Get schedules
    const schedulesResponse = await fetch('https://qstash.upstash.io/v2/schedules', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const schedules = await schedulesResponse.json();

    console.log('📊 CURRENT SCHEDULES');
    console.log('===================');
    console.log(`Total Schedules: ${schedules.length}\n`);

    if (schedules.length > 0) {
      schedules.forEach((s, i) => {
        console.log(`${i + 1}. ${s.scheduleId || 'Unknown'}`);
        console.log(`   URL: ${s.destination || 'N/A'}`);
        console.log(`   Cron: ${s.cron || 'N/A'}`);
        console.log(`   Created: ${s.createdAt ? new Date(s.createdAt * 1000).toLocaleString() : 'N/A'}`);
        console.log('');
      });
    }

    // Calculate daily requests
    console.log('\n📈 DAILY REQUEST ESTIMATION');
    console.log('==========================');
    
    const requestsPerDay = schedules.reduce((total, schedule) => {
      const cron = schedule.cron || '';
      let dailyReqs = 0;

      if (cron === '* * * * *') dailyReqs = 1440; // Every minute
      else if (cron === '*/5 * * * *') dailyReqs = 288; // Every 5 min
      else if (cron === '*/15 * * * *') dailyReqs = 96; // Every 15 min
      else if (cron === '0 * * * *') dailyReqs = 24; // Hourly
      else if (cron === '0 0 * * *') dailyReqs = 1; // Daily
      else dailyReqs = 0;

      console.log(`${schedule.cron?.padEnd(15)} → ${dailyReqs.toString().padStart(4)} req/day`);
      return total + dailyReqs;
    }, 0);

    console.log('----------------------------');
    console.log(`TOTAL: ${requestsPerDay} requests/day\n`);

    // Plan limits
    console.log('💳 UPSTASH PLAN LIMITS');
    console.log('=====================');
    console.log('Free Tier:  500 requests/day');
    console.log('Pro Plan:   Unlimited requests (~$10/mo)');
    console.log('');

    if (requestsPerDay <= 500) {
      console.log('✅ Status: Within FREE TIER limits');
    } else {
      console.log('⚠️  Status: EXCEEDS FREE TIER');
      console.log(`   Overage: ${requestsPerDay - 500} requests/day`);
      console.log('   Action: Upgrade to Pro OR reduce frequency');
      console.log('');
      console.log('💡 Options to stay FREE:');
      console.log('   1. Change signal-generator to 5-min (*/5 * * * *)');
      console.log('   2. Change signal-generator to 15-min (*/15 * * * *)');
      console.log('   3. Disable some schedules');
    }

    console.log('\n✅ Check complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkUpstashPlan();
