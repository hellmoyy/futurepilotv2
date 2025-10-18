# AI Agent Chat History Feature

## 📚 Overview

Fitur untuk menyimpan dan me-manage chat history AI Agent per user dengan batasan maksimal jumlah chat.

## ✨ Features

### 1. **Persistent Chat History**
- ✅ Setiap chat session disimpan ke MongoDB
- ✅ History tersimpan per user
- ✅ Auto-save setiap 30 detik
- ✅ Load chat history dari database

### 2. **Chat Limits & Auto-Cleanup**
- ✅ Maksimal **50 chat sessions** per user
- ✅ Maksimal **100 messages** per chat session
- ✅ Auto-delete oldest chat ketika limit tercapai
- ✅ Configurable limits

### 3. **Chat Management**
- ✅ View all chat sessions
- ✅ Load specific chat session
- ✅ Delete chat sessions
- ✅ Start new chat
- ✅ Auto-generate chat title dari first message

## 🗄️ Database Schema

### ChatHistory Model

```typescript
{
  userId: ObjectId,              // Reference to User
  sessionId: string,             // Unique session ID
  messages: [
    {
      role: 'user' | 'assistant',
      content: string,
      timestamp: Date,
      hasImage: boolean          // NEW: Track if message has image
    }
  ],
  title: string,                 // Chat title (auto-generated)
  messageCount: number,          // NEW: Count of messages
  createdAt: Date,
  updatedAt: Date
}
```

### Configuration

```typescript
export const CHAT_HISTORY_CONFIG = {
  MAX_CHATS_PER_USER: 50,        // Max chat sessions per user
  MAX_MESSAGES_PER_CHAT: 100,    // Max messages per session
  AUTO_CLEANUP_ENABLED: true,    // Auto delete oldest when limit reached
};
```

## 🔌 API Endpoints

### 1. **GET /api/ai/chat-history**
Load all chat sessions for current user

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "session_1234567890",
      "title": "Bitcoin price analysis",
      "messageCount": 15,
      "createdAt": "2025-10-18T10:00:00Z",
      "updatedAt": "2025-10-18T10:30:00Z"
    }
  ],
  "config": {
    "maxChats": 50,
    "maxMessages": 100
  }
}
```

### 2. **GET /api/ai/chat-history/[sessionId]**
Load specific chat session

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session_1234567890",
    "title": "Bitcoin price analysis",
    "messages": [
      {
        "role": "user",
        "content": "What's your analysis on BTC?",
        "timestamp": "2025-10-18T10:00:00Z",
        "hasImage": false
      },
      {
        "role": "assistant",
        "content": "Based on current market...",
        "timestamp": "2025-10-18T10:00:05Z",
        "hasImage": false
      }
    ],
    "messageCount": 15,
    "createdAt": "2025-10-18T10:00:00Z",
    "updatedAt": "2025-10-18T10:30:00Z"
  }
}
```

### 3. **POST /api/ai/chat-history**
Save or update chat session

**Request:**
```json
{
  "sessionId": "session_1234567890",
  "messages": [
    {
      "role": "user",
      "content": "What's your analysis on BTC?",
      "timestamp": "2025-10-18T10:00:00Z",
      "hasImage": false
    }
  ],
  "title": "Bitcoin price analysis"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat history saved",
  "sessionId": "session_1234567890",
  "messageCount": 15
}
```

**Error (Limit Exceeded):**
```json
{
  "error": "Maximum 100 messages per chat allowed",
  "code": "MESSAGE_LIMIT_EXCEEDED"
}
```

### 4. **DELETE /api/ai/chat-history?sessionId=[sessionId]**
Delete specific chat session

**Response:**
```json
{
  "success": true,
  "message": "Chat session deleted"
}
```

## 🎨 UI Components

### 1. **History Sidebar**
- Toggle button di header (icon clock)
- Sidebar slide-in dari kiri
- List semua chat sessions dengan:
  - Chat title
  - Message count
  - Last updated date
  - Delete button
- "New Chat" button
- Click chat untuk load

### 2. **Chat Session Card**
```tsx
{
  sessionId === currentSessionId
    ? 'Highlighted (blue border)'
    : 'Normal (gray border)'
}
```

### 3. **Auto-Save Indicator**
- Small text "💾 Saving chat..." when saving
- Disappears when saved

## 🔄 Auto-Save Logic

```typescript
// Auto-save every 30 seconds if there are new messages
useEffect(() => {
  const autoSaveInterval = setInterval(() => {
    if (messages.length > 1 && !isLoading) {
      saveChatSession();
    }
  }, 30000); // 30 seconds

  return () => clearInterval(autoSaveInterval);
}, [messages, isLoading]);
```

## 🗑️ Auto-Cleanup Logic

When saving a new chat session:

```typescript
// Check chat limit
const chatCount = await ChatHistory.countDocuments({ userId: user._id });

if (chatCount >= MAX_CHATS_PER_USER) {
  // Delete oldest chat
  const oldestChat = await ChatHistory.findOne({ userId: user._id })
    .sort({ updatedAt: 1 })
    .limit(1);
  
  if (oldestChat) {
    await ChatHistory.deleteOne({ _id: oldestChat._id });
  }
}
```

## 📊 Usage Flow

### New User Flow:
1. User opens AI Agent
2. Starts chatting
3. After 30 seconds → Auto-save (creates first session)
4. Continue chatting → Auto-save every 30s
5. User can click history icon to see sessions

### Returning User Flow:
1. User opens AI Agent
2. Clicks history icon
3. Sees list of previous chats
4. Clicks a chat → Loads full conversation
5. Continues chatting → Auto-save

### Limit Reached Flow:
1. User has 50 chat sessions
2. Starts new chat
3. After 30s, auto-save triggers
4. System auto-deletes oldest chat
5. New chat saved successfully

## ⚙️ Configuration Options

### Change Max Chats Per User:
```typescript
// src/models/ChatHistory.ts
export const CHAT_HISTORY_CONFIG = {
  MAX_CHATS_PER_USER: 100, // Change from 50 to 100
  MAX_MESSAGES_PER_CHAT: 100,
  AUTO_CLEANUP_ENABLED: true,
};
```

### Change Max Messages Per Chat:
```typescript
MAX_MESSAGES_PER_CHAT: 200, // Change from 100 to 200
```

### Disable Auto-Cleanup:
```typescript
AUTO_CLEANUP_ENABLED: false, // User will get error when limit reached
```

### Change Auto-Save Interval:
```typescript
// src/app/dashboard/ai-agent/page.tsx
const autoSaveInterval = setInterval(() => {
  if (messages.length > 1 && !isLoading) {
    saveChatSession();
  }
}, 60000); // Change from 30s to 60s
```

## 🔒 Security

### Authentication:
- ✅ All API endpoints require authentication
- ✅ User can only access their own chats
- ✅ SessionId validated against userId

### Data Protection:
- ✅ Each chat belongs to specific user
- ✅ No cross-user data access
- ✅ Proper MongoDB indexes for performance

## 🎯 Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Save Chat | ✅ | Auto-save every 30s |
| Load Chat | ✅ | Load full conversation |
| Delete Chat | ✅ | Delete specific session |
| New Chat | ✅ | Start fresh session |
| Max Chats Limit | ✅ | 50 chats per user |
| Max Messages Limit | ✅ | 100 messages per chat |
| Auto-Cleanup | ✅ | Delete oldest when limit reached |
| History Sidebar | ✅ | Toggle sidebar UI |
| Auto-Title | ✅ | Generate from first message |
| Image Tracking | ✅ | Track messages with images |

## 🚀 Usage Examples

### Load Chat History:
```typescript
const loadChatSessions = async () => {
  const response = await fetch('/api/ai/chat-history');
  const data = await response.json();
  setChatSessions(data.sessions);
};
```

### Load Specific Chat:
```typescript
const loadChatSession = async (sessionId: string) => {
  const response = await fetch(`/api/ai/chat-history/${sessionId}`);
  const data = await response.json();
  setMessages(data.session.messages);
};
```

### Save Current Chat:
```typescript
const saveChatSession = async () => {
  await fetch('/api/ai/chat-history', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: currentSessionId,
      messages: formattedMessages,
      title: 'My Chat Title',
    }),
  });
};
```

### Delete Chat:
```typescript
const deleteChatSession = async (sessionId: string) => {
  await fetch(`/api/ai/chat-history?sessionId=${sessionId}`, {
    method: 'DELETE',
  });
};
```

## 📝 Notes

1. **Auto-Save**: Hanya save jika ada lebih dari 1 message (skip welcome message)
2. **Title Generation**: Auto-generate dari first user message (max 50 chars)
3. **Message Count**: Updated setiap kali save
4. **Image Tracking**: Track messages dengan image untuk future features
5. **Performance**: Indexes pada userId dan createdAt untuk fast queries

## 🔮 Future Enhancements

- [ ] Search chat history
- [ ] Export chat as PDF/JSON
- [ ] Share chat with others
- [ ] Tag/categorize chats
- [ ] Favorite chats
- [ ] Archive old chats
- [ ] Chat analytics (most discussed topics)

---

**Last Updated:** October 18, 2025
**Status:** ✅ Complete and Ready to Use
