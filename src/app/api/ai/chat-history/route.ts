import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { ChatHistory, CHAT_HISTORY_CONFIG } from '@/models/ChatHistory';
import { User } from '@/models/User';

// GET - Load all chat sessions for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Get all chat sessions for user
    const chatSessions = await ChatHistory.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .limit(CHAT_HISTORY_CONFIG.MAX_CHATS_PER_USER)
      .select('sessionId title messageCount createdAt updatedAt');

    return NextResponse.json({
      success: true,
      sessions: chatSessions,
      config: {
        maxChats: CHAT_HISTORY_CONFIG.MAX_CHATS_PER_USER,
        maxMessages: CHAT_HISTORY_CONFIG.MAX_MESSAGES_PER_CHAT,
      },
    });
  } catch (error) {
    console.error('Error loading chat history:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}

// POST - Save or update chat session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sessionId, messages, title } = body;

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
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

    // Check message limit
    if (messages.length > CHAT_HISTORY_CONFIG.MAX_MESSAGES_PER_CHAT) {
      return NextResponse.json(
        { 
          error: `Maximum ${CHAT_HISTORY_CONFIG.MAX_MESSAGES_PER_CHAT} messages per chat allowed`,
          code: 'MESSAGE_LIMIT_EXCEEDED'
        },
        { status: 400 }
      );
    }

    // Auto-generate title from first user message if not provided
    const autoTitle = title || 
      messages.find(m => m.role === 'user')?.content.slice(0, 50) || 
      'New Chat';

    // Check if session exists
    let chatHistory = await ChatHistory.findOne({ 
      userId: user._id, 
      sessionId 
    });

    if (chatHistory) {
      // Update existing session
      chatHistory.messages = messages;
      chatHistory.title = autoTitle;
      chatHistory.messageCount = messages.length;
      await chatHistory.save();
    } else {
      // Check chat limit and cleanup if needed
      if (CHAT_HISTORY_CONFIG.AUTO_CLEANUP_ENABLED) {
        const chatCount = await ChatHistory.countDocuments({ userId: user._id });
        
        if (chatCount >= CHAT_HISTORY_CONFIG.MAX_CHATS_PER_USER) {
          // Delete oldest chat
          const oldestChat = await ChatHistory.findOne({ userId: user._id })
            .sort({ updatedAt: 1 })
            .limit(1);
          
          if (oldestChat) {
            await ChatHistory.deleteOne({ _id: oldestChat._id });
            console.log(`Auto-deleted oldest chat: ${oldestChat.sessionId}`);
          }
        }
      }

      // Create new session
      chatHistory = new ChatHistory({
        userId: user._id,
        sessionId,
        messages,
        title: autoTitle,
        messageCount: messages.length,
      });
      await chatHistory.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history saved',
      sessionId: chatHistory.sessionId,
      messageCount: chatHistory.messageCount,
    });
  } catch (error) {
    console.error('Error saving chat history:', error);
    return NextResponse.json(
      { error: 'Failed to save chat history' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific chat session
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

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

    // Delete chat session
    const result = await ChatHistory.deleteOne({
      userId: user._id,
      sessionId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat session deleted',
    });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat history' },
      { status: 500 }
    );
  }
}
