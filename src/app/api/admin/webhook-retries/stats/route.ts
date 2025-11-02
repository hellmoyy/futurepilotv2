/**
 * Admin API for Webhook Retry Statistics
 * 
 * GET /api/admin/webhook-retries/stats
 * - Get statistics about webhook retries
 * 
 * Required: Admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebhookRetryManager } from '@/lib/webhookRetry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Get statistics from WebhookRetryManager
    const statistics = await WebhookRetryManager.getStatistics();
    
    return NextResponse.json({
      success: true,
      statistics
    });
    
  } catch (error) {
    console.error('❌ Error fetching webhook retry statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
