/**
 * Signal Center Configuration API
 * 
 * GET /api/signal-center/config - Get active config
 * POST /api/signal-center/config - Create/Update config
 * PUT /api/signal-center/config - Set active config
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { SignalCenterConfig } from '@/models/SignalCenterConfig';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET - Get active configuration
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const getAll = searchParams.get('all') === 'true';
    
    if (getAll) {
      // Get all configs
      const configs = await SignalCenterConfig.find().sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        configs,
      });
    } else {
      // Get active config only
      const config = await (SignalCenterConfig as any).getActiveConfig();
      
      return NextResponse.json({
        success: true,
        config,
      });
    }
  } catch (error: any) {
    console.error('❌ GET config error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update configuration
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const body = await req.json();
    const { configId, ...configData } = body;
    
    let config;
    
    if (configId) {
      // Update existing config
      config = await SignalCenterConfig.findByIdAndUpdate(
        configId,
        {
          ...configData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );
      
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Config not found' },
          { status: 404 }
        );
      }
      
      console.log(`⚙️  Config updated: ${config.name} by ${authResult.user?.email}`);
    } else {
      // Create new config
      config = await SignalCenterConfig.create({
        ...configData,
        createdBy: authResult.user?.email,
      });
      
      console.log(`✅ Config created: ${config.name} by ${authResult.user?.email}`);
    }
    
    return NextResponse.json({
      success: true,
      config,
      message: configId ? 'Configuration updated' : 'Configuration created',
    });
  } catch (error: any) {
    console.error('❌ POST config error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Config name already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Set active configuration
 */
export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const body = await req.json();
    const { configId } = body;
    
    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'configId required' },
        { status: 400 }
      );
    }
    
    // Set active config (deactivates all others)
    const config = await (SignalCenterConfig as any).setActiveConfig(configId);
    
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Config not found' },
        { status: 404 }
      );
    }
    
    console.log(`🎯 Active config set to: ${config.name} by ${authResult.user?.email}`);
    
    return NextResponse.json({
      success: true,
      config,
      message: `Active config set to: ${config.name}`,
    });
  } catch (error: any) {
    console.error('❌ PUT config error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete configuration
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const configId = searchParams.get('id');
    
    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'configId required' },
        { status: 400 }
      );
    }
    
    const config = await SignalCenterConfig.findById(configId);
    
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Config not found' },
        { status: 404 }
      );
    }
    
    // Prevent deleting active config
    if (config.isActive) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete active config. Set another config as active first.' },
        { status: 400 }
      );
    }
    
    await SignalCenterConfig.findByIdAndDelete(configId);
    
    console.log(`🗑️  Config deleted: ${config.name} by ${authResult.user?.email}`);
    
    return NextResponse.json({
      success: true,
      message: `Config "${config.name}" deleted`,
    });
  } catch (error: any) {
    console.error('❌ DELETE config error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
