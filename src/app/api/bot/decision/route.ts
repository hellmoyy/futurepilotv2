/**
 * 📡 API: Bot Decision - Should Execute Signal?
 * 
 * POST /api/bot/decision
 * User bot calls this to decide whether to execute signal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { BotDecisionEngine } from '@/lib/signal-center';
import type { BotDecisionInput } from '@/lib/signal-center';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // ===== AUTH CHECK =====
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // ===== PARSE REQUEST =====
    const body = await request.json();
    const { signal, userSettings, accountState } = body as BotDecisionInput;
    
    if (!signal || !userSettings || !accountState) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: signal, userSettings, accountState' },
        { status: 400 }
      );
    }
    
    // Validate userId matches session
    const userId = (user as any)._id?.toString() || user.id;
    if (userSettings.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'User ID mismatch' },
        { status: 403 }
      );
    }
    
    // ===== MAKE DECISION =====
    const decision = BotDecisionEngine.shouldExecute({
      signal,
      userSettings,
      accountState,
    });
    
    // Log decision for analytics
    console.log(
      `🤖 Bot Decision [${user.email}]:`,
      decision.shouldExecute ? '✅ EXECUTE' : '❌ REJECT',
      `- ${decision.reason}`
    );
    
    return NextResponse.json({
      success: true,
      decision,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('❌ Bot decision error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to make decision',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
