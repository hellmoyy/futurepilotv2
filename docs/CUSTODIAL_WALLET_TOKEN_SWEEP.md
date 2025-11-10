# Custodial Wallet Multi-Token Sweep System

## Overview
Advanced custodial wallet system dengan support untuk 3 jenis token yang bisa di-sweep ke master wallet:
1. **USDT** - Stablecoin (USDT BEP-20 atau ERC-20)
2. **Native Token** - BNB (BSC) atau ETH (Ethereum)
3. **Custom Token** - ERC-20/BEP-20 token dengan contract address custom

## Features

### ✅ Multi-Token Support
- **USDT**: Menggunakan contract address dari environment variables
- **Native**: BNB untuk BSC networks, ETH untuk Ethereum networks
- **Custom**: User input contract address untuk token apapun

### ✅ Network-Aware Configuration (Mainnet Only)
- BSC Mainnet → USDT_BEP20_CONTRACT
- Ethereum Mainnet → USDT_ERC20_CONTRACT

### ✅ Smart Gas Management
- Native sweep: Reserves 0.001 BNB/ETH untuk gas
- Token sweep: Validates gas balance minimum 0.001 before transfer
- Automatic gas calculation per network

### ✅ Dynamic UI
- Token type selector dengan emoji indicators
- Conditional custom token address input
- Dynamic minimum amount label (USDT/BNB/ETH/Tokens)
- Dynamic step values (0.001 for native, 10 for tokens)

## Architecture

### API Endpoint
**POST** `/api/admin/sweep-wallets`

#### Request Body
```typescript
{
  network: 'BSC_MAINNET' | 'ETHEREUM_MAINNET',
  minAmount: number,           // Minimum balance to sweep
  tokenType: 'USDT' | 'NATIVE' | 'CUSTOM',
  customTokenAddress?: string  // Required if tokenType === 'CUSTOM'
}
```

#### Response
```typescript
{
  success: true,
  message: 'Wallet sweep completed',
  summary: {
    total: number,
    success: number,
    failed: number,
    skipped: number,
    totalSwept: number,
    tokenType: string,
    tokenSymbol: string,
    masterWallet: string,
    network: string
  },
  results: Array<{
    userId: string,
    userEmail: string,
    walletAddress: string,
    balance: string,
    sweptAmount: string,
    txHash: string,
    status: 'success' | 'failed' | 'skipped',
    error?: string,
    tokenType: string,
    tokenSymbol: string
  }>
}
```

### Frontend Component
**Location**: `/src/app/administrator/custodial-wallet/page.tsx`

#### State Management
```typescript
const [tokenType, setTokenType] = useState<'USDT' | 'NATIVE' | 'CUSTOM'>('USDT');
const [customTokenAddress, setCustomTokenAddress] = useState('');
const [minAmount, setMinAmount] = useState(10);
const [selectedNetwork, setSelectedNetwork] = useState('BSC_MAINNET');
```

#### UI Components
1. **Token Type Selector**
   - 💵 USDT (Stablecoin)
   - ⚡ Native (BNB/ETH)
   - 🔧 Custom Token

2. **Custom Token Address Input**
   - Only visible when tokenType === 'CUSTOM'
   - Placeholder: "0x..."
   - Validates Ethereum address format

3. **Dynamic Minimum Amount**
   - Label changes based on token type
   - Step: 0.001 for native, 10 for tokens
   - Helper text shows token symbol

4. **Results Display**
   - Token symbol in header
   - Balance and swept amount columns
   - Transaction hash links to explorer

## Token Sweep Logic

### 1. USDT Sweep
```typescript
// Get USDT contract based on network
const usdtContract = networkConfig[network].usdtContract;
const contract = new ethers.Contract(usdtContract, TOKEN_ABI, provider);

// Check balance
const balance = await contract.balanceOf(walletAddress);

// Transfer
const tx = await contract.connect(userWallet).transfer(
  MASTER_WALLET_ADDRESS, 
  balance
);
```

### 2. Native Token Sweep (BNB/ETH)
```typescript
// Get native balance
const balance = await provider.getBalance(walletAddress);

// Reserve 0.001 for gas
const gasReserve = ethers.parseEther('0.001');
const amountToSweep = balance - gasReserve;

// Transfer
const tx = await userWallet.sendTransaction({
  to: MASTER_WALLET_ADDRESS,
  value: amountToSweep
});
```

### 3. Custom Token Sweep
```typescript
// Create contract with custom address
const contract = new ethers.Contract(
  customTokenAddress, 
  TOKEN_ABI, 
  provider
);

// Get token info
const symbol = await contract.symbol();
const decimals = await contract.decimals();

// Check balance
const balance = await contract.balanceOf(walletAddress);

// Transfer
const tx = await contract.connect(userWallet).transfer(
  MASTER_WALLET_ADDRESS, 
  balance
);
```

## Environment Variables

### Required
```bash
# Master Wallet
MASTER_WALLET_ADDRESS=0x...
MASTER_WALLET_PRIVATE_KEY=0x...

# Network Mode
NETWORK_MODE=testnet
NEXT_PUBLIC_NETWORK_MODE=testnet

# USDT Contracts (Mainnet)
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7

# USDT Contracts (Testnet)
TESTNET_USDT_BEP20_CONTRACT=0x46484Aee842A735Fbf4C05Af7e371792cf52b498
TESTNET_USDT_ERC20_CONTRACT=0x46484Aee842A735Fbf4C05Af7e371792cf52b498

# RPC URLs (Mainnet)
BSC_RPC_URL=https://bsc-dataseed1.binance.org
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...

# Encryption
ENCRYPTION_SECRET_KEY=your-secret-key
```

## Security Features

### 1. Admin Authentication
- Only ADMIN_EMAIL can access sweep endpoint
- NextAuth session validation
- Server-side permission check

### 2. Network Mode Validation
- NETWORK_MODE env variable controls available networks
- Testnet mode: Only BSC_TESTNET and ETHEREUM_TESTNET
- Mainnet mode: Only BSC_MAINNET and ETHEREUM_MAINNET

### 3. Custom Token Validation
- Validates Ethereum address format
- Attempts to read token symbol and decimals
- Fails gracefully if invalid contract

### 4. Private Key Encryption
- AES-256-CBC encryption
- SHA-256 key derivation
- Decrypt only during transaction signing
- Never exposed to frontend

### 5. Gas Protection
- Minimum 0.001 native token for gas
- Native sweep reserves gas automatically
- Skips wallets with insufficient gas

## Usage Guide

### For Admin

1. **Navigate to Custodial Wallet Page**
   - Sidebar → Custodial Wallet

2. **Configure Sweep**
   - Select Network (filtered by NETWORK_MODE)
   - Choose Token Type:
     * USDT - For stablecoin sweep
     * Native - For BNB/ETH sweep
     * Custom - For any ERC-20/BEP-20 token
   - If Custom: Enter token contract address
   - Set minimum amount threshold

3. **Execute Sweep**
   - Click "Start Sweep"
   - Confirm action
   - Wait for processing

4. **Review Results**
   - Summary stats (success/failed/skipped)
   - Total swept amount with token symbol
   - Detailed table with user info
   - Transaction hashes with explorer links
   - Error details for failed transactions

### Token Type Selection Guide

#### When to use USDT:
- ✅ Collecting stablecoin from user deposits
- ✅ Centralized liquidity management
- ✅ Fiat-pegged value consolidation

#### When to use Native:
- ✅ Collecting leftover BNB/ETH from user wallets
- ✅ Gas fee management and redistribution
- ✅ Native token liquidity pooling

#### When to use Custom:
- ✅ Project-specific token collection (e.g., governance tokens)
- ✅ Airdrop token centralization
- ✅ Any ERC-20/BEP-20 token not USDT

## Example Scenarios

### Scenario 1: USDT Sweep (Testnet)
```typescript
Request:
{
  network: 'BSC_TESTNET',
  minAmount: 10,
  tokenType: 'USDT'
}

Response:
{
  summary: {
    total: 50,
    success: 45,
    failed: 2,
    skipped: 3,
    totalSwept: 12450.50,
    tokenType: 'USDT',
    tokenSymbol: 'USDT',
    masterWallet: '0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1',
    network: 'BSC_TESTNET'
  }
}
```

### Scenario 2: Native BNB Sweep
```typescript
Request:
{
  network: 'BSC_TESTNET',
  minAmount: 0.01,
  tokenType: 'NATIVE'
}

Response:
{
  summary: {
    total: 50,
    success: 30,
    failed: 0,
    skipped: 20,  // Below 0.01 BNB
    totalSwept: 1.45,  // Reserves 0.001 per wallet
    tokenType: 'NATIVE',
    tokenSymbol: 'BNB',
    masterWallet: '0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1',
    network: 'BSC_TESTNET'
  }
}
```

### Scenario 3: Custom Token Sweep
```typescript
Request:
{
  network: 'ETHEREUM_TESTNET',
  minAmount: 100,
  tokenType: 'CUSTOM',
  customTokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'  // UNI token
}

Response:
{
  summary: {
    total: 50,
    success: 15,
    failed: 5,
    skipped: 30,
    totalSwept: 8500,
    tokenType: 'CUSTOM',
    tokenSymbol: 'UNI',
    masterWallet: '0xdCdE1CCE20E4E7b10921e3b7C54ea4291bB1F7A1',
    network: 'ETHEREUM_TESTNET'
  }
}
```

## Error Handling

### Common Errors

1. **Insufficient Gas**
   ```
   Error: Insufficient gas (need 0.001 BNB/ETH)
   Solution: Fund user wallet with native token for gas
   ```

2. **Invalid Custom Token**
   ```
   Error: Invalid custom token contract. Cannot read token info.
   Solution: Verify contract address and network match
   ```

3. **Balance Too Low**
   ```
   Status: Skipped (below minimum threshold)
   Solution: Lower minAmount or wait for more deposits
   ```

4. **Network Mismatch**
   ```
   Error: Invalid network for testnet mode
   Solution: Check NETWORK_MODE env variable
   ```

## Performance Considerations

- **Batch Processing**: Processes wallets sequentially to avoid nonce conflicts
- **Gas Optimization**: Dynamic gas estimation per network
- **Error Recovery**: Failed sweeps don't halt entire process
- **Logging**: Detailed console logs for debugging

## Testing

### Test USDT Sweep
```bash
# Testnet BSC USDT
curl -X POST http://localhost:3000/api/admin/sweep-wallets \
  -H "Content-Type: application/json" \
  -d '{
    "network": "BSC_TESTNET",
    "minAmount": 10,
    "tokenType": "USDT"
  }'
```

### Test Native Sweep
```bash
# Testnet BSC BNB
curl -X POST http://localhost:3000/api/admin/sweep-wallets \
  -H "Content-Type: application/json" \
  -d '{
    "network": "BSC_TESTNET",
    "minAmount": 0.01,
    "tokenType": "NATIVE"
  }'
```

### Test Custom Token
```bash
# Custom token on Ethereum Mainnet
curl -X POST http://localhost:3000/api/admin/sweep-wallets \
  -H "Content-Type: application/json" \
  -d '{
    "network": "ETHEREUM_MAINNET",
    "minAmount": 100,
    "tokenType": "CUSTOM",
    "customTokenAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
  }'
```

## Future Enhancements

### Planned Features
- [ ] Multi-wallet batch selection (choose specific users)
- [ ] Scheduled auto-sweep (cron job integration)
- [ ] Sweep threshold alerts (notify when ready)
- [ ] Gas fee optimization (batch transactions)
- [ ] Token whitelist/blacklist
- [ ] Sweep history and analytics
- [ ] Export results to CSV/JSON
- [ ] Webhook notifications on completion

### Advanced Features
- [ ] Multi-signature master wallet support
- [ ] Partial sweep (percentage-based)
- [ ] Token swap before sweep (DEX integration)
- [ ] Multi-token sweep in single transaction
- [ ] Dynamic gas price adjustment
- [ ] Failover RPC endpoints

## Troubleshooting

### Issue: Sweep fails for all users
**Check:**
1. Master wallet has no gas? → Fund master wallet
2. Wrong network selected? → Verify NETWORK_MODE
3. RPC endpoint down? → Check RPC_URL connectivity
4. Contract address invalid? → Verify USDT_CONTRACT env

### Issue: Some sweeps succeed, others fail
**Check:**
1. User wallets have gas? → Fund user wallets with native token
2. Token balance too low? → Lower minAmount threshold
3. Contract interaction failed? → Check custom token contract

### Issue: Native sweep reserves too much gas
**Solution:**
- Edit gas reserve from 0.001 to lower value
- Location: `/src/app/api/admin/sweep-wallets/route.ts` line ~308
```typescript
const gasReserve = ethers.parseEther('0.0005'); // Changed from 0.001
```

## Related Documentation
- [Network Configuration System](./NETWORK_CONFIGURATION_SYSTEM.md)
- [Custodial Wallet System](./CUSTODIAL_WALLET_SYSTEM.md)
- [Automatic Deposit Detection](./AUTOMATIC_DEPOSIT_DETECTION.md)
- [Master Wallet Setup](./MASTER_WALLET_SETUP.md)

---

**Last Updated:** December 2024  
**Status:** ✅ Production Ready  
**Network Support:** 4 networks (BSC/ETH, Testnet/Mainnet)  
**Token Support:** 3 types (USDT, Native, Custom)
