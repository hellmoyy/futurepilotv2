/**
 * 🪙 TRADING PAIRS CONFIGURATION
 * 
 * File ini adalah pusat kontrol untuk semua trading pairs yang diizinkan.
 * Hanya pairs yang ada di sini yang bisa digunakan untuk trading.
 * 
 * ⚠️ PENTING: 
 * - Pairs yang tidak ada di list ini akan DIBLOKIR
 * - Backup file ini sebelum melakukan perubahan!
 * - Update ALLOWED_PAIRS setelah add/remove pairs
 */

// ============================================================================
// 📊 TRADING PAIR INTERFACES
// ============================================================================

export interface CoinMetadata {
  symbol: string;           // Simbol coin (BTC, ETH, dll)
  name: string;             // Nama lengkap (Bitcoin, Ethereum)
  category: 'major' | 'altcoin' | 'defi' | 'meme' | 'gaming' | 'metaverse' | 'layer1' | 'layer2';
  marketCap: 'large' | 'medium' | 'small' | 'micro';
  icon?: string;            // URL atau path ke icon
  description?: string;     // Deskripsi singkat
  website?: string;         // Official website
  whitepaper?: string;      // Whitepaper URL
}

export interface PairSettings {
  // Trading Settings
  enabled: boolean;         // Apakah pair ini aktif?
  
  // Leverage & Risk
  maxLeverage: number;      // Max leverage untuk pair ini (1-125)
  minLeverage: number;      // Min leverage (default: 1)
  
  // Position Limits
  maxPositionSize: number;  // Max position size in USD
  minOrderSize: number;     // Min order size in USD
  
  // Price Settings
  tickSize: number;         // Minimum price movement (0.01, 0.1, 1, etc)
  minPrice: number;         // Minimum allowed price
  maxPrice?: number;        // Maximum allowed price (optional)
  
  // Volume Requirements
  minDailyVolume: number;   // Minimum 24h volume in USD (untuk filter)
  
  // Volatility Settings
  maxVolatility?: number;   // Max allowed volatility % (skip trading if exceeded)
  
  // Time Restrictions
  tradingHours?: {
    enabled: boolean;
    windows: Array<{ start: string; end: string }>;
  };
  
  // Strategy Overrides (optional)
  customStrategy?: {
    stopLossPercent?: number;
    takeProfitPercent?: number;
    indicators?: string[];
  };
  
  // Metadata
  addedDate: string;        // Kapan pair ini ditambahkan
  lastUpdated: string;      // Terakhir diupdate
  notes?: string;           // Catatan khusus
}

export interface TradingPair {
  // Basic Info
  symbol: string;           // Trading pair symbol (BTCUSDT, ETHUSDT, etc)
  baseCurrency: string;     // Base currency (BTC, ETH, etc)
  quoteCurrency: string;    // Quote currency (USDT, BUSD, etc)
  
  // Metadata
  metadata: CoinMetadata;
  
  // Settings
  settings: PairSettings;
  
  // Status
  status: 'active' | 'inactive' | 'maintenance' | 'delisted';
  
  // Tags untuk filtering
  tags: string[];           // ['popular', 'high-volume', 'volatile', etc]
}

// ============================================================================
// 🪙 COIN METADATA DATABASE
// ============================================================================

const COIN_METADATA: Record<string, CoinMetadata> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'major',
    marketCap: 'large',
    description: 'The first and largest cryptocurrency by market capitalization',
    website: 'https://bitcoin.org',
  },
  
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'layer1',
    marketCap: 'large',
    description: 'Decentralized platform for smart contracts and dApps',
    website: 'https://ethereum.org',
  },
  
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    category: 'major',
    marketCap: 'large',
    description: 'Binance native token used for trading fee discounts',
    website: 'https://www.binance.com',
  },
  
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    category: 'layer1',
    marketCap: 'large',
    description: 'High-performance blockchain for DeFi and NFTs',
    website: 'https://solana.com',
  },
  
  XRP: {
    symbol: 'XRP',
    name: 'Ripple',
    category: 'major',
    marketCap: 'large',
    description: 'Digital payment protocol for fast cross-border transactions',
    website: 'https://ripple.com',
  },
  
  ADA: {
    symbol: 'ADA',
    name: 'Cardano',
    category: 'layer1',
    marketCap: 'large',
    description: 'Proof-of-stake blockchain platform for smart contracts',
    website: 'https://cardano.org',
  },
  
  DOGE: {
    symbol: 'DOGE',
    name: 'Dogecoin',
    category: 'meme',
    marketCap: 'medium',
    description: 'Meme cryptocurrency with strong community',
    website: 'https://dogecoin.com',
  },
  
  DOT: {
    symbol: 'DOT',
    name: 'Polkadot',
    category: 'layer1',
    marketCap: 'large',
    description: 'Multi-chain network for interoperability',
    website: 'https://polkadot.network',
  },
  
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon',
    category: 'layer2',
    marketCap: 'large',
    description: 'Ethereum scaling solution using sidechains',
    website: 'https://polygon.technology',
  },
  
  LINK: {
    symbol: 'LINK',
    name: 'Chainlink',
    category: 'defi',
    marketCap: 'large',
    description: 'Decentralized oracle network for smart contracts',
    website: 'https://chain.link',
  },
  
  AVAX: {
    symbol: 'AVAX',
    name: 'Avalanche',
    category: 'layer1',
    marketCap: 'large',
    description: 'Fast and scalable blockchain platform',
    website: 'https://www.avax.network',
  },
  
  UNI: {
    symbol: 'UNI',
    name: 'Uniswap',
    category: 'defi',
    marketCap: 'large',
    description: 'Leading decentralized exchange protocol',
    website: 'https://uniswap.org',
  },
  
  LTC: {
    symbol: 'LTC',
    name: 'Litecoin',
    category: 'major',
    marketCap: 'large',
    description: 'Peer-to-peer cryptocurrency, silver to Bitcoin\'s gold',
    website: 'https://litecoin.org',
  },
  
  ATOM: {
    symbol: 'ATOM',
    name: 'Cosmos',
    category: 'layer1',
    marketCap: 'large',
    description: 'Interoperable blockchain ecosystem',
    website: 'https://cosmos.network',
  },
  
  TRX: {
    symbol: 'TRX',
    name: 'TRON',
    category: 'layer1',
    marketCap: 'large',
    description: 'Decentralized platform for content sharing',
    website: 'https://tron.network',
  },
  
  SHIB: {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    category: 'meme',
    marketCap: 'medium',
    description: 'Meme token built on Ethereum',
    website: 'https://shibatoken.com',
  },
  
  APT: {
    symbol: 'APT',
    name: 'Aptos',
    category: 'layer1',
    marketCap: 'medium',
    description: 'High-performance Layer 1 blockchain',
    website: 'https://aptoslabs.com',
  },
  
  ARB: {
    symbol: 'ARB',
    name: 'Arbitrum',
    category: 'layer2',
    marketCap: 'large',
    description: 'Ethereum Layer 2 scaling solution',
    website: 'https://arbitrum.io',
  },
  
  OP: {
    symbol: 'OP',
    name: 'Optimism',
    category: 'layer2',
    marketCap: 'medium',
    description: 'Ethereum Layer 2 optimistic rollup',
    website: 'https://optimism.io',
  },
  
  FIL: {
    symbol: 'FIL',
    name: 'Filecoin',
    category: 'defi',
    marketCap: 'large',
    description: 'Decentralized storage network',
    website: 'https://filecoin.io',
  },
};

// ============================================================================
// ⚙️ DEFAULT PAIR SETTINGS
// ============================================================================

const DEFAULT_PAIR_SETTINGS: PairSettings = {
  enabled: true,
  maxLeverage: 10,
  minLeverage: 1,
  maxPositionSize: 10000,    // $10,000 max per position
  minOrderSize: 10,          // $10 minimum order
  tickSize: 0.01,
  minPrice: 0.00001,
  minDailyVolume: 1000000,   // $1M minimum daily volume
  addedDate: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
};

// ============================================================================
// 🎯 TRADING PAIRS CONFIGURATION
// ============================================================================

export const TRADING_PAIRS: Record<string, TradingPair> = {
  // ========== MAJOR PAIRS (High Volume, Low Risk) ==========
  
  BTCUSDT: {
    symbol: 'BTCUSDT',
    baseCurrency: 'BTC',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.BTC,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 125,        // BTC bisa leverage tinggi
      maxPositionSize: 50000,  // $50k max untuk BTC
      minOrderSize: 10,
      tickSize: 0.1,
      minPrice: 1000,
      minDailyVolume: 10000000000, // $10B minimum
    },
    status: 'active',
    tags: ['major', 'high-volume', 'stable', 'popular'],
  },
  
  ETHUSDT: {
    symbol: 'ETHUSDT',
    baseCurrency: 'ETH',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.ETH,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 100,
      maxPositionSize: 30000,
      minOrderSize: 10,
      tickSize: 0.01,
      minPrice: 100,
      minDailyVolume: 5000000000, // $5B minimum
    },
    status: 'active',
    tags: ['major', 'high-volume', 'stable', 'popular'],
  },
  
  BNBUSDT: {
    symbol: 'BNBUSDT',
    baseCurrency: 'BNB',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.BNB,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 75,
      maxPositionSize: 20000,
      minOrderSize: 10,
      tickSize: 0.01,
      minPrice: 10,
      minDailyVolume: 1000000000, // $1B minimum
    },
    status: 'active',
    tags: ['major', 'high-volume', 'exchange-token'],
  },
  
  // ========== LAYER 1 BLOCKCHAINS ==========
  
  SOLUSDT: {
    symbol: 'SOLUSDT',
    baseCurrency: 'SOL',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.SOL,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.01,
      minPrice: 1,
      minDailyVolume: 500000000, // $500M minimum
      maxVolatility: 10,  // Skip jika volatility > 10%
    },
    status: 'active',
    tags: ['layer1', 'high-volume', 'volatile', 'defi'],
  },
  
  ADAUSDT: {
    symbol: 'ADAUSDT',
    baseCurrency: 'ADA',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.ADA,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.0001,
      minPrice: 0.1,
      minDailyVolume: 300000000,
    },
    status: 'active',
    tags: ['layer1', 'medium-volume', 'stable'],
  },
  
  DOTUSDT: {
    symbol: 'DOTUSDT',
    baseCurrency: 'DOT',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.DOT,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.001,
      minPrice: 1,
      minDailyVolume: 200000000,
    },
    status: 'active',
    tags: ['layer1', 'medium-volume'],
  },
  
  AVAXUSDT: {
    symbol: 'AVAXUSDT',
    baseCurrency: 'AVAX',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.AVAX,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.01,
      minPrice: 1,
      minDailyVolume: 200000000,
    },
    status: 'active',
    tags: ['layer1', 'defi', 'medium-volume'],
  },
  
  ATOMUSDT: {
    symbol: 'ATOMUSDT',
    baseCurrency: 'ATOM',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.ATOM,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 10000,
      minOrderSize: 10,
      tickSize: 0.001,
      minPrice: 1,
      minDailyVolume: 100000000,
    },
    status: 'active',
    tags: ['layer1', 'cosmos', 'medium-volume'],
  },
  
  TRXUSDT: {
    symbol: 'TRXUSDT',
    baseCurrency: 'TRX',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.TRX,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 25,
      maxPositionSize: 10000,
      minOrderSize: 10,
      tickSize: 0.00001,
      minPrice: 0.01,
      minDailyVolume: 200000000,
    },
    status: 'active',
    tags: ['layer1', 'medium-volume'],
  },
  
  APTUSDT: {
    symbol: 'APTUSDT',
    baseCurrency: 'APT',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.APT,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 25,
      maxPositionSize: 10000,
      minOrderSize: 10,
      tickSize: 0.001,
      minPrice: 1,
      minDailyVolume: 100000000,
    },
    status: 'active',
    tags: ['layer1', 'new', 'medium-volume'],
  },
  
  // ========== LAYER 2 SOLUTIONS ==========
  
  MATICUSDT: {
    symbol: 'MATICUSDT',
    baseCurrency: 'MATIC',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.MATIC,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.0001,
      minPrice: 0.1,
      minDailyVolume: 200000000,
    },
    status: 'active',
    tags: ['layer2', 'scaling', 'medium-volume'],
  },
  
  ARBUSDT: {
    symbol: 'ARBUSDT',
    baseCurrency: 'ARB',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.ARB,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 25,
      maxPositionSize: 10000,
      minOrderSize: 10,
      tickSize: 0.0001,
      minPrice: 0.1,
      minDailyVolume: 100000000,
    },
    status: 'active',
    tags: ['layer2', 'ethereum', 'new'],
  },
  
  OPUSDT: {
    symbol: 'OPUSDT',
    baseCurrency: 'OP',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.OP,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 25,
      maxPositionSize: 10000,
      minOrderSize: 10,
      tickSize: 0.001,
      minPrice: 0.5,
      minDailyVolume: 50000000,
    },
    status: 'active',
    tags: ['layer2', 'ethereum', 'optimistic-rollup'],
  },
  
  // ========== DEFI TOKENS ==========
  
  LINKUSDT: {
    symbol: 'LINKUSDT',
    baseCurrency: 'LINK',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.LINK,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.001,
      minPrice: 1,
      minDailyVolume: 200000000,
    },
    status: 'active',
    tags: ['defi', 'oracle', 'medium-volume'],
  },
  
  UNIUSDT: {
    symbol: 'UNIUSDT',
    baseCurrency: 'UNI',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.UNI,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 10000,
      minOrderSize: 10,
      tickSize: 0.001,
      minPrice: 1,
      minDailyVolume: 100000000,
    },
    status: 'active',
    tags: ['defi', 'dex', 'medium-volume'],
  },
  
  FILUSDT: {
    symbol: 'FILUSDT',
    baseCurrency: 'FIL',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.FIL,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 25,
      maxPositionSize: 10000,
      minOrderSize: 10,
      tickSize: 0.001,
      minPrice: 1,
      minDailyVolume: 100000000,
    },
    status: 'active',
    tags: ['defi', 'storage', 'medium-volume'],
  },
  
  // ========== ESTABLISHED ALTCOINS ==========
  
  XRPUSDT: {
    symbol: 'XRPUSDT',
    baseCurrency: 'XRP',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.XRP,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.0001,
      minPrice: 0.1,
      minDailyVolume: 500000000,
    },
    status: 'active',
    tags: ['major', 'payment', 'high-volume'],
  },
  
  LTCUSDT: {
    symbol: 'LTCUSDT',
    baseCurrency: 'LTC',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.LTC,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.01,
      minPrice: 10,
      minDailyVolume: 200000000,
    },
    status: 'active',
    tags: ['major', 'payment', 'medium-volume'],
  },
  
  // ========== MEME COINS (Higher Risk) ==========
  
  DOGEUSDT: {
    symbol: 'DOGEUSDT',
    baseCurrency: 'DOGE',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.DOGE,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 25,          // Lower leverage untuk meme coins
      maxPositionSize: 5000,    // Smaller position size
      minOrderSize: 10,
      tickSize: 0.00001,
      minPrice: 0.01,
      minDailyVolume: 500000000,
      maxVolatility: 15,        // Higher volatility threshold
    },
    status: 'active',
    tags: ['meme', 'volatile', 'high-risk', 'medium-volume'],
  },
  
  SHIBUSDT: {
    symbol: 'SHIBUSDT',
    baseCurrency: 'SHIB',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.SHIB,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: false,           // Disabled by default (too volatile)
      maxLeverage: 10,
      maxPositionSize: 3000,
      minOrderSize: 10,
      tickSize: 0.00000001,
      minPrice: 0.000001,
      minDailyVolume: 200000000,
      maxVolatility: 20,
      notes: 'Extreme volatility - use with caution',
    },
    status: 'inactive',
    tags: ['meme', 'very-volatile', 'high-risk', 'speculative'],
  },
};

// ============================================================================
// 🎯 ALLOWED PAIRS (Quick Reference)
// ============================================================================

/**
 * List of all allowed trading pairs.
 * Hanya pairs yang ada di list ini yang bisa di-trade.
 */
export const ALLOWED_PAIRS = Object.keys(TRADING_PAIRS).filter(
  symbol => TRADING_PAIRS[symbol].status === 'active' && TRADING_PAIRS[symbol].settings.enabled
);

/**
 * List of all pair symbols (including inactive)
 */
export const ALL_PAIRS = Object.keys(TRADING_PAIRS);

/**
 * Pairs grouped by category
 */
export const PAIRS_BY_CATEGORY = {
  major: ALLOWED_PAIRS.filter(s => TRADING_PAIRS[s].metadata.category === 'major'),
  layer1: ALLOWED_PAIRS.filter(s => TRADING_PAIRS[s].metadata.category === 'layer1'),
  layer2: ALLOWED_PAIRS.filter(s => TRADING_PAIRS[s].metadata.category === 'layer2'),
  defi: ALLOWED_PAIRS.filter(s => TRADING_PAIRS[s].metadata.category === 'defi'),
  meme: ALLOWED_PAIRS.filter(s => TRADING_PAIRS[s].metadata.category === 'meme'),
};

/**
 * High volume pairs (for conservative strategies)
 */
export const HIGH_VOLUME_PAIRS = ALLOWED_PAIRS.filter(
  s => TRADING_PAIRS[s].tags.includes('high-volume')
);

/**
 * Volatile pairs (requires higher risk tolerance)
 */
export const VOLATILE_PAIRS = ALLOWED_PAIRS.filter(
  s => TRADING_PAIRS[s].tags.includes('volatile') || TRADING_PAIRS[s].tags.includes('very-volatile')
);

// ============================================================================
// 🔧 HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a trading pair is allowed
 */
export function isPairAllowed(symbol: string): boolean {
  return ALLOWED_PAIRS.includes(symbol.toUpperCase());
}

/**
 * Check if a trading pair exists (even if disabled)
 */
export function pairExists(symbol: string): boolean {
  return ALL_PAIRS.includes(symbol.toUpperCase());
}

/**
 * Get trading pair configuration
 */
export function getPairConfig(symbol: string): TradingPair | null {
  const upperSymbol = symbol.toUpperCase();
  return TRADING_PAIRS[upperSymbol] || null;
}

/**
 * Get pair settings
 */
export function getPairSettings(symbol: string): PairSettings | null {
  const config = getPairConfig(symbol);
  return config?.settings || null;
}

/**
 * Get coin metadata
 */
export function getCoinMetadata(symbol: string): CoinMetadata | null {
  const config = getPairConfig(symbol);
  return config?.metadata || null;
}

/**
 * Validate if pair can be traded
 */
export function validatePair(symbol: string): { 
  valid: boolean; 
  errors: string[]; 
  warnings: string[] 
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if pair exists
  if (!pairExists(symbol)) {
    errors.push(`Trading pair ${symbol} not found in configuration`);
    return { valid: false, errors, warnings };
  }
  
  const config = getPairConfig(symbol);
  if (!config) {
    errors.push(`Failed to load configuration for ${symbol}`);
    return { valid: false, errors, warnings };
  }
  
  // Check if pair is active
  if (config.status !== 'active') {
    errors.push(`Trading pair ${symbol} is ${config.status}`);
  }
  
  // Check if pair is enabled
  if (!config.settings.enabled) {
    errors.push(`Trading pair ${symbol} is disabled`);
  }
  
  // Check for high volatility warning
  if (config.tags.includes('very-volatile')) {
    warnings.push(`${symbol} is extremely volatile - use caution`);
  } else if (config.tags.includes('volatile')) {
    warnings.push(`${symbol} has high volatility`);
  }
  
  // Check for high risk warning
  if (config.tags.includes('high-risk')) {
    warnings.push(`${symbol} is considered high-risk`);
  }
  
  // Check for meme coin
  if (config.metadata.category === 'meme') {
    warnings.push(`${symbol} is a meme coin - highly speculative`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get pairs by filter
 */
export function filterPairs(filter: {
  category?: string;
  tag?: string;
  minVolume?: number;
  maxLeverage?: number;
}): string[] {
  return ALLOWED_PAIRS.filter(symbol => {
    const pair = TRADING_PAIRS[symbol];
    
    if (filter.category && pair.metadata.category !== filter.category) {
      return false;
    }
    
    if (filter.tag && !pair.tags.includes(filter.tag)) {
      return false;
    }
    
    if (filter.minVolume && pair.settings.minDailyVolume < filter.minVolume) {
      return false;
    }
    
    if (filter.maxLeverage && pair.settings.maxLeverage > filter.maxLeverage) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get recommended pairs for strategy
 */
export function getRecommendedPairs(strategyType: 'conservative' | 'balanced' | 'aggressive'): string[] {
  switch (strategyType) {
    case 'conservative':
      // High volume, stable pairs only
      return filterPairs({ 
        tag: 'high-volume',
        minVolume: 1000000000, // $1B+
      });
      
    case 'balanced':
      // Medium to high volume, exclude very volatile
      return ALLOWED_PAIRS.filter(s => 
        !TRADING_PAIRS[s].tags.includes('very-volatile') &&
        !TRADING_PAIRS[s].tags.includes('high-risk')
      );
      
    case 'aggressive':
      // All allowed pairs
      return ALLOWED_PAIRS;
      
    default:
      return HIGH_VOLUME_PAIRS;
  }
}

/**
 * Calculate max position value for a pair
 */
export function getMaxPositionValue(
  symbol: string,
  accountBalance: number,
  positionSizePercent: number
): number {
  const settings = getPairSettings(symbol);
  if (!settings) return 0;
  
  const calculatedSize = (accountBalance * positionSizePercent) / 100;
  return Math.min(calculatedSize, settings.maxPositionSize);
}

/**
 * Get all pairs metadata as array (for UI display)
 */
export function getAllPairsData(): TradingPair[] {
  return ALLOWED_PAIRS.map(symbol => TRADING_PAIRS[symbol]);
}

/**
 * Get a single pair by symbol
 */
export function getPair(symbol: string): TradingPair | undefined {
  return TRADING_PAIRS[symbol];
}

/**
 * Get all enabled pairs
 */
export function getEnabledPairs(): TradingPair[] {
  return ALLOWED_PAIRS.map(symbol => TRADING_PAIRS[symbol]);
}

/**
 * Search pairs by name or symbol
 */
export function searchPairs(query: string): TradingPair[] {
  const lowerQuery = query.toLowerCase();
  return getAllPairsData().filter(pair => 
    pair.symbol.toLowerCase().includes(lowerQuery) ||
    pair.baseCurrency.toLowerCase().includes(lowerQuery) ||
    pair.metadata.name.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// 📊 EXPORT DEFAULT
// ============================================================================

const tradingPairsConfig = {
  TRADING_PAIRS,
  ALLOWED_PAIRS,
  ALL_PAIRS,
  PAIRS_BY_CATEGORY,
  HIGH_VOLUME_PAIRS,
  VOLATILE_PAIRS,
  
  // Helper functions
  getPair,
  getEnabledPairs,
  isPairAllowed,
  pairExists,
  getPairConfig,
  getPairSettings,
  getCoinMetadata,
  validatePair,
  filterPairs,
  getRecommendedPairs,
  getMaxPositionValue,
  getAllPairsData,
  searchPairs,
};

export default tradingPairsConfig;
