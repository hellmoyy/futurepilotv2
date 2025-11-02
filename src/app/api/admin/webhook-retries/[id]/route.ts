/**
 * Admin API for Individual Webhook Retry
 * 
 * DELETE /api/admin/webhook-retries/[id]
 * - Delete a webhook retry record
 * 
 * Required: Admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WebhookRetry } from '@/models/WebhookRetry';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // TODO: Add admin authentication check here
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }
    
    // Delete webhook
    const result = await WebhookRetry.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
