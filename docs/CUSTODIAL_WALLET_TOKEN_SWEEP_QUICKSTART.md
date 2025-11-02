# 🚀 Custodial Wallet Token Sweep - Quick Reference

## Token Types

### 💵 USDT (Stablecoin)
- Auto-detects contract from env based on network
- BSC Mainnet: `USDT_BEP20_CONTRACT`
- ETH Mainnet: `USDT_ERC20_CONTRACT`
- BSC Testnet: `TESTNET_USDT_BEP20_CONTRACT`
- ETH Sepolia: `TESTNET_USDT_ERC20_CONTRACT`

### ⚡ Native Token (BNB/ETH)
- No contract address needed
- BSC networks → BNB
- Ethereum networks → ETH
- Auto-reserves 0.001 for gas

### 🔧 Custom Token
- User provides contract address
- Must be valid ERC-20/BEP-20
- Reads symbol and decimals automatically
- Validates contract before sweep

## Quick Usage

```typescript
// 1. USDT Sweep
POST /api/admin/sweep-wallets
{
  "network": "BSC_TESTNET",
  "minAmount": 10,
  "tokenType": "USDT"
}

// 2. Native BNB Sweep
POST /api/admin/sweep-wallets
{
  "network": "BSC_TESTNET",
  "minAmount": 0.01,
  "tokenType": "NATIVE"
}

// 3. Custom Token Sweep
POST /api/admin/sweep-wallets
{
  "network": "ETHEREUM_TESTNET",
  "minAmount": 100,
  "tokenType": "CUSTOM",
  "customTokenAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
}
```

## Response Example

```json
{
  "success": true,
  "summary": {
    "total": 50,
    "success": 45,
    "failed": 2,
    "skipped": 3,
    "totalSwept": 12450.50,
    "tokenType": "USDT",
    "tokenSymbol": "USDT",
    "masterWallet": "0xdCdE...",
    "network": "BSC_TESTNET"
  },
  "results": [...]
}
```

## Key Features

✅ 3 token types (USDT, Native, Custom)  
✅ 4 networks (BSC/ETH Testnet/Mainnet)  
✅ Auto gas management  
✅ Dynamic contract selection  
✅ Error handling per wallet  
✅ Transaction explorer links  
✅ Network mode filtering

## Files Modified

| File | Purpose |
|------|---------|
| `/src/app/administrator/custodial-wallet/page.tsx` | Frontend UI with token selector |
| `/src/app/api/admin/sweep-wallets/route.ts` | API endpoint with 3 token logics |
| `/docs/CUSTODIAL_WALLET_TOKEN_SWEEP.md` | Complete documentation |

## Environment Variables

```bash
# Master Wallet
MASTER_WALLET_ADDRESS=0x...
MASTER_WALLET_PRIVATE_KEY=0x...

# USDT Contracts (4 networks)
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
TESTNET_USDT_BEP20_CONTRACT=0x46484Aee842A735Fbf4C05Af7e371792cf52b498
TESTNET_USDT_ERC20_CONTRACT=0x46484Aee842A735Fbf4C05Af7e371792cf52b498

# Network Mode
NETWORK_MODE=testnet
NEXT_PUBLIC_NETWORK_MODE=testnet
```

## Common Issues

### ❌ Insufficient Gas
**Solution:** Fund user wallets with 0.001+ BNB/ETH

### ❌ Invalid Custom Token
**Solution:** Verify contract address matches network type

### ❌ All Skipped
**Solution:** Lower `minAmount` threshold

### ❌ Network Mismatch
**Solution:** Check `NETWORK_MODE` env variable

## Security Notes

- ✅ Admin-only access (NextAuth)
- ✅ AES-256-CBC private key encryption
- ✅ Network mode validation
- ✅ Gas balance checks
- ✅ Custom token validation
- ✅ Transaction confirmation required

---

**Full Documentation:** [CUSTODIAL_WALLET_TOKEN_SWEEP.md](./CUSTODIAL_WALLET_TOKEN_SWEEP.md)  
**Status:** ✅ Production Ready  
**Last Updated:** December 2024
