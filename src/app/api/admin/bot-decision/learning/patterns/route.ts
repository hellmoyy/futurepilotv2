import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import LearningPattern from '@/models/LearningPattern';
import { User } from '@/models/User';

/**
 * GET /api/admin/bot-decision/learning/patterns
 * 
 * Get learning patterns dengan filters:
 * - type: loss/win
 * - minConfidence: 0-1
 * - minStrength: 0-100
 * - userId: filter by user
 * - limit: max results
 * - sortBy: successRate, confidence, strength, occurrences
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

    // Parse filters
    const type = params.get('type') || undefined; // 'loss' | 'win'
    const userId = params.get('userId') || undefined;
    const minConfidence = parseFloat(params.get('minConfidence') || '0');
    const minStrength = parseFloat(params.get('minStrength') || '0');
    const minOccurrences = parseInt(params.get('minOccurrences') || '0', 10);
    const limit = parseInt(params.get('limit') || '50', 10);
    const sortBy = params.get('sortBy') || 'strength'; // successRate, confidence, strength, occurrences
    const order = params.get('order') === 'asc' ? 1 : -1;

    // Build query
    const query: any = { isActive: true };

    if (type) {
      query['pattern.type'] = type;
    }

    if (userId) {
      query.userId = userId;
    }

    if (minConfidence > 0) {
      query.confidence = { $gte: minConfidence };
    }

    if (minStrength > 0) {
      query.strength = { $gte: minStrength };
    }

    if (minOccurrences > 0) {
      query.occurrences = { $gte: minOccurrences };
    }

    // Build sort
    const sortOptions: any = {};
    sortOptions[sortBy] = order;

    // Add secondary sort
    if (sortBy !== 'occurrences') {
      sortOptions.occurrences = -1;
    }

    console.log(`📊 Fetching patterns with filters:`, query);

    const patterns = await LearningPattern.find(query)
      .sort(sortOptions)
      .limit(limit)
      .populate('userId', 'email username')
      .select('-__v');

    // Calculate aggregate stats for filtered patterns
    const stats = await LearningPattern.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$pattern.type',
          count: { $sum: 1 },
          avgSuccessRate: { $avg: '$successRate' },
          avgConfidence: { $avg: '$confidence' },
          avgStrength: { $avg: '$strength' },
          totalOccurrences: { $sum: '$occurrences' },
          totalMatched: { $sum: '$timesMatched' },
          totalAvoided: { $sum: '$timesAvoided' },
        },
      },
    ]);

    const statsMap: any = {
      loss: stats.find((s) => s._id === 'loss') || {},
      win: stats.find((s) => s._id === 'win') || {},
    };

    console.log(`✅ Found ${patterns.length} patterns`);

    return NextResponse.json({
      success: true,
      patterns,
      stats: statsMap,
      total: patterns.length,
      filters: {
        type,
        userId,
        minConfidence,
        minStrength,
        minOccurrences,
        limit,
        sortBy,
        order: order === 1 ? 'asc' : 'desc',
      },
    });
  } catch (error: any) {
    console.error('❌ GET /api/admin/bot-decision/learning/patterns error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bot-decision/learning/patterns
 * 
 * Create or update learning pattern manually (admin override)
 * Body: { userId, userBotId, pattern: { type, description, conditions }, confidence?, strength? }
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { userId, userBotId, pattern, confidence, strength } = body;

    if (!userId || !userBotId || !pattern || !pattern.type || !pattern.description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new pattern
    const newPattern = await LearningPattern.create({
      userId,
      userBotId,
      pattern: {
        type: pattern.type,
        description: pattern.description,
        conditions: pattern.conditions || {},
      },
      occurrences: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfitLoss: 0,
      avgProfit: 0,
      avgLoss: 0,
      confidence: confidence || 0.5,
      strength: strength || 50,
      timesMatched: 0,
      timesAvoided: 0,
      avoidanceSuccessRate: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      lastUpdated: new Date(),
      isActive: true,
      aiGenerated: false, // Manual admin creation
    });

    console.log(`✅ Created pattern: ${newPattern._id}`);

    return NextResponse.json({
      success: true,
      pattern: newPattern,
      message: 'Pattern created successfully',
    });
  } catch (error: any) {
    console.error('❌ POST /api/admin/bot-decision/learning/patterns error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bot-decision/learning/patterns
 * 
 * Deactivate pattern (soft delete)
 * Body: { patternId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { patternId } = body;

    if (!patternId) {
      return NextResponse.json(
        { success: false, error: 'patternId required' },
        { status: 400 }
      );
    }

    const pattern = await LearningPattern.findById(patternId);
    if (!pattern) {
      return NextResponse.json(
        { success: false, error: 'Pattern not found' },
        { status: 404 }
      );
    }

    pattern.isActive = false;
    await pattern.save();

    console.log(`✅ Deactivated pattern: ${patternId}`);

    return NextResponse.json({
      success: true,
      message: 'Pattern deactivated successfully',
    });
  } catch (error: any) {
    console.error('❌ DELETE /api/admin/bot-decision/learning/patterns error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
