import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { TradeLog } from '@/models/TradeLog';

// GET - Get trade logs for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const botInstanceId = searchParams.get('botInstanceId');
    const logType = searchParams.get('logType');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    const query: any = { userId: session.user.id };
    
    if (botInstanceId) {
      query.botInstanceId = botInstanceId;
    }
    
    if (logType) {
      query.logType = logType;
    }
    
    if (severity) {
      query.severity = severity;
    }

    const logs = await TradeLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching trade logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade logs', details: error.message },
      { status: 500 }
    );
  }
}
