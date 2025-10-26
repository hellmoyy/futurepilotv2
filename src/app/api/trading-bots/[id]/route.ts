import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { TradingBotConfig } from '@/models/TradingBotConfig';

/**
 * GET /api/trading-bots/[id]
 * Get a specific trading bot configuration by botId
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const botId = parseInt(params.id);
    if (isNaN(botId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bot ID' },
        { status: 400 }
      );
    }

    const bot = await TradingBotConfig.findOne({ botId }).lean();

    if (!bot) {
      return NextResponse.json(
        { success: false, error: 'Trading bot configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bot,
    });

  } catch (error) {
    console.error('❌ Error fetching trading bot config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trading bot configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/trading-bots/[id]
 * Update a trading bot configuration (Admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const botId = parseInt(params.id);
    if (isNaN(botId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bot ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Don't allow changing botId
    if (body.botId && body.botId !== botId) {
      return NextResponse.json(
        { success: false, error: 'Cannot change bot ID' },
        { status: 400 }
      );
    }

    // Update the bot configuration
    const updatedBot = await TradingBotConfig.findOneAndUpdate(
      { botId },
      { 
        $set: { 
          ...body, 
          updatedAt: new Date() 
        } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedBot) {
      return NextResponse.json(
        { success: false, error: 'Trading bot configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bot: updatedBot,
      message: 'Trading bot configuration updated successfully',
    });

  } catch (error) {
    console.error('❌ Error updating trading bot config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update trading bot configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trading-bots/[id]
 * Delete a trading bot configuration (Admin only)
 * Note: This will soft delete by setting isActive to false
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const botId = parseInt(params.id);
    if (isNaN(botId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bot ID' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const deletedBot = await TradingBotConfig.findOneAndUpdate(
      { botId },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date() 
        } 
      },
      { new: true }
    );

    if (!deletedBot) {
      return NextResponse.json(
        { success: false, error: 'Trading bot configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trading bot configuration deactivated successfully',
    });

  } catch (error) {
    console.error('❌ Error deleting trading bot config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete trading bot configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
