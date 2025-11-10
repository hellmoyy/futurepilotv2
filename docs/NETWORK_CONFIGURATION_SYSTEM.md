# 🌐 Network Configuration System

## 📋 Overview

Sistem network configuration yang terpusat untuk **semua module** yang berinteraksi dengan blockchain. **Platform ini HANYA mendukung MAINNET** - tidak ada testnet support.

---

## 🎯 Supported Networks

### Mainnet Only
1. **BSC Mainnet** (BNB Smart Chain)
   - Chain ID: `56`
   - Moralis ID: `0x38`
   - Explorer: https://bscscan.com
   - USDT Contract: `0x55d398326f99059fF775485246999027B3197955`

2. **Ethereum Mainnet**
   - Chain ID: `1`
   - Moralis ID: `0x1`
   - Explorer: https://etherscan.io
   - USDT Contract: `0xdAC17F958D2ee523a2206206994597C13D831ec7`

---

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Network Mode (MAINNET ONLY)
NETWORK_MODE=mainnet
NEXT_PUBLIC_NETWORK_MODE=mainnet

########## MAINNET RPC URLs ##########
ETHEREUM_RPC_URL=https://ethereum.publicnode.com
BSC_RPC_URL=https://1rpc.io/bnb

# USDT Contract Addresses Mainnet
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955
########################################
```

---

## 🚀 Usage Examples

### 1. Import Network Helper

```typescript
import { 
  getNetworkMode, 
  getAvailableNetworks,
  getNetworkConfig,
  isNetworkAvailable,
  AVAILABLE_NETWORKS 
} from '@/lib/networkConfig';
```

### 2. Get Current Network Mode

```typescript
const mode = getNetworkMode(); // Always returns 'mainnet'
console.log('Current mode:', mode);
```

### 3. Get Available Networks

```typescript
const networks = getAvailableNetworks();
// Always returns: [BSC_MAINNET, ETHEREUM_MAINNET]
```

### 4. Validate Network

```typescript
const isValid = isNetworkAvailable('BSC_MAINNET'); // Always true
const isValidTestnet = isNetworkAvailable('BSC_TESTNET'); // Always false - no testnet support
```

### 5. Get Network Details

```typescript
const config = getNetworkConfig('BSC_MAINNET');
console.log(config.name); // "BNB Smart Chain Mainnet"
console.log(config.chainId); // 56
console.log(config.explorerUrl); // "https://bscscan.com"
console.log(config.usdtContract); // "0x55d398326f99059fF775485246999027B3197955"
```

### 6. React Component Usage

```typescript
'use client';

import { useNetworkMode, getAvailableNetworks } from '@/lib/networkConfig';

export default function MyComponent() {
  const networkMode = useNetworkMode(); // Always 'mainnet'
  const networks = getAvailableNetworks(); // [BSC_MAINNET, ETHEREUM_MAINNET]

  return (
    <select>
      {networks.map(network => (
        <option key={network.key} value={network.key}>
          {network.name}
        </option>
      ))}
    </select>
  );
}
```

### 7. API Endpoint Usage

```typescript
import { getAvailableNetworkKeys, getNetworkConfig } from '@/lib/networkConfig';

export async function POST(request: NextRequest) {
  const { network } = await request.json();
  
  // Validate network (mainnet only)
  const availableNetworks = getAvailableNetworkKeys(); // ['BSC_MAINNET', 'ETHEREUM_MAINNET']
  if (!availableNetworks.includes(network)) {
    return NextResponse.json(
      { 
        error: 'Invalid network - only mainnet supported',
        availableNetworks 
      },
      { status: 400 }
    );
  }
  
  // Get network config
  const config = getNetworkConfig(network);
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  // ... proceed with blockchain interaction
}
```

---

## 📦 Affected Modules

All modules that interact with blockchain now use centralized network config:

### ✅ Updated Modules:

1. **Custodial Wallet** (`/src/app/administrator/custodial-wallet/`)
   - Sweep wallets UI
   - Network selector (filtered by mode)
   - Master wallet balance check

2. **Sweep Wallets API** (`/src/app/api/admin/sweep-wallets/`)
   - Network validation
   - 4 networks support
   - Explorer URL generation

3. **Master Wallet Balance API** (`/src/app/api/admin/master-wallet-balance/`)
   - Network validation
   - USDT balance check
   - Explorer URL response

4. **Topup Page** (`/src/app/topup/`)
   - Network detection (Mainnet/Testnet badge)
   - Uses NETWORK_MODE env

5. **Master Wallet Config** (`/src/lib/masterWallet.ts`)
   - 4 networks configuration
   - Helper functions

6. **Network Config Helper** (`/src/lib/networkConfig.ts`) ⭐ NEW
   - Centralized configuration
   - Type-safe network keys
   - Utility functions

### 🔄 Modules to Update (Future):

- [ ] Wallet generation (`/src/app/api/wallet/generate/`)
- [ ] Deposit monitoring (`/src/app/api/cron/monitor-deposits/`)
- [ ] Moralis webhook (`/src/app/api/webhook/moralis/`)
- [ ] Transaction history
- [ ] Withdrawal processing

---

## 🔧 How It Works

### Mainnet-Only Mode:

```
NETWORK_MODE=mainnet (hardcoded)
  ↓
getNetworkMode() returns 'mainnet'
  ↓
getAvailableNetworks() returns [BSC_MAINNET, ETHEREUM_MAINNET]
  ↓
Only mainnet networks shown in UI
  ↓
API validates: Only mainnet networks accepted
```

### Network Validation Flow:

```typescript
// 1. User selects network in UI
selectedNetwork = 'BSC_MAINNET'

// 2. API receives request
POST /api/admin/sweep-wallets
body: { network: 'BSC_MAINNET' }

// 3. API validates network
const availableNetworks = getAvailableNetworkKeys(); // ['BSC_MAINNET', 'ETHEREUM_MAINNET']
if (availableNetworks.includes('BSC_MAINNET')) {
  // ✅ ALLOWED - proceed with sweep
}

// 4. Testnet requests are rejected
if (!availableNetworks.includes('BSC_TESTNET')) {
  return { error: 'Testnet not supported' }; // ❌ REJECTED
}
```

---

## 🎨 UI Implementation

### Network Selector (Mainnet Only):

```typescript
<select value={selectedNetwork} onChange={handleChange}>
  <option value="BSC_MAINNET">🟢 BSC Mainnet</option>
  <option value="ETHEREUM_MAINNET">🔷 Ethereum Mainnet</option>
</select>
```

### Network Badge:

```typescript
<div className="badge-green">
  🟢 Mainnet
</div>
```

---

## 🧪 Testing

### Production Environment:

```bash
# .env
NETWORK_MODE=mainnet
NEXT_PUBLIC_NETWORK_MODE=mainnet

# Start server
npm run dev

# Access admin panel
http://localhost:3000/administrator/custodial-wallet

# Only BSC Mainnet and Ethereum Mainnet will show
```

---

## 📊 Network Information

| Network | Chain ID | Explorer | USDT Contract |
|---------|----------|----------|---------------|
| **BSC Mainnet** | 56 | https://bscscan.com | 0x55d398326f99059fF775485246999027B3197955 |
| **Ethereum Mainnet** | 1 | https://etherscan.io | 0xdAC17F958D2ee523a2206206994597C13D831ec7 |

---

## 🔐 Security Considerations

### Mainnet Mode (Production):
- ⚠️ Real money involved
- ⚠️ Gas fees required (real BNB/ETH)
- ⚠️ Transactions are permanent and irreversible
- ✅ Production ready for real users
- ✅ Higher security standards

### Best Practices:
1. **Always verify transaction details before submitting**
2. **Monitor all mainnet transactions closely**
3. **Keep private keys secure (encrypted in database)**
4. **Never commit .env to git**
5. **Use environment variables for sensitive data**
6. **Implement proper error handling for blockchain operations**

---

## 🚨 Troubleshooting

### Issue 1: "Invalid network"
**Cause:** Selected unsupported network or testnet reference

**Solution:**
```bash
# Check .env - must be mainnet
NETWORK_MODE=mainnet
NEXT_PUBLIC_NETWORK_MODE=mainnet

# Restart server
npm run dev
```

### Issue 2: Network selector shows no options
**Cause:** Frontend cached old configuration

**Solution:**
```bash
# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or rebuild Next.js
npm run build
npm run dev
```

### Issue 3: Transaction fails
**Cause:** Insufficient gas fees or wrong network

**Solution:**
```bash
# Verify wallet has sufficient native tokens (BNB/ETH) for gas
# Check network is correct (BSC_MAINNET or ETHEREUM_MAINNET)
# Verify RPC endpoint is accessible
```

---

## 📚 API Reference

### Functions:

#### `getNetworkMode(): NetworkMode`
Returns current network mode ('mainnet' | 'testnet')

#### `getAvailableNetworks(): NetworkConfig[]`
Returns array of available network configs based on mode

#### `getAvailableNetworkKeys(): NetworkKey[]`
Returns array of available network keys (['BSC_TESTNET', 'ETHEREUM_TESTNET'])

#### `getNetworkConfig(key: NetworkKey): NetworkConfig | undefined`
Get detailed config for specific network

#### `getNetworkByChainId(chainId: number): NetworkConfig | undefined`
Find network by chain ID (56 for BSC, 1 for Ethereum)

#### `getNetworkByMoralisChainId(id: string): NetworkConfig | undefined`
Find network by Moralis chain ID ('0x38' for BSC, '0x1' for Ethereum)

#### `isNetworkAvailable(key: NetworkKey): boolean`
Check if network is available (mainnet networks only)

#### `getDefaultNetwork(): NetworkConfig`
Get default network (BSC_MAINNET)

#### `getAvailableMoralisChainIds(): string[]`
Get all Moralis chain IDs for mainnet (['0x38', '0x1'])

#### `formatNetworkName(key: NetworkKey): string`
Format network name with icon (🟢 BSC Mainnet / 🔷 Ethereum Mainnet)

---

## 🎯 Migration Checklist

When updating existing modules:

- [ ] Import network helper functions
- [ ] Replace hardcoded network configs
- [ ] Add network validation in APIs (mainnet only)
- [ ] Update network selector in UI (mainnet only)
- [ ] Update explorer URL generation
- [ ] Test with mainnet configuration
- [ ] Update documentation

---

## 📖 Related Documentation

- **Full Network Config:** `/src/lib/networkConfig.ts`
- **Master Wallet:** `/src/lib/masterWallet.ts`
- **Custodial Wallet System:** `/docs/CUSTODIAL_WALLET_SYSTEM.md`
- **Custodial Wallet Quick Start:** `/docs/CUSTODIAL_WALLET_QUICKSTART.md`

---

**🎉 Ready for Production!** Network configuration is mainnet-only and fully secure.

**⚠️ Important:** This platform ONLY supports mainnet - no testnet functionality exists.

**Need help?** Check `/src/lib/networkConfig.ts` for all available functions.
