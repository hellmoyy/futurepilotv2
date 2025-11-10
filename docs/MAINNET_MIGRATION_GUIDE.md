# 🚀 MAINNET MIGRATION GUIDE

## ⚠️ MIGRATION COMPLETED - FOR REFERENCE ONLY

**This guide is for HISTORICAL REFERENCE only.** FuturePilot platform has completed migration and now operates **MAINNET ONLY**.

Migration completed on: November 2025
Current status: ✅ Production Mainnet

---

## ARCHIVE: Guide lengkap untuk migrasi FuturePilot dari Testnet ke Mainnet

**Status:** ✅ Environment variables sudah di-set ke mainnet
**Network Mode:** `NETWORK_MODE=mainnet`

---

## ⚠️ CRITICAL CHECKLIST SEBELUM GO LIVE

### 1. ✅ Environment Variables (.env)

**Sudah Di-set:**
- ✅ `NETWORK_MODE=mainnet`
- ✅ `NEXT_PUBLIC_NETWORK_MODE=mainnet`
- ✅ `BINANCE_TESTNET=false`
- ✅ Mainnet RPC URLs (Ethereum & BSC)
- ✅ Mainnet USDT Contracts
- ✅ Master Wallet (Custodial)
- ✅ Commission Wallet

**Perlu Action:**
```bash
# Moralis Stream IDs - Setup di Moralis Dashboard
MORALIS_BSC_STREAM_ID=YOUR_BSC_MAINNET_STREAM_ID_HERE
MORALIS_ETHEREUM_STREAM_ID=YOUR_ETHEREUM_MAINNET_STREAM_ID_HERE
```

---

## 📋 LANGKAH-LANGKAH MIGRASI

### **STEP 1: Setup Moralis Mainnet Streams**

**Tujuan:** Detect deposits USDT di mainnet (Ethereum & BSC)

**Actions:**

1. **Login ke Moralis Dashboard:** https://admin.moralis.io/streams

2. **Create BSC Mainnet Stream:**
   ```
   Network: BSC Mainnet (56)
   Contract Address: 0x55d398326f99059fF775485246999027B3197955 (USDT BEP20)
   Topic0: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef (Transfer event)
   Webhook URL: https://futurepilot.pro/api/webhooks/moralis
   Include Internal TXs: ✅ Yes
   Tag: bsc-mainnet-usdt
   ```

3. **Create Ethereum Mainnet Stream:**
   ```
   Network: Ethereum Mainnet (1)
   Contract Address: 0xdAC17F958D2ee523a2206206994597C13D831ec7 (USDT ERC20)
   Topic0: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef (Transfer event)
   Webhook URL: https://futurepilot.pro/api/webhooks/moralis
   Include Internal TXs: ✅ Yes
   Tag: ethereum-mainnet-usdt
   ```

4. **Copy Stream IDs ke .env:**
   ```bash
   MORALIS_BSC_STREAM_ID=xxx-xxx-xxx-xxx-xxx
   MORALIS_ETHEREUM_STREAM_ID=xxx-xxx-xxx-xxx-xxx
   ```

---

### **STEP 2: Verify Wallet Configuration**

**Master Wallet (Custodial):**
```bash
Address: 0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1
Private Key: 0x910e028f1d935e8772b5f8329911e867f3ae65582b56ba31a796ea52f8fa6819
```

**⚠️ IMPORTANT CHECKS:**

1. **Check Balance (Ethereum):**
   ```bash
   # Visit Etherscan
   https://etherscan.io/address/0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1
   
   # Ensure wallet has ETH for gas fees
   # Recommended: At least 0.1 ETH
   ```

2. **Check Balance (BSC):**
   ```bash
   # Visit BSCScan
   https://bscscan.com/address/0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1
   
   # Ensure wallet has BNB for gas fees
   # Recommended: At least 0.1 BNB
   ```

3. **Test Wallet Access:**
   ```bash
   # Test script untuk verify private key bisa sign transactions
   node scripts/test-wallet-mainnet.js
   ```

---

### **STEP 3: Commission Wallet Setup**

**Commission Wallet:**
```bash
Address: 0xb287ee45007FF96D6CFF2EFb5cFa04c2eF0eE293
Private Key: 0x976d2a4f7c2707cdad9de42ad9788cb8ab33ccc4c5d17414417f8410c9571bad
```

**Purpose:** Menerima komisi dari gas fee balance users

**Public Display Address:**
```bash
NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS=0xeF4658A3d595BC8934736A6c73f64290b63D0A45
```

**⚠️ NOTE:** Address yang ditampilkan di frontend berbeda dengan wallet penerima komisi (untuk security)

---

### **STEP 4: Database Migration**

**⚠️ CRITICAL:** Testnet balance ≠ Mainnet balance!

**Options:**

**Option 1: Reset All Balances (Recommended)**
```bash
# Script untuk reset semua user balances ke 0
node scripts/reset-all-balances-mainnet.js

# Set semua users:
# - walletData.balance = 0 (testnet)
# - walletData.mainnetBalance = 0
```

**Option 2: Migrate Testnet Balances**
```bash
# Jika ingin give credit untuk early users
node scripts/migrate-testnet-to-mainnet.js

# Copy testnet balance → mainnetBalance
# ⚠️ Hanya jika Anda berkomitmen untuk honor testnet balances!
```

**Recommended:** Option 1 - Start fresh di mainnet

---

### **STEP 5: Update Deposit Detection System**

**File:** `/src/app/api/webhooks/moralis/route.ts`

**Current Code:**
```typescript
// Check network mode
const networkMode = process.env.NETWORK_MODE || 'testnet';
const balanceField = networkMode === 'mainnet' 
  ? 'walletData.mainnetBalance' 
  : 'walletData.balance';
```

**✅ Already Configured!** Network mode otomatis detect dari env variable.

**Test Webhook:**
```bash
# Send test webhook dari Moralis Dashboard
# Verify bahwa deposit ter-detect dan update mainnetBalance
```

---

### **STEP 6: Update Frontend Display**

**File:** `/src/components/Sidebar.tsx` (atau balance display component)

**Verify:**
```typescript
// Ensure frontend reads correct balance field
const balance = networkMode === 'mainnet' 
  ? user.walletData.mainnetBalance 
  : user.walletData.balance;
```

**✅ Already using network-aware helper:** `getUserBalance(user)` from `/src/lib/network-balance.ts`

---

### **STEP 7: Test Deposit Flow (Mainnet)**

**Test Case 1: Ethereum Deposit**
```bash
1. User login → Dashboard → Top-up
2. Display QR Code untuk Master Wallet (Ethereum):
   0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1
3. Send USDT (Ethereum) ke address tersebut
4. Wait for Moralis webhook trigger
5. Verify mainnetBalance bertambah di database
6. Verify balance display di sidebar updated
```

**Test Case 2: BSC Deposit**
```bash
1. User login → Dashboard → Top-up → Select "BSC Network"
2. Display QR Code untuk Master Wallet (BSC):
   0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1
3. Send USDT (BSC) ke address tersebut
4. Wait for Moralis webhook trigger
5. Verify mainnetBalance bertambah
6. Verify balance display updated
```

---

### **STEP 8: Test Commission System**

**Test Trading Commission:**
```bash
1. User melakukan trading (profit $100)
2. Bot auto-close position
3. Commission (20%) = $20 dipotong dari mainnetBalance
4. Verify mainnetBalance berkurang $20
5. Verify transaction type = 'trading_commission' tercatat
```

**Test Referral Commission:**
```bash
1. User A refer User B
2. User B topup $100 mainnet USDT
3. User A dapat komisi (sesuai tier)
4. Verify totalEarnings User A bertambah
5. Verify available commission correct
```

---

### **STEP 9: Test Withdrawal System**

**Commission Withdrawal:**
```bash
1. User request withdrawal dari available commission
2. Verify withdrawal request tercatat
3. Admin approve withdrawal
4. System transfer USDT dari Master Wallet ke user wallet
5. Verify totalWithdrawn updated
6. Verify transaction recorded
```

**⚠️ IMPORTANT:** Mainnet withdrawal = Real money! Test dengan amount kecil dulu.

---

### **STEP 10: Update Railway Environment Variables**

**Railway Dashboard:** https://railway.app

**Set Environment Variables:**
```bash
NETWORK_MODE=mainnet
NEXT_PUBLIC_NETWORK_MODE=mainnet
BINANCE_TESTNET=false

# Moralis Stream IDs
MORALIS_BSC_STREAM_ID=xxx
MORALIS_ETHEREUM_STREAM_ID=xxx

# Master Wallet
MASTER_WALLET_ADDRESS=0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1
MASTER_WALLET_PRIVATE_KEY=0x910e028f1d935e8772b5f8329911e867f3ae65582b56ba31a796ea52f8fa6819

# Commission Wallet
COMMISSION_WALLET_ADDRESS=0xb287ee45007FF96D6CFF2EFb5cFa04c2eF0eE293
COMMISSION_WALLET_PRIVATE_KEY=0x976d2a4f7c2707cdad9de42ad9788cb8ab33ccc4c5d17414417f8410c9571bad

# RPC URLs
ETHEREUM_RPC_URL=https://ethereum.publicnode.com
BSC_RPC_URL=https://1rpc.io/bnb

# USDT Contracts
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955
USDT_ERC20_DECIMAL=6
USDT_BEP20_DECIMAL=18
```

**Redeploy:**
```bash
git push origin main
# Railway auto-deploy with new env variables
```

---

## 🧪 TESTING CHECKLIST

### Pre-Launch Testing:

- [ ] **Wallet Access**
  - [ ] Master wallet dapat sign transactions (Ethereum)
  - [ ] Master wallet dapat sign transactions (BSC)
  - [ ] Commission wallet accessible
  - [ ] Gas fees sufficient (ETH & BNB)

- [ ] **Deposit Detection**
  - [ ] Moralis stream aktif (BSC Mainnet)
  - [ ] Moralis stream aktif (Ethereum Mainnet)
  - [ ] Webhook URL correct: `https://futurepilot.pro/api/webhooks/moralis`
  - [ ] Test deposit $1 USDT (Ethereum) → Balance updated
  - [ ] Test deposit $1 USDT (BSC) → Balance updated

- [ ] **Balance Display**
  - [ ] Sidebar shows correct mainnetBalance
  - [ ] Top-up page shows correct QR code (mainnet address)
  - [ ] Transaction history shows mainnet deposits

- [ ] **Trading Commission**
  - [ ] Trading profit deducts commission from mainnetBalance
  - [ ] Commission rate configurable (default 20%)
  - [ ] Auto-close when mainnet balance low

- [ ] **Referral Commission**
  - [ ] Referral deposit triggers commission calculation
  - [ ] Commission based on referrer tier
  - [ ] Commission credited to totalEarnings

- [ ] **Withdrawal System**
  - [ ] Withdrawal request creates pending record
  - [ ] Admin can approve/reject
  - [ ] Approved withdrawal transfers USDT from master wallet
  - [ ] Transaction recorded correctly

---

## 🚨 ROLLBACK PLAN

Jika ada masalah critical di mainnet:

### Rollback ke Testnet:

**1. Update Environment Variables:**
```bash
NETWORK_MODE=testnet
NEXT_PUBLIC_NETWORK_MODE=testnet
BINANCE_TESTNET=true
```

**2. Redeploy:**
```bash
git push origin main
```

**3. Notify Users:**
- Email blast: "System maintenance, temporarily using testnet"
- Banner di dashboard: "⚠️ Testing mode - Balances will be reset"

**4. No Data Loss:**
- Testnet balance masih intact di `walletData.balance`
- Mainnet balance tersimpan di `walletData.mainnetBalance`
- Rollback tidak menghilangkan data

---

## 📊 MONITORING POST-LAUNCH

### Critical Metrics to Monitor:

**1. Deposit Detection Rate:**
```bash
# Check every hour
node scripts/check-deposit-detection-rate.js

# Expected: >95% success rate
# If <90%: Check Moralis stream status
```

**2. Balance Accuracy:**
```bash
# Daily audit
node scripts/audit-mainnet-balances.js

# Compare:
# - Database mainnetBalance
# - Sum of transactions
# - Blockchain balance (Master Wallet)
```

**3. Commission Deductions:**
```bash
# Weekly report
node scripts/report-commission-mainnet.js

# Verify:
# - Total trading commissions
# - Total referral commissions
# - Commission wallet balance matches
```

**4. Withdrawal Processing:**
```bash
# Daily check
node scripts/check-pending-withdrawals.js

# Alert if:
# - Pending >24 hours
# - Master wallet balance insufficient
```

---

## 🔒 SECURITY RECOMMENDATIONS

### Wallet Security:

1. **Master Wallet Private Key:**
   - ✅ Already stored in .env (not in code)
   - ✅ .env in .gitignore
   - ⚠️ Backup private key di secure location (KeePass, 1Password)
   - ⚠️ Consider using hardware wallet for large amounts

2. **Commission Wallet:**
   - Regular withdrawals ke cold storage
   - Max balance: $10,000 di commission wallet
   - Transfer excess ke secure wallet weekly

3. **Environment Variables:**
   - Never commit .env to git
   - Use Railway secrets (encrypted)
   - Rotate API keys quarterly

### Access Control:

1. **Admin Access:**
   - 2FA enabled untuk admin accounts
   - IP whitelist untuk admin endpoints
   - Audit log untuk semua admin actions

2. **API Rate Limiting:**
   - Withdrawal API: 1 request per minute
   - Deposit webhook: Verify Moralis signature
   - Trading API: Rate limit per user

---

## 📞 EMERGENCY CONTACTS

**If Critical Issue:**

1. **Pause Deposits:**
   ```bash
   # Disable Moralis streams temporarily
   # Stop deposit detection cron
   ```

2. **Pause Withdrawals:**
   ```bash
   # Set WITHDRAWALS_ENABLED=false in Railway
   # Redeploy
   ```

3. **Notify Team:**
   - Admin: admin@futurepilot.pro
   - Developer: (your email)

---

## ✅ FINAL CHECKLIST BEFORE GO-LIVE

- [ ] All environment variables set di Railway
- [ ] Moralis mainnet streams configured
- [ ] Master wallet has gas fees (ETH & BNB)
- [ ] Commission wallet accessible
- [ ] Test deposits verified (Ethereum & BSC)
- [ ] Balance display correct
- [ ] Commission system tested
- [ ] Withdrawal system tested
- [ ] User balances reset (or migrated)
- [ ] Monitoring scripts setup
- [ ] Backup plan documented
- [ ] Team notified
- [ ] User announcement prepared

---

## 🎉 POST-LAUNCH

**Day 1:**
- Monitor deposits closely (every hour)
- Test commission deductions
- Verify withdrawal processing

**Week 1:**
- Daily balance audits
- User feedback collection
- Performance monitoring

**Month 1:**
- Review commission rates
- Optimize deposit detection
- Scale master wallet balance if needed

---

**Good luck with mainnet launch! 🚀**
