'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I&apos;m your AI Trading Agent. I can help you analyze markets, execute trades, and manage your portfolio. What would you like to do today?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: getAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('btc') || lowerInput.includes('bitcoin')) {
      return '📊 Bitcoin Analysis:\n\nCurrent Price: $67,234\n24h Change: +2.45%\n\nTechnical Indicators:\n• RSI: 58 (Neutral)\n• MACD: Bullish crossover\n• Support: $65,000\n• Resistance: $70,000\n\nRecommendation: Consider LONG position with 2x leverage. Entry: $67,000, TP: $70,000, SL: $65,500';
    }
    
    if (lowerInput.includes('market') || lowerInput.includes('analysis')) {
      return '📈 Market Overview:\n\nTop Movers (24h):\n• BTC: +2.45% 🟢\n• ETH: +1.83% 🟢\n• SOL: +5.67% 🟢\n• XRP: -0.52% 🔴\n\nMarket Sentiment: Bullish\nFear & Greed Index: 62 (Greed)\n\nAI Suggestion: Market conditions favor long positions. Consider accumulating major altcoins.';
    }
    
    if (lowerInput.includes('portfolio') || lowerInput.includes('balance')) {
      return '💼 Portfolio Analysis:\n\nTotal Balance: $10,243.56\nP&L (24h): +$234.12 (+2.34%)\n\nAsset Allocation:\n• USDT: 45% ($4,609)\n• BTC: 30% ($3,073)\n• ETH: 15% ($1,536)\n• Others: 10% ($1,024)\n\nRecommendation: Your portfolio is well-diversified. Consider taking 20% profit on BTC if it reaches $70,000.';
    }
    
    if (lowerInput.includes('risk') || lowerInput.includes('strategy')) {
      return '⚙️ Risk Management Strategy:\n\nCurrent Settings:\n• Max Position Size: 30% of portfolio\n• Stop Loss: -2%\n• Take Profit: +5%\n• Max Leverage: 3x\n\nAI Recommendation:\n✓ Your risk settings are conservative and safe\n✓ Consider increasing position size to 40% for high-confidence trades\n✓ Always use stop-loss orders';
    }
    
    return '🤖 I understand you want to ' + input + '. Let me analyze the current market conditions and provide you with the best trading strategy. Based on technical indicators and market sentiment, I recommend monitoring BTC and ETH for potential entries. Would you like detailed analysis on any specific asset?';
  };

  const quickActions = [
    { icon: '📊', label: 'Analyze BTC', query: 'Analyze Bitcoin price' },
    { icon: '💼', label: 'Check Portfolio', query: 'Show my portfolio' },
    { icon: '📈', label: 'Market Overview', query: 'Give me market analysis' },
    { icon: '⚙️', label: 'Risk Settings', query: 'Show risk management strategy' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100 light:to-cyan-100 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-white/20 light:border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
                AI Trading Agent
              </span>
            </h1>
            <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-lg">Your intelligent trading assistant powered by advanced AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-400">AI Active</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-8">
                    {/* Chat Container */}
          {/* Chat Container */}
          <div className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 flex flex-col h-[700px] shadow-xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 dark:border-white/10 light:border-blue-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white dark:text-white light:text-gray-900">AI Agent</h3>
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 font-medium">Online • Ready to assist</p>
              </div>
              <button className="p-2 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-blue-100 rounded-lg transition-all">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-400 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {message.type === 'ai' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    )}
                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div>
                      <div
                        className={`rounded-2xl p-4 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                            : 'bg-white/5 dark:bg-white/5 light:bg-blue-50 border border-white/10 dark:border-white/10 light:border-blue-200 text-white dark:text-white light:text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1 px-2 font-medium">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 border border-white/10 dark:border-white/10 light:border-blue-200 rounded-2xl p-4">
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
            <div className="p-4 border-t border-white/10 dark:border-white/10 light:border-blue-200">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(action.query);
                      handleSend();
                    }}
                    className="px-3 py-2 bg-white/5 dark:bg-white/5 light:bg-blue-50 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-blue-100 border border-white/10 dark:border-white/10 light:border-blue-200 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 text-white dark:text-white light:text-gray-900"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about trading, market analysis, or your portfolio..."
                  className="flex-1 bg-white/5 dark:bg-white/5 light:bg-blue-50 border border-white/10 dark:border-white/10 light:border-blue-200 rounded-xl px-4 py-3 text-sm text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all flex items-center gap-2"
                >
                  <span>Send</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Stats & Info */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Status */}
          <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 dark:from-blue-900/40 dark:to-cyan-900/40 light:from-white light:to-blue-50 backdrop-blur-xl rounded-2xl border border-blue-500/30 dark:border-blue-500/30 light:border-blue-300 p-4 shadow-xl">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-white dark:text-white light:text-gray-900">
              <svg className="w-5 h-5 text-blue-400 dark:text-blue-400 light:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-700 font-medium">Win Rate</span>
                <span className="text-lg font-bold text-green-400 dark:text-green-400 light:text-green-600">76.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-700 font-medium">Total Trades</span>
                <span className="text-lg font-bold text-white dark:text-white light:text-gray-900">1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-700 font-medium">Profit (30d)</span>
                <span className="text-lg font-bold text-green-400 dark:text-green-400 light:text-green-600">+23.4%</span>
              </div>
            </div>
          </div>

          {/* Active Signals */}
          <div className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-4 shadow-xl">
            <h3 className="font-bold mb-3 text-white dark:text-white light:text-gray-900">Active Signals</h3>
            <div className="space-y-2">
              <div className="p-3 bg-green-500/10 dark:bg-green-500/10 light:bg-green-50 border border-green-500/30 dark:border-green-500/30 light:border-green-300 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white dark:text-white light:text-gray-900">BTC/USDT</span>
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 dark:bg-green-500/20 light:bg-green-100 rounded text-green-400 dark:text-green-400 light:text-green-700 font-semibold">LONG</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 font-medium">Entry: $67,000 • TP: $70,000</p>
              </div>
              <div className="p-3 bg-green-500/10 dark:bg-green-500/10 light:bg-green-50 border border-green-500/30 dark:border-green-500/30 light:border-green-300 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white dark:text-white light:text-gray-900">ETH/USDT</span>
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 dark:bg-green-500/20 light:bg-green-100 rounded text-green-400 dark:text-green-400 light:text-green-700 font-semibold">LONG</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 font-medium">Entry: $3,200 • TP: $3,400</p>
              </div>
              <div className="p-3 bg-red-500/10 dark:bg-red-500/10 light:bg-red-50 border border-red-500/30 dark:border-red-500/30 light:border-red-300 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white dark:text-white light:text-gray-900">SOL/USDT</span>
                  <span className="text-xs px-2 py-0.5 bg-red-500/20 dark:bg-red-500/20 light:bg-red-100 rounded text-red-400 dark:text-red-400 light:text-red-700 font-semibold">SHORT</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 font-medium">Entry: $145 • TP: $138</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-4 shadow-xl">
            <h3 className="font-bold mb-3 text-white dark:text-white light:text-gray-900">AI Capabilities</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 dark:text-green-400 light:text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400 dark:text-gray-400 light:text-gray-700 font-medium">Real-time market analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 dark:text-green-400 light:text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400 dark:text-gray-400 light:text-gray-700 font-medium">Automated trade execution</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 dark:text-green-400 light:text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400 dark:text-gray-400 light:text-gray-700 font-medium">Risk management</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 dark:text-green-400 light:text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400 dark:text-gray-400 light:text-gray-700 font-medium">Portfolio optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 dark:text-green-400 light:text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400 dark:text-gray-400 light:text-gray-700 font-medium">24/7 market monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
