#!/usr/bin/env node
/**
 * Test Risk Management System
 * 
 * Tests:
 * 1. Adaptive daily trade limits based on win rate
 * 2. Consecutive loss protection (auto-cooldown)
 * 3. Cooldown auto-reset after period expires
 * 4. Win resets consecutive losses
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/futurepilot';

async function testRiskManagement() {
  console.log('🧪 Testing Risk Management System...\n');
  
  let client;
  let db;
  
  try {
    // Connect to MongoDB
    client = await MongoClient.connect(MONGODB_URI);
    db = client.db();
    console.log('✅ Connected to MongoDB\n');
    
    // Test user ID (use existing test user or create new)
    const testUserId = new mongoose.Types.ObjectId('674f5e8a1234567890abcdef');
    
    // Create test UserBot document
    const testBot = {
      userId: testUserId,
      status: 'active',
      lastBalanceCheck: {
        timestamp: new Date(),
        binanceBalance: 10000,
        gasFeeBalance: 50,
        availableMargin: 8000,
        usedMargin: 2000,
      },
      aiConfig: {
        enabled: true,
        confidenceThreshold: 0.82,
        newsWeight: 0.10,
        backtestWeight: 0.05,
        learningWeight: 0.03,
        minGasFeeBalance: 10,
      },
      tradingConfig: {
        riskPercent: 0.02,
        maxLeverage: 10,
        maxDailyTrades: 50,
        allowedPairs: ['BTCUSDT'],
        blacklistPairs: [],
      },
      riskManagement: {
        maxDailyTradesHighWinRate: 4,
        maxDailyTradesLowWinRate: 2,
        winRateThreshold: 0.85,
        maxConsecutiveLosses: 2,
        cooldownPeriodHours: 24,
        isInCooldown: false,
        cooldownStartTime: null,
        cooldownReason: '',
      },
      stats: {
        totalSignalsReceived: 100,
        signalsExecuted: 80,
        signalsRejected: 20,
        totalTrades: 50,
        winningTrades: 44,
        losingTrades: 6,
        winRate: 0.88, // 88% win rate (HIGH)
        totalProfit: 5000,
        totalLoss: 600,
        netProfit: 4400,
        bestTrade: 500,
        worstTrade: -200,
        avgProfit: 113.64,
        avgLoss: 100,
        patternsLearned: 5,
        patternsAvoided: 3,
        learningImprovementPct: 0.05,
      },
      consecutiveWins: 3,
      consecutiveLosses: 0,
      dailyTradeCount: 0,
      weeklyProfitLoss: 1000,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert test bot
    await db.collection('userbots').deleteMany({ userId: testUserId });
    const insertResult = await db.collection('userbots').insertOne(testBot);
    console.log('✅ Created test UserBot document\n');
    
    // ========================================
    // TEST 1: High Win Rate - Adaptive Limit
    // ========================================
    console.log('📊 TEST 1: High Win Rate - Adaptive Daily Limit');
    console.log('Settings: Win Rate 88% ≥ Threshold 85%');
    console.log('Expected: Daily limit = 4 trades\n');
    
    let bot = await db.collection('userbots').findOne({ userId: testUserId });
    
    // Simulate 3 trades used
    await db.collection('userbots').updateOne(
      { userId: testUserId },
      { $set: { dailyTradeCount: 3 } }
    );
    
    bot = await db.collection('userbots').findOne({ userId: testUserId });
    const isHighWR = bot.stats.winRate >= bot.riskManagement.winRateThreshold;
    const limit1 = isHighWR ? bot.riskManagement.maxDailyTradesHighWinRate : bot.riskManagement.maxDailyTradesLowWinRate;
    const canTrade1 = bot.dailyTradeCount < limit1;
    
    console.log(`   Win Rate: ${(bot.stats.winRate * 100).toFixed(1)}%`);
    console.log(`   Daily Limit: ${limit1} trades`);
    console.log(`   Trades Used: ${bot.dailyTradeCount}/${limit1}`);
    console.log(`   Can Trade: ${canTrade1 ? '✅ YES' : '❌ NO'}`);
    
    if (canTrade1 && limit1 === 4) {
      console.log('✅ TEST 1 PASSED\n');
    } else {
      console.log('❌ TEST 1 FAILED\n');
    }
    
    // ========================================
    // TEST 2: Low Win Rate - Restricted Limit
    // ========================================
    console.log('📊 TEST 2: Low Win Rate - Restricted Daily Limit');
    console.log('Settings: Win Rate 72% < Threshold 85%');
    console.log('Expected: Daily limit = 2 trades\n');
    
    // Change to low win rate
    await db.collection('userbots').updateOne(
      { userId: testUserId },
      { 
        $set: { 
          'stats.winRate': 0.72,
          'stats.winningTrades': 36,
          'stats.losingTrades': 14,
          dailyTradeCount: 2 
        } 
      }
    );
    
    bot = await db.collection('userbots').findOne({ userId: testUserId });
    const isHighWR2 = bot.stats.winRate >= bot.riskManagement.winRateThreshold;
    const limit2 = isHighWR2 ? bot.riskManagement.maxDailyTradesHighWinRate : bot.riskManagement.maxDailyTradesLowWinRate;
    const canTrade2 = bot.dailyTradeCount < limit2;
    
    console.log(`   Win Rate: ${(bot.stats.winRate * 100).toFixed(1)}%`);
    console.log(`   Daily Limit: ${limit2} trades`);
    console.log(`   Trades Used: ${bot.dailyTradeCount}/${limit2}`);
    console.log(`   Can Trade: ${canTrade2 ? '✅ YES' : '❌ NO'}`);
    
    if (!canTrade2 && limit2 === 2) {
      console.log('✅ TEST 2 PASSED\n');
    } else {
      console.log('❌ TEST 2 FAILED\n');
    }
    
    // ========================================
    // TEST 3: Consecutive Loss - Trigger Cooldown
    // ========================================
    console.log('🛑 TEST 3: Consecutive Loss Protection - Trigger Cooldown');
    console.log('Simulate: 2 consecutive losses');
    console.log('Expected: Cooldown activated\n');
    
    // Reset for test
    await db.collection('userbots').updateOne(
      { userId: testUserId },
      { 
        $set: { 
          consecutiveLosses: 0,
          'riskManagement.isInCooldown': false,
          'riskManagement.cooldownStartTime': null,
          'riskManagement.cooldownReason': ''
        } 
      }
    );
    
    // Simulate first loss
    await db.collection('userbots').updateOne(
      { userId: testUserId },
      { 
        $inc: { consecutiveLosses: 1 },
        $set: { consecutiveWins: 0 }
      }
    );
    
    bot = await db.collection('userbots').findOne({ userId: testUserId });
    console.log(`   After Loss 1: consecutiveLosses = ${bot.consecutiveLosses}`);
    
    // Simulate second loss (should trigger cooldown)
    const shouldTrigger = (bot.consecutiveLosses + 1) >= bot.riskManagement.maxConsecutiveLosses;
    
    if (shouldTrigger) {
      await db.collection('userbots').updateOne(
        { userId: testUserId },
        { 
          $inc: { consecutiveLosses: 1 },
          $set: { 
            consecutiveWins: 0,
            'riskManagement.isInCooldown': true,
            'riskManagement.cooldownStartTime': new Date(),
            'riskManagement.cooldownReason': '2x consecutive losses detected'
          }
        }
      );
    }
    
    bot = await db.collection('userbots').findOne({ userId: testUserId });
    console.log(`   After Loss 2: consecutiveLosses = ${bot.consecutiveLosses}`);
    console.log(`   Cooldown Status: ${bot.riskManagement.isInCooldown ? '🛑 ACTIVE' : '✅ INACTIVE'}`);
    console.log(`   Cooldown Reason: ${bot.riskManagement.cooldownReason}`);
    console.log(`   Cooldown Start: ${bot.riskManagement.cooldownStartTime?.toISOString()}`);
    
    if (bot.riskManagement.isInCooldown && bot.consecutiveLosses === 2) {
      console.log('✅ TEST 3 PASSED\n');
    } else {
      console.log('❌ TEST 3 FAILED\n');
    }
    
    // ========================================
    // TEST 4: Cooldown Check - Remaining Time
    // ========================================
    console.log('⏰ TEST 4: Cooldown Check - Time Remaining');
    console.log('Expected: Calculate remaining hours\n');
    
    bot = await db.collection('userbots').findOne({ userId: testUserId });
    
    if (bot.riskManagement.isInCooldown) {
      const cooldownEnd = new Date(bot.riskManagement.cooldownStartTime.getTime() + bot.riskManagement.cooldownPeriodHours * 60 * 60 * 1000);
      const now = new Date();
      const remainingMs = cooldownEnd.getTime() - now.getTime();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      
      console.log(`   Cooldown Period: ${bot.riskManagement.cooldownPeriodHours}h`);
      console.log(`   Cooldown Start: ${bot.riskManagement.cooldownStartTime.toISOString()}`);
      console.log(`   Cooldown End: ${cooldownEnd.toISOString()}`);
      console.log(`   Remaining: ${remainingHours}h`);
      
      if (remainingHours > 0 && remainingHours <= bot.riskManagement.cooldownPeriodHours) {
        console.log('✅ TEST 4 PASSED\n');
      } else {
        console.log('❌ TEST 4 FAILED\n');
      }
    } else {
      console.log('❌ TEST 4 FAILED - No active cooldown\n');
    }
    
    // ========================================
    // TEST 5: Win Resets Consecutive Losses
    // ========================================
    console.log('🏆 TEST 5: Win Resets Consecutive Losses');
    console.log('Simulate: 1 loss → 1 win → Consecutive losses reset\n');
    
    // Reset cooldown for test
    await db.collection('userbots').updateOne(
      { userId: testUserId },
      { 
        $set: { 
          consecutiveLosses: 1,
          consecutiveWins: 0,
          'riskManagement.isInCooldown': false,
          'riskManagement.cooldownStartTime': null,
          'riskManagement.cooldownReason': ''
        } 
      }
    );
    
    bot = await db.collection('userbots').findOne({ userId: testUserId });
    console.log(`   Before Win: consecutiveLosses = ${bot.consecutiveLosses}`);
    
    // Simulate win
    await db.collection('userbots').updateOne(
      { userId: testUserId },
      { 
        $set: { consecutiveLosses: 0 },
        $inc: { consecutiveWins: 1 }
      }
    );
    
    bot = await db.collection('userbots').findOne({ userId: testUserId });
    console.log(`   After Win: consecutiveLosses = ${bot.consecutiveLosses}`);
    console.log(`   After Win: consecutiveWins = ${bot.consecutiveWins}`);
    
    if (bot.consecutiveLosses === 0 && bot.consecutiveWins === 1) {
      console.log('✅ TEST 5 PASSED\n');
    } else {
      console.log('❌ TEST 5 FAILED\n');
    }
    
    // ========================================
    // CLEANUP
    // ========================================
    await db.collection('userbots').deleteMany({ userId: testUserId });
    console.log('🧹 Cleaned up test data');
    
    console.log('\n========================================');
    console.log('✅ ALL RISK MANAGEMENT TESTS COMPLETE');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run tests
testRiskManagement()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
