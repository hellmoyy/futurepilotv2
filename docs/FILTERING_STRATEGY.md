# 🔍 Signal Filtering Strategy

## Overview

FuturePilotv2 menggunakan **Hybrid Filtering Approach** yang mengombinasikan server-side dan client-side filtering untuk optimal performance dan user experience.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│  DATABASE (MongoDB)                              │
│  - Contains 1000+ signals (all users)           │
│  - Global signal pool                            │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  SERVER-SIDE FILTER (Heavy Queries)              │
│  ✓ minConfidence (database index)                │
│  ✓ status = 'active' (database index)            │
│  ✓ timeframe                                     │
│  ✓ pagination (limit: 100)                      │
│  ✓ date range                                    │
└──────────────────────────────────────────────────┘
                    ↓ (Returns ~100 signals)
┌──────────────────────────────────────────────────┐
│  CLIENT-SIDE FILTER (Instant UX)                 │
│  ✓ Signal Type (ALL/LONG/SHORT/HOLD)             │
│  ✓ Symbol Search (BTC, ETH, SOL...)              │
│  ✓ Sorting (newest, confidence, symbol)          │
│  ✓ No API call - instant toggle                  │
└──────────────────────────────────────────────────┘
                    ↓ (Display 10-50 signals)
┌──────────────────────────────────────────────────┐
│  USER DISPLAY                                    │
│  - Animated cards with Framer Motion            │
│  - Real-time updates every 30s                   │
└──────────────────────────────────────────────────┘
```

---

## 📊 Filter Types

### 🔴 **SERVER-SIDE FILTERS** (Heavy Database Queries)

**When to use:** 
- Filters that significantly reduce data volume
- Filters that benefit from database indexes
- Filters that rarely change

**Examples:**
```typescript
// ✅ Good for server-side
minConfidence: 50,  // Indexed field, reduces 50% data
status: 'active',   // Indexed, reduces 80% data
timeframe: '15m',   // Specific requirement
limit: 100,         // Pagination
```

**Implementation:**
```typescript
const params = new URLSearchParams({
  limit: '100',
  minConfidence: minConfidence.toString(), // Server filter
  status: 'active',                        // Server filter
});

const response = await fetch(`/api/signals/latest?${params}`);
```

**Triggers API Call When:**
- ✅ minConfidence slider changes
- ✅ refreshInterval timer fires
- ✅ Manual refresh button clicked

---

### 🟢 **CLIENT-SIDE FILTERS** (Instant UX)

**When to use:**
- Filters users toggle frequently
- Filters that don't reduce data significantly
- Filters for instant visual feedback

**Examples:**
```typescript
// ✅ Good for client-side
filter: 'LONG' | 'SHORT' | 'HOLD'  // User toggles frequently
searchTerm: 'BTC'                  // Real-time search
sortBy: 'confidence'               // Instant sort
```

**Implementation:**
```typescript
const filteredSignals = signals
  .filter(signal => {
    // Filter by type (instant toggle, no API call)
    if (filter !== 'ALL' && signal.action !== filter) {
      return false;
    }
    
    // Filter by search term (real-time search)
    if (searchTerm && !signal.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  })
  .sort((a, b) => {
    // Client-side sorting for instant feedback
    switch (sortBy) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'symbol':
        return a.symbol.localeCompare(b.symbol);
      case 'timestamp':
      default:
        return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    }
  });
```

**Does NOT trigger API call when:**
- ❌ Signal Type toggle (LONG/SHORT/HOLD)
- ❌ Symbol search input
- ❌ Sort dropdown changed

---

## 🎯 Decision Tree: Server vs Client

```
┌─────────────────────────────────────┐
│ Does filter reduce data by > 30%?  │
└─────────────────────────────────────┘
         ↓ YES              ↓ NO
┌─────────────────┐  ┌─────────────────┐
│ SERVER-SIDE     │  │ Does user toggle│
│ FILTER          │  │ frequently?     │
└─────────────────┘  └─────────────────┘
                           ↓ YES
                     ┌─────────────────┐
                     │ CLIENT-SIDE     │
                     │ FILTER          │
                     └─────────────────┘
```

**Examples:**

| Filter | Reduction | Frequency | Decision |
|--------|-----------|-----------|----------|
| minConfidence > 50% | 50% | Low | ✅ Server |
| status = 'active' | 80% | Never | ✅ Server |
| action = 'LONG' | 33% | High | 🟡 Client |
| symbol search | 5-10% | High | ✅ Client |
| sortBy | 0% | High | ✅ Client |
| timeframe | 90% | Low | ✅ Server |

---

## 🚀 Performance Benefits

### **Before (All Server-Side):**
```
User clicks LONG → API call (500ms) → Wait → Update UI
User clicks SHORT → API call (500ms) → Wait → Update UI
User searches "BTC" → API call (500ms) → Wait → Update UI
```
**Total: 1500ms+ latency, 3 API calls**

### **After (Hybrid):**
```
Initial load → API call (500ms) → Fetch 100 signals
User clicks LONG → Instant (0ms) → Filter client-side
User clicks SHORT → Instant (0ms) → Filter client-side
User searches "BTC" → Instant (0ms) → Filter client-side
```
**Total: 500ms initial, then 0ms for all toggles**

---

## 📦 Data Flow Example

### **Scenario:** User wants LONG signals with confidence > 70%

1. **Initial Page Load:**
```typescript
// Server fetches (heavy query)
GET /api/signals/latest?limit=100&minConfidence=50&status=active
// Returns 100 signals (all types, confidence 50-100%)
```

2. **User changes minConfidence to 70%:**
```typescript
// Triggers new API call (useEffect dependency)
GET /api/signals/latest?limit=100&minConfidence=70&status=active
// Returns 60 signals (all types, confidence 70-100%)
```

3. **User clicks LONG button:**
```typescript
// Client-side filter (instant, no API call)
const filtered = signals.filter(s => s.action === 'LONG');
// Shows 20 LONG signals instantly
```

4. **User searches "BTC":**
```typescript
// Client-side filter (instant, no API call)
const filtered = signals.filter(s => 
  s.action === 'LONG' && 
  s.symbol.includes('BTC')
);
// Shows 1 BTCUSDT signal instantly
```

---

## 🎨 UI Components

### **Filter Controls:**

```tsx
// Server-side filter (triggers API call)
<input
  type="range"
  value={minConfidence}
  onChange={(e) => setMinConfidence(parseInt(e.target.value))}
/>

// Client-side filter (instant toggle)
<button
  onClick={() => setFilter('LONG')}
>
  LONG
</button>

// Client-side search (real-time)
<input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search BTC, ETH..."
/>

// Client-side sort (instant)
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
>
  <option value="timestamp">Newest First</option>
  <option value="confidence">Highest Confidence</option>
  <option value="symbol">Symbol (A-Z)</option>
</select>
```

---

## 🔄 useEffect Dependencies

```typescript
useEffect(() => {
  fetchSignals(); // Initial fetch
  
  const interval = setInterval(() => {
    fetchSignals(); // Auto-refresh
  }, refreshInterval * 1000);
  
  return () => clearInterval(interval);
}, [
  minConfidence,    // ✅ Triggers API call
  refreshInterval,  // ✅ Changes polling rate
  // filter,        // ❌ Removed - client-side only
  // searchTerm,    // ❌ Not needed - client-side only
  // sortBy,        // ❌ Not needed - client-side only
]);
```

**Why `filter` is NOT in dependencies:**
- User toggles LONG/SHORT frequently
- Would cause unnecessary API calls
- Client-side filtering is instant (0ms)
- Data is already fetched (no need to re-fetch)

---

## 📊 Results Display

```tsx
<div className="text-sm text-gray-600">
  Showing <span className="font-semibold">{filteredSignals.length}</span> of{' '}
  <span className="font-semibold">{signals.length}</span> signals
  
  {searchTerm && (
    <span>• Searching for "{searchTerm}"</span>
  )}
  
  {filter !== 'ALL' && (
    <span>• Filtered by {filter}</span>
  )}
</div>

{/* Clear filters button */}
{(searchTerm || filter !== 'ALL') && (
  <button onClick={() => {
    setSearchTerm('');
    setFilter('ALL');
  }}>
    Clear Filters
  </button>
)}
```

---

## 🎯 Best Practices

### ✅ **DO:**
- Use server-side filters for indexed fields (minConfidence, status)
- Use client-side filters for frequent toggles (LONG/SHORT/HOLD)
- Fetch more data initially (limit: 100) to reduce API calls
- Cache filtered results in state for instant UI updates
- Show clear filter indicators to users

### ❌ **DON'T:**
- Don't put frequently-changed filters in useEffect dependencies
- Don't make API calls for simple toggles
- Don't fetch too little data (causes pagination issues)
- Don't fetch too much data (memory issues)

---

## 🔮 Future Enhancements

### **1. Local Storage Cache**
```typescript
// Cache signals in localStorage
localStorage.setItem('cached_signals', JSON.stringify(signals));
// Load from cache on page load (instant initial render)
```

### **2. Advanced Search**
```typescript
// Multiple symbol search
searchTerm: 'BTC,ETH,SOL'

// Range filters
confidenceRange: [60, 90]

// Multiple conditions
filter: {
  actions: ['LONG', 'SHORT'],
  symbols: ['BTC', 'ETH'],
  minConfidence: 70,
}
```

### **3. Saved Filter Presets**
```typescript
// User saves favorite filters
presets: [
  { name: 'High Confidence Longs', filter: 'LONG', minConfidence: 80 },
  { name: 'Moderate Shorts', filter: 'SHORT', minConfidence: 60 },
]
```

### **4. Real-time Updates (WebSocket)**
```typescript
// Push new signals to client instantly
ws.on('new_signal', (signal) => {
  setSignals(prev => [signal, ...prev]);
});
```

---

## 📚 Related Documentation

- [Live Signal Engine](./LIVE_SIGNAL_ENGINE.md)
- [Trading Algorithms Config](./TRADING_ALGORITHMS_CONFIG.md)
- [Trading Pairs Config](./TRADING_PAIRS_CONFIG.md)

---

**Last Updated:** October 17, 2025
**Version:** 1.0.0
