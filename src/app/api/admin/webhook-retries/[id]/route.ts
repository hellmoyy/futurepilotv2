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
import { withAdminAuth } from '@/lib/checkAdminAuth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authentication check
    const auth = await withAdminAuth();
    if (!auth.authorized) {
      return auth.response;
    }
    
    await connectDB();
    
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
