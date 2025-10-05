'use client';

import { useState } from 'react';

interface AnalysisResult {
  symbol: string;
  timeframe: string;
  analysis: string;
  timestamp: string;
}

export default function MarketAnalyzer() {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const popularPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'];
  const timeframes = ['15m', '1h', '4h', '1d'];

  const analyzeMarket = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          indicators: ['RSI', 'MACD', 'Moving Averages'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data);
      } else {
        console.error('Analysis Error:', data.error);
      }
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/50 rounded-xl border border-white/10 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-xl text-white">AI Market Analyzer</h3>
          <p className="text-sm text-gray-400">Get instant technical analysis</p>
        </div>
      </div>

      {/* Symbol Selection */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">Trading Pair</label>
        <div className="grid grid-cols-5 gap-2 mb-2">
          {popularPairs.map((pair) => (
            <button
              key={pair}
              onClick={() => setSymbol(pair)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                symbol === pair
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {pair.split('/')[0]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Or enter custom pair..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Timeframe Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-300 mb-2">Timeframe</label>
        <div className="grid grid-cols-4 gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={analyzeMarket}
        disabled={loading}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {loading ? (
          <span className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analyzing...</span>
          </span>
        ) : (
          'Analyze Market'
        )}
      </button>

      {/* Analysis Result */}
      {analysis && (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-lg text-white">{analysis.symbol}</h4>
              <p className="text-sm text-gray-400">{analysis.timeframe} timeframe</p>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(analysis.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {analysis.analysis}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
