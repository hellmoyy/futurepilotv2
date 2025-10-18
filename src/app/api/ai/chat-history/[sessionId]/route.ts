import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { ChatHistory } from '@/models/ChatHistory';
import { User } from '@/models/User';

// GET - Load specific chat session by sessionId
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get chat session
    const chatHistory = await ChatHistory.findOne({
      userId: user._id,
      sessionId,
    });

    if (!chatHistory) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: chatHistory.sessionId,
        title: chatHistory.title,
        messages: chatHistory.messages,
        messageCount: chatHistory.messageCount,
        createdAt: chatHistory.createdAt,
        updatedAt: chatHistory.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error loading chat session:', error);
    return NextResponse.json(
      { error: 'Failed to load chat session' },
      { status: 500 }
    );
  }
}
