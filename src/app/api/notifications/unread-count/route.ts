/**
 * Unread Notifications Count API
 * GET /api/notifications/unread-count
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationManager } from '@/lib/notifications/NotificationManager';

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

    // Get unread count
    const count = await notificationManager.getUnreadCount(session.user.id);

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('[API] Get unread count error:', error);
    return NextResponse.json(
      { error: 'Failed to get unread count', details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
