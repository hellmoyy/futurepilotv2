/**
 * API: AI Configuration Management
 * 
 * GET /api/admin/bot-decision/ai-config - Get all AI configurations
 * POST /api/admin/bot-decision/ai-config - Update AI configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserBot from '@/models/UserBot';
import { verifyAdminAuth } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * GET - Get all user AI configurations
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await verifyAdminAuth(req);
    if (!adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all UserBot configs
    const userBots = await UserBot.find()
      .populate('userId', 'email name')
      .select('userId aiConfig riskManagement stats consecutiveLosses updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const configs = userBots.map((bot: any) => ({
      _id: bot._id,
      userId: bot.userId._id,
      user: {
        email: bot.userId.email,
        name: bot.userId.name,
      },
      // AI Config
      confidenceThreshold: bot.aiConfig?.confidenceThreshold || 0.82,
      newsWeight: bot.aiConfig?.newsWeight || 0.10,
      backtestWeight: bot.aiConfig?.backtestWeight || 0.05,
      learningEnabled: bot.aiConfig?.learningEnabled !== false,
      
      // ✨ NEW: Risk Management
      riskManagement: {
        maxDailyTradesHighWinRate: bot.riskManagement?.maxDailyTradesHighWinRate || 4,
        maxDailyTradesLowWinRate: bot.riskManagement?.maxDailyTradesLowWinRate || 2,
        winRateThreshold: bot.riskManagement?.winRateThreshold || 0.85,
        maxConsecutiveLosses: bot.riskManagement?.maxConsecutiveLosses || 2,
        cooldownPeriodHours: bot.riskManagement?.cooldownPeriodHours || 24,
        isInCooldown: bot.riskManagement?.isInCooldown || false,
        cooldownStartTime: bot.riskManagement?.cooldownStartTime || null,
        cooldownReason: bot.riskManagement?.cooldownReason || '',
      },
      
      // Stats for context
      winRate: bot.stats?.winRate || 0,
      consecutiveLosses: bot.consecutiveLosses || 0,
      
      updatedAt: bot.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      configs,
      total: configs.length,
    });

  } catch (error: any) {
    console.error('❌ AI config GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Update AI configuration (global or user-specific)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await verifyAdminAuth(req);
    if (!adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const {
      userId, // Optional: specific user or null for global
      confidenceThreshold,
      newsWeight,
      backtestWeight,
      learningEnabled,
      // ✨ NEW: Risk Management Settings
      maxDailyTradesHighWinRate,
      maxDailyTradesLowWinRate,
      winRateThreshold,
      maxConsecutiveLosses,
      cooldownPeriodHours,
    } = body;

    // Validate AI config values
    if (confidenceThreshold !== undefined && (confidenceThreshold < 0.7 || confidenceThreshold > 0.95)) {
      return NextResponse.json(
        { success: false, error: 'Confidence threshold must be between 70% and 95%' },
        { status: 400 }
      );
    }

    if (newsWeight !== undefined && (newsWeight < 0 || newsWeight > 0.2)) {
      return NextResponse.json(
        { success: false, error: 'News weight must be between 0% and 20%' },
        { status: 400 }
      );
    }

    if (backtestWeight !== undefined && (backtestWeight < 0 || backtestWeight > 0.15)) {
      return NextResponse.json(
        { success: false, error: 'Backtest weight must be between 0% and 15%' },
        { status: 400 }
      );
    }

    // ✨ NEW: Validate risk management values
    if (maxDailyTradesHighWinRate !== undefined && (maxDailyTradesHighWinRate < 1 || maxDailyTradesHighWinRate > 20)) {
      return NextResponse.json(
        { success: false, error: 'Max daily trades (high win rate) must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (maxDailyTradesLowWinRate !== undefined && (maxDailyTradesLowWinRate < 1 || maxDailyTradesLowWinRate > 10)) {
      return NextResponse.json(
        { success: false, error: 'Max daily trades (low win rate) must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (winRateThreshold !== undefined && (winRateThreshold < 0.5 || winRateThreshold > 0.99)) {
      return NextResponse.json(
        { success: false, error: 'Win rate threshold must be between 50% and 99%' },
        { status: 400 }
      );
    }

    if (maxConsecutiveLosses !== undefined && (maxConsecutiveLosses < 1 || maxConsecutiveLosses > 10)) {
      return NextResponse.json(
        { success: false, error: 'Max consecutive losses must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (cooldownPeriodHours !== undefined && (cooldownPeriodHours < 1 || cooldownPeriodHours > 168)) {
      return NextResponse.json(
        { success: false, error: 'Cooldown period must be between 1 and 168 hours (1 week)' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Add AI config updates if provided
    if (confidenceThreshold !== undefined) updateData['aiConfig.confidenceThreshold'] = confidenceThreshold;
    if (newsWeight !== undefined) updateData['aiConfig.newsWeight'] = newsWeight;
    if (backtestWeight !== undefined) updateData['aiConfig.backtestWeight'] = backtestWeight;
    if (learningEnabled !== undefined) updateData['aiConfig.learningEnabled'] = learningEnabled;

    // ✨ NEW: Add risk management updates if provided
    if (maxDailyTradesHighWinRate !== undefined) updateData['riskManagement.maxDailyTradesHighWinRate'] = maxDailyTradesHighWinRate;
    if (maxDailyTradesLowWinRate !== undefined) updateData['riskManagement.maxDailyTradesLowWinRate'] = maxDailyTradesLowWinRate;
    if (winRateThreshold !== undefined) updateData['riskManagement.winRateThreshold'] = winRateThreshold;
    if (maxConsecutiveLosses !== undefined) updateData['riskManagement.maxConsecutiveLosses'] = maxConsecutiveLosses;
    if (cooldownPeriodHours !== undefined) updateData['riskManagement.cooldownPeriodHours'] = cooldownPeriodHours;

    if (userId) {
      // Update specific user
      const userBot = await UserBot.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'User AI configuration updated',
        config: userBot.aiConfig,
      });
    } else {
      // Update all users (global)
      const result = await UserBot.updateMany(
        {},
        { $set: updateData }
      );

      return NextResponse.json({
        success: true,
        message: 'Global AI configuration updated',
        updated: result.modifiedCount,
      });
    }

  } catch (error: any) {
    console.error('❌ AI config POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
