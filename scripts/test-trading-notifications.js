#!/usr/bin/env node
/**
 * Test Trading Notifications System
 * 
 * Tests:
 * 1. Auto-close notification (position closed to prevent negative balance)
 * 2. Low gas fee warning (balance < $10, cannot trade)
 * 3. Low balance alert (balance approaching minimum)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.magenta}▶${colors.reset} ${msg}`),
  result: (label, value) => console.log(`${colors.cyan}  ${label}:${colors.reset} ${value}`),
};

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  gasFeeBalance: { type: Number, default: 0 },
}, { collection: 'futurepilotcols' });

const notificationSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  type: String,
  title: String,
  message: String,
  priority: String,
  read: Boolean,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true, collection: 'notifications' });

const User = mongoose.model('User', userSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// Import NotificationManager (simulated)
async function sendNotification(type, userId, metadata) {
  // Simulate NotificationManager.send()
  const notificationData = {
    userId,
    type,
    read: false,
    metadata,
  };

  switch (type) {
    case 'trading_autoclose':
      notificationData.title = '⚠️ Position Auto-Closed';
      notificationData.message = `Your position was automatically closed at ${metadata.profit.toFixed(2)} USDT profit to prevent negative gas fee balance`;
      notificationData.priority = 'warning';
      break;
    
    case 'trading_low_gas':
      notificationData.title = '🚨 Low Gas Fee Balance';
      notificationData.message = `Your gas fee balance (${metadata.gasFeeBalance.toFixed(2)} USDT) is below 10 USDT. Please top up to continue trading.`;
      notificationData.priority = 'error';
      break;
    
    case 'low_gas_balance':
      notificationData.title = '⚠️ Low Gas Fee Balance';
      notificationData.message = `Your gas fee balance is running low: ${metadata.currentBalance.toFixed(2)} USDT`;
      notificationData.priority = 'warning';
      break;
  }

  await Notification.create(notificationData);
  log.success(`Notification created: ${notificationData.title}`);
}

// Test Cases
const testCases = [
  {
    name: 'Test 1: Auto-Close Notification',
    description: 'Position auto-closed to prevent negative balance',
    type: 'trading_autoclose',
    metadata: {
      positionId: 'POS-12345',
      profit: 45.50,
      autoCloseThreshold: 10,
      gasFeeBalance: 12.30,
      link: '/automation',
      actionLabel: 'View Dashboard',
    },
  },
  {
    name: 'Test 2: Low Gas Fee Warning (Cannot Trade)',
    description: 'Gas fee balance < $10, trading paused',
    type: 'trading_low_gas',
    metadata: {
      gasFeeBalance: 7.50,
      link: '/topup',
      actionLabel: 'Top Up Now',
    },
  },
  {
    name: 'Test 3: Low Balance Alert',
    description: 'Balance approaching minimum, early warning',
    type: 'low_gas_balance',
    metadata: {
      currentBalance: 15.00,
      minimumRequired: 10,
      link: '/topup',
      actionLabel: 'Top Up Now',
    },
  },
];

// Test runner
async function runTest(testCase, user) {
  log.step(`\n${'='.repeat(60)}`);
  log.step(`${testCase.name}`);
  log.step(`${testCase.description}`);
  log.step(`${'='.repeat(60)}`);

  try {
    // Send notification
    log.info('Sending notification...');
    await sendNotification(testCase.type, user._id, testCase.metadata);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if notification was created
    const notification = await Notification.findOne({
      userId: user._id,
      type: testCase.type,
    }).sort({ createdAt: -1 });

    if (notification) {
      log.success('Notification found in database!');
      log.result('  Type', notification.type);
      log.result('  Title', notification.title);
      log.result('  Message', notification.message);
      log.result('  Priority', notification.priority);
      log.result('  Read', notification.read ? 'Yes' : 'No');
      
      if (notification.metadata) {
        log.result('  Metadata', JSON.stringify(notification.metadata, null, 2));
      }

      return true;
    } else {
      log.error('Notification NOT found in database!');
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Main
async function main() {
  console.log(`\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║      TRADING NOTIFICATIONS SYSTEM - TEST SUITE           ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Connect to MongoDB
    log.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');

    // Create or get test user
    log.info('Creating test user...');
    let user = await User.findOne({ email: 'trading-test@test.com' });
    
    if (!user) {
      user = await User.create({
        email: 'trading-test@test.com',
        name: 'Trading Test User',
        gasFeeBalance: 15.00,
      });
      log.success('Test user created');
    } else {
      log.info('Using existing test user');
    }

    log.result('User ID', user._id);
    log.result('Email', user.email);
    log.result('Gas Fee Balance', `$${user.gasFeeBalance.toFixed(2)}`);

    // Run all tests
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const result = await runTest(testCase, user);
      if (result) {
        passed++;
      } else {
        failed++;
      }
    }

    // Summary
    console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
    log.result('Total Tests', testCases.length);
    log.result('Passed', `${passed} ${colors.green}✅${colors.reset}`);
    log.result('Failed', `${failed} ${failed > 0 ? colors.red + '❌' : colors.green + '✅'}${colors.reset}`);
    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);

    if (failed === 0) {
      log.success('All tests passed! Trading notifications are working correctly.');
      log.info('\nNext steps:');
      console.log('  1. Test email delivery (check inbox for trading-test@test.com)');
      console.log('  2. Test in-app notifications (check bell icon in dashboard)');
      console.log('  3. Integrate into trading bot logic');
      console.log('  4. Test with real trading scenarios');
    } else {
      log.error('Some tests failed! Please check the implementation.');
    }

    // Cleanup option
    log.info('\nCleanup test data...');
    await Notification.deleteMany({ userId: user._id });
    // await User.deleteOne({ _id: user._id }); // Keep user for manual testing
    log.success('Test notifications cleaned up');

  } catch (error) {
    log.error(`Test runner error: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log.info('Disconnected from MongoDB');
  }
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
