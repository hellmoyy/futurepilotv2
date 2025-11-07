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
    if (!adminAuth.isValid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all UserBot configs
    const userBots = await UserBot.find()
      .populate('userId', 'email name')
      .select('userId aiConfig updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const configs = userBots.map((bot: any) => ({
      _id: bot._id,
      userId: bot.userId._id,
      user: {
        email: bot.userId.email,
        name: bot.userId.name,
      },
      confidenceThreshold: bot.aiConfig?.confidenceThreshold || 0.82,
      newsWeight: bot.aiConfig?.newsWeight || 0.10,
      backtestWeight: bot.aiConfig?.backtestWeight || 0.05,
      learningEnabled: bot.aiConfig?.learningEnabled !== false,
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
    if (!adminAuth.isValid) {
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
    } = body;

    // Validate values
    if (confidenceThreshold < 0.7 || confidenceThreshold > 0.95) {
      return NextResponse.json(
        { success: false, error: 'Confidence threshold must be between 70% and 95%' },
        { status: 400 }
      );
    }

    if (newsWeight < 0 || newsWeight > 0.2) {
      return NextResponse.json(
        { success: false, error: 'News weight must be between 0% and 20%' },
        { status: 400 }
      );
    }

    if (backtestWeight < 0 || backtestWeight > 0.15) {
      return NextResponse.json(
        { success: false, error: 'Backtest weight must be between 0% and 15%' },
        { status: 400 }
      );
    }

    const updateData = {
      'aiConfig.confidenceThreshold': confidenceThreshold,
      'aiConfig.newsWeight': newsWeight,
      'aiConfig.backtestWeight': backtestWeight,
      'aiConfig.learningEnabled': learningEnabled,
      updatedAt: new Date(),
    };

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
