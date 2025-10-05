'use client';

import { useState, useEffect } from 'react';

// Crypto assets data
const cryptoAssets = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', price: 67234.50, change24h: 2.45, volume24h: 12350111123.25, isPositive: true },
  { symbol: 'ETHUSDT', name: 'Ethereum', price: 3456.78, change24h: 3.21, volume24h: 6840178792, isPositive: true },
  { symbol: 'BNBUSDT', name: 'BNB', price: 589.23, change24h: 1.89, volume24h: 1023456789, isPositive: true },
  { symbol: 'SOLUSDT', name: 'Solana', price: 156.78, change24h: 5.67, volume24h: 2345678901, isPositive: true },
  { symbol: 'XRPUSDT', name: 'Ripple', price: 0.5234, change24h: -1.23, volume24h: 987654321, isPositive: false },
  { symbol: 'ADAUSDT', name: 'Cardano', price: 0.4567, change24h: 2.34, volume24h: 456789012, isPositive: true },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', price: 0.0897, change24h: -0.87, volume24h: 567890123, isPositive: false },
  { symbol: 'MATICUSDT', name: 'Polygon', price: 0.7654, change24h: 4.56, volume24h: 345678901, isPositive: true },
  { symbol: 'DOTUSDT', name: 'Polkadot', price: 5.678, change24h: -2.12, volume24h: 234567890, isPositive: false },
  { symbol: 'AVAXUSDT', name: 'Avalanche', price: 34.56, change24h: 3.45, volume24h: 678901234, isPositive: true },
];

export default function FuturesTradingPage() {
  const [selectedAsset, setSelectedAsset] = useState(cryptoAssets[0]);
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState(10);

  // Load TradingView widget
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedAsset) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).TradingView) {
          new (window as any).TradingView.widget({
            autosize: true,
            symbol: `BINANCE:${selectedAsset.symbol}`,
            interval: '30',
            timezone: 'Asia/Jakarta',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#000000',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: 'tradingview_chart',
            studies: [
              'MASimple@tv-basicstudies',
              'RSI@tv-basicstudies'
            ],
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            gridColor: 'rgba(255, 255, 255, 0.06)',
          });
        }
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [selectedAsset]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
              Futures Trading
            </span>
          </h1>
          <p className="text-gray-400 text-sm">Trade cryptocurrency futures with leverage</p>
        </div>
        
        {/* Selected Asset Info */}
        <div className="bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 px-6 py-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-400">Selected Pair</p>
              <p className="text-lg font-bold">{selectedAsset.symbol}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Price</p>
              <p className="text-lg font-bold">${selectedAsset.price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">24h Change</p>
              <p className={`text-lg font-bold ${selectedAsset.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {selectedAsset.isPositive ? '+' : ''}{selectedAsset.change24h}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Left Sidebar - Asset List */}
        <div className="col-span-2 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4 h-[calc(100vh-200px)] overflow-y-auto">
          <h3 className="text-sm font-bold mb-4 text-gray-400">MARKETS</h3>
          <div className="space-y-1">
            {cryptoAssets.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                  selectedAsset.symbol === asset.symbol
                    ? 'bg-blue-500/20 border border-blue-500/50'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm">{asset.symbol.replace('USDT', '')}</span>
                  <span className={`text-xs font-semibold ${asset.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {asset.isPositive ? '+' : ''}{asset.change24h}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{asset.name}</span>
                  <span className="text-xs font-semibold">${asset.price.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center - TradingView Chart */}
        <div className="col-span-7 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div id="tradingview_chart" className="w-full h-[calc(100vh-200px)]"></div>
        </div>

        {/* Right Sidebar - Trading Panel */}
        <div className="col-span-3 space-y-4">
          
          {/* Order Type Tabs */}
          <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setOrderType('limit')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  orderType === 'limit'
                    ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                Limit
              </button>
              <button
                onClick={() => setOrderType('market')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  orderType === 'market'
                    ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                Market
              </button>
            </div>

            {/* Leverage Selector */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400">Leverage</label>
                <span className="text-sm font-bold text-blue-400">{leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="125"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(leverage / 125) * 100}%, rgba(255,255,255,0.1) ${(leverage / 125) * 100}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1x</span>
                <span>125x</span>
              </div>
            </div>

            {/* Price Input (Only for Limit) */}
            {orderType === 'limit' && (
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Price (USDT)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={selectedAsset.price.toString()}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Quantity Input */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Quantity (BTC)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 mt-2">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-semibold transition-all"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            {/* Cost Calculation */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Value</span>
                <span className="font-semibold">0.00 USDT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Cost</span>
                <span className="font-semibold">0.00 USDT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Fee (0.02%)</span>
                <span className="font-semibold">0.00 USDT</span>
              </div>
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTradeDirection('long')}
                className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all"
              >
                Long
              </button>
              <button
                onClick={() => setTradeDirection('short')}
                className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/50 transition-all"
              >
                Short
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <h3 className="text-sm font-bold mb-3">Unified Trading Account</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Margin Balance</span>
                <span className="font-semibold">0.0000 USDT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Available Balance</span>
                <span className="font-semibold">0.0000 USDT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Initial Margin</span>
                <span className="font-semibold text-yellow-400">0.00%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Maintenance Margin</span>
                <span className="font-semibold text-green-400">0.00%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-all">
                Deposit
              </button>
              <button className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-all">
                Transfer
              </button>
            </div>
          </div>

          {/* AI Bot Analysis */}
          <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold">AI Bot Analysis</h3>
            </div>
            
            {/* Recommendation */}
            <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-bold text-lg">LONG</span>
                <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs font-semibold text-green-400">Strong Signal</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Recommended to open <span className="text-green-400 font-semibold">LONG position</span> in the next <span className="font-semibold">2 hours</span>, hold until <span className="font-semibold">4 hours</span> ahead.
              </p>
            </div>

            {/* Analysis Reasons */}
            <div className="space-y-2 mb-3">
              <div className="flex items-start gap-2">
                <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-gray-400">RSI indicates oversold territory at 32.5</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-gray-400">MA(50) crossed above MA(200) - Golden Cross</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-gray-400">Volume surge +45% indicates strong momentum</p>
              </div>
            </div>

            {/* Target & Stop Loss */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-xs text-gray-400 mb-1">Take Profit</p>
                <p className="text-sm font-bold text-green-400">${(selectedAsset.price * 1.035).toLocaleString()}</p>
                <p className="text-xs text-gray-500">+3.5%</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-xs text-gray-400 mb-1">Stop Loss</p>
                <p className="text-sm font-bold text-red-400">${(selectedAsset.price * 0.98).toLocaleString()}</p>
                <p className="text-xs text-gray-500">-2.0%</p>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Confidence Level</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <span className="font-bold text-green-400">78%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
