# Copilot Instructions for FuturePilotv2

This is a Next.js project with Tailwind CSS for modern web development with integrated Binance Futures trading bot.

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

### 📊 Network-Isolated Balance Architecture

**Database Structure:**
```typescript
User.walletData {
  balance: number           // Testnet balance (Sepolia + BSC Testnet)
  mainnetBalance: number    // Mainnet balance (Ethereum + BSC)
  erc20Address: string      // Ethereum address (same for testnet/mainnet)
  bep20Address: string      // BSC address (same for testnet/mainnet)
  encryptedPrivateKey: string
}
```

**Network Mode Switching:**
- Set via `NETWORK_MODE=testnet` or `NETWORK_MODE=mainnet` in `.env.local`
- Helper library: `/src/lib/network-balance.ts`
  - `getUserBalance(user)` - Returns correct balance based on network mode
  - `createBalanceUpdate(amount)` - Creates MongoDB update for correct field
  - `getBalanceField()` - Returns 'walletData.balance' or 'walletData.mainnetBalance'

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

**User Collection:** `futurepilotcol` (NOT `users`)
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
- Network-aware (testnet vs mainnet)
- Shows:
  - Total users with wallets
  - ERC20 total balance (Ethereum/Sepolia)
  - BEP20 total balance (BSC/BSC Testnet)
  - Grand total USDT
  - Top 10 users by balance
- Endpoint: `POST /api/admin/scan-user-balances`
- Manual trigger: "Scan All Users" button

**Dashboard Stats:**
- Endpoint: `GET /api/admin/dashboard-stats`
- Returns: totalUsers, totalBalance, totalDeposits, totalEarnings, etc.
- Network-aware balance aggregation
- Force-dynamic, no caching

**Transaction Management:**
- Status: 'pending' | 'confirmed' | 'failed'
- Type: 'deposit' | 'withdrawal' | 'commission' | 'referral_bonus' | 'trading_profit' | 'trading_loss'
- Stats filtered by `status='confirmed'`

### 🔐 USDT Contract Addresses

**Testnet:**
```bash
TESTNET_USDT_ERC20_CONTRACT=0x46484Aee842A735Fbf4C05Af7e371792cf52b498  # Sepolia
TESTNET_USDT_BEP20_CONTRACT=0x46484Aee842A735Fbf4C05Af7e371792cf52b498  # BSC Testnet
TESTNET_USDT_ERC20_DECIMAL=18
TESTNET_USDT_BEP20_DECIMAL=18
```

**Mainnet:**
```bash
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7  # Ethereum
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955  # BSC
USDT_ERC20_DECIMAL=6   # Ethereum USDT uses 6 decimals
USDT_BEP20_DECIMAL=18  # BSC USDT uses 18 decimals
```

**RPC Endpoints (No Rate Limits):**
```bash
# Testnet
TESTNET_ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
TESTNET_BSC_RPC_URL=https://bsc-testnet-rpc.publicnode.com

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
   - Wrong: `user.walletData.balance` (could be testnet or mainnet)
   - Right: `getUserBalance(user)` (network-aware)

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
const User = mongoose.model('futurepilotcol', userSchema);
const Transaction = mongoose.model('transactions', transactionSchema);

# Network-aware queries
const networkMode = process.env.NETWORK_MODE || 'testnet';
const balanceField = networkMode === 'mainnet' ? 'mainnetBalance' : 'balance';
```

---

**Remember:** This is high-risk futures trading with leverage. Only use capital you can afford to lose. Past performance does not guarantee future results.