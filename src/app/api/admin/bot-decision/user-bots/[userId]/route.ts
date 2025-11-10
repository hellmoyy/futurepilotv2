import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import UserBot from '@/models/UserBot';
import { User } from '@/models/User';
import mongoose from 'mongoose';

/**
 * GET /api/admin/bot-decision/user-bots/[userId]
 * 
 * Get detailed information about a specific user's bot.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Register User model alias for populate compatibility
    if (!mongoose.models.User && mongoose.models.futurepilotcols) {
      const UserModel = mongoose.model('futurepilotcols');
      mongoose.model('User', UserModel.schema, 'futurepilotcols');
      console.log('✅ Registered User model alias for populate queries');
    }
    
    const { userId } = params;
    
    const userBot = await UserBot.findOne({ userId })
      .populate('userId', 'email username');
    
    if (!userBot) {
      return NextResponse.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }
    
    // Get recent decisions
    const AIDecision = (await import('@/models/AIDecision')).default;
    const recentDecisions = await AIDecision.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20);
    
    // Get learning patterns
    const LearningPattern = (await import('@/models/LearningPattern')).default;
    const patterns = await LearningPattern.getByUser(userBot.userId, {
      isActive: true,
    });
    
    return NextResponse.json({
      success: true,
      bot: {
        _id: userBot._id,
        userId: userBot.userId,
        status: userBot.status,
        lastBalanceCheck: userBot.lastBalanceCheck,
        aiConfig: userBot.aiConfig,
        tradingConfig: userBot.tradingConfig,
        stats: userBot.stats,
        lastActive: userBot.lastActive,
        dailyTradeCount: userBot.dailyTradeCount,
        createdAt: userBot.createdAt,
      },
      recentDecisions: recentDecisions.map(d => ({
        _id: d._id,
        signalId: d.signalId,
        signal: d.signal,
        decision: d.decision,
        confidenceBreakdown: d.confidenceBreakdown,
        reason: d.reason,
        timestamp: d.timestamp,
        execution: d.execution,
      })),
      learningPatterns: {
        total: patterns.length,
        lossPatterns: patterns.filter((p: any) => p.pattern.type === 'loss').length,
        winPatterns: patterns.filter((p: any) => p.pattern.type === 'win').length,
        topPatterns: patterns.slice(0, 5).map((p: any) => ({
          type: p.pattern.type,
          description: p.pattern.description,
          confidence: p.confidence,
          strength: p.strength,
          occurrences: p.occurrences,
          successRate: p.successRate,
        })),
      },
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching bot details:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch bot details',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bot-decision/user-bots/[userId]
 * 
 * Update bot configuration or status.
 * 
 * Body:
 * {
 *   action: 'pause' | 'resume' | 'stop' | 'update_config';
 *   aiConfig?: { ... };
 *   tradingConfig?: { ... };
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Register User model alias for populate compatibility
    if (!mongoose.models.User && mongoose.models.futurepilotcols) {
      const UserModel = mongoose.model('futurepilotcols');
      mongoose.model('User', UserModel.schema, 'futurepilotcols');
    }
    
    const { userId } = params;
    const body = await request.json();
    const { action, aiConfig, tradingConfig } = body;
    
    const userBot = await UserBot.findOne({ userId });
    
    if (!userBot) {
      return NextResponse.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }
    
    let message = '';
    
    switch (action) {
      case 'pause':
        userBot.status = 'paused';
        message = 'Bot paused successfully';
        console.log(`⏸️ Bot paused for user ${userId}`);
        break;
        
      case 'resume':
        userBot.status = 'active';
        message = 'Bot resumed successfully';
        console.log(`▶️ Bot resumed for user ${userId}`);
        break;
        
      case 'stop':
        userBot.status = 'stopped';
        message = 'Bot stopped successfully';
        console.log(`⏹️ Bot stopped for user ${userId}`);
        break;
        
      case 'update_config':
        if (aiConfig) {
          userBot.aiConfig = { ...userBot.aiConfig, ...aiConfig };
        }
        if (tradingConfig) {
          userBot.tradingConfig = { ...userBot.tradingConfig, ...tradingConfig };
        }
        message = 'Bot configuration updated successfully';
        console.log(`⚙️ Bot config updated for user ${userId}`);
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    await userBot.save();
    
    return NextResponse.json({
      success: true,
      message,
      bot: {
        _id: userBot._id,
        status: userBot.status,
        aiConfig: userBot.aiConfig,
        tradingConfig: userBot.tradingConfig,
      },
    });
    
  } catch (error: any) {
    console.error('❌ Error updating bot:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update bot',
      },
      { status: 500 }
    );
  }
}
