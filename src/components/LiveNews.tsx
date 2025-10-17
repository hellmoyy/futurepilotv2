'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  category: 'crypto' | 'market' | 'tech' | 'regulation';
  impact: 'high' | 'medium' | 'low';
}

export default function LiveNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');

  useEffect(() => {
    fetchNews();
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      // TODO: Integrate with real crypto news API (CoinGecko, CryptoCompare, etc.)
      // For now, using mock data
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Bitcoin Breaks $105,000 - New All-Time High',
          description: 'Bitcoin reaches unprecedented levels as institutional adoption continues to surge.',
          source: 'CoinDesk',
          url: '#',
          publishedAt: new Date().toISOString(),
          sentiment: 'bullish',
          category: 'crypto',
          impact: 'high',
        },
        {
          id: '2',
          title: 'SEC Approves New Bitcoin ETF Applications',
          description: 'Major breakthrough for cryptocurrency regulation in the United States.',
          source: 'Bloomberg Crypto',
          url: '#',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sentiment: 'bullish',
          category: 'regulation',
          impact: 'high',
        },
        {
          id: '3',
          title: 'Ethereum Network Completes Major Upgrade',
          description: 'Gas fees reduced by 40% following successful implementation.',
          source: 'Ethereum Foundation',
          url: '#',
          publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          sentiment: 'bullish',
          category: 'tech',
          impact: 'medium',
        },
        {
          id: '4',
          title: 'Market Analysis: Altcoin Season Approaching',
          description: 'Technical indicators suggest potential rally in alternative cryptocurrencies.',
          source: 'CryptoQuant',
          url: '#',
          publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          sentiment: 'neutral',
          category: 'market',
          impact: 'medium',
        },
        {
          id: '5',
          title: 'Federal Reserve Holds Interest Rates Steady',
          description: 'Decision impacts risk assets including cryptocurrencies.',
          source: 'Reuters',
          url: '#',
          publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          sentiment: 'neutral',
          category: 'market',
          impact: 'high',
        },
      ];
      
      setNews(mockNews);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      setLoading(false);
    }
  };

  const filteredNews = news.filter(item => {
    if (filter === 'all') return true;
    return item.sentiment === filter;
  });

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'bearish':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📰 Live Crypto News
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Stay updated with the latest market-moving news
              </p>
            </div>
            <button
              onClick={fetchNews}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4"
        >
          <div className="flex gap-2 flex-wrap">
            {['all', 'bullish', 'bearish', 'neutral'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === filterOption
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* News List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading news...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSentimentColor(item.sentiment)}`}>
                            {item.sentiment === 'bullish' && '📈'}
                            {item.sentiment === 'bearish' && '📉'}
                            {item.sentiment === 'neutral' && '➡️'}
                            {' '}{item.sentiment.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getImpactColor(item.impact)}`}>
                            {item.impact.toUpperCase()} IMPACT
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.category.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{item.source}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(item.publishedAt)}</span>
                        </div>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold transition-colors whitespace-nowrap"
                      >
                        Read More →
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredNews.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  📭 No news found for this filter.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
