'use client';

import { useState } from 'react';

// Sample trading bots data
const tradingBots = [
  {
    id: 1,
    name: 'Multi-Asset',
    icon: '🎯',
    contracts: 'Various',
    price: '-',
    range24h: '-',
    change24h: '-',
    category: 'diversified'
  },
  {
    id: 2,
    name: 'BTC/USDT',
    icon: '₿',
    contracts: '1.5',
    price: '67,234',
    range24h: '8.23%',
    change24h: '+2.45%',
    isPositive: true,
    category: 'crypto'
  },
  {
    id: 3,
    name: 'ETH/USDT',
    icon: 'Ξ',
    contracts: '12.8',
    price: '3,456',
    range24h: '6.78%',
    change24h: '+3.21%',
    isPositive: true,
    category: 'crypto'
  },
  {
    id: 4,
    name: 'SOL/USDT',
    icon: '◎',
    contracts: '250',
    price: '156.78',
    range24h: '12.45%',
    change24h: '+5.67%',
    isPositive: true,
    category: 'crypto'
  },
  {
    id: 5,
    name: 'BNB/USDT',
    icon: '🔶',
    contracts: '45.2',
    price: '589.23',
    range24h: '4.56%',
    change24h: '+1.89%',
    isPositive: true,
    category: 'crypto'
  },
  {
    id: 6,
    name: 'ADA/USDT',
    icon: '🔷',
    contracts: '3500',
    price: '0.456',
    range24h: '9.12%',
    change24h: '-1.23%',
    isPositive: false,
    category: 'crypto'
  },
];

export default function AutomationPage() {
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [tradingType, setTradingType] = useState<'spot' | 'futures'>('futures');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Bot Settings State
  const [leverage, setLeverage] = useState(10);
  const [stopLoss, setStopLoss] = useState(2);
  const [takeProfit, setTakeProfit] = useState(5);
  const [maxPositionSize, setMaxPositionSize] = useState(30);
  const [maxDailyLoss, setMaxDailyLoss] = useState(5);

  const filteredBots = tradingBots.filter(bot =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBot = tradingBots.find(bot => bot.id === selectedAsset);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
            Auto Trading
          </span>
        </h1>
        <p className="text-gray-400">Match with the right trading bot for your strategy</p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Panel - Bot Matching Form */}
        <div className="lg:col-span-2 bg-black/50 backdrop-blur-3xl rounded-3xl border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-2xl">
              🤖
            </div>
            <h2 className="text-2xl font-bold">Match With the Right Trading Bot</h2>
          </div>

          {/* Question 1: Asset Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              1. Which asset would you like to focus on?
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-left flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <span className={selectedBot ? 'text-white' : 'text-gray-500'}>
                  {selectedBot ? (
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">{selectedBot.icon}</span>
                      <span>{selectedBot.name}</span>
                    </span>
                  ) : (
                    'Please select an option'
                  )}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                  {/* Search */}
                  <div className="p-4 border-b border-white/10">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/5 text-xs text-gray-400 font-semibold">
                    <div className="col-span-3">Contracts</div>
                    <div className="col-span-3 text-right">Price</div>
                    <div className="col-span-3 text-right">24H Range</div>
                    <div className="col-span-3 text-right">24H Change</div>
                  </div>

                  {/* Bot List */}
                  <div className="max-h-96 overflow-y-auto">
                    {filteredBots.map((bot) => (
                      <button
                        key={bot.id}
                        onClick={() => {
                          setSelectedAsset(bot.id);
                          setShowDropdown(false);
                          setSearchQuery('');
                        }}
                        className="w-full grid grid-cols-12 gap-4 px-4 py-4 hover:bg-white/5 transition-all border-b border-white/5"
                      >
                        <div className="col-span-3 flex items-center gap-3">
                          <span className="text-2xl">{bot.icon}</span>
                          <span className="font-semibold text-white">{bot.name}</span>
                        </div>
                        <div className="col-span-3 text-right text-gray-300">{bot.price}</div>
                        <div className="col-span-3 text-right text-gray-300">{bot.range24h}</div>
                        <div className={`col-span-3 text-right font-semibold ${bot.isPositive ? 'text-green-400' : bot.isPositive === false ? 'text-red-400' : 'text-gray-400'}`}>
                          {bot.change24h}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question 2: Trading Type */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              2. Which type of trading do you prefer?
            </label>
            <div className="flex gap-4">
              <button
                disabled
                className="flex-1 px-6 py-4 rounded-xl font-semibold transition-all bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed relative"
              >
                Spot
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-gray-600/50 text-gray-400 text-xs rounded">Soon</span>
              </button>
              <button
                onClick={() => setTradingType('futures')}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all ${
                  tradingType === 'futures'
                    ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                Futures
              </button>
            </div>
          </div>

          {/* Get My Match Button */}
          <button
            disabled={!selectedAsset}
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            Get My Match
          </button>
        </div>

        {/* Right Panel - Bot Settings */}
        <div className="lg:col-span-1">
          <div className="bg-black/50 backdrop-blur-3xl rounded-3xl border border-white/10 p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Bot Settings</h3>
            </div>
            
            <div className="space-y-5">
              {/* Selected Asset Display */}
              {selectedAsset && (
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{selectedBot?.icon}</span>
                    <div>
                      <p className="font-bold">{selectedBot?.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{tradingType} Trading</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leverage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-300">Leverage</label>
                  <span className="text-sm font-bold text-blue-400">{leverage}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="125"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(leverage / 125) * 100}%, rgba(255,255,255,0.1) ${(leverage / 125) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x</span>
                  <span>125x</span>
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-300">Stop Loss</label>
                  <span className="text-sm font-bold text-red-400">-{stopLoss}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(239, 68, 68) 0%, rgb(239, 68, 68) ${(stopLoss / 10) * 100}%, rgba(255,255,255,0.1) ${(stopLoss / 10) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-1%</span>
                  <span>-10%</span>
                </div>
              </div>

              {/* Take Profit */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-300">Take Profit</label>
                  <span className="text-sm font-bold text-green-400">+{takeProfit}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${(takeProfit / 20) * 100}%, rgba(255,255,255,0.1) ${(takeProfit / 20) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>+1%</span>
                  <span>+20%</span>
                </div>
              </div>

              {/* Max Position Size */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-300">Max Position Size</label>
                  <span className="text-sm font-bold text-cyan-400">{maxPositionSize}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={maxPositionSize}
                  onChange={(e) => setMaxPositionSize(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(34, 211, 238) 0%, rgb(34, 211, 238) ${(maxPositionSize / 100) * 100}%, rgba(255,255,255,0.1) ${(maxPositionSize / 100) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Max Daily Loss */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-300">Max Daily Loss</label>
                  <span className="text-sm font-bold text-orange-400">-{maxDailyLoss}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={maxDailyLoss}
                  onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(251, 146, 60) 0%, rgb(251, 146, 60) ${(maxDailyLoss / 20) * 100}%, rgba(255,255,255,0.1) ${(maxDailyLoss / 20) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-1%</span>
                  <span>-20%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Bot will stop trading when daily loss reaches this limit</p>
              </div>

              {/* Risk Level Indicator */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400">Risk Level</span>
                  <span className={`text-xs font-bold ${
                    leverage > 20 ? 'text-red-400' : 
                    leverage > 10 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {leverage > 20 ? 'HIGH' : leverage > 10 ? 'MEDIUM' : 'LOW'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      leverage > 20 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                      leverage > 10 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                      'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${Math.min((leverage / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 pt-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Margin</span>
                    <span className="font-semibold">~${((maxPositionSize / 100) * 1000 / leverage).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Position Value</span>
                    <span className="font-semibold">${((maxPositionSize / 100) * 1000).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
