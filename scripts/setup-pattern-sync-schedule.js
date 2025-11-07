#!/usr/bin/env node

/**
 * 🚀 Setup QStash Schedule for Bot Pattern Sync
 * 
 * This script creates a QStash schedule to automatically sync
 * Bot Signal patterns to Bot Decision every 15 minutes.
 * 
 * Prerequisites:
 * - QSTASH_TOKEN in .env
 * - CRON_SECRET in .env
 * - NEXT_PUBLIC_APP_URL set to production URL
 * 
 * Usage:
 *   node scripts/setup-pattern-sync-schedule.js
 *   node scripts/setup-pattern-sync-schedule.js --delete    # Delete existing schedule
 *   node scripts/setup-pattern-sync-schedule.js --list      # List all schedules
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('@upstash/qstash');

// Configuration
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SCHEDULE_NAME = 'bot-pattern-sync';
const CRON_EXPRESSION = '*/15 * * * *'; // Every 15 minutes

// Validate environment
if (!QSTASH_TOKEN) {
  console.error('❌ QSTASH_TOKEN not found in .env');
  console.error('   Get your token from: https://console.upstash.com/qstash');
  console.error('   Add to .env: QSTASH_TOKEN=qstash_xxxxx');
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in .env');
  console.error('   Generate a secure secret:');
  console.error('   openssl rand -base64 32');
  console.error('   Add to .env: CRON_SECRET=your-secret-here');
  process.exit(1);
}

// Initialize QStash client
const client = new Client({ token: QSTASH_TOKEN });

/**
 * Create QStash schedule
 */
async function createSchedule() {
  try {
    console.log('🚀 Creating QStash schedule for Bot Pattern Sync...\n');
    console.log('📋 Configuration:');
    console.log(`   Name: ${SCHEDULE_NAME}`);
    console.log(`   URL: ${APP_URL}/api/cron/sync-bot-patterns`);
    console.log(`   Schedule: ${CRON_EXPRESSION} (Every 15 minutes)`);
    console.log(`   Retries: 3`);
    console.log(`   Timeout: 30s\n`);

    // Create schedule
    const schedule = await client.schedules.create({
      destination: `${APP_URL}/api/cron/sync-bot-patterns`,
      cron: CRON_EXPRESSION,
      body: JSON.stringify({
        source: 'qstash-scheduled',
        automated: true
      }),
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      retries: 3,
      timeout: 30
    });

    console.log('✅ Schedule created successfully!\n');
    console.log('📊 Schedule Details:');
    console.log(`   Schedule ID: ${schedule.scheduleId}`);
    console.log(`   Destination: ${APP_URL}/api/cron/sync-bot-patterns`);
    console.log(`   Cron: ${CRON_EXPRESSION}`);
    console.log(`   Created: ${new Date().toISOString()}\n`);

    console.log('🎉 Setup complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Verify at: https://console.upstash.com/qstash');
    console.log('   2. Test with "Run Now" button');
    console.log('   3. Check logs for successful execution');
    console.log('   4. Monitor pattern sync every 15 minutes\n');

    // Test endpoint connectivity
    await testEndpoint();

  } catch (error) {
    console.error('\n❌ Error creating schedule:', error.message);
    
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Verify QSTASH_TOKEN is correct');
      console.error('   - Get token from: https://console.upstash.com/qstash');
      console.error('   - Token should start with "qstash_"');
    } else if (error.message.includes('destination') || error.message.includes('url')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Verify NEXT_PUBLIC_APP_URL is correct');
      console.error('   - URL must be publicly accessible (HTTPS)');
      console.error('   - Local URLs (localhost) will NOT work with QStash');
    } else {
      console.error('\n💡 Full error:', error);
    }
    
    process.exit(1);
  }
}

/**
 * Delete existing schedule
 */
async function deleteSchedule() {
  try {
    console.log('🗑️  Deleting existing schedules...\n');

    const schedules = await client.schedules.list();
    
    if (!schedules || schedules.length === 0) {
      console.log('✅ No schedules found to delete.\n');
      return;
    }

    // Find schedules for pattern sync
    const patternSyncSchedules = schedules.filter(s => 
      s.destination?.includes('sync-bot-patterns') ||
      s.cron === CRON_EXPRESSION
    );

    if (patternSyncSchedules.length === 0) {
      console.log('✅ No pattern sync schedules found to delete.\n');
      return;
    }

    console.log(`📋 Found ${patternSyncSchedules.length} schedule(s) to delete:\n`);

    for (const schedule of patternSyncSchedules) {
      console.log(`   Deleting: ${schedule.scheduleId}`);
      console.log(`   Destination: ${schedule.destination}`);
      console.log(`   Cron: ${schedule.cron}\n`);
      
      await client.schedules.delete(schedule.scheduleId);
      console.log(`   ✅ Deleted!\n`);
    }

    console.log('🎉 All pattern sync schedules deleted successfully!\n');

  } catch (error) {
    console.error('❌ Error deleting schedule:', error.message);
    process.exit(1);
  }
}

/**
 * List all schedules
 */
async function listSchedules() {
  try {
    console.log('📋 Fetching all schedules...\n');

    const schedules = await client.schedules.list();
    
    if (!schedules || schedules.length === 0) {
      console.log('✅ No schedules found.\n');
      return;
    }

    console.log(`📊 Total schedules: ${schedules.length}\n`);

    schedules.forEach((schedule, index) => {
      console.log(`${index + 1}. Schedule ID: ${schedule.scheduleId}`);
      console.log(`   Destination: ${schedule.destination}`);
      console.log(`   Cron: ${schedule.cron}`);
      console.log(`   Created: ${schedule.createdAt ? new Date(schedule.createdAt * 1000).toISOString() : 'N/A'}`);
      console.log(`   Paused: ${schedule.isPaused ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Highlight pattern sync schedules
    const patternSyncSchedules = schedules.filter(s => 
      s.destination?.includes('sync-bot-patterns')
    );

    if (patternSyncSchedules.length > 0) {
      console.log(`🎯 Pattern Sync Schedules: ${patternSyncSchedules.length}\n`);
      patternSyncSchedules.forEach((schedule, index) => {
        console.log(`   ${index + 1}. ${schedule.scheduleId}`);
        console.log(`      ${schedule.destination}`);
        console.log(`      ${schedule.cron} (Every 15 minutes)\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error listing schedules:', error.message);
    process.exit(1);
  }
}

/**
 * Test endpoint connectivity
 */
async function testEndpoint() {
  console.log('🧪 Testing endpoint connectivity...\n');

  const endpoint = `${APP_URL}/api/cron/sync-bot-patterns`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'test',
        automated: true
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Endpoint test successful!');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Response:`, JSON.stringify(result, null, 2));
      console.log('');
    } else {
      console.log(`⚠️  Endpoint returned: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
      console.log('\n   Note: This may be expected if your app is not deployed yet.');
      console.log('   Schedule will work once deployed.\n');
    }
  } catch (error) {
    console.log(`⚠️  Could not test endpoint: ${error.message}`);
    console.log('   Note: This is OK if app is not deployed yet.');
    console.log('   Schedule will work once deployed.\n');
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔄 QStash Pattern Sync Setup\n');
  console.log('═══════════════════════════════════════════\n');

  switch (command) {
    case '--delete':
    case '-d':
      await deleteSchedule();
      break;

    case '--list':
    case '-l':
      await listSchedules();
      break;

    case '--help':
    case '-h':
      console.log('Usage:');
      console.log('  node scripts/setup-pattern-sync-schedule.js          # Create schedule');
      console.log('  node scripts/setup-pattern-sync-schedule.js --delete # Delete schedule');
      console.log('  node scripts/setup-pattern-sync-schedule.js --list   # List all schedules');
      console.log('  node scripts/setup-pattern-sync-schedule.js --help   # Show this help\n');
      break;

    default:
      await createSchedule();
      break;
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
