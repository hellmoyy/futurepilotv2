#!/usr/bin/env node

/**
 * Create Test Notifications Script
 * 
 * Usage:
 *   node scripts/create-test-notifications.js --email=user@example.com --count=5
 *   node scripts/create-test-notifications.js --userId=USER_ID --type=trading_commission
 * 
 * Options:
 *   --email      User email to find userId
 *   --userId     Direct userId (bypasses email lookup)
 *   --count      Number of notifications to create (default: 5)
 *   --type       Notification type (default: random)
 *   --priority   Priority level (default: random)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const path = require('path');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  walletData: Object,
}, { collection: 'futurepilotcols' });

const User = mongoose.models.futurepilotcols || mongoose.model('futurepilotcols', userSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  priority: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  channels: [String],
  actionUrl: String,
  metadata: Object,
});

const Notification = mongoose.models.notifications || mongoose.model('notifications', notificationSchema);

// Notification templates
const notificationTemplates = {
  trading_commission: [
    {
      priority: 'success',
      title: 'Trading Commission Deducted',
      message: 'Your trading commission of $10.00 has been deducted from your gas fee balance.',
      actionUrl: '/dashboard',
      metadata: { amount: 10, commission: 0.2, profit: 50 },
    },
    {
      priority: 'success',
      title: 'Trading Commission Deducted',
      message: 'Your trading commission of $25.50 has been deducted from your gas fee balance.',
      actionUrl: '/dashboard',
      metadata: { amount: 25.5, commission: 0.2, profit: 127.5 },
    },
  ],
  trading_autoclose: [
    {
      priority: 'warning',
      title: 'Position Auto-Closed',
      message: 'Your BTC/USDT position was automatically closed to protect your gas fee balance.',
      actionUrl: '/dashboard',
      metadata: { symbol: 'BTCUSDT', profit: 45, reason: 'Gas fee balance approaching limit' },
    },
  ],
  trading_low_gas: [
    {
      priority: 'error',
      title: 'Low Gas Fee Balance',
      message: 'Your gas fee balance is $8.50. You need at least $10 to continue trading.',
      actionUrl: '/topup',
      metadata: { currentBalance: 8.5, required: 10 },
    },
  ],
  position_opened: [
    {
      priority: 'info',
      title: 'Position Opened',
      message: 'Long position opened on BTC/USDT with 10x leverage.',
      actionUrl: '/dashboard',
      metadata: { symbol: 'BTCUSDT', leverage: 10, side: 'LONG' },
    },
    {
      priority: 'info',
      title: 'Position Opened',
      message: 'Short position opened on ETH/USDT with 10x leverage.',
      actionUrl: '/dashboard',
      metadata: { symbol: 'ETHUSDT', leverage: 10, side: 'SHORT' },
    },
  ],
  position_closed: [
    {
      priority: 'success',
      title: 'Position Closed - Profit',
      message: 'Your BTC/USDT position closed with $50.00 profit (+45% ROI).',
      actionUrl: '/dashboard',
      metadata: { symbol: 'BTCUSDT', profit: 50, roi: 45 },
    },
    {
      priority: 'error',
      title: 'Position Closed - Loss',
      message: 'Your ETH/USDT position closed with -$20.00 loss (-18% ROI).',
      actionUrl: '/dashboard',
      metadata: { symbol: 'ETHUSDT', profit: -20, roi: -18 },
    },
  ],
  tier_upgrade: [
    {
      priority: 'success',
      title: '🎉 Tier Upgraded to Silver!',
      message: 'Congratulations! Your tier has been upgraded to Silver. Your commission rates have increased.',
      actionUrl: '/referrals',
      metadata: {
        oldTier: 'bronze',
        newTier: 'silver',
        oldRates: { level1: 0.1, level2: 0.05, level3: 0.05 },
        newRates: { level1: 0.2, level2: 0.05, level3: 0.05 },
      },
    },
    {
      priority: 'success',
      title: '🎉 Tier Upgraded to Gold!',
      message: 'Congratulations! Your tier has been upgraded to Gold. Your commission rates have increased significantly.',
      actionUrl: '/referrals',
      metadata: {
        oldTier: 'silver',
        newTier: 'gold',
        oldRates: { level1: 0.2, level2: 0.05, level3: 0.05 },
        newRates: { level1: 0.3, level2: 0.05, level3: 0.05 },
      },
    },
  ],
  referral_commission: [
    {
      priority: 'success',
      title: 'Referral Commission Earned',
      message: 'You earned $30.00 commission from your referral\'s deposit.',
      actionUrl: '/referrals',
      metadata: { amount: 30, referralName: 'John Doe', level: 1 },
    },
  ],
  deposit_confirmed: [
    {
      priority: 'success',
      title: 'Deposit Confirmed',
      message: 'Your deposit of $100.00 USDT has been confirmed and credited to your gas fee balance.',
      actionUrl: '/topup',
      metadata: { amount: 100, txHash: '0x1234...5678', network: 'ERC20' },
    },
  ],
  withdrawal_approved: [
    {
      priority: 'success',
      title: 'Withdrawal Approved',
      message: 'Your withdrawal request of $50.00 has been approved and processed.',
      actionUrl: '/referrals',
      metadata: { amount: 50, txHash: '0xabcd...efgh' },
    },
  ],
  withdrawal_rejected: [
    {
      priority: 'error',
      title: 'Withdrawal Rejected',
      message: 'Your withdrawal request of $50.00 was rejected. Reason: Insufficient balance.',
      actionUrl: '/referrals',
      metadata: { amount: 50, reason: 'Insufficient balance' },
    },
  ],
  system_alert: [
    {
      priority: 'warning',
      title: 'System Maintenance Scheduled',
      message: 'Platform will undergo maintenance tonight at 10 PM UTC for approximately 2 hours.',
      actionUrl: null,
      metadata: { duration: '2 hours', startTime: '2025-11-02T22:00:00Z' },
    },
    {
      priority: 'info',
      title: 'New Feature Available',
      message: 'Check out the new AI Agent feature for advanced trading analysis!',
      actionUrl: '/ai-agent',
      metadata: { feature: 'AI Agent' },
    },
  ],
  account_update: [
    {
      priority: 'info',
      title: 'Account Settings Updated',
      message: 'Your account settings have been successfully updated.',
      actionUrl: '/settings',
      metadata: { section: 'profile' },
    },
  ],
};

// Get random notification template
function getRandomNotification(type) {
  const types = type ? [type] : Object.keys(notificationTemplates);
  const randomType = types[Math.floor(Math.random() * types.length)];
  const templates = notificationTemplates[randomType];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    type: randomType,
    ...template,
    channels: ['database'], // Only save to database for testing
  };
}

// Create test notifications
async function createTestNotifications(userId, count, type, priority) {
  console.log(`\n📝 Creating ${count} test notifications...`);
  
  const notifications = [];
  
  for (let i = 0; i < count; i++) {
    const template = getRandomNotification(type);
    
    // Override priority if specified
    if (priority) {
      template.priority = priority;
    }
    
    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(userId),
      ...template,
      createdAt: new Date(Date.now() - (i * 60000)), // Stagger by 1 minute
    });
    
    await notification.save();
    notifications.push(notification);
    
    console.log(`  ${i + 1}. ${template.priority.padEnd(8)} | ${template.type.padEnd(25)} | ${template.title}`);
  }
  
  console.log(`\n✅ Successfully created ${notifications.length} notifications`);
  return notifications;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    email: null,
    userId: null,
    count: 5,
    type: null,
    priority: null,
  };
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    const optionKey = key.replace('--', '');
    
    if (optionKey === 'count') {
      options.count = parseInt(value) || 5;
    } else if (options.hasOwnProperty(optionKey)) {
      options[optionKey] = value;
    }
  });
  
  return options;
}

// Main function
async function main() {
  console.log('🔔 FuturePilot - Test Notification Creator\n');
  
  const options = parseArgs();
  
  // Validate options
  if (!options.email && !options.userId) {
    console.error('❌ Error: Please provide either --email or --userId');
    console.log('\nUsage:');
    console.log('  node scripts/create-test-notifications.js --email=user@example.com --count=5');
    console.log('  node scripts/create-test-notifications.js --userId=USER_ID --type=trading_commission');
    process.exit(1);
  }
  
  await connectDB();
  
  try {
    // Find user
    let userId = options.userId;
    
    if (options.email) {
      console.log(`🔍 Finding user with email: ${options.email}`);
      const user = await User.findOne({ email: options.email });
      
      if (!user) {
        console.error(`❌ User not found with email: ${options.email}`);
        process.exit(1);
      }
      
      userId = user._id.toString();
      console.log(`✅ Found user: ${user.name} (${user._id})`);
    } else {
      console.log(`📋 Using userId: ${userId}`);
    }
    
    // Create notifications
    await createTestNotifications(userId, options.count, options.type, options.priority);
    
    // Show summary
    const unreadCount = await Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), read: false });
    console.log(`\n📊 Summary:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Total Notifications: ${options.count}`);
    console.log(`   Unread Count: ${unreadCount}`);
    
    if (options.type) {
      console.log(`   Type Filter: ${options.type}`);
    }
    if (options.priority) {
      console.log(`   Priority Filter: ${options.priority}`);
    }
    
    console.log(`\n✅ Done! Check the notification center in the dashboard.`);
    
  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createTestNotifications };
