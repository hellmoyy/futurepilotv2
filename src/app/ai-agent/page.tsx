/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getWelcomeMessage, getQuickActions } from '@/config/ai-agent-persona';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  role?: 'user' | 'assistant' | 'system';
  imageUrl?: string; // For messages with images
  imagePreview?: string; // For local image preview
}

interface ChatSession {
  sessionId: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Initialize messages from localStorage or default
const getInitialMessages = (): Message[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ai-agent-messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any, index: number) => ({
          id: msg.id || index + 1,
          type: msg.type,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          role: msg.role,
          imageUrl: msg.imageUrl,
          imagePreview: msg.imagePreview,
        }));
      } catch (error) {
        console.error('Failed to restore chat:', error);
      }
    }
  }
  // Default welcome message
  return [{
    id: 1,
    type: 'ai',
    content: getWelcomeMessage(),
    timestamp: new Date(),
    role: 'assistant',
  }];
};

// Initialize session ID from localStorage or create new
const getInitialSessionId = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ai-agent-current-session');
    if (saved) return saved;
  }
  return `session_${Date.now()}`;
};

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>(getInitialSessionId());
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickActionsConfig = getQuickActions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert image to base64 for API
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Load chat sessions from history
  const loadChatSessions = async () => {
    try {
      const response = await fetch('/api/ai/chat-history');
      const data = await response.json();
      
      if (data.success) {
        setChatSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  // Load specific chat session
  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai/chat-history/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        const loadedMessages: Message[] = data.session.messages.map((msg: any, index: number) => ({
          id: index + 1,
          type: msg.role === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          role: msg.role,
        }));
        
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
        localStorage.setItem('ai-agent-current-session', sessionId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      setError('Failed to load chat session');
    }
  };

  // Save current chat session
  const saveChatSession = useCallback(async () => {
    if (messages.length <= 1) {
      return;
    }
    
    setIsSaving(true);
    try {
      const formattedMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          hasImage: !!m.imageUrl,
        }));

      const response = await fetch('/api/ai/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: formattedMessages,
          title: messages.find(m => m.role === 'user')?.content.slice(0, 50) || 'New Chat',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Save to localStorage only after successful DB save
        localStorage.setItem('ai-agent-current-session', currentSessionId);
        await loadChatSessions(); // Refresh sessions list
      } else {
        console.error('Failed to save chat:', data.error);
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    } finally {
      setIsSaving(false);
    }
  }, [messages, currentSessionId]);

  // Delete chat session
  const deleteChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai/chat-history?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await loadChatSessions(); // Refresh sessions list
        if (sessionId === currentSessionId) {
          // Start new chat if current chat was deleted
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
    }
  };

  // Start new chat
  const startNewChat = () => {
    const newSessionId = `session_${Date.now()}`;
    const newMessages = [
      {
        id: 1,
        type: 'ai' as const,
        content: getWelcomeMessage(),
        timestamp: new Date(),
        role: 'assistant' as const,
      }
    ];
    
    setMessages(newMessages);
    setCurrentSessionId(newSessionId);
    
    // Clear localStorage for fresh start
    localStorage.removeItem('ai-agent-messages');
    localStorage.removeItem('ai-agent-current-session');
    
    setShowHistory(false);
  };

  // Load chat sessions list on mount (for sidebar)
  useEffect(() => {
    loadChatSessions();
  }, []);

  // Auto-save to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('ai-agent-messages', JSON.stringify(messages));
        localStorage.setItem('ai-agent-current-session', currentSessionId);
      } catch (error) {
        console.error('Failed to save chat:', error);
      }
    }
  }, [messages, currentSessionId]);

  // Auto-save every 30 seconds if there are new messages
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (messages.length > 1 && !isLoading) {
        saveChatSession();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [messages, isLoading, saveChatSession]);

  // Save chat before page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 1 && !isLoading) {
        // Use synchronous method to ensure save completes before unload
        const formattedMessages = messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            hasImage: !!m.imageUrl,
          }));

        // Send beacon for guaranteed delivery even during page unload
        const data = JSON.stringify({
          sessionId: currentSessionId,
          messages: formattedMessages,
          title: messages.find(m => m.role === 'user')?.content.slice(0, 50) || 'New Chat',
        });

        navigator.sendBeacon('/api/ai/chat-history', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [messages, currentSessionId, isLoading]);

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImage) || isLoading) return;

    // More descriptive default message for chart analysis
    const userMessageContent = inputValue || 'Please provide educational technical analysis of this trading chart. Identify patterns, key levels, and potential trade setups for learning purposes.';
    const imageData = selectedImage ? imagePreview : null;
    
    setInputValue('');
    setError(null);

    // Add user message with image if available
    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: userMessageContent,
      timestamp: new Date(),
      role: 'user',
      imageUrl: imageData || undefined,
      imagePreview: imageData || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Prepare image for API if available
      let imageUrlForAPI = null;
      if (selectedImage) {
        imageUrlForAPI = await convertImageToBase64(selectedImage);
      }

      // Build conversation history for API (exclude images from history to save tokens)
      const conversationHistory = messages
        .filter(msg => msg.role && !msg.imageUrl)
        .map(msg => ({
          role: msg.type === 'ai' ? 'assistant' : 'user',
          content: msg.content,
        }));

      // Call AI Agent API
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessageContent,
          conversationHistory,
          imageUrl: imageUrlForAPI,
          includeMarketData: true,
          includeNews: true, // Always include news for comprehensive analysis
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Add AI response
      const aiMessage: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        role: 'assistant',
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Clear image after successful send
      handleRemoveImage();
      
    } catch (error: any) {
      console.error('AI Agent Error:', error);
      setError(error.message || 'Failed to connect to AI Agent');
      
      // Add error message
      const errorMessage: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: `⚠️ I apologize, but I encountered an error: ${error.message}. Please try again or rephrase your question.`,
        timestamp: new Date(),
        role: 'assistant',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    // Check if it's upload chart trigger
    if (query === 'upload-chart-trigger') {
      fileInputRef.current?.click();
      return;
    }
    
    setInputValue(query);
    // Auto-send after a short delay to show the input
    setTimeout(() => {
      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      handleSend();
    }, 100);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* History Sidebar */}
      {showHistory && (
        <>
          {/* Mobile Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowHistory(false)}
          />
          
          {/* Sidebar */}
          <div className="
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
            w-80 max-w-[85vw]
            bg-white/5 dark:bg-white/5 light:bg-white 
            border-r lg:border border-white/10 dark:border-white/10 light:border-gray-200 
            rounded-none lg:rounded-2xl 
            p-4 
            max-h-screen lg:max-h-[calc(100vh-120px)] 
            overflow-y-auto
            transform transition-transform duration-300
            lg:translate-x-0
          ">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white dark:text-white light:text-gray-900">
              💬 Chat History
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            onClick={startNewChat}
            className="w-full mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          <div className="space-y-2">
            {chatSessions.map((session) => (
              <div
                key={session.sessionId}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  session.sessionId === currentSessionId
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div onClick={() => loadChatSession(session.sessionId)}>
                  <div className="text-sm font-medium text-white truncate">
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {session.messageCount} messages • {new Date(session.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => deleteChatSession(session.sessionId)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          </div>
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100 light:to-cyan-100 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 dark:border-white/20 light:border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 truncate">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
                  FuturePilot AI Agent
                </span>
              </h1>
              <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm sm:text-base lg:text-lg">
                Your expert cryptocurrency futures trading assistant
              </p>
              <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs sm:text-sm mt-1">
                Specialized in BTC, ETH & major altcoin perpetual futures
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {/* Manual Save Button (for debugging) */}
              {messages.length > 1 && (
                <button
                  onClick={saveChatSession}
                  disabled={isSaving}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
                  title="Save Chat Now"
                >
                  {isSaving ? (
                    <span className="text-sm text-gray-400">💾 Saving...</span>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  )}
                </button>
              )}
              
              {/* History Toggle Button */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                title="Chat History"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-semibold text-green-400">AI Active • OpenAI</span>
          </div>
          
          {/* Session Info */}
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-2">
            <span className="text-xs text-blue-400">
              💬 {messages.length} • {currentSessionId.slice(-8)}
            </span>
          </div>

          {/* Save Status */}
          {localStorage.getItem('ai-agent-messages') && (
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center gap-2">
              <span className="text-xs text-purple-400">💾 Saved</span>
            </div>
          )}
          
          {error && (
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-red-400">⚠️ {error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="w-full min-w-0">
        {/* Chat Container */}
          <div className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 flex flex-col h-[500px] sm:h-[600px] lg:h-[700px] shadow-xl">
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-white/10 dark:border-white/10 light:border-blue-200 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white dark:text-white light:text-gray-900 text-sm sm:text-base truncate">AI Agent</h3>
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 font-medium">Online • Ready</p>
              </div>
              <button className="p-1.5 sm:p-2 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-blue-100 rounded-lg transition-all flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-400 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              {/* Debug: Show message count */}
              {process.env.NODE_ENV === 'development' && messages.length === 0 && (
                <div className="text-center text-gray-400 p-4 border border-dashed border-gray-600 rounded">
                  ⚠️ No messages to render (messages.length = 0)
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] lg:max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {message.type === 'ai' && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    )}
                    {message.type === 'user' && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className="min-w-0">
                      <div
                        className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                            : 'bg-white/5 dark:bg-white/5 light:bg-blue-50 border border-white/10 dark:border-white/10 light:border-blue-200 text-white dark:text-white light:text-gray-900'
                        }`}
                      >
                        {/* Display image if present */}
                        {message.imagePreview && (
                          <div className="mb-2 sm:mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={message.imagePreview} 
                              alt="Chart screenshot" 
                              className="rounded-lg max-w-full h-auto max-h-48 sm:max-h-64 lg:max-h-96 object-contain border-2 border-white/20"
                            />
                          </div>
                        )}
                        <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed break-words">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1 px-1 sm:px-2 font-medium">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 border border-white/10 dark:border-white/10 light:border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 dark:bg-blue-400 light:bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 dark:bg-blue-400 light:bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 dark:bg-blue-400 light:bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t border-white/10 dark:border-white/10 light:border-blue-200">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-2 sm:mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {quickActionsConfig.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.query)}
                    disabled={isLoading}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 dark:bg-white/5 light:bg-blue-50 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-blue-100 border border-white/10 dark:border-white/10 light:border-blue-200 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 text-white dark:text-white light:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                    <span className="text-sm sm:text-base">{action.icon}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">{action.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Image Preview - TEMPORARILY HIDDEN */}
              {false && imagePreview !== null && (
                <div className="mb-3 relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={imagePreview || ''} 
                    alt="Selected chart" 
                    className="rounded-lg max-h-32 border-2 border-blue-500/50"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                    📸 Chart will be analyzed by AI
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Input */}
              <div className="flex gap-2">
                {/* Image upload button - TEMPORARILY HIDDEN */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="hidden px-3 py-3 bg-white/5 dark:bg-white/5 light:bg-blue-50 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-blue-100 border border-white/10 dark:border-white/10 light:border-blue-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload chart screenshot"
                >
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-400 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading}
                  placeholder={selectedImage ? "Add message about chart..." : "Ask anything about futures trading..."}
                  className="flex-1 bg-white/5 dark:bg-white/5 light:bg-blue-50 border border-white/10 dark:border-white/10 light:border-blue-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                />
                <button
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && !selectedImage) || isLoading}
                  className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg sm:rounded-xl font-semibold text-white transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0">
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Send</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Save Status */}
        {isSaving && (
          <div className="text-xs text-gray-400 text-center">
            💾 Saving chat...
          </div>
        )}
      </div>
    </div>
  );
}
