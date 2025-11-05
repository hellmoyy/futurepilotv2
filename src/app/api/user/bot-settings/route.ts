import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/bot-settings
 * Fetch user bot configuration
 */
export async function GET(req: NextRequest) {
  try {
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
    
    // Return bot settings with defaults
    const settings = user.botSettings || {
      enabled: false,
      symbols: ['BTCUSDT'],
      minStrength: 'STRONG',
      riskPerTrade: 2,
      maxPositions: 3,
      leverage: 10,
    };
    
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('❌ GET bot settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/bot-settings
 * Update user bot configuration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { enabled, symbols, minStrength, riskPerTrade, maxPositions, leverage } = body;
    
    // Validation
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid enabled value' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid symbols array' },
        { status: 400 }
      );
    }
    
    const validStrengths = ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'];
    if (!validStrengths.includes(minStrength)) {
      return NextResponse.json(
        { success: false, error: 'Invalid minStrength value' },
        { status: 400 }
      );
    }
    
    if (riskPerTrade < 1 || riskPerTrade > 5) {
      return NextResponse.json(
        { success: false, error: 'riskPerTrade must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    if (maxPositions < 1 || maxPositions > 5) {
      return NextResponse.json(
        { success: false, error: 'maxPositions must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    if (leverage < 1 || leverage > 20) {
      return NextResponse.json(
        { success: false, error: 'leverage must be between 1 and 20' },
        { status: 400 }
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
    
    // Update bot settings
    user.botSettings = {
      enabled,
      symbols,
      minStrength,
      riskPerTrade,
      maxPositions,
      leverage,
      createdAt: user.botSettings?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    await user.save();
    
    console.log(`⚙️  Bot settings updated for user ${user.email}`);
    
    return NextResponse.json({
      success: true,
      settings: user.botSettings,
    });
  } catch (error: any) {
    console.error('❌ POST bot settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
