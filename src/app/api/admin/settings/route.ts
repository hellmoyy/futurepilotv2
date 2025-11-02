import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { Settings } from '@/models/Settings';

// Verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { email: string; role: string };
    
    if (decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Fetch current settings
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get settings (there should only be one document)
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({
        updatedBy: admin.email,
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    await connectDB();

    // Get existing settings or create new one
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    // Update all fields from request body
    if (body.referralCommission) {
      settings.referralCommission = body.referralCommission;
    }
    if (body.minimumWithdrawal !== undefined) {
      settings.minimumWithdrawal = body.minimumWithdrawal;
    }
    if (body.tradingCommission !== undefined) {
      settings.tradingCommission = body.tradingCommission;
    }
    if (body.platformName) {
      settings.platformName = body.platformName;
    }
    if (body.platformUrl) {
      settings.platformUrl = body.platformUrl;
    }
    if (body.maintenanceMode !== undefined) {
      settings.maintenanceMode = body.maintenanceMode;
    }
    if (body.allowRegistration !== undefined) {
      settings.allowRegistration = body.allowRegistration;
    }
    if (body.twoFactorRequired !== undefined) {
      settings.twoFactorRequired = body.twoFactorRequired;
    }
    if (body.sessionTimeout !== undefined) {
      settings.sessionTimeout = body.sessionTimeout;
    }
    if (body.maxLoginAttempts !== undefined) {
      settings.maxLoginAttempts = body.maxLoginAttempts;
    }
    if (body.emailFrom) {
      settings.emailFrom = body.emailFrom;
    }
    if (body.smtpHost) {
      settings.smtpHost = body.smtpHost;
    }
    if (body.emailNotifications !== undefined) {
      settings.emailNotifications = body.emailNotifications;
    }

    // Update metadata
    settings.updatedBy = admin.email;
    settings.updatedAt = new Date();

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update settings', error: error.message },
      { status: 500 }
    );
  }
}
