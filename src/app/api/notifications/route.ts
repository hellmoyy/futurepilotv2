/**
 * Notifications API
 * GET /api/notifications - List notifications with pagination
 * Supports filtering by type, priority, read status, and date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationManager } from '@/lib/notifications/NotificationManager';
import type { NotificationFilter } from '@/types/notification';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as any;
    const priority = searchParams.get('priority') as any;
    const read = searchParams.get('read');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filter
    const filter: NotificationFilter = {
      userId: session.user.id,
      page,
      limit,
    };

    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (read !== null) filter.read = read === 'true';
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);

    // Get notifications
    const result = await notificationManager.getNotifications(filter);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[API] Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
