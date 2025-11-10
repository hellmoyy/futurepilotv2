/**
 * Sync Signal Patterns API
 * 
 * POST /api/admin/bot-decision/sync-signal-patterns
 * 
 * Imports Bot Signal learning patterns into Bot Decision
 * Enables cross-bot intelligence sharing
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import LearningPattern from '@/models/LearningPattern';
import User from '@/models/User';
import UserBot from '@/models/UserBot';
import {
  convertSignalPatternsToDecisionPatterns,
  generateSyncInsights,
  type BotSignalLearning
} from '@/lib/pattern-sync';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      source = 'backtest-learning',
      userId: targetUserId,
      userBotId: targetUserBotId,
      symbol = 'BTCUSDT',
      overwrite = false
    } = body;

    console.log('🔄 Starting pattern sync from Bot Signal to Bot Decision...');
    console.log('   Source:', source);
    console.log('   Target user:', targetUserId || 'all users');
    console.log('   Symbol:', symbol);

    // Step 1: Fetch Bot Signal learning data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const learningUrl = `${baseUrl}/api/backtest/learning?type=all&limit=50`;
    
    console.log('📊 Fetching Bot Signal learning data from:', learningUrl);
    
    const learningRes = await fetch(learningUrl);
    const learningData = await learningRes.json();

    if (!learningData.success || !learningData.learning) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Bot Signal learning data'
      }, { status: 500 });
    }

    const signalLearning: BotSignalLearning = learningData.learning;
    
    console.log('✅ Bot Signal data loaded:');
    console.log(`   - ${signalLearning.summary.totalBacktests} backtests`);
    console.log(`   - ${signalLearning.summary.winTradesAnalyzed} win trades`);
    console.log(`   - ${signalLearning.summary.lossTradesAnalyzed} loss trades`);

    // Step 2: Determine target users
    let targetUsers: any[] = [];
    
    if (targetUserId) {
      const user = await User.findById(targetUserId);
      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'Target user not found'
        }, { status: 404 });
      }
      targetUsers.push(user);
    } else {
      // Sync for all users (admin operation)
      targetUsers = await User.find({ isBanned: { $ne: true } }).limit(10);
      console.log(`📋 Syncing for ${targetUsers.length} users`);
    }

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    // Step 3: Process each user
    for (const user of targetUsers) {
      // Find or create UserBot for this user
      let userBot;
      if (targetUserBotId) {
        userBot = await UserBot.findById(targetUserBotId);
      } else {
        userBot = await UserBot.findOne({ userId: user._id });
        if (!userBot) {
          // Create default UserBot
          userBot = await UserBot.create({
            userId: user._id,
            status: 'paused', // Valid enum: 'active' | 'paused' | 'stopped'
            lastBalanceCheck: {
              timestamp: new Date(),
              binanceBalance: 0,
              gasFeeBalance: user.walletData?.mainnetBalance || 0,
              availableMargin: 0,
              usedMargin: 0
            },
            aiConfig: {
              enabled: true,
              confidenceThreshold: 0.82,
              newsWeight: 0.10,
              backtestWeight: 0.05,
              learningWeight: 0.03,
              minGasFeeBalance: 10
            },
            tradingConfig: {
              riskPercent: 0.02,
              maxLeverage: 10,
              maxDailyTrades: 50,
              allowedPairs: ['BTCUSDT'],
              blacklistPairs: []
            },
            riskManagement: {
              maxDailyTradesHighWinRate: 4,
              maxDailyTradesLowWinRate: 2,
              winRateThreshold: 0.85,
              maxConsecutiveLosses: 2,
              cooldownPeriodHours: 24,
              cooldownStartTime: null,
              isInCooldown: false,
              cooldownReason: ''
            },
            stats: {
              totalSignalsReceived: 0,
              signalsExecuted: 0,
              signalsRejected: 0,
              totalTrades: 0,
              winningTrades: 0,
              losingTrades: 0,
              winRate: 0,
              totalProfit: 0,
              totalLoss: 0,
              netProfit: 0,
              consecutiveLosses: 0,
              dailyTradesCount: 0,
              lastTradeDate: null,
              bestTrade: 0,
              worstTrade: 0,
              avgWin: 0,
              avgLoss: 0
            },
            performance: {
              last7Days: { trades: 0, wins: 0, profit: 0, winRate: 0 },
              last30Days: { trades: 0, wins: 0, profit: 0, winRate: 0 },
              allTime: { trades: 0, wins: 0, profit: 0, winRate: 0 }
            }
          });
          console.log(`   ✅ Created UserBot for user ${user.email}`);
        }
      }

      // Step 4: Convert patterns
      if (!userBot) {
        console.log(`   ⚠️ No UserBot found for user ${user.email}, skipping`);
        continue;
      }

      // Validate ObjectIds before conversion
      if (!user._id) {
        console.log(`   ⚠️ User has no _id, skipping`);
        continue;
      }

      if (!userBot._id) {
        console.log(`   ⚠️ UserBot has no _id, skipping`);
        continue;
      }

      const userIdString = user._id.toString();
      const userBotIdString = userBot._id.toString();

      console.log(`   📋 Converting patterns for user: ${user.email}`);
      console.log(`      userId: ${userIdString}`);
      console.log(`      userBotId: ${userBotIdString}`);

      const patterns = convertSignalPatternsToDecisionPatterns(
        signalLearning,
        userIdString,
        userBotIdString,
        symbol
      );

      console.log(`   📦 Generated ${patterns.length} patterns for ${user.email}`);

      // Step 5: Upsert patterns
      for (const pattern of patterns) {
        const query = {
          userId: pattern.userId,
          userBotId: pattern.userBotId,
          'pattern.description': pattern.pattern.description
        };

        const existing = await LearningPattern.findOne(query);

        if (existing) {
          if (overwrite) {
            await LearningPattern.updateOne(
              { _id: existing._id },
              {
                $set: {
                  ...pattern,
                  occurrences: existing.occurrences + pattern.occurrences,
                  successCount: existing.successCount + pattern.successCount,
                  failureCount: existing.failureCount + pattern.failureCount,
                  lastUpdated: new Date()
                }
              }
            );
            totalUpdated++;
          } else {
            totalSkipped++;
          }
        } else {
          await LearningPattern.create(pattern);
          totalCreated++;
        }
      }
    }

    // Step 6: Generate insights
    // Use first created/found userBot for insight generation
    let samplePatterns: any[] = [];
    let insights: string[] = [];
    
    if (targetUsers.length > 0) {
      // Find any userBot to use for sample pattern generation
      const anyUserBot = await UserBot.findOne({ userId: targetUsers[0]._id });
      
      if (anyUserBot && anyUserBot._id) {
        samplePatterns = convertSignalPatternsToDecisionPatterns(
          signalLearning,
          targetUsers[0]._id.toString(),
          anyUserBot._id.toString(),
          symbol
        );
        insights = generateSyncInsights(samplePatterns, signalLearning);
      } else {
        // Generate basic insights without sample patterns
        insights = [
          `✅ Imported ${signalLearning.summary.totalBacktests} backtests with ${signalLearning.summary.avgROI.toFixed(2)}% average ROI`,
          `📈 Win rate: ${((signalLearning.summary.winTradesAnalyzed / (signalLearning.summary.winTradesAnalyzed + signalLearning.summary.lossTradesAnalyzed)) * 100).toFixed(2)}%`,
          `🎯 Created ${totalCreated} new patterns from Bot Signal proven strategies`,
          totalUpdated > 0 ? `🔄 Updated ${totalUpdated} existing patterns with latest data` : null,
          `💡 Bot Decision AI will now use Bot Signal insights for better decisions`
        ].filter(Boolean) as string[];
      }
    }

    console.log('✅ Pattern sync completed!');
    console.log(`   - Created: ${totalCreated}`);
    console.log(`   - Updated: ${totalUpdated}`);
    console.log(`   - Skipped: ${totalSkipped}`);

    return NextResponse.json({
      success: true,
      synced: {
        winPatterns: samplePatterns.filter(p => p.pattern.type === 'win').length,
        lossPatterns: samplePatterns.filter(p => p.pattern.type === 'loss').length,
        total: samplePatterns.length
      },
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      usersProcessed: targetUsers.length,
      insights,
      source: {
        totalBacktests: signalLearning.summary.totalBacktests,
        avgROI: signalLearning.summary.avgROI,
        winTrades: signalLearning.summary.winTradesAnalyzed,
        lossTrades: signalLearning.summary.lossTradesAnalyzed
      }
    });

  } catch (error: any) {
    console.error('❌ Pattern sync error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to sync patterns'
    }, { status: 500 });
  }
}

/**
 * GET - Check sync status
 */
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Count AI-generated patterns (from Bot Signal)
    const aiPatterns = await LearningPattern.countDocuments({ aiGenerated: true, isActive: true });
    const manualPatterns = await LearningPattern.countDocuments({ aiGenerated: false, isActive: true });
    const totalPatterns = await LearningPattern.countDocuments({ isActive: true });

    // Get last sync time (newest AI pattern)
    const lastSynced = await LearningPattern.findOne({ aiGenerated: true })
      .sort({ createdAt: -1 })
      .select('createdAt');

    return NextResponse.json({
      success: true,
      status: {
        totalPatterns,
        aiPatterns,
        manualPatterns,
        lastSynced: lastSynced?.createdAt || null
      }
    });

  } catch (error: any) {
    console.error('❌ Get sync status error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get sync status'
    }, { status: 500 });
  }
}
