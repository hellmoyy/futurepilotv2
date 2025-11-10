# 🗑️ UNUSED ENVIRONMENT VARIABLES

Hasil audit environment variables di `.env` (November 11, 2025)

---

## ❌ **TIDAK DIPAKAI - Aman untuk Dihapus**

### 1. **REDIS_URL**
```bash
REDIS_URL=redis://localhost:6379
```
- **Status:** ❌ Tidak ada referensi di codebase
- **Reason:** Redis tidak digunakan di aplikasi ini
- **Action:** ✅ **HAPUS**

### 2. **QSTASH_URL**
```bash
QSTASH_URL=https://qstash.upstash.io
```
- **Status:** ❌ Tidak ada referensi di codebase
- **Reason:** Upstash QStash tidak digunakan
- **Action:** ✅ **HAPUS**

### 3. **QSTASH_TOKEN**
```bash
QSTASH_TOKEN=eyJVc2VySUQiOi...
```
- **Status:** ❌ Tidak ada referensi di codebase
- **Reason:** Upstash QStash tidak digunakan
- **Action:** ✅ **HAPUS**

### 4. **QSTASH_CURRENT_SIGNING_KEY**
```bash
QSTASH_CURRENT_SIGNING_KEY=sig_6mwe1YUytwo74bdfoy7reEZbMK6i
```
- **Status:** ❌ Tidak ada referensi di codebase
- **Reason:** Upstash QStash tidak digunakan
- **Action:** ✅ **HAPUS**

### 5. **QSTASH_NEXT_SIGNING_KEY**
```bash
QSTASH_NEXT_SIGNING_KEY=sig_7GsKWBnNACR1tYT3UbcCQspp7zpn
```
- **Status:** ❌ Tidak ada referensi di codebase
- **Reason:** Upstash QStash tidak digunakan
- **Action:** ✅ **HAPUS**

### 6. ~~**CRYPTO_NEWS_API_KEY**~~ (KEEP)
```bash
CRYPTO_NEWS_API_KEY=lmrkgq8qw5dkldggrm3dz6vpuy5iudnzt2kmbrmo
```
- **Status:** ⚠️ Duplicate dengan `CRYPTONEWS_API_KEY`
- **Reason:** Tidak dipakai di code, tapi **TETAP SIMPAN** (user request)
- **Action:** ✅ **KEEP** (jangan hapus)

---

## ✅ **DIPAKAI - Harus Tetap Ada**

### Application Settings
- ✅ `NEXT_PUBLIC_APP_NAME` - Dipakai di frontend
- ✅ `NEXT_PUBLIC_APP_URL` - Dipakai di banyak tempat
- ✅ `NEXT_PUBLIC_API_URL` - Dipakai di API calls
- ✅ `NEXTAUTH_URL` - Dipakai di email verification, reset password (5 matches)
- ✅ `NEXTAUTH_SECRET` - Dipakai di JWT authentication (20+ matches)

### Security & Auth
- ✅ `NEXT_PUBLIC_CAPTCHA_ENABLED` - Feature flag
- ✅ `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile
- ✅ `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile
- ✅ `PIN_SIGNAL_CONFIGURATION` - Signal Center protection
- ✅ `JWT_SECRET` - JWT signing
- ✅ `JWT_EXPIRES_IN` - JWT expiration
- ✅ `ENCRYPTION_SECRET_KEY` - Data encryption
- ✅ `ENCRYPTION_SECRET_KEY_LEGACY` - Backward compatibility
- ✅ `CRON_SECRET` - Cron job protection

### API Keys
- ✅ `OPENAI_API_KEY` - OpenAI GPT API
- ✅ `DEEPSEEK_API_KEY` - DeepSeek AI API
- ✅ `MORALIS_API_KEY` - Blockchain API
- ✅ `RESEND_API_KEY` - Email service
- ✅ `CRYPTONEWS_API_KEY` - Crypto news API

### Database & Blockchain
- ✅ `MONGODB_URI` - Database connection
- ✅ `MORALIS_BSC_STREAM_ID` - Deposit detection (BSC)
- ✅ `MORALIS_ETHEREUM_STREAM_ID` - Deposit detection (Ethereum)

### Trading
- ✅ `BINANCE_API_SECRET` - Binance trading
- ✅ `BINANCE_TESTNET` - Network mode flag

### Mainnet Configuration
- ✅ `NETWORK_MODE` - mainnet/testnet
- ✅ `NEXT_PUBLIC_NETWORK_MODE` - Frontend network mode
- ✅ `ETHEREUM_RPC_URL` - Ethereum RPC
- ✅ `BSC_RPC_URL` - BSC RPC
- ✅ `USDT_ERC20_CONTRACT` - USDT contract (Ethereum)
- ✅ `USDT_BEP20_CONTRACT` - USDT contract (BSC)
- ✅ `USDT_ERC20_DECIMAL` - USDT decimals (Ethereum)
- ✅ `USDT_BEP20_DECIMAL` - USDT decimals (BSC)

### Admin
- ✅ `ADMIN_EMAIL` - Admin login
- ✅ `ADMIN_PASSWORD` - Admin password
- ✅ `AUTO_START_SIGNAL_GENERATOR` - Auto-start flag (2 matches)
- ✅ `SIGNAL_GENERATOR_INTERVAL` - Generator interval (1 match)

### Wallets
- ✅ `MASTER_WALLET_ADDRESS` - Custodial wallet
- ✅ `MASTER_WALLET_PRIVATE_KEY` - Wallet private key
- ✅ `NEXT_PUBLIC_MASTER_WALLET_ADDRESS` - Frontend display
- ✅ `COMMISSION_WALLET_ADDRESS` - Commission wallet
- ✅ `COMMISSION_WALLET_PRIVATE_KEY` - Commission private key
- ✅ `NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS` - Frontend display

### Logging
- ✅ `LOG_LEVEL` - Logging level

---

## 📊 **Summary**

| Category | Count |
|----------|-------|
| ❌ **Tidak Dipakai (Hapus)** | **5 variables** |
| ⚠️ **Duplicate (Keep)** | **1 variable** |
| ✅ **Dipakai (Tetap)** | **40+ variables** |

---

## 🧹 **Recommended Cleanup**

**Remove these lines from `.env`:**
```bash
# Remove Redis (not used)
REDIS_URL=redis://localhost:6379

# Remove QStash (not used - all 4 variables)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=eyJVc2VySUQiOi...
QSTASH_CURRENT_SIGNING_KEY=sig_6mwe1YUytwo74bdfoy7reEZbMK6i
QSTASH_NEXT_SIGNING_KEY=sig_7GsKWBnNACR1tYT3UbcCQspp7zpn

# Remove duplicate (keep CRYPTONEWS_API_KEY)
CRYPTO_NEWS_API_KEY=lmrkgq8qw5dkldggrm3dz6vpuy5iudnzt2kmbrmo
```

**Total lines saved:** ~8 lines

---

## ⚠️ **Important Notes**

1. **CRYPTONEWS_API_KEY** is used in:
   - `/src/lib/trading/NewsAnalyzer.ts` (line 101)
   
2. **CRYPTO_NEWS_API_KEY** is a duplicate and NOT used anywhere.

3. **QStash variables** were likely for planned cron jobs but never implemented. Current cron system uses different approach.

4. **REDIS_URL** suggests Redis was planned but never integrated. App works fine without it.

---

**Last Updated:** November 11, 2025
