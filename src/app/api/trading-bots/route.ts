import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { TradingBotConfig } from '@/models/TradingBotConfig';

/**
 * GET /api/trading-bots
 * Get all trading bot configurations
 * Optional query params:
 * - isActive: filter by active status (true/false)
 * - risk: filter by risk level (Low/Medium/High)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');
    const risk = searchParams.get('risk');

    // Build query filter
    const filter: any = {};
    if (isActive !== null) {
      filter.isActive = isActive === 'true';
    }
    if (risk) {
      filter.risk = risk;
    }

    // Fetch bot configurations
    const bots = await TradingBotConfig.find(filter)
      .sort({ botId: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      bots,
      count: bots.length,
    });

  } catch (error) {
    console.error('❌ Error fetching trading bot configs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trading bot configurations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trading-bots
 * Create a new trading bot configuration (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you can add role check here)
    // For now, we'll allow any authenticated user to create bot configs
    
    await connectDB();

    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['botId', 'name', 'icon', 'description', 'risk', 'riskColor', 'winRate', 'avgProfit', 'defaultSettings', 'supportedCurrencies'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if bot with same botId already exists
    const existingBot = await TradingBotConfig.findOne({ botId: body.botId });
    if (existingBot) {
      return NextResponse.json(
        { success: false, error: `Bot with ID ${body.botId} already exists` },
        { status: 409 }
      );
    }

    // Create new bot configuration
    const newBot = await TradingBotConfig.create(body);

    return NextResponse.json({
      success: true,
      bot: newBot,
      message: 'Trading bot configuration created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating trading bot config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create trading bot configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
