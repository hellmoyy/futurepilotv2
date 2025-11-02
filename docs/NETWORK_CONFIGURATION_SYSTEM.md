# 🌐 Network Configuration System

## 📋 Overview

Sistem network configuration yang terpusat untuk **semua module** yang berinteraksi dengan blockchain. Mendukung 4 networks dengan automatic filtering berdasarkan `NETWORK_MODE`.

---

## 🎯 Supported Networks

### Mainnet (NETWORK_MODE=mainnet)
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

### Testnet (NETWORK_MODE=testnet)
1. **BSC Testnet**
   - Chain ID: `97`
   - Moralis ID: `0x61`
   - Explorer: https://testnet.bscscan.com
   - USDT Contract: `0x46484Aee842A735Fbf4C05Af7e371792cf52b498`

2. **Ethereum Sepolia Testnet**
   - Chain ID: `11155111`
   - Moralis ID: `0xaa36a7`
   - Explorer: https://sepolia.etherscan.io
   - USDT Contract: `0x46484Aee842A735Fbf4C05Af7e371792cf52b498`

---

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Network Mode (CRITICAL: Controls which networks are active)
NETWORK_MODE=testnet  # or mainnet
NEXT_PUBLIC_NETWORK_MODE=testnet  # For client-side

########## MAINNET RPC URLs ##########
ETHEREUM_RPC_URL=https://ethereum.publicnode.com
BSC_RPC_URL=https://1rpc.io/bnb

# USDT Contract Addresses Mainnet
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955
########################################

########## TESTNET RPC URLs ##########
TESTNET_ETHEREUM_RPC_URL=https://rpc.ankr.com/eth_sepolia
TESTNET_BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# USDT Contract Addresses Testnet
TESTNET_USDT_ERC20_CONTRACT=0x46484Aee842A735Fbf4C05Af7e371792cf52b498
TESTNET_USDT_BEP20_CONTRACT=0x46484Aee842A735Fbf4C05Af7e371792cf52b498
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
const mode = getNetworkMode(); // 'mainnet' or 'testnet'
console.log('Current mode:', mode);
```

### 3. Get Available Networks

```typescript
const networks = getAvailableNetworks();
// If NETWORK_MODE=testnet:
// Returns: [BSC_TESTNET, ETHEREUM_TESTNET]

// If NETWORK_MODE=mainnet:
// Returns: [BSC_MAINNET, ETHEREUM_MAINNET]
```

### 4. Validate Network

```typescript
const isValid = isNetworkAvailable('BSC_MAINNET');
// If NETWORK_MODE=testnet: false
// If NETWORK_MODE=mainnet: true
```

### 5. Get Network Details

```typescript
const config = getNetworkConfig('BSC_TESTNET');
console.log(config.name); // "BNB Smart Chain Testnet"
console.log(config.chainId); // 97
console.log(config.explorerUrl); // "https://testnet.bscscan.com"
console.log(config.usdtContract); // "0x464..."
```

### 6. React Component Usage

```typescript
'use client';

import { useNetworkMode, getAvailableNetworks } from '@/lib/networkConfig';

export default function MyComponent() {
  const networkMode = useNetworkMode(); // 'mainnet' or 'testnet'
  const networks = getAvailableNetworks();

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
  
  // Validate network
  const availableNetworks = getAvailableNetworkKeys();
  if (!availableNetworks.includes(network)) {
    return NextResponse.json(
      { 
        error: 'Invalid network for current mode',
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

### Mode Detection:

```
NETWORK_MODE=testnet
  ↓
getNetworkMode() returns 'testnet'
  ↓
getAvailableNetworks() returns [BSC_TESTNET, ETHEREUM_TESTNET]
  ↓
Only testnet networks shown in UI
  ↓
API validates: Only testnet networks accepted
```

### Network Validation Flow:

```typescript
// 1. User selects network in UI
selectedNetwork = 'BSC_MAINNET'

// 2. API receives request
POST /api/admin/sweep-wallets
body: { network: 'BSC_MAINNET' }

// 3. API validates network
const availableNetworks = getAvailableNetworkKeys(); // ['BSC_TESTNET', 'ETHEREUM_TESTNET']
if (!availableNetworks.includes('BSC_MAINNET')) {
  return { error: 'Invalid network for testnet mode' }; // ❌ REJECTED
}

// 4. If NETWORK_MODE=mainnet
const availableNetworks = getAvailableNetworkKeys(); // ['BSC_MAINNET', 'ETHEREUM_MAINNET']
if (availableNetworks.includes('BSC_MAINNET')) {
  // ✅ ALLOWED - proceed with sweep
}
```

---

## 🎨 UI Implementation

### Network Selector (Auto-filtered):

```typescript
<select value={selectedNetwork} onChange={handleChange}>
  {networkMode === 'testnet' ? (
    <>
      <option value="BSC_TESTNET">🧪 BSC Testnet</option>
      <option value="ETHEREUM_TESTNET">🧪 Ethereum Sepolia</option>
    </>
  ) : (
    <>
      <option value="BSC_MAINNET">🟢 BSC Mainnet</option>
      <option value="ETHEREUM_MAINNET">🔷 Ethereum Mainnet</option>
    </>
  )}
</select>
```

### Network Badge:

```typescript
<div className={isMainnet ? 'badge-green' : 'badge-yellow'}>
  {isMainnet ? '🟢 Mainnet' : '🧪 Testnet'}
</div>
```

---

## 🧪 Testing

### Switch to Testnet:

```bash
# .env
NETWORK_MODE=testnet
NEXT_PUBLIC_NETWORK_MODE=testnet

# Restart server
npm run dev

# Access admin panel
http://localhost:3000/administrator/custodial-wallet

# Only BSC Testnet and Ethereum Sepolia will show
```

### Switch to Mainnet:

```bash
# .env
NETWORK_MODE=mainnet
NEXT_PUBLIC_NETWORK_MODE=mainnet

# Restart server
npm run dev

# Access admin panel
http://localhost:3000/administrator/custodial-wallet

# Only BSC Mainnet and Ethereum Mainnet will show
```

---

## 📊 Network Comparison

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| **Networks** | BSC Testnet, Ethereum Sepolia | BSC Mainnet, Ethereum Mainnet |
| **Real Money** | ❌ No | ✅ Yes |
| **Gas Fees** | Free (faucet) | Paid (real BNB/ETH) |
| **USDT** | Test tokens | Real USDT |
| **Purpose** | Testing & development | Production |
| **Security** | Lower | Higher |
| **Reversible** | ✅ Can reset | ❌ Cannot undo |

---

## 🔐 Security Considerations

### Testnet Mode:
- ✅ Safe for testing
- ✅ Can experiment freely
- ✅ Free gas fees (faucet)
- ⚠️ Test tokens have no value

### Mainnet Mode:
- ⚠️ Real money involved
- ⚠️ Gas fees required
- ⚠️ Transactions permanent
- ✅ Production ready

### Best Practices:
1. **Always test on testnet first**
2. **Double-check NETWORK_MODE before deploy**
3. **Use separate .env files for testnet/mainnet**
4. **Never commit .env to git**
5. **Monitor all mainnet transactions**

---

## 🚨 Troubleshooting

### Issue 1: "Invalid network for testnet mode"
**Cause:** Selected mainnet network while NETWORK_MODE=testnet

**Solution:**
```bash
# Check .env
echo $NETWORK_MODE  # Should match UI selection

# If mismatch, update .env
NETWORK_MODE=mainnet  # or testnet
NEXT_PUBLIC_NETWORK_MODE=mainnet  # or testnet

# Restart server
npm run dev
```

### Issue 2: Network selector shows wrong networks
**Cause:** Frontend cached old NETWORK_MODE

**Solution:**
```bash
# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or rebuild Next.js
npm run build
npm run dev
```

### Issue 3: API accepts wrong network
**Cause:** Server-side NETWORK_MODE not updated

**Solution:**
```bash
# Update .env on server
NETWORK_MODE=testnet  # or mainnet

# Restart server (Vercel/Railway auto-redeploys on env change)
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
Find network by chain ID (56, 97, 1, 11155111)

#### `getNetworkByMoralisChainId(id: string): NetworkConfig | undefined`
Find network by Moralis chain ID ('0x38', '0x61', etc)

#### `isNetworkAvailable(key: NetworkKey): boolean`
Check if network is available in current mode

#### `getDefaultNetwork(): NetworkConfig`
Get default network for current mode

#### `getAvailableMoralisChainIds(): string[]`
Get all Moralis chain IDs for current mode

#### `formatNetworkName(key: NetworkKey): string`
Format network name with icon (🟢 BSC Mainnet / 🧪 BSC Testnet)

---

## 🎯 Migration Checklist

When updating existing modules:

- [ ] Import network helper functions
- [ ] Replace hardcoded network configs
- [ ] Add network validation in APIs
- [ ] Filter network selector in UI
- [ ] Update explorer URL generation
- [ ] Test with both testnet and mainnet modes
- [ ] Update documentation

---

## 📖 Related Documentation

- **Full Network Config:** `/src/lib/networkConfig.ts`
- **Master Wallet:** `/src/lib/masterWallet.ts`
- **Custodial Wallet System:** `/docs/CUSTODIAL_WALLET_SYSTEM.md`
- **Custodial Wallet Quick Start:** `/docs/CUSTODIAL_WALLET_QUICKSTART.md`

---

**🎉 Ready to use!** Network configuration is now centralized and automatic!

**Switch modes:** Just update `NETWORK_MODE` in `.env` and restart server.

**Need help?** Check `/src/lib/networkConfig.ts` for all available functions.
