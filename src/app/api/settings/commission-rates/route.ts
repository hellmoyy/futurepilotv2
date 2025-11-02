import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Settings } from '@/models/Settings';

// GET - Fetch commission rates (public endpoint for users)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get settings
    let settings = await Settings.findOne();

    // If no settings exist, return default rates
    if (!settings) {
      return NextResponse.json({
        success: true,
        rates: {
          bronze: { level1: 5, level2: 2, level3: 1 },
          silver: { level1: 10, level2: 5, level3: 2 },
          gold: { level1: 15, level2: 8, level3: 4 },
          platinum: { level1: 20, level2: 10, level3: 5 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      rates: settings.referralCommission,
    });
  } catch (error: any) {
    console.error('Error fetching commission rates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch commission rates', error: error.message },
      { status: 500 }
    );
  }
}
