'use client';

import { useState } from 'react';

export default function TestNewsPage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testNews = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test CryptoNews API directly
      const ticker = symbol.replace('USDT', '');
      const apiKey = 'lmrkgq8qw5dkldggrm3dz6vpuy5iudnzt2kmbrmo';
      const url = `https://cryptonews-api.com/api/v1?tickers=${ticker}&items=20&token=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.data) {
        const positive = data.data.filter((n: any) => n.sentiment === 'Positive').length;
        const negative = data.data.filter((n: any) => n.sentiment === 'Negative').length;
        const neutral = data.data.filter((n: any) => n.sentiment === 'Neutral').length;
        const score = ((positive - negative) / data.data.length) * 100;
        const overall = score > 10 ? 'BULLISH' : score < -10 ? 'BEARISH' : 'NEUTRAL';

        setResult({
          total: data.data.length,
          positive,
          negative,
          neutral,
          score: score.toFixed(1),
          overall,
          news: data.data.slice(0, 10).map((n: any) => ({
            title: n.title,
            sentiment: n.sentiment,
            source: n.source_name,
            date: n.date,
          })),
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to fetch news' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          📰 CryptoNews API Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="BTCUSDT">BTC/USDT</option>
              <option value="ETHUSDT">ETH/USDT</option>
              <option value="BNBUSDT">BNB/USDT</option>
              <option value="SOLUSDT">SOL/USDT</option>
              <option value="XRPUSDT">XRP/USDT</option>
            </select>

            <button
              onClick={testNews}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Loading...' : '🔍 Test News API'}
            </button>
          </div>

          {result && !result.error && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total News</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.total}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">🟢 Positive</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{result.positive}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400">🔴 Negative</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{result.negative}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">⚪ Neutral</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.neutral}</div>
                </div>
              </div>

              {/* Overall Sentiment */}
              <div className={`p-6 rounded-lg ${
                result.overall === 'BULLISH' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                result.overall === 'BEARISH' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Overall Sentiment</div>
                  <div className={`text-4xl font-bold mb-2 ${
                    result.overall === 'BULLISH' ? 'text-green-600 dark:text-green-400' :
                    result.overall === 'BEARISH' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {result.overall === 'BULLISH' ? '🟢 BULLISH' :
                     result.overall === 'BEARISH' ? '🔴 BEARISH' :
                     '⚪ NEUTRAL'}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {result.score}%
                  </div>
                </div>
              </div>

              {/* Recent News */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📰 Recent Headlines
                </h3>
                <div className="space-y-3">
                  {result.news.map((news: any, i: number) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border ${
                        news.sentiment === 'Positive' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                        news.sentiment === 'Negative' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                        'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {news.sentiment === 'Positive' ? '🟢' :
                           news.sentiment === 'Negative' ? '🔴' : '⚪'}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {news.title}
                          </h4>
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>📰 {news.source}</span>
                            <span>🕒 {new Date(news.date).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON */}
              <details className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white">
                  🔍 View Raw JSON
                </summary>
                <pre className="mt-4 text-xs text-gray-700 dark:text-gray-300 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="text-red-700 dark:text-red-300 font-semibold">❌ Error</div>
              <div className="text-red-600 dark:text-red-400">{result.error}</div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 How to Use
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Select a cryptocurrency symbol</li>
            <li>Click &quot;Test News API&quot; to fetch recent news</li>
            <li>View sentiment breakdown and overall market sentiment</li>
            <li>Read recent headlines with sentiment indicators</li>
            <li>Use this data to validate trading signals</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
