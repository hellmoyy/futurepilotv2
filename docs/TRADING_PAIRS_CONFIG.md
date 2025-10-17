# 🪙 Trading Pairs Configuration Guide

## 📋 Overview

File `src/config/trading-pairs.ts` adalah **database terpusat** untuk semua trading pairs yang diizinkan di platform.

**Key Features:**
- ✅ Whitelist system - Hanya pairs yang listed bisa di-trade
- ✅ Metadata lengkap untuk setiap coin
- ✅ Per-pair settings (leverage, position size, dll)
- ✅ Categorization (major, layer1, defi, meme, dll)
- ✅ Risk tagging (volatile, high-risk, dll)
- ✅ Built-in validation functions
- ✅ Type-safe dengan TypeScript

---

## 🚀 Quick Start

### Check if Pair is Allowed

```typescript
import TradingPairs from '@/config/trading-pairs';

// Method 1: Check using helper function
if (TradingPairs.isPairAllowed('BTCUSDT')) {
  console.log('✅ BTC/USDT can be traded');
}

// Method 2: Check from allowed list
const allowedPairs = TradingPairs.ALLOWED_PAIRS;
console.log('Allowed pairs:', allowedPairs);
// Output: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', ...]
```

### Get Pair Configuration

```typescript
const btcConfig = TradingPairs.getPairConfig('BTCUSDT');

console.log('Symbol:', btcConfig.symbol);
console.log('Name:', btcConfig.metadata.name);
console.log('Max Leverage:', btcConfig.settings.maxLeverage);
console.log('Category:', btcConfig.metadata.category);
console.log('Tags:', btcConfig.tags);
```

### Validate Pair Before Trading

```typescript
const validation = TradingPairs.validatePair('SHIBUSDT');

if (!validation.valid) {
  console.error('❌ Cannot trade:', validation.errors);
  // Output: ['Trading pair SHIBUSDT is inactive']
}

if (validation.warnings.length > 0) {
  console.warn('⚠️ Warnings:', validation.warnings);
  // Output: ['SHIBUSDT is extremely volatile - use caution']
}
```

---

## 🎯 Pair Categories

### 1️⃣ Major Pairs
**Karakteristik:**
- ✅ Highest volume
- ✅ Most stable
- ✅ Best liquidity
- ✅ Lower risk

**Pairs:**
- BTC/USDT - Bitcoin
- ETH/USDT - Ethereum
- BNB/USDT - Binance Coin
- XRP/USDT - Ripple
- LTC/USDT - Litecoin

**Use Case:** Conservative strategies, large positions

---

### 2️⃣ Layer 1 Blockchains
**Karakteristik:**
- ⚖️ Medium to high volume
- ⚖️ Moderate volatility
- ⚖️ Strong fundamentals

**Pairs:**
- SOL/USDT - Solana
- ADA/USDT - Cardano
- DOT/USDT - Polkadot
- AVAX/USDT - Avalanche
- ATOM/USDT - Cosmos
- TRX/USDT - TRON
- APT/USDT - Aptos

**Use Case:** Balanced strategies, swing trading

---

### 3️⃣ Layer 2 Solutions
**Karakteristik:**
- 📈 Growing volume
- 📈 Good potential
- 📈 Ethereum ecosystem

**Pairs:**
- MATIC/USDT - Polygon
- ARB/USDT - Arbitrum
- OP/USDT - Optimism

**Use Case:** Growth strategies, medium-term holds

---

### 4️⃣ DeFi Tokens
**Karakteristik:**
- 💎 Innovation leaders
- 💎 Protocol tokens
- 💎 Utility value

**Pairs:**
- LINK/USDT - Chainlink (Oracle)
- UNI/USDT - Uniswap (DEX)
- FIL/USDT - Filecoin (Storage)

**Use Case:** Sector rotation, DeFi trends

---

### 5️⃣ Meme Coins ⚠️
**Karakteristik:**
- ⚠️ **EXTREME volatility**
- ⚠️ **High risk**
- ⚠️ **Speculative**
- ⚠️ **Community-driven**

**Pairs:**
- DOGE/USDT - Dogecoin (enabled, lower leverage)
- SHIB/USDT - Shiba Inu (**disabled by default**)

**Use Case:** Aggressive strategies, small positions, **HIGH RISK**

---

## 📊 Pair Settings Explained

### Per-Pair Configuration

```typescript
{
  // Trading Settings
  enabled: true,              // ✅ Can be traded?
  
  // Leverage & Risk
  maxLeverage: 125,           // Max leverage (1-125)
  minLeverage: 1,             // Min leverage
  
  // Position Limits
  maxPositionSize: 50000,     // Max $50k per position
  minOrderSize: 10,           // Min $10 order
  
  // Price Settings
  tickSize: 0.1,              // Price increment
  minPrice: 1000,             // Min allowed price
  
  // Volume Requirements
  minDailyVolume: 10000000000, // $10B minimum daily volume
  
  // Volatility Control
  maxVolatility: 10,          // Skip if volatility > 10%
}
```

### Leverage Tiers

| Pair Category | Max Leverage | Risk Level |
|--------------|--------------|------------|
| BTC/USDT | 125x | Low (High volume) |
| ETH/USDT | 100x | Low |
| Major Altcoins | 50-75x | Medium |
| Layer 1/2 | 25-50x | Medium |
| DeFi Tokens | 25-50x | Medium-High |
| Meme Coins | 10-25x | **Very High** |

---

## 🔧 How to Add New Pair

### Step 1: Add Coin Metadata

```typescript
// File: src/config/trading-pairs.ts
// Line: ~30-40

const COIN_METADATA: Record<string, CoinMetadata> = {
  // ... existing coins
  
  // Add new coin
  NEAR: {
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    category: 'layer1',
    marketCap: 'large',
    description: 'Sharded proof-of-stake blockchain',
    website: 'https://near.org',
  },
};
```

### Step 2: Add Trading Pair

```typescript
// Line: ~200+

export const TRADING_PAIRS: Record<string, TradingPair> = {
  // ... existing pairs
  
  // Add new pair
  NEARUSDT: {
    symbol: 'NEARUSDT',
    baseCurrency: 'NEAR',
    quoteCurrency: 'USDT',
    metadata: COIN_METADATA.NEAR,
    settings: {
      ...DEFAULT_PAIR_SETTINGS,
      enabled: true,
      maxLeverage: 50,
      maxPositionSize: 15000,
      minOrderSize: 10,
      tickSize: 0.01,
      minPrice: 1,
      minDailyVolume: 100000000,
    },
    status: 'active',
    tags: ['layer1', 'medium-volume', 'sharding'],
  },
};
```

### Step 3: Save & Test

```typescript
import TradingPairs from '@/config/trading-pairs';

// Test if pair is now allowed
console.log(TradingPairs.isPairAllowed('NEARUSDT')); // true
console.log(TradingPairs.ALLOWED_PAIRS); // includes 'NEARUSDT'
```

---

## 🚫 How to Disable Pair

### Temporary Disable (Maintenance)

```typescript
BTCUSDT: {
  // ... config
  settings: {
    ...DEFAULT_PAIR_SETTINGS,
    enabled: false,  // ❌ Disable trading
  },
  status: 'maintenance',  // Status indicator
  tags: ['major', 'high-volume'],
},
```

### Permanent Disable (Delisted)

```typescript
LUNAUSDT: {  // Example: Terra Luna
  // ... config
  settings: {
    ...DEFAULT_PAIR_SETTINGS,
    enabled: false,
  },
  status: 'delisted',  // Permanently disabled
  tags: ['delisted', 'historical'],
},
```

---

## 🔍 Helper Functions Usage

### 1. Filter Pairs by Category

```typescript
// Get all Layer 1 pairs
const layer1Pairs = TradingPairs.filterPairs({ 
  category: 'layer1' 
});

console.log(layer1Pairs);
// Output: ['SOLUSDT', 'ADAUSDT', 'DOTUSDT', ...]
```

### 2. Filter by Volume

```typescript
// Get only high-volume pairs (>$1B daily)
const highVolumePairs = TradingPairs.filterPairs({ 
  minVolume: 1000000000 
});

console.log(highVolumePairs);
// Output: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', ...]
```

### 3. Filter by Max Leverage

```typescript
// Get pairs with max leverage <= 25x (safer)
const safePairs = TradingPairs.filterPairs({ 
  maxLeverage: 25 
});

console.log(safePairs);
// Output: ['DOGEUSDT', 'ARBUSDT', 'OPUSDT', ...]
```

### 4. Get Recommended Pairs for Strategy

```typescript
// Conservative strategy
const conservativePairs = TradingPairs.getRecommendedPairs('conservative');
console.log(conservativePairs);
// Output: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'] (High volume only)

// Balanced strategy
const balancedPairs = TradingPairs.getRecommendedPairs('balanced');
console.log(balancedPairs);
// Output: All except very volatile/high-risk pairs

// Aggressive strategy
const aggressivePairs = TradingPairs.getRecommendedPairs('aggressive');
console.log(aggressivePairs);
// Output: All allowed pairs (including volatile)
```

### 5. Calculate Max Position Size

```typescript
const accountBalance = 10000; // $10,000
const positionPercent = 30;   // 30% of balance

const maxPosition = TradingPairs.getMaxPositionValue(
  'BTCUSDT',
  accountBalance,
  positionPercent
);

console.log('Max position:', maxPosition);
// Output: $3,000 (30% of $10k, within BTC's $50k limit)

// For a pair with smaller limit
const maxPositionDoge = TradingPairs.getMaxPositionValue(
  'DOGEUSDT',
  accountBalance,
  positionPercent
);

console.log('Max position DOGE:', maxPositionDoge);
// Output: $3,000 (capped by DOGE's $5k limit)
```

### 6. Search Pairs

```typescript
// Search by symbol
const btcPairs = TradingPairs.searchPairs('btc');
console.log(btcPairs);
// Output: [{ symbol: 'BTCUSDT', ... }]

// Search by name
const ethereumPairs = TradingPairs.searchPairs('ethereum');
console.log(ethereumPairs);
// Output: [{ symbol: 'ETHUSDT', ... }]
```

---

## 🎯 Integration Examples

### Example 1: Validate Before Trading

```typescript
async function executeTrade(symbol: string, action: 'BUY' | 'SELL') {
  // 1. Validate pair
  const validation = TradingPairs.validatePair(symbol);
  
  if (!validation.valid) {
    throw new Error(`Cannot trade ${symbol}: ${validation.errors.join(', ')}`);
  }
  
  // 2. Show warnings
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Trading warnings:', validation.warnings);
  }
  
  // 3. Get pair settings
  const settings = TradingPairs.getPairSettings(symbol);
  
  // 4. Apply settings to order
  const order = {
    symbol,
    action,
    leverage: Math.min(userLeverage, settings.maxLeverage),
    size: Math.min(userSize, settings.maxPositionSize),
    // ... other order params
  };
  
  // 5. Execute order
  await placeOrder(order);
}
```

### Example 2: Dynamic Pair Selection

```typescript
function selectPairsForStrategy(strategyType: string, riskTolerance: string) {
  let pairs: string[];
  
  // Get recommended pairs
  pairs = TradingPairs.getRecommendedPairs(strategyType);
  
  // Apply risk filters
  if (riskTolerance === 'low') {
    // Only high-volume, stable pairs
    pairs = pairs.filter(s => {
      const pair = TradingPairs.getPairConfig(s);
      return pair.tags.includes('high-volume') && 
             !pair.tags.includes('volatile');
    });
  }
  
  // Exclude meme coins if requested
  if (riskTolerance !== 'extreme') {
    pairs = pairs.filter(s => {
      const pair = TradingPairs.getPairConfig(s);
      return pair.metadata.category !== 'meme';
    });
  }
  
  return pairs;
}
```

### Example 3: UI Display with Metadata

```typescript
// In your React component
function TradingPairSelector() {
  const allPairs = TradingPairs.getAllPairsData();
  
  return (
    <div>
      {allPairs.map(pair => (
        <div key={pair.symbol} className="pair-card">
          <h3>{pair.metadata.name} ({pair.symbol})</h3>
          <p>{pair.metadata.description}</p>
          <div className="tags">
            {pair.tags.map(tag => (
              <span key={tag} className={`tag tag-${tag}`}>
                {tag}
              </span>
            ))}
          </div>
          <div className="settings">
            <span>Max Leverage: {pair.settings.maxLeverage}x</span>
            <span>Max Position: ${pair.settings.maxPositionSize.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🛡️ Security & Validation

### Whitelist Enforcement

```typescript
// In your trading engine
async function validateTradeRequest(symbol: string) {
  // CRITICAL: Check whitelist first
  if (!TradingPairs.isPairAllowed(symbol)) {
    throw new Error(`Trading pair ${symbol} is not allowed`);
  }
  
  // Additional validation
  const validation = TradingPairs.validatePair(symbol);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  return true;
}
```

### Automatic Updates

```typescript
// Sync with Binance API (optional)
async function syncPairsWithExchange() {
  const exchangeInfo = await binance.exchangeInfo();
  
  for (const symbol of exchangeInfo.symbols) {
    // Only update if pair exists in our config
    if (TradingPairs.pairExists(symbol.symbol)) {
      const pair = TradingPairs.getPairConfig(symbol.symbol);
      
      // Update live settings (e.g., min order size, tick size)
      pair.settings.minOrderSize = parseFloat(symbol.filters.minNotional);
      pair.settings.tickSize = parseFloat(symbol.filters.tickSize);
    }
  }
}
```

---

## 📝 Best Practices

### ✅ DO

1. **Always validate pairs** before trading
2. **Use helper functions** instead of direct access
3. **Check warnings** and show to users
4. **Respect max leverage** limits per pair
5. **Filter by category** for strategy-specific selection
6. **Update metadata** when adding new pairs

### ❌ DON'T

1. **Don't hardcode pair lists** in multiple places
2. **Don't bypass validation** functions
3. **Don't ignore warnings** (especially for volatile pairs)
4. **Don't exceed max position size** limits
5. **Don't enable meme coins** without risk warnings
6. **Don't trade disabled/delisted** pairs

---

## 🔄 Maintenance

### Weekly Tasks
- Review pair performance
- Check for new listings on Binance
- Update volume thresholds if needed
- Monitor for delistings

### Monthly Tasks
- Review and adjust leverage limits
- Update metadata and descriptions
- Clean up inactive pairs
- Backup configuration

### When to Update
- New coin listing on exchange
- Exchange delisting announcement
- Major protocol upgrades
- Significant volume changes
- Risk profile changes

---

## 📊 Statistics

Current Configuration:
- **Total Pairs Configured:** 23
- **Active Pairs:** 22
- **Inactive Pairs:** 1 (SHIB)
- **Major Pairs:** 5
- **Layer 1:** 8
- **Layer 2:** 3
- **DeFi:** 3
- **Meme Coins:** 2 (1 disabled)

---

## 🆘 Troubleshooting

### Error: "Trading pair not found"
```typescript
// Solution: Check if pair is in config
if (!TradingPairs.pairExists('NEWCOIN')) {
  // Add pair to config first
}
```

### Error: "Trading pair is disabled"
```typescript
// Solution: Enable in config or remove from trading list
const pair = TradingPairs.getPairConfig('SHIBUSDT');
pair.settings.enabled = true;  // Enable if needed
```

### Warning: "Extreme volatility"
```typescript
// This is normal for meme coins
// Either accept the risk or filter them out:
const safePairs = TradingPairs.ALLOWED_PAIRS.filter(s => 
  !TradingPairs.getPairConfig(s).tags.includes('very-volatile')
);
```

---

## 📚 Related Files

- `trading-algorithms.ts` - Strategy configuration
- `src/lib/trading/LiveSignalEngine.ts` - Uses pair validation
- `src/app/api/signals/generate/route.ts` - Pair filtering
- `src/app/dashboard/live-signal/page.tsx` - UI display

---

**Questions or need to add a new pair?** Check the examples above or refer to existing pair configurations! 🚀
