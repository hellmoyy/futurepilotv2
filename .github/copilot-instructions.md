# Copilot Instructions for FuturePilotv2

This is a Next.js project with Tailwind CSS for modern web development with integrated Binance Futures trading bot.

## 🎯 PLATFORM OVERVIEW

**FuturePilot** adalah platform trading bot otomatis yang terhubung dengan Binance Futures untuk melakukan trading secara otomatis di pasar futures.

### 💡 Core Concept

#### **Gas Fee Balance System:**
- **Minimum Requirement:** User harus memiliki **minimal 10 USDT** gas fee balance untuk dapat trading
- **Monetization Model:** Gas fee balance adalah biaya yang digunakan untuk monetisasi FuturePilot
- **Commission System:** Setiap keuntungan trading, **20% (default, configurable) adalah komisi platform** (FuturePilot)
- **Admin Configurable:** Admin dapat mengatur commission rate di `/administrator/settings` tab "Trading Commission"
- **Auto-Deduction:** Komisi dipotong otomatis dari gas fee balance
- **Trading Restriction:** Jika saldo gas fee < 10 USDT → User **TIDAK BISA TRADING**
- **Auto-Close Protection:** Jika profit mendekati habisnya gas fee balance, bot akan auto-close posisi untuk mencegah gas fee balance minus

**Example:**
```
User A trading dengan gas fee balance: 10 USDT
Profit trading mencapai: 50 USDT
Bot auto-close posisi → Prevent gas fee balance menjadi minus
Komisi platform (20%): 50 USDT × 20% = 10 USDT (dipotong dari gas fee balance)
Remaining gas fee: 10 - 10 = 0 USDT (user harus topup lagi untuk trading)
```

**Important Notes:**
- ✅ FuturePilot **TIDAK punya akses** ke saldo trading user
- ✅ User menyimpan saldo trading di **Binance account mereka masing-masing**
- ✅ Connection via **Binance API Key** (read + trade permission)
- ✅ Gas fee balance **terpisah** dari trading balance

---

## 💰 REFERRAL COMMISSION SYSTEM

### 📊 How It Works

**Referral Commission** adalah komisi yang didapatkan dari mengajak user baru untuk topup gas fee balance.

#### **Commission Flow:**
```
User A (Referrer) mengajak User B
↓
User B deposit gas fee balance: $100
↓
User A mendapat komisi berupa % dari deposit User B
↓
Commission rate ditentukan oleh TIER User A
↓
Komisi masuk ke Available Commission User A
↓
User A bisa withdraw komisi ke wallet
```

#### **Multi-Level System (3 Levels):**
```
User A (You) → Level 1: User B → Level 2: User C → Level 3: User D

Example:
- User B deposit $100 → User A dapat komisi Level 1 (based on User A's tier rate)
- User C deposit $100 → User A dapat komisi Level 2 (based on User A's tier rate)
- User D deposit $100 → User A dapat komisi Level 3 (based on User A's tier rate)

Note: Each referrer gets commission based on THEIR OWN tier rate, not a fixed distribution.
```

#### **Commission Calculation:**
```javascript
// IMPORTANT: Commission calculated from FULL topup amount, not platform fee!

Example 1:
User A (Gold Tier) → User B (Bronze Tier)
User B deposit: $100

User A Commission (Level 1): $100 × 30% (Gold Level 1) = $30.00
User B Gas Fee Balance: $100 (full amount credited)

Example 2:
User A (Gold Tier) → User B (Bronze Tier) → User C
User C deposit: $100

User B Commission (Level 1): $100 × 10% (Bronze Level 1) = $10.00
User A Commission (Level 2): $100 × 5% (Gold Level 2) = $5.00
User C Gas Fee Balance: $100 (full amount credited)

Example 3 (Complete 3-Level):
User A (Gold: 30%, 5%, 5%) → User B (Bronze: 10%, 5%, 5%) → User C → User D
User D deposit: $100

User C Commission (Level 1): $100 × 10% (Bronze Level 1) = $10.00
User B Commission (Level 2): $100 × 5% (Bronze Level 2) = $5.00
User A Commission (Level 3): $100 × 5% (Gold Level 3) = $5.00
User D Gas Fee Balance: $100 (full amount credited)

Total Commissions:
- User A: $30 (from B) + $5 (from C) + $5 (from D) = $40
- User B: $10 (from C) + $5 (from D) = $15
- User C: $10 (from D) = $10
```

### 🎖️ MEMBERSHIP TIER SYSTEM

**Tier ditentukan dari TOTAL DEPOSIT PRIBADI (Personal Topup Gas Fee Balance)**

| Tier | Min Deposit | Max Deposit | Level 1 | Level 2 | Level 3 | Total Rate |
|------|-------------|-------------|---------|---------|---------|------------|
| 🥉 **Bronze** | $0 | $999 | 10% | 5% | 5% | 20% |
| 🥈 **Silver** | $1,000 | $1,999 | 20% | 5% | 5% | 30% |
| 🥇 **Gold** | $2,000 | $9,999 | 30% | 5% | 5% | 40% |
| 💎 **Platinum** | $10,000 | ∞ | 40% | 5% | 5% | 50% |

**Tier Upgrade Logic:**
```typescript
// User saat ini Bronze (total deposit: $500)
// User topup lagi: $600
// Total deposit: $500 + $600 = $1,100
// Auto upgrade to Silver ✅

if (totalPersonalDeposit >= 10000) tier = 'platinum';
else if (totalPersonalDeposit >= 2000) tier = 'gold';
else if (totalPersonalDeposit >= 1000) tier = 'silver';
else tier = 'bronze';
```

**Important:**
- ✅ Tier based on **personal deposit**, bukan dari referral
- ✅ Commission rate bisa di-set di `/administrator/settings` tab "Referral Commission"
- ✅ Tier threshold bisa di-set di `/administrator/settings` (future feature)

---

## 📋 FEATURE STATUS

### ✅ **COMPLETED FEATURES:**

1. **Trading Bot System**
   - ✅ Binance Futures integration dengan API Key
   - ✅ Automated trading dengan proven strategy (675% ROI backtested)
   - ✅ Risk management (2% per trade, 10x leverage)
   - ✅ Dual trailing system (profit + loss)
   - ✅ Emergency exit protection (-2% hard cap)

2. **Gas Fee Balance System**
   - ✅ Custodial wallet (ERC20 + BEP20) - **MAINNET ONLY**
   - ✅ Automatic deposit detection (webhook + cron)
   - ✅ Balance display di sidebar
   - ✅ Top-up page dengan QR code generation
   - ✅ Transaction history
   - ✅ **100% Mainnet - All testnet functionality removed**

3. **Referral System (UI)**
   - ✅ Referral code generation
   - ✅ 3-level referral tracking
   - ✅ Referral stats (Level 1/2/3 count + earnings)
   - ✅ Available Commission display
   - ✅ Total Commission Rate calculation (sum of 3 levels)
   - ✅ Commission structure tab (detailed breakdown)
   - ✅ Membership level card dengan tier info

4. **Admin System**
   - ✅ User management (ban/unban)
   - ✅ Dashboard statistics
   - ✅ Transaction monitoring
   - ✅ Withdrawal approval (referral commissions)
   - ✅ Settings management
     - ✅ Tier-based commission rates
     - ✅ Trading commission percentage
     - ✅ Minimum withdrawal amount

5. **Database & Models**
   - ✅ User model (dengan gasFeeBalance, totalEarnings, totalPersonalDeposit, referralCode, referredBy)
   - ✅ Transaction model (deposit, withdrawal, commission, etc)
   - ✅ Withdrawal model (untuk commission withdrawals)
   - ✅ ReferralCommission model (tracking komisi per level)
   - ✅ Settings model (platform settings)

6. **Referral Commission System** ✅
   - ✅ Commission integrated with gas fee topup
   - ✅ Dynamic rates from Settings (admin configurable)
   - ✅ 3-level commission distribution
   - ✅ Commission calculated from FULL topup amount
   - ✅ Available commission tracking (totalEarnings - totalWithdrawn)
   - ✅ Tier auto-upgrade based on totalPersonalDeposit

### ✅ **TRADING COMMISSION INFRASTRUCTURE (COMPLETE):**

1. **Trading Commission System** ✅
   - ✅ Core library (`/src/lib/tradingCommission.ts`)
     - ✅ `canUserTrade()` - Minimum 10 USDT check
     - ✅ `calculateMaxProfit()` - Calculate profit limits
     - ✅ `shouldAutoClose()` - Auto-close detection
     - ✅ `deductTradingCommission()` - Commission deduction
     - ✅ `getTradingCommissionSummary()` - User statistics
   - ✅ Trading Hooks (`/src/lib/trading/hooks.ts`)
     - ✅ `beforeTrade()` - Pre-trade eligibility check
     - ✅ `onProfitUpdate()` - Periodic auto-close check
     - ✅ `afterTrade()` - Post-trade commission deduction
   - ✅ API Endpoint (`/api/trading/commission`)
     - ✅ POST - Deduct commission
     - ✅ GET - Check eligibility, max profit, summary, auto-close
   - ✅ Admin Dashboard (`/administrator/trading-commissions`)
     - ✅ Total platform revenue statistics
     - ✅ Top 10 users by commission
     - ✅ Transaction history with filters
     - ✅ Export to CSV
   - ✅ User Dashboard Widget (`TradingCommissionWidget`)
     - ✅ Trading limits display
     - ✅ Commission history
     - ✅ Gas fee balance status
     - ✅ **Dark/Light theme support** (Updated Jan 2025)
   - ✅ Admin Sidebar Integration
     - ✅ Trading Commissions link added
     - ✅ Accessible from `/administrator/trading-commissions`
   - ✅ Transaction Model - Added `trading_commission` type with `tradingMetadata`
   - ✅ Documentation:
     - ✅ `/docs/TRADING_COMMISSION_SYSTEM.md` - System architecture
     - ✅ `/docs/TRADING_COMMISSION_TESTING.md` - Testing guide
     - ✅ `/docs/TRADING_COMMISSION_THEME_FIX.md` - Theme support details
     - ✅ `/docs/WEEK1_COMPLETION_SUMMARY.md` - Week 1 deliverables
   - ✅ Testing Script (`/scripts/test-trading-commission.js`)
   - **Status:** ✅ COMPLETE - Ready for bot integration + testing

### ✅ **NEWLY COMPLETED (November 2, 2025):**

1. **Tier Upgrade Notification System** ✅ **COMPLETE**
   - ✅ Email notification saat tier upgrade (Bronze → Silver → Gold → Platinum)
   - ✅ Dashboard alert untuk tier upgrade (NotificationCenter with bell icon)
   - ✅ Commission rate increase notification (old vs new rates)
   - ✅ Professional HTML email template with tier emojis
   - ✅ In-app notification with metadata (old/new tier, rates, total deposit)
   - ✅ Integrated in deposit flow (`/api/user/balance`)
   - ✅ Admin override protection (`tierSetManually` flag)
   - ✅ Automated test script with 4 test cases (100% passing)
   - ✅ Documentation complete (`TIER_UPGRADE_STATUS_REPORT.md`, `TIER_UPGRADE_QUICK_REFERENCE.md`)
   - **Status:** ✅ Production Ready - Fully tested and verified

2. **Enhanced Transaction History UI** ✅ **COMPLETE**
   - ✅ Advanced filters (type, source, status, date range, search)
   - ✅ Export to CSV (all filtered data, Excel-compatible)
   - ✅ Export to PDF (formatted report with statistics)
   - ✅ Pagination (10 items per page, smart navigation)
   - ✅ Real-time statistics (count, total amount)
   - ✅ Active filter badges with reset button
   - ✅ Responsive design (mobile + desktop)
   - ✅ Dark/Light theme support
   - ✅ Reusable component (`EnhancedTransactionHistory.tsx`)
   - ✅ Documentation complete (`ENHANCED_TRANSACTION_HISTORY.md`)
   - **Status:** ✅ Ready for Integration into pages

3. **Trading Notifications System** ✅ **COMPLETE**
   - ✅ Auto-close alert (position closed to prevent negative balance)
   - ✅ Low gas fee warning (balance < $10, cannot trade)
   - ✅ Low balance alert (balance approaching minimum)
   - ✅ Email templates (HTML, professional design, color-coded)
   - ✅ NotificationManager integration (email routing)
   - ✅ EmailService methods (sendTradingAutoClose, sendLowGasFeeWarning)
   - ✅ Multi-channel delivery (email + in-app + toast)
   - ✅ Automated test script with 3 test cases (100% passing)
   - ✅ Documentation complete (`TRADING_NOTIFICATIONS_COMPLETE.md`)
   - **Status:** ✅ Production Ready - Pending bot integration

### ⚠️ **PARTIALLY COMPLETED / NEEDS TESTING:**

1. **Trading Commission Testing** ⚠️
   - ✅ Test script created (6 test cases)
   - ✅ Testing guide documented
   - ✅ UI theme support verified
   - ❌ Manual testing not yet performed
   - ❌ Automated tests (Jest) not implemented
   - **Status:** Ready for testing, pending execution

### ❌ **NOT STARTED / TODO:**

1. **Commission Analytics Dashboard (Optional Enhancement)**
   - ❌ API endpoint for analytics (`/api/commission/analytics`)
   - ❌ Charts and graphs (monthly/daily trends)
   - ❌ Breakdown visualization (by source, type, level)
   - ❌ Growth rate metrics

2. **Trading Bot Integration (High Priority)**
   - ❌ Integrate `beforeTrade()` check (block trading if gas < $10)
   - ❌ Integrate `shouldAutoClose()` in position monitoring
   - ❌ Add balance check cron job (hourly low balance alerts)
   - ❌ Manual testing with real trading scenarios
   - **Note:** Notification system 100% ready, just needs function calls in bot logic

---

## Project Structure
- Next.js 14+ with App Router
- Tailwind CSS for styling  
- TypeScript support
- ESLint configuration
- PostCSS and Autoprefixer
- **Trading Bot:** Binance Futures automated trading system
- **Backtest Engine:** Historical performance validation

## Development Guidelines
- Use functional components with React hooks
- Follow Next.js best practices for routing and data fetching
- Use Tailwind CSS utility classes for styling
- Maintain clean, readable code with proper TypeScript types
- Place components in `src/app/` directory following App Router structure

## Available Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## ⚙️ SIGNAL CENTER CONFIGURATION SYSTEM

### 🎯 Overview

**Configuration System** adalah database-backed system untuk menyimpan dan mengelola parameter trading strategy. Semua komponen (Signal Generator, Backtest Engine, Bot Executor) menggunakan **SATU SUMBER KEBENARAN** dari database.

### 🔗 100% Sinkronisasi

**Principle:** Configuration Tab → Database → All Systems

```
┌─────────────────────────┐
│  Configuration Tab (UI) │  ← Admin edits parameters
└───────────┬─────────────┘
            │ Save
            ▼
┌─────────────────────────┐
│   SignalCenterConfig    │  ← Single source of truth (MongoDB)
│      (Database)         │
└───────────┬─────────────┘
            │ Load active config
            ▼
┌─────────────────────────────────────────────┐
│  ✅ Signal Generator (Live Trading)         │
│  ✅ Backtest Engine (Historical Testing)    │
│  ✅ Bot Executor (Auto Trading)             │
│  ✅ Risk Manager (Position Sizing)          │
└─────────────────────────────────────────────┘
```

**Key Features:**
- ✅ **Real-time Updates:** Edit di UI → Save → Langsung dipakai semua sistem
- ✅ **Multiple Configs:** Support untuk "default", "aggressive", "conservative", dll
- ✅ **Active Config System:** Only 1 config active at a time
- ✅ **Validation:** Min/max ranges untuk semua parameter
- ✅ **Auto-Fallback:** Jika database error, gunakan DEFAULT_CONFIG
- ✅ **Admin Only:** Protected dengan JWT authentication

### 📁 Core Files

#### 1. Database Model: `/src/models/SignalCenterConfig.ts`

**Purpose:** MongoDB schema untuk menyimpan strategy configuration

**Key Fields:**
```typescript
interface ISignalCenterConfig {
  // Identification
  name: string;              // "default", "aggressive", "conservative"
  description?: string;
  isActive: boolean;         // Only one active at a time
  
  // Trading Parameters (20+ fields)
  symbols: string[];         // ['BTCUSDT']
  primaryTimeframe: string;  // '1m'
  confirmationTimeframes: string[]; // ['3m', '5m']
  riskPerTrade: number;      // 0.02 = 2%
  leverage: number;          // 10x
  stopLossPercent: number;   // 0.008 = 0.8%
  takeProfitPercent: number; // 0.008 = 0.8%
  
  // Trailing Stops
  trailProfitActivate: number;  // 0.004 = +0.4%
  trailProfitDistance: number;  // 0.003 = 0.3%
  trailLossActivate: number;    // -0.003 = -0.3%
  trailLossDistance: number;    // 0.002 = 0.2%
  
  // Strategy Filters
  macdMinStrength: number;   // 0.00003
  volumeMin: number;         // 0.8x average
  volumeMax: number;         // 2.0x average
  adxMin: number;            // 20
  adxMax: number;            // 50
  rsiMin: number;            // 35
  rsiMax: number;            // 68
  
  // Confirmation
  entryConfirmationCandles: number; // 2
  marketBiasPeriod: number;  // 100
  biasThreshold: number;     // 0.02 = 2%
  
  // Signal Settings
  signalExpiryMinutes: number; // 5 minutes
  broadcastEnabled: boolean;
  broadcastChannel: string;
}
```

**Static Methods:**
```typescript
// Get active configuration (with auto-create default)
const config = await SignalCenterConfig.getActiveConfig();

// Set config as active (deactivates others)
await SignalCenterConfig.setActiveConfig(configId);
```

**Validation:**
- All numeric fields have min/max validation
- Example: `riskPerTrade: min 0.001, max 0.1` (0.1%-10%)
- Example: `leverage: min 1, max 20`
- Auto-creates default config if none exists

**Location:** `/src/models/SignalCenterConfig.ts` (~280 lines)

---

#### 2. CRUD API: `/src/app/api/signal-center/config/route.ts`

**Purpose:** Admin endpoints untuk manage configurations

**Endpoints:**

**GET /api/signal-center/config**
```typescript
// Get active config
GET /api/signal-center/config
Response: { config: ISignalCenterConfig }

// Get all configs
GET /api/signal-center/config?all=true
Response: { configs: ISignalCenterConfig[] }
```

**POST /api/signal-center/config**
```typescript
// Create new config
POST /api/signal-center/config
Body: { name, description, ...parameters }
Response: { config: ISignalCenterConfig }

// Update existing config
POST /api/signal-center/config?configId=xxx
Body: { ...parameters }
Response: { config: ISignalCenterConfig }
```

**PUT /api/signal-center/config**
```typescript
// Set active config (deactivates others)
PUT /api/signal-center/config
Body: { configId: "xxx" }
Response: { config: ISignalCenterConfig }
```

**DELETE /api/signal-center/config**
```typescript
// Delete config (cannot delete active)
DELETE /api/signal-center/config
Body: { configId: "xxx" }
Response: { success: true }
```

**Security:**
- All endpoints require admin authentication
- Uses `verifyAdminAuth()` from `/src/lib/adminAuth.ts`
- JWT token validation from cookies

**Location:** `/src/app/api/signal-center/config/route.ts` (~244 lines)

---

#### 3. Signal Engine: `/src/lib/signal-center/SignalEngine.ts`

**Purpose:** Core engine untuk generate trading signals

**Database Integration:**

**OLD (Hardcoded):**
```typescript
const engine = new SignalEngine(); // Uses DEFAULT_CONFIG
```

**NEW (Database-backed):**
```typescript
// Load active config from database
const engine = await SignalEngine.createFromDatabase();

// Automatically uses Configuration tab settings
// Falls back to DEFAULT_CONFIG if database error
```

**Static Method:**
```typescript
static async createFromDatabase(): Promise<SignalEngine> {
  try {
    const { SignalCenterConfig } = await import('@/models/SignalCenterConfig');
    const activeConfig = await SignalCenterConfig.getActiveConfig();
    
    if (activeConfig) {
      console.log('✅ SignalEngine loaded config from database:', activeConfig.name);
      return new SignalEngine({
        symbols: activeConfig.symbols,
        riskPerTrade: activeConfig.riskPerTrade,
        leverage: activeConfig.leverage,
        // ... all 20+ parameters
      });
    }
  } catch (error) {
    console.warn('⚠️ Failed to load config from database, using DEFAULT_CONFIG');
  }
  
  return new SignalEngine(); // Fallback
}
```

**Usage in Signal Generator:**
```typescript
// /src/app/api/cron/generate-signals/route.ts

// Before: const engine = new SignalEngine();
const engine = await SignalEngine.createFromDatabase(); // ✅ Uses Configuration tab

const result = await engine.analyze(symbol, candles1m, candles3m, candles5m);
```

**Location:** `/src/lib/signal-center/SignalEngine.ts` (~450 lines)

---

#### 4. Backtest Integration: `/src/app/api/backtest/run/route.ts`

**Purpose:** Run backtest dengan configuration dari database

**Parameters:**
```typescript
POST /api/backtest/run
Body: {
  symbol?: string,
  period?: string,
  useActiveConfig?: boolean,  // ✅ NEW: Use database config
  configId?: string,          // ✅ NEW: Use specific config
  // ... manual parameters (fallback)
}
```

**Logic:**
```typescript
// 1. Load config from database (if useActiveConfig=true)
let config;
if (useActiveConfig) {
  config = await SignalCenterConfig.getActiveConfig();
  console.log('✅ Using active config:', config.name);
}

// 2. Or load specific config by ID
if (configId) {
  config = await SignalCenterConfig.findById(configId);
}

// 3. Build backtest command with all parameters
const command = `node backtest/run-futures-scalper.js 
  --symbol=${config.symbols[0]}
  --period=${period}
  --risk=${config.riskPerTrade}
  --leverage=${config.leverage}
  --sl=${config.stopLossPercent}
  --tp=${config.takeProfitPercent}
  // ... all 20+ parameters
`;

// 4. Execute backtest with spawn()
const backtest = spawn('node', args);

// 5. Return results with config metadata
return {
  success: true,
  results: backtestResults,
  config: {
    id: config._id,
    name: config.name,
    description: config.description,
    isActive: config.isActive,
  }
};
```

**Response Includes:**
- Backtest results (ROI, win rate, trades, etc.)
- Config metadata (which config was used)
- All parameters used in backtest

**Location:** `/src/app/api/backtest/run/route.ts` (~200 lines)

---

### 🔄 Complete Workflow

**1. Admin Edits Configuration:**
```
Admin opens /administrator/signal-center
→ Goes to "Configuration" tab
→ Edits parameters (e.g., leverage 10x → 15x)
→ Clicks "Save Configuration"
→ POST /api/signal-center/config
→ Database updated with new values
```

**2. Backtest Uses Configuration:**
```
Admin clicks "Run Backtest" (in Configuration tab)
→ POST /api/backtest/run with useActiveConfig=true
→ API loads active config from database
→ Backtest script executes with exact parameters
→ Results returned with config metadata
→ Admin sees: "Backtest using config: default (leverage 15x)"
```

**3. Signal Generator Uses Configuration:**
```
Cron job triggers /api/cron/generate-signals
→ SignalEngine.createFromDatabase()
→ Loads active config from database
→ Analyzes market with exact parameters
→ Generates signal with correct risk settings
→ Console: "✅ SignalEngine loaded config: default"
```

**4. Bot Executes Trade:**
```
SignalListener receives signal
→ BotExecutor validates signal
→ Uses same config for position sizing
→ Risk = config.riskPerTrade (2%)
→ Leverage = config.leverage (15x)
→ SL = config.stopLossPercent (0.8%)
→ TP = config.takeProfitPercent (0.8%)
```

**Result: 100% consistency across all systems!**

---

### 🛠️ Usage Examples

**Example 1: Create New Config**
```bash
curl -X POST http://localhost:3000/api/signal-center/config \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=xxx" \
  -d '{
    "name": "aggressive",
    "description": "High risk, high reward strategy",
    "riskPerTrade": 0.05,
    "leverage": 20,
    "stopLossPercent": 0.01,
    "takeProfitPercent": 0.02
  }'
```

**Example 2: Set Active Config**
```bash
curl -X PUT http://localhost:3000/api/signal-center/config \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=xxx" \
  -d '{ "configId": "675xxxxx" }'
```

**Example 3: Run Backtest with Active Config**
```bash
curl -X POST http://localhost:3000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "period": "3m",
    "useActiveConfig": true
  }'
```

**Example 4: Load Config in Code**
```typescript
// In any backend file
import { SignalCenterConfig } from '@/models/SignalCenterConfig';

const config = await SignalCenterConfig.getActiveConfig();
console.log('Current strategy:', config.name);
console.log('Risk per trade:', config.riskPerTrade * 100 + '%');
```

---

### ⚠️ Important Notes

**1. Single Source of Truth:**
- ✅ Database is the ONLY source for configuration
- ❌ Don't hardcode parameters in multiple files
- ❌ Don't use DEFAULT_CONFIG directly (use createFromDatabase())

**2. Error Handling:**
- ✅ Always have fallback to DEFAULT_CONFIG
- ✅ Log when using database vs fallback
- ✅ Validate parameters before use

**3. Testing:**
- ✅ Test with active config
- ✅ Test with specific config by ID
- ✅ Test fallback when database unavailable
- ✅ Verify all 20+ parameters passed correctly

**4. Deployment:**
- ✅ Ensure MongoDB connection in production
- ✅ Create default config on first deploy
- ✅ Backup configs before major changes
- ✅ Monitor config changes in admin logs

---

### 📚 Documentation

**Complete Guide:**
- `/docs/SIGNAL_CENTER_CONFIG_DATABASE.md` - Full documentation
- Includes: API reference, usage examples, testing guide

**Related Files:**
- `/src/models/SignalCenterConfig.ts` - Database model
- `/src/app/api/signal-center/config/route.ts` - CRUD API
- `/src/lib/signal-center/SignalEngine.ts` - Signal generator
- `/src/app/api/backtest/run/route.ts` - Backtest integration
- `/src/app/api/cron/generate-signals/route.ts` - Auto signal generation

---

## 🔐 Environment Variables

**IMPORTANT:** Gunakan **HANYA `.env`** untuk semua environment variables!

### ⚠️ `.env` vs `.env.local` (READ THIS!)

**Problem yang sering terjadi:**
- Ada 2 file environment: `.env` dan `.env.local`
- Sering bingung mana yang dipakai
- PIN tidak berfungsi karena ada di file yang salah
- Script tidak load variable karena salah file

**Solution - Gunakan HANYA `.env`:**

```bash
# ✅ CORRECT: Semua variables di .env
/Users/hap/Documents/CODE-MASTER/futurepilotv2/.env

# ❌ IGNORE: Jangan gunakan .env.local
/Users/hap/Documents/CODE-MASTER/futurepilotv2/.env.local
```

**Kenapa hanya `.env`?**
1. ✅ **Single source of truth** - Tidak ada confusion
2. ✅ **Semua scripts langsung load** - Node.js default load `.env`
3. ✅ **Production ready** - Railway, Vercel baca dari `.env`
4. ✅ **No override issues** - Tidak ada variable yang ketiban

**File Priority (Next.js default):**
```
.env.local         (highest priority, override semua)
↓
.env.development   (only in development)
↓
.env.production    (only in production)
↓
.env               (default, always loaded)
```

**Our Strategy:**
- ❌ **Delete atau ignore** `.env.local` 
- ✅ **Use only** `.env` for all variables
- ✅ Variables langsung ke Production (Railway dashboard)

### 📋 Critical Environment Variables

**Signal Center Configuration PIN:**
```bash
# PIN untuk protect Configuration tab di Signal Center
# PIN: 366984 (6-digit numeric)
# Used in: /api/admin/verify-config-pin
PIN_SIGNAL_CONFIGURATION=366984
```

**Location:**
```
File: /Users/hap/Documents/CODE-MASTER/futurepilotv2/.env
Line: 12
```

**Usage:**
```typescript
// API Route: /src/app/api/admin/verify-config-pin/route.ts
const correctPin = process.env.PIN_SIGNAL_CONFIGURATION; // "366984"

// Frontend: /src/app/administrator/signal-center/page.tsx
const response = await fetch('/api/admin/verify-config-pin', {
  method: 'POST',
  body: JSON.stringify({ pin: userInput })
});
```

**Security:**
- ✅ Only admins can access Configuration tab
- ✅ 5 attempts max, then auto-logout
- ✅ Protects sensitive trading strategy parameters

**Other Important Variables:**
```bash
# Trading Commission (configurable)
# Default: 20% of profit deducted from gas fee balance
# Configurable in: /administrator/settings tab "Trading Commission"

# Binance API (per user, stored in DB)
# All connections are MAINNET ONLY - No testnet support
```

### 🛠️ Troubleshooting Environment Variables

**Problem: "Incorrect PIN" padahal PIN benar**
```bash
# ❌ Wrong: PIN di .env.local, API baca .env
.env.local → PIN_SIGNAL_CONFIGURATION=366984
.env → (tidak ada PIN)
Result: API tidak dapat PIN, selalu return false

# ✅ Correct: PIN di .env
.env → PIN_SIGNAL_CONFIGURATION=366984
Result: API dapat PIN, verification works!
```

**Solution:**
1. Check `.env` (HANYA file ini):
   ```bash
   grep PIN_SIGNAL_CONFIGURATION .env
   # Should return: PIN_SIGNAL_CONFIGURATION=366984
   ```

2. Restart dev server (load new .env):
   ```bash
   # Kill existing server (Ctrl+C)
   npm run dev
   ```

3. Verify API dapat PIN:
   ```bash
   # Check console log when submitting PIN
   # Should see: ✅ Configuration PIN verified for admin: xxx
   # NOT: ❌ PIN_SIGNAL_CONFIGURATION not set in environment variables
   ```

**When to use which file:**
```bash
# Development (local machine)
✅ USE: .env (always)
❌ SKIP: .env.local (causes confusion)

# Production (Railway/Vercel)
✅ USE: Dashboard environment variables (Railway/Vercel UI)
❌ DON'T: Commit .env to git (use .env.example instead)
```

### 📝 Environment Variable Checklist

**Before running app:**
- [ ] `.env` exists di root folder
- [ ] `PIN_SIGNAL_CONFIGURATION=366984` ada di `.env`
- [ ] `NETWORK_MODE=mainnet` (hardcoded, mainnet-only)
- [ ] Restart dev server setelah edit `.env`
- [ ] `.env.local` TIDAK digunakan (untuk avoid confusion)

**Before deploying to production:**
- [ ] Copy `.env` ke `.env.example` (remove sensitive values)
- [ ] Set environment variables di Railway/Vercel dashboard
- [ ] Verify `PIN_SIGNAL_CONFIGURATION` ada di production env
- [ ] Test PIN protection setelah deploy

---

## 🚀 TRADING BOT STRATEGY (PRODUCTION READY)

### 📊 Proven Performance (3 Month Backtest)
```
File: /backtest/run-futures-scalper.js
Status: ✅ PRODUCTION READY
Last Updated: November 2, 2025

Results:
- Initial: $10,000 → Final: $77,529
- ROI: 675% (3 months)
- Win Rate: 80.5%
- Profit Factor: 10.28
```

### ⚙️ Strategy Configuration

#### Core Parameters:
```javascript
INITIAL_BALANCE: 10000        // Minimum $10k recommended
RISK_PER_TRADE: 0.02          // 2% risk per trade
LEVERAGE: 10                   // 10x leverage (balanced)
STOP_LOSS_PCT: 0.008          // 0.8% stop loss
TAKE_PROFIT_PCT: 0.008        // 0.8% take profit
EMERGENCY_EXIT_PCT: 0.02      // -2% hard cap

// Dual Trailing System
TRAIL_PROFIT_ACTIVATE: 0.004  // +0.4% profit activates trailing
TRAIL_PROFIT_DISTANCE: 0.003  // Trail 0.3% below peak
TRAIL_LOSS_ACTIVATE: -0.003   // -0.3% loss activates trailing
TRAIL_LOSS_DISTANCE: 0.002    // Trail 0.2% above lowest
```

#### Triple Timeframe Confirmation:
- **1m + 3m + 5m** must all align
- Market bias detection (100 candles)
- Entry confirmation (2 candles delay)
- Reduces false signals significantly

#### Technical Indicators:
- **EMA:** 9/21 crossover
- **RSI:** 14 period (35-68 range)
- **MACD:** 12/26/9 histogram
- **ADX:** 14 period (20-50 range)
- **Volume:** 0.8-2.0x average filter

#### Dual Trailing System (Advanced Risk Management):

**1. Trailing Profit (Maximize Gains):**
```javascript
// Activation: When profit reaches +0.4%
if (profitPct >= 0.004) {
  trailingProfitActive = true;
  highestProfit = profitPct; // Track peak
}

// Trailing: Exit if drops 0.3% from peak
if (profitPct <= highestProfit - 0.003) {
  exitPosition("TRAILING_PROFIT");
}
```

**Example:**
```
Entry: $68,000
Price moves to $68,300 (+0.44% profit) ✅ Trailing activates
Peak reaches $68,400 (+0.59% profit) → Trail at +0.29%
Price drops to $68,200 (+0.29%) → EXIT with $197 profit
(Instead of waiting for 0.8% TP = $544)
```

**2. Trailing Loss (Cut Losses Early):**
```javascript
// Activation: When loss reaches -0.3%
if (profitPct <= -0.003) {
  trailingLossActive = true;
  lowestLoss = profitPct; // Track lowest point
}

// Trailing: Exit if recovers 0.2% from lowest
if (profitPct >= lowestLoss + 0.002) {
  exitPosition("TRAILING_LOSS");
}
```

**Example:**
```
Entry: $68,000
Price drops to $67,800 (-0.29% loss) → Continue holding
Price drops to $67,750 (-0.37% loss) ✅ Trailing activates
Lowest: $67,700 (-0.44% loss) → Trail at -0.24%
Price recovers to $67,840 (-0.24%) → EXIT with $160 loss
(Instead of waiting for -0.8% SL = $544 loss)
```

**Benefits:**
- ✅ Captures partial profits before reversal
- ✅ Cuts losses before hitting full stop loss
- ✅ Reduces average loss from $200 to ~$160
- ✅ Increases winning trades by 5-10%
- ✅ Improves profit factor significantly

**Statistics Impact:**
```
Without Trailing:
- Avg Win: $200 (at TP)
- Avg Loss: $200 (at SL)
- Win Rate: ~75%

With Trailing:
- Avg Win: $165 (mix of TP + trailing)
- Avg Loss: $160 (mix of SL + trailing)
- Win Rate: ~80% (+5% improvement)
- Profit Factor: +20% improvement
```

#### Risk Management:
- All losses capped at exactly $200 (2% of $10k)
- Dual trailing system (profit + loss)
- Emergency exit at -2% (non-negotiable)
- Margin usage ~25% per trade
- Max 3-4 concurrent positions

### 📈 Performance by Balance

| Balance | Period | ROI | Status |
|---------|--------|-----|--------|
| $1,000 | 3m | -93% | ❌ NOT VIABLE |
| $10,000 | 1m | 79% | ✅ GOOD |
| $10,000 | 2m | 96% | ✅ EXCELLENT |
| $10,000 | 3m | 675% | ✅✅✅ PROVEN |

**Minimum Capital:** $10,000 (proven optimal)

### 🔧 Usage Examples

```bash
# Standard backtest (3 months, $10k)
cd backtest
node run-futures-scalper.js --symbol=BTCUSDT --period=3m

# Custom balance
node run-futures-scalper.js --period=2m --balance=20000

# Monthly analysis with projections
node analyze-monthly.js --symbol=BTCUSDT --balance=10000

# Loss pattern analysis
node analyze-loss-patterns.js results/latest.json
```

### 📁 Key Files

#### Main Strategy:
- `/backtest/run-futures-scalper.js` - Main backtest engine
- `/backtest/PRODUCTION_BACKTEST.md` - Complete documentation
- `/backtest/BinanceDataFetcher.js` - Historical data fetcher

#### Analysis Tools:
- `/backtest/analyze-monthly.js` - Monthly breakdown
- `/backtest/analyze-loss-patterns.js` - Loss analysis
- `/backtest/SMALL_BALANCE_ANALYSIS.md` - $1k testing results
- `/backtest/CONFIG_SMALL_BALANCE.js` - Small balance config

#### Production Code:
- `/src/lib/trading/BitcoinProStrategy.ts` - Live strategy
- `/src/lib/trading/TradingEngine.ts` - Execution engine
- `/src/lib/trading/RiskManager.ts` - Risk controls

### 🎯 Development Workflow

When working on trading bot features:

1. **Backtest First:** Always test in `/backtest/` before touching production
2. **Risk Management:** Never bypass emergency exits or risk limits
3. **Paper Trade:** Test with real market data, no real money first
4. **Gradual Deploy:** Start small ($10k), scale after proven success
5. **Monitor Daily:** Check positions, PnL, and system health

### ⚠️ Important Notes

- **Minimum $10k balance** - Strategy not viable below $5k
- **Leverage 10x** - Don't increase (liquidation risk)
- **Risk 2%** - Don't exceed (capital preservation)
- **Backtest ≠ Real Trading** - Expect 10-20% lower performance
- **Bull market data** - Strategy tested Aug-Oct 2025 (trending up)
- **Always use stop loss** - Emergency exits save capital

### 🚨 Trading Bot Safety Rules

1. ✅ All losses must be capped at 2% max
2. ✅ Emergency exit at -2% is non-negotiable
3. ✅ Max 3-4 positions concurrent
4. ✅ Never override risk management
5. ✅ Always validate parameters before deploy
6. ✅ Paper trade new strategies first
7. ✅ Monitor system health 24/7
8. ✅ Keep audit logs of all trades

### 📊 Expected Real Trading Performance

```
Backtest ROI: 675% (3 months)
Real Trading: 500-600% (adjusted for slippage/fees)
Monthly Target: 80-100% (realistic with compounding)
Maximum Drawdown: <20% (well-managed)
```

**Compounding Effect:**
- Month 1: $10k → $30k (+200%)
- Month 2: $30k → $55k (+83%)
- Month 3: $55k → $77k (+41%)

### 🔗 References

- **Strategy Documentation:** `/backtest/PRODUCTION_BACKTEST.md`
- **Small Balance Analysis:** `/backtest/SMALL_BALANCE_ANALYSIS.md`
- **Cache System:** `/backtest/CACHE_SYSTEM.md`
- **Monthly Analysis Guide:** `/backtest/analyze-monthly.js`

---

## 💰 CUSTODIAL WALLET & BALANCE SYSTEM

### 📊 Mainnet-Only Balance Architecture

**Database Structure:**
```typescript
User.walletData {
  mainnetBalance: number    // Mainnet balance (Ethereum + BSC)
  erc20Address: string      // Ethereum address
  bep20Address: string      // BSC address
  encryptedPrivateKey: string
}
```

**Network Mode:**
- Platform is **MAINNET ONLY** - `NETWORK_MODE=mainnet` (hardcoded)
- Helper library: `/src/lib/network-balance.ts`
  - `getUserBalance(user)` - Returns mainnetBalance
  - `createBalanceUpdate(amount)` - Updates mainnetBalance field
  - `getBalanceField()` - Returns 'walletData.mainnetBalance'

### 🔍 Balance Discrepancy Detection & Resolution

**Issue:** Database balance doesn't match blockchain balance

**Common Causes:**
1. **Manual Credit Duplicates** - Admin manually credited amount that already exists on blockchain
2. **Missing Transactions** - Deposit detection system missed some deposits
3. **Incorrect Amounts** - Transaction recorded with wrong amount
4. **Auto-Detection Gaps** - Webhook/cron missed deposits during downtime

**Diagnostic Scripts:** (in `/scripts/` directory)

```bash
# 1. Check balance discrepancy
node scripts/check-balance-discrepancy.js
# Shows: Database vs Transaction vs Blockchain comparison

# 2. Scan blockchain for all deposits
node scripts/scan-missing-deposit.js
# Lists all Transfer events to user addresses

# 3. Compare blockchain vs database
node scripts/compare-blockchain-db.js
# Side-by-side comparison with missing/extra transactions

# 4. Fix discrepancies
node scripts/cleanup-and-fix-balance.js
# Removes duplicates, adds missing, corrects amounts
```

**Resolution Steps:**

1. **Identify Discrepancy:**
   ```bash
   node scripts/check-balance-discrepancy.js
   ```
   Output shows:
   - Database Balance: $X
   - Transaction Total: $Y
   - Blockchain Total: $Z

2. **Find Root Cause:**
   ```bash
   node scripts/scan-missing-deposit.js
   ```
   Lists all blockchain deposits with TxHash, Amount, Date

3. **Compare & Analyze:**
   ```bash
   node scripts/compare-blockchain-db.js
   ```
   Shows:
   - Missing in Database (deposits not recorded)
   - Manual Credits (fake TxHash like `MANUAL_CREDIT_*`)
   - Extra transactions (not on blockchain)

4. **Fix Issues:**
   ```bash
   node scripts/cleanup-and-fix-balance.js
   ```
   Actions:
   - Delete duplicate manual credits
   - Add missing blockchain transactions
   - Correct wrong amounts
   - Update user balance to match blockchain

**Prevention Tips:**
- ✅ Always check blockchain before manual credit
- ✅ Use deposit detection system (webhook + cron)
- ✅ Verify balance after any manual operation
- ✅ Run weekly balance audits
- ✅ Monitor deposit detection system logs

### 📝 MongoDB Collections

**User Collection:** `futurepilotcols` (NOT `users`)
```javascript
const User = mongoose.model('futurepilotcol', UserSchema);
```

**Transaction Collection:** `transactions`
```javascript
const Transaction = mongoose.model('transactions', TransactionSchema);
```

**Important:** Always use correct collection names in scripts to avoid "0 users found" errors.

### 🛠️ Admin Dashboard Features

**User Accounts Summary (Custodial Wallet Page):**
- Real-time blockchain balance scanning
- Mainnet-only (BSC + Ethereum)
- Shows:
  - Total users with wallets
  - ERC20 total balance (Ethereum Mainnet)
  - BEP20 total balance (BSC Mainnet)
  - Grand total USDT
  - Top 10 users by balance
- Endpoint: `POST /api/admin/scan-user-balances`
- Manual trigger: "Scan All Users" button

**Dashboard Stats:**
- Endpoint: `GET /api/admin/dashboard-stats`
- Returns: totalUsers, totalBalance, totalDeposits, totalEarnings, etc.
- Mainnet balance aggregation only
- Force-dynamic, no caching

**Transaction Management:**
- Status: 'pending' | 'confirmed' | 'failed'
- Type: 'deposit' | 'withdrawal' | 'commission' | 'referral_bonus' | 'trading_profit' | 'trading_loss'
- Stats filtered by `status='confirmed'`

### 🔐 USDT Contract Addresses

**Mainnet:**
```bash
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7  # Ethereum
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955  # BSC
USDT_ERC20_DECIMAL=6   # Ethereum USDT uses 6 decimals
USDT_BEP20_DECIMAL=18  # BSC USDT uses 18 decimals
```

**RPC Endpoints (No Rate Limits):**
```bash
# Mainnet
ETHEREUM_RPC_URL=https://ethereum-rpc.publicnode.com
BSC_RPC_URL=https://bsc-rpc.publicnode.com
```

### ⚠️ Common Pitfalls

1. **❌ Don't use manual credits if deposit already on blockchain**
   - Always check blockchain first: `node scripts/scan-missing-deposit.js`
   - Manual credits should only be used for off-chain adjustments

2. **❌ Don't modify balance directly in MongoDB**
   - Use Transaction records to maintain audit trail
   - Balance should always equal sum of confirmed transactions

3. **❌ Don't forget network mode when querying balances**
   - Always use `getUserBalance()` helper
   - Platform is mainnet-only: `getUserBalance(user)` returns mainnetBalance

4. **❌ Don't use wrong collection names**
   - User collection: `futurepilotcol` (not `users`)
   - Transaction collection: `transactions` (lowercase)

5. **❌ Don't ignore blockchain as source of truth**
   - Database can have errors, blockchain is immutable
   - Always reconcile database with blockchain
   - Run regular audits to detect discrepancies early

### 🧰 Utility Scripts Reference

All scripts in `/scripts/` directory:

**Balance Verification:**
- `check-balance-discrepancy.js` - Full diagnostic report
- `scan-missing-deposit.js` - Scan blockchain for deposits
- `compare-blockchain-db.js` - Side-by-side comparison
- `list-all-users.js` - List all users with balances

**Balance Fixes:**
- `cleanup-and-fix-balance.js` - Auto-fix discrepancies
- `reset-test-user-balance.js` - Reset specific user balance
- `update-user-balance.js` - Manual balance update script

**Transaction Management:**
- `update-transaction-types.js` - Add type field to old transactions
- `delete-test-transactions.js` - Clean up test data
- `manual-credit.js` - Safe manual credit (with verification)

**Debug Tools:**
- `check-user-balances.js` - Detailed balance breakdown
- `find-users-with-balance.js` - Find non-zero balances
- `debug-balance-aggregate.js` - Test MongoDB aggregations

**Usage Pattern:**
```bash
# Always load .env.local for scripts
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

# Use correct collection names
const User = mongoose.model('futurepilotcols', userSchema);
const Transaction = mongoose.model('transactions', transactionSchema);

# Network-aware queries
const networkMode = process.env.NETWORK_MODE || 'testnet';
const balanceField = networkMode === 'mainnet' ? 'mainnetBalance' : 'balance';
```

---

**Remember:** This is high-risk futures trading with leverage. Only use capital you can afford to lose. Past performance does not guarantee future results.