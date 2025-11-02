/**
 * Admin API for Webhook Retries
 * 
 * GET /api/admin/webhook-retries
 * - List webhook retries with filters
 * - Query params: status, type, limit, skip
 * 
 * Required: Admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WebhookRetry } from '@/models/WebhookRetry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // TODO: Add admin authentication check here
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (type && type !== 'all') {
      query.webhookType = type;
    }
    
    // Fetch webhooks
    const webhooks = await WebhookRetry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    // Count total
    const total = await WebhookRetry.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      webhooks,
      total,
      limit,
      skip
    });
    
  } catch (error) {
    console.error('❌ Error fetching webhook retries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook retries' },
      { status: 500 }
    );
  }
}
