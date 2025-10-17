'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceImage?: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  tags?: string[];
  categories?: string[];
}

export default function LiveNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/news');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch news');
      }

      setNews(result.data);
      console.log(`✅ Loaded ${result.data.length} news articles (cached: ${result.cached})`);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError(error instanceof Error ? error.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(item => {
    if (filter === 'all') return true;
    return item.sentiment === filter;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return `${minutes}m ago`;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'bearish':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                📰 Live Crypto News
              </h1>
              <p className="text-gray-400">
                Real-time cryptocurrency market news and updates
              </p>
            </div>
            <button
              onClick={fetchNews}
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3"
        >
          {['all', 'bullish', 'bearish', 'neutral'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === filterType
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/10 dark:bg-white/5 text-gray-400 hover:bg-white/20 dark:hover:bg-white/10'
              }`}
            >
              {filterType === 'all' ? '📋 All' : ''}
              {filterType === 'bullish' ? '📈 Bullish' : ''}
              {filterType === 'bearish' ? '📉 Bearish' : ''}
              {filterType === 'neutral' ? '➖ Neutral' : ''}
            </button>
          ))}
        </motion.div>

        {/* News List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-400 font-medium">Loading latest crypto news...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-center">
            <p className="text-red-400 font-medium mb-2">⚠️ Failed to load news</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={fetchNews}
              className="mt-4 px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map((item, index) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-500"
              >
                <div className="flex gap-4">
                  {/* News Image */}
                  {item.imageUrl && (
                    <div className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* News Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSentimentColor(item.sentiment)}`}>
                        {item.sentiment === 'bullish' && '📈 BULLISH'}
                        {item.sentiment === 'bearish' && '📉 BEARISH'}
                        {item.sentiment === 'neutral' && '➖ NEUTRAL'}
                      </span>
                      {item.sourceImage && (
                        <img 
                          src={item.sourceImage} 
                          alt={item.source}
                          className="w-5 h-5 rounded"
                        />
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {item.source}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(item.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
                      {item.description}
                    </p>
                    
                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.tags.slice(0, 5).map((tag) => (
                          <span 
                            key={tag}
                            className="px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* External Link Icon */}
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </motion.a>
            ))}
          </div>
        )}

        {filteredNews.length === 0 && !loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              📭 No news found for selected filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
