import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import AIDecision from '@/models/AIDecision';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bot-decision/decisions
 * 
 * Advanced decision logging with filtering, search, and export.
 * 
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20)
 * - decision: 'EXECUTE' | 'SKIP' | 'all'
 * - userId: string (filter by specific user)
 * - symbol: string (filter by symbol)
 * - dateFrom: ISO date string
 * - dateTo: ISO date string
 * - search: string (search in reason)
 * - sortBy: 'timestamp' | 'confidence' (default timestamp)
 * - sortOrder: 'asc' | 'desc' (default desc)
 * - export: 'csv' (return CSV format)
 * 
 * Protected: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const url = new URL(request.url);
    const params = url.searchParams;

    // Pagination
    const page = parseInt(params.get('page') || '1', 10);
    const limit = parseInt(params.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Filters
    const decision = params.get('decision') || 'all';
    const userId = params.get('userId');
    const symbol = params.get('symbol');
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');
    const search = params.get('search');
    const sortBy = params.get('sortBy') || 'timestamp';
    const sortOrder = params.get('sortOrder') || 'desc';
    const exportFormat = params.get('export');

    // Build query
    const query: any = {};

    if (decision !== 'all') {
      query.decision = decision;
    }

    if (userId) {
      query.userId = userId;
    }

    if (symbol) {
      query['signal.symbol'] = symbol;
    }

    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
      if (dateTo) query.timestamp.$lte = new Date(dateTo);
    }

    if (search) {
      query.reason = { $regex: search, $options: 'i' };
    }

    // Sort
    const sort: any = {};
    sort[sortBy === 'confidence' ? 'confidenceBreakdown.total' : 'timestamp'] = 
      sortOrder === 'asc' ? 1 : -1;

    // Export CSV
    if (exportFormat === 'csv') {
      const decisions = await AIDecision.find(query)
        .populate('userId', 'email username')
        .sort(sort)
        .limit(1000); // Max 1000 for CSV

      // Build CSV
      const headers = [
        'Timestamp',
        'User Email',
        'Symbol',
        'Action',
        'Decision',
        'Technical Confidence',
        'News Impact',
        'Backtest Impact',
        'Learning Impact',
        'Final Confidence',
        'Reason',
        'Executed At',
        'Result',
        'Profit',
      ];

      const rows = decisions.map((d: any) => [
        new Date(d.timestamp).toISOString(),
        d.userId?.email || 'N/A',
        d.signal?.symbol || 'N/A',
        d.signal?.action || 'N/A',
        d.decision,
        (d.confidenceBreakdown?.technical || 0).toFixed(4),
        (d.confidenceBreakdown?.news || 0).toFixed(4),
        (d.confidenceBreakdown?.backtest || 0).toFixed(4),
        (d.confidenceBreakdown?.learning || 0).toFixed(4),
        (d.confidenceBreakdown?.total || 0).toFixed(4),
        (d.reason || '').replace(/,/g, ';'), // Escape commas
        d.execution?.executedAt ? new Date(d.execution.executedAt).toISOString() : 'N/A',
        d.execution?.result || 'N/A',
        d.execution?.profit?.toFixed(2) || 'N/A',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="decisions-${Date.now()}.csv"`,
        },
      });
    }

    // Regular JSON response
    const total = await AIDecision.countDocuments(query);
    const decisions = await AIDecision.find(query)
      .populate('userId', 'email username')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      decisions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('GET /api/admin/bot-decision/decisions error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error) 
    }, { status: 500 });
  }
}
