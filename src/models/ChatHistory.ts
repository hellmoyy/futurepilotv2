import mongoose, { Schema, Document, Model } from 'mongoose';

// AI Chat History Interface
export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    hasImage?: boolean;
  }[];
  title?: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Configuration
export const CHAT_HISTORY_CONFIG = {
  MAX_CHATS_PER_USER: 50, // Maximum number of chat sessions per user
  MAX_MESSAGES_PER_CHAT: 100, // Maximum messages per chat session
  AUTO_CLEANUP_ENABLED: true, // Auto delete oldest chats when limit reached
};

// Chat History Schema
const ChatHistorySchema = new Schema<IChatHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        hasImage: {
          type: Boolean,
          default: false,
        },
      },
    ],
    title: {
      type: String,
      default: 'New Chat',
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ChatHistorySchema.index({ userId: 1, createdAt: -1 });
ChatHistorySchema.index({ sessionId: 1 });

export const ChatHistory: Model<IChatHistory> =
  mongoose.models.ChatHistory ||
  mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);
