# 🔧 Commission Wallet Setup Guide

**Last Updated:** November 11, 2025  
**Issue:** Commission wallet shows "Not configured" in production  
**Location:** https://futurepilot.pro/administrator/custodial-wallet

---

## 🔍 Problem Analysis

### Current Situation:
- ✅ Local environment: Commission wallet configured and working
- ❌ Production (Railway): Shows "Not configured"
- ✅ Environment variables exist in `.env` file
- ❌ Environment variables **NOT SET** in Railway dashboard

### Root Cause:
Railway environment variables missing the following **REQUIRED** variables:

```bash
# MISSING in Railway (but present in .env):
NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS=0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a
COMMISSION_WALLET_ADDRESS=0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a
COMMISSION_WALLET_PRIVATE_KEY=18bd2b26cee1aca2e9148fbdca0a6a8e3b4b79d58aca8c063818fb490a89a95c
```

---

## ✅ SOLUTION

### Step 1: Add Environment Variables to Railway

**Login to Railway Dashboard:**
1. Go to: https://railway.app
2. Select project: `futurepilotv2`
3. Click on: **Variables** tab
4. Add the following 3 variables:

**Variable 1: Frontend Display**
```
Key: NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS
Value: 0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a
```

**Variable 2: Backend Operations**
```
Key: COMMISSION_WALLET_ADDRESS
Value: 0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a
```

**Variable 3: Private Key (CRITICAL)**
```
Key: COMMISSION_WALLET_PRIVATE_KEY
Value: 18bd2b26cee1aca2e9148fbdca0a6a8e3b4b79d58aca8c063818fb490a89a95c
```

⚠️ **SECURITY WARNING:**
- **NEVER commit private key to git**
- Only store in Railway dashboard (encrypted)
- Keep backup in secure password manager

### Step 2: Redeploy Application

**Option A: Automatic Redeploy (Recommended)**
```bash
# Railway auto-redeploys when environment variables change
# Wait 2-3 minutes after adding variables
```

**Option B: Manual Redeploy**
```bash
# Railway Dashboard → Deployments → Click "Redeploy"
```

**Option C: Git Push**
```bash
git push origin main  # Triggers auto-deploy
```

### Step 3: Verify in Production

**Test Commission Wallet:**
1. Go to: https://futurepilot.pro/administrator/custodial-wallet
2. Login as admin
3. Check **Commission Wallet** section
4. Should display:
   - ✅ Wallet Address: `0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a`
   - ✅ ETH Balance: (shows balance)
   - ✅ USDT Balance: (shows balance)
   - ✅ Network badge: "🟢 MAINNET"

**If still shows "Not configured":**
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Check Railway logs for errors
4. Verify variables saved correctly

---

## 📋 Complete Environment Variables Checklist

### Commission Wallet (Required):
```bash
# Frontend (client-side display)
NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS=0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a

# Backend (server-side operations)
COMMISSION_WALLET_ADDRESS=0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a
COMMISSION_WALLET_PRIVATE_KEY=18bd2b26cee1aca2e9148fbdca0a6a8e3b4b79d58aca8c063818fb490a89a95c
```

### Master Wallet (Should already be set):
```bash
# Frontend
NEXT_PUBLIC_MASTER_WALLET_ADDRESS=0x2e95ca7db1ba2f68e3cff330a9a55980c7283b0a

# Backend
MASTER_WALLET_ADDRESS=0x2e95ca7db1ba2f68e3cff330a9a55980c7283b0a
MASTER_WALLET_PRIVATE_KEY=775dc93cc0d41ce9fce69d00de9288184769c394f7b50d1f3fbf450822bf2dc3
```

---

## 🔐 Security Best Practices

### DO:
- ✅ Store private keys ONLY in Railway environment variables
- ✅ Use Railway's encrypted variable storage
- ✅ Keep backups in secure password manager (1Password, LastPass, etc.)
- ✅ Limit access to Railway dashboard (admin only)
- ✅ Enable 2FA on Railway account
- ✅ Regularly rotate wallet private keys (every 6-12 months)

### DON'T:
- ❌ Commit private keys to git
- ❌ Share private keys via email/chat
- ❌ Store private keys in plaintext files
- ❌ Use same private key for testnet and mainnet
- ❌ Expose private keys in frontend code
- ❌ Log private keys to console

---

## 🧪 Testing Guide

### 1. Test Commission Wallet Display
```bash
# Visit page
https://futurepilot.pro/administrator/custodial-wallet

# Expected Output:
✅ Commission Wallet section visible
✅ Address: 0xba12c5ad...96f5e6a
✅ ETH Balance: 0.XXXX ETH
✅ USDT Balance: $X.XX
✅ Network: 🟢 MAINNET
```

### 2. Test Balance Fetching
```bash
# Click "Refresh Balance" button
# Expected:
✅ Loading spinner shows
✅ Balance updates after 2-3 seconds
✅ No console errors
✅ ETH and USDT values display correctly
```

### 3. Test Withdrawal API
```bash
# API endpoint (backend only, requires admin auth)
POST /api/admin/process-withdrawal

# Expected:
✅ Commission wallet credentials loaded
✅ USDT transfer executed
✅ Transaction hash returned
✅ Balance deducted
```

### 4. Verify Blockchain Explorer
```bash
# Check wallet on Etherscan
https://etherscan.io/address/0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a

# Verify:
✅ ETH balance > 0 (for gas fees)
✅ USDT balance matches dashboard
✅ Recent transactions visible
```

---

## 🐛 Troubleshooting

### Issue 1: Still shows "Not configured"
**Cause:** Environment variables not loaded  
**Solution:**
1. Verify variables exist in Railway dashboard
2. Redeploy application (Railway → Deployments → Redeploy)
3. Wait 3-5 minutes for deployment to complete
4. Hard refresh browser (Cmd+Shift+R)

### Issue 2: "Commission wallet not configured properly" error
**Cause:** Missing or invalid environment variables  
**Solution:**
1. Check Railway logs: `railway logs`
2. Verify all 3 variables are set:
   - `NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS`
   - `COMMISSION_WALLET_ADDRESS`
   - `COMMISSION_WALLET_PRIVATE_KEY`
3. Ensure values are correct (no extra spaces, quotes, etc.)
4. Redeploy application

### Issue 3: Balance shows $0.00
**Cause:** Wallet might be empty or RPC endpoint issue  
**Solution:**
1. Check wallet on Etherscan: https://etherscan.io/address/0xba12c5ad...
2. Verify RPC endpoint working: `ETHEREUM_RPC_URL`
3. Check console logs for RPC errors
4. Fund wallet if empty:
   - ETH: For gas fees (minimum 0.01 ETH recommended)
   - USDT: For withdrawals

### Issue 4: Private key error
**Cause:** Invalid private key format  
**Solution:**
1. Verify private key is 64 characters (hex, no 0x prefix)
2. Check for extra spaces or newlines
3. Regenerate wallet if private key compromised
4. Update environment variables with new key

---

## 📊 Expected Behavior

### Production (Mainnet):
```
Commission Wallet Display:
├── Address: 0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a
├── Network: 🟢 MAINNET
├── ETH Balance: 0.XXXX ETH (for gas)
├── USDT Balance: $X.XX (from commissions)
└── Status: ✅ Configured
```

### Environment Variables Required:
```bash
# Total: 3 variables
NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS ✅
COMMISSION_WALLET_ADDRESS ✅
COMMISSION_WALLET_PRIVATE_KEY ✅
```

### API Response:
```json
{
  "success": true,
  "address": "0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a",
  "network": "mainnet",
  "ethBalance": "0.0123",
  "usdtBalance": "150.00",
  "rawEthBalance": "12300000000000000",
  "rawUsdtBalance": "150000000"
}
```

---

## 🚀 Quick Setup Script

**Copy-paste into Railway Variables:**

```bash
# 1. NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS
0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a

# 2. COMMISSION_WALLET_ADDRESS
0xba12c5ad901777e2a758f9d6b4573d35a96f5e6a

# 3. COMMISSION_WALLET_PRIVATE_KEY
18bd2b26cee1aca2e9148fbdca0a6a8e3b4b79d58aca8c063818fb490a89a95c
```

**Steps:**
1. Railway Dashboard → Variables
2. Click "New Variable"
3. Paste key and value (3 times, one for each variable)
4. Click "Add" for each
5. Railway auto-redeploys
6. Wait 3 minutes
7. Test: https://futurepilot.pro/administrator/custodial-wallet

---

## ✅ Success Criteria

**Commission wallet configured successfully when:**
- [ ] Address displays in UI (not "Not configured")
- [ ] ETH balance shows (for gas fees)
- [ ] USDT balance shows (commission funds)
- [ ] Network badge shows "🟢 MAINNET"
- [ ] Refresh button works without errors
- [ ] Console has no wallet-related errors
- [ ] API endpoint returns valid balance data

---

## 📝 Notes

**Important:**
- Commission wallet is **SEPARATE** from master wallet
- Master wallet: Holds user deposits (custodial)
- Commission wallet: Receives withdrawal commissions
- Both wallets must have ETH for gas fees

**Wallet Purpose:**
- Used for **referral commission withdrawals** only
- When user withdraws referral earnings:
  1. Backend checks commission wallet credentials
  2. Sends USDT from commission wallet to user address
  3. Deducts gas fees from commission wallet ETH balance

**Funding Requirements:**
- ETH: Minimum 0.01 ETH for gas fees (~$30-50 depending on gas price)
- USDT: Funded by platform revenue (no initial funding needed)

---

**Status:** Ready for Railway deployment  
**Action Required:** Add 3 environment variables to Railway  
**Estimated Time:** 5 minutes setup + 3 minutes deployment = 8 minutes total
