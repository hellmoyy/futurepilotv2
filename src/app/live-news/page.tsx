/* eslint-disable @next/next/no-img-element */
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
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState(60);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchNews, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for next refresh
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdate) {
        const elapsed = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setNextRefresh(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/news', { cache: 'no-store' });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch news');
      }

      setNews(result.data);
      setLastUpdate(new Date());
      setNextRefresh(30);
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

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNews = filteredNews.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-4 sm:p-5 lg:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                📰 Live Crypto News
              </h1>
              <p className="text-sm sm:text-base text-gray-400">
                Real-time cryptocurrency market news and updates
              </p>
              {lastUpdate && (
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <span className="text-gray-500">
                    Last update: {lastUpdate.toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 w-fit">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="hidden sm:inline">Next refresh in {nextRefresh}s</span>
                    <span className="sm:hidden">{nextRefresh}s</span>
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={fetchNews}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 sm:gap-3"
        >
          {['all', 'bullish', 'bearish', 'neutral'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => handleFilterChange(filterType as any)}
              className={`px-3 sm:px-4 lg:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-1 sm:flex-initial min-w-[70px] ${
                filter === filterType
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/10 dark:bg-white/5 text-gray-400 hover:bg-white/20 dark:hover:bg-white/10'
              }`}
            >
              <span className="hidden sm:inline">
                {filterType === 'all' ? '📋 All' : ''}
                {filterType === 'bullish' ? '📈 Bullish' : ''}
                {filterType === 'bearish' ? '📉 Bearish' : ''}
                {filterType === 'neutral' ? '➖ Neutral' : ''}
              </span>
              <span className="sm:hidden">
                {filterType === 'all' ? '📋' : ''}
                {filterType === 'bullish' ? '📈' : ''}
                {filterType === 'bearish' ? '📉' : ''}
                {filterType === 'neutral' ? '➖' : ''}
              </span>
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
          <div className="space-y-3 sm:space-y-4">
            {paginatedNews.map((item, index) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="block bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-500"
              >
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* News Image */}
                  {item.imageUrl && (
                    <div className="flex-shrink-0 w-full sm:w-24 md:w-28 lg:w-32 h-40 sm:h-24 md:h-28 lg:h-32 rounded-lg sm:rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold ${getSentimentColor(item.sentiment)}`}>
                        {item.sentiment === 'bullish' && '📈 BULLISH'}
                        {item.sentiment === 'bearish' && '📉 BEARISH'}
                        {item.sentiment === 'neutral' && '➖ NEUTRAL'}
                      </span>
                      {item.sourceImage && (
                        <img 
                          src={item.sourceImage} 
                          alt={item.source}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded"
                        />
                      )}
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
                        {item.source}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">•</span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(item.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
                      {item.description}
                    </p>
                    
                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {item.tags.slice(0, 5).map((tag) => (
                          <span 
                            key={tag}
                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* External Link Icon */}
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </motion.a>
            ))}
          </div>
        )}

        {filteredNews.length === 0 && !loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              📭 No news found for selected filter.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredNews.length > itemsPerPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 dark:border-white/10 p-4 sm:p-5 lg:p-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                <span className="hidden sm:inline">Showing {startIndex + 1}-{Math.min(endIndex, filteredNews.length)} of {filteredNews.length} news articles</span>
                <span className="sm:hidden">{startIndex + 1}-{Math.min(endIndex, filteredNews.length)} of {filteredNews.length}</span>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">← Previous</span>
                  <span className="sm:hidden">←</span>
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Next →</span>
                  <span className="sm:hidden">→</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
