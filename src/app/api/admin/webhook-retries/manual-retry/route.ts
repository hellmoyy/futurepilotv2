/**
 * Admin API for Manual Webhook Retry
 * 
 * POST /api/admin/webhook-retries/manual-retry
 * - Manually retry a webhook from Dead Letter Queue
 * 
 * Body: { webhookId: string }
 * 
 * Required: Admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebhookRetryManager } from '@/lib/webhookRetry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const body = await request.json();
    const { webhookId } = body;
    
    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }
    
    // Attempt manual retry
    const success = await WebhookRetryManager.manualRetry(webhookId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook retry initiated successfully'
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Webhook retry failed or webhook not found'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error manual retrying webhook:', error);
    return NextResponse.json(
      { error: 'Failed to retry webhook' },
      { status: 500 }
    );
  }
}
