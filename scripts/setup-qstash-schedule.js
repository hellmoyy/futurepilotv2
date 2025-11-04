#!/usr/bin/env node

/**
 * Setup QStash Schedule for Auto-Fix Commission Cron
 * 
 * This script creates a QStash schedule that calls the auto-fix-commissions
 * endpoint every 5 minutes to catch any missed commission calculations.
 * 
 * Prerequisites:
 * - QSTASH_TOKEN in .env.local
 * - CRON_SECRET in .env.local
 * - NEXT_PUBLIC_APP_URL set to production URL
 * 
 * Usage:
 *   node scripts/setup-qstash-schedule.js
 *   node scripts/setup-qstash-schedule.js --delete    # Delete existing schedule
 *   node scripts/setup-qstash-schedule.js --list      # List all schedules
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Client } = require('@upstash/qstash');

// Configuration
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SCHEDULE_NAME = 'auto-fix-commissions';
const CRON_EXPRESSION = '*/5 * * * *'; // Every 5 minutes

// Validate environment
if (!QSTASH_TOKEN) {
  console.error('❌ QSTASH_TOKEN not found in .env.local');
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in .env.local');
  process.exit(1);
}

// Initialize QStash client
const client = new Client({ token: QSTASH_TOKEN });

/**
 * Create QStash schedule
 */
async function createSchedule() {
  try {
    console.log('🚀 Creating QStash schedule...\n');
    console.log('📋 Configuration:');
    console.log(`   - Name: ${SCHEDULE_NAME}`);
    console.log(`   - Cron: ${CRON_EXPRESSION} (every 5 minutes)`);
    console.log(`   - Endpoint: ${APP_URL}/api/cron/auto-fix-commissions`);
    console.log(`   - Method: GET\n`);

    const destination = `${APP_URL}/api/cron/auto-fix-commissions?token=${CRON_SECRET}`;

    const schedule = await client.schedules.create({
      destination: destination,
      cron: CRON_EXPRESSION,
      // Optional: Add headers for additional security
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'QStash-AutoFixCommission/1.0'
      }
    });

    console.log('✅ Schedule created successfully!\n');
    console.log('📊 Schedule Details:');
    console.log(`   - Schedule ID: ${schedule.scheduleId}`);
    console.log(`   - Created At: ${schedule.createdAt}`);
    console.log(`   - Cron: ${schedule.cron}`);
    console.log(`   - Destination: ${schedule.destination?.replace(/token=[^&]+/, 'token=***')}\n`);
    
    console.log('🎯 Next Steps:');
    console.log('   1. Verify schedule in QStash console: https://console.upstash.com/qstash');
    console.log('   2. Wait 5 minutes and check logs');
    console.log('   3. Run: node scripts/monitor-commissions.js');
    console.log('   4. Verify no duplicate commissions created\n');

    console.log('💡 Tips:');
    console.log('   - To delete: node scripts/setup-qstash-schedule.js --delete');
    console.log('   - To list all: node scripts/setup-qstash-schedule.js --list');
    console.log('   - Logs available in QStash console\n');

    return schedule;
  } catch (error) {
    console.error('❌ Failed to create schedule:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Schedule already exists. To recreate:');
      console.log('   1. Delete: node scripts/setup-qstash-schedule.js --delete');
      console.log('   2. Recreate: node scripts/setup-qstash-schedule.js\n');
    }
    
    throw error;
  }
}

/**
 * List all schedules
 */
async function listSchedules() {
  try {
    console.log('📋 Fetching all QStash schedules...\n');
    
    const schedules = await client.schedules.list();
    
    if (!schedules || schedules.length === 0) {
      console.log('📭 No schedules found\n');
      return;
    }

    console.log(`✅ Found ${schedules.length} schedule(s):\n`);
    
    schedules.forEach((schedule, index) => {
      console.log(`${index + 1}. Schedule ID: ${schedule.scheduleId}`);
      console.log(`   - Cron: ${schedule.cron}`);
      console.log(`   - Destination: ${schedule.destination?.replace(/token=[^&]+/, 'token=***')}`);
      console.log(`   - Created: ${schedule.createdAt || 'N/A'}`);
      console.log(`   - Status: ${schedule.isPaused ? '⏸️  Paused' : '▶️  Active'}`);
      console.log('');
    });

    return schedules;
  } catch (error) {
    console.error('❌ Failed to list schedules:', error.message);
    throw error;
  }
}

/**
 * Delete schedule by ID or find and delete by destination
 */
async function deleteSchedule(scheduleId = null) {
  try {
    console.log('🗑️  Deleting QStash schedule...\n');

    // If no ID provided, find schedule by destination
    if (!scheduleId) {
      console.log('🔍 Searching for auto-fix-commissions schedule...');
      const schedules = await client.schedules.list();
      
      const targetSchedule = schedules.find(s => 
        s.destination?.includes('/api/cron/auto-fix-commissions')
      );

      if (!targetSchedule) {
        console.log('❌ Schedule not found. Run --list to see all schedules.\n');
        return;
      }

      scheduleId = targetSchedule.scheduleId;
      console.log(`✅ Found schedule: ${scheduleId}\n`);
    }

    await client.schedules.delete(scheduleId);
    
    console.log('✅ Schedule deleted successfully!\n');
    console.log('💡 To recreate: node scripts/setup-qstash-schedule.js\n');

  } catch (error) {
    console.error('❌ Failed to delete schedule:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === '--list') {
      await listSchedules();
    } else if (command === '--delete') {
      const scheduleId = args[1]; // Optional: specific schedule ID
      await deleteSchedule(scheduleId);
    } else if (command === '--help') {
      console.log(`
📖 QStash Schedule Setup Tool

Usage:
  node scripts/setup-qstash-schedule.js           # Create schedule
  node scripts/setup-qstash-schedule.js --list    # List all schedules
  node scripts/setup-qstash-schedule.js --delete  # Delete auto-fix schedule
  node scripts/setup-qstash-schedule.js --delete <id>  # Delete specific schedule

Environment Variables:
  QSTASH_TOKEN              - QStash API token (required)
  CRON_SECRET               - Secret for cron endpoint auth (required)
  NEXT_PUBLIC_APP_URL       - Production URL (default: localhost:3000)

Schedule Configuration:
  - Name: ${SCHEDULE_NAME}
  - Frequency: Every 5 minutes (${CRON_EXPRESSION})
  - Endpoint: /api/cron/auto-fix-commissions

Documentation:
  See docs/AUTO_FIX_COMMISSION_CRON.md for complete guide
      `);
    } else {
      // Default: create schedule
      await createSchedule();
    }

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

// Run
main();
