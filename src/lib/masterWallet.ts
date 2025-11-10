/**
 * Master Wallet Configuration
 * This is the central wallet that will hold all user funds
 */

// Master wallet credentials (KEEP SECURE!)
// For production, use Hardware Security Module (HSM) or KMS

export const MASTER_WALLET_CONFIG = {
  // Set this in .env for production
  PRIVATE_KEY: process.env.MASTER_WALLET_PRIVATE_KEY || '',
  ADDRESS: process.env.MASTER_WALLET_ADDRESS || '',
  
  // Network configs
  NETWORKS: {
    // Mainnet
    ETHEREUM_MAINNET: {
      name: 'Ethereum Mainnet',
      rpc: process.env.ETHEREUM_RPC_URL,
      chainId: 1,
      gasLimit: 100000,
      explorer: 'https://etherscan.io',
    },
    BSC_MAINNET: {
      name: 'BSC Mainnet',
      rpc: process.env.BSC_RPC_URL,
      chainId: 56,
      gasLimit: 100000,
      explorer: 'https://bscscan.com',
    },
    // Testnet
    ETHEREUM_TESTNET: {
      name: 'Ethereum Sepolia',
      rpc: process.env.TESTNET_ETHEREUM_RPC_URL,
      chainId: 11155111,
      gasLimit: 100000,
      explorer: 'https://sepolia.etherscan.io',
    },
    BSC_TESTNET: {
      name: 'BSC Testnet',
      rpc: process.env.TESTNET_BSC_RPC_URL,
      chainId: 97,
      gasLimit: 100000,
      explorer: 'https://testnet.bscscan.com',
    }
  },
  
  // USDT Contracts
  USDT_CONTRACTS: {
    ETHEREUM_MAINNET: process.env.USDT_ERC20_CONTRACT,
    BSC_MAINNET: process.env.USDT_BEP20_CONTRACT,
    ETHEREUM_TESTNET: process.env.TESTNET_USDT_ERC20_CONTRACT,
    BSC_TESTNET: process.env.TESTNET_USDT_BEP20_CONTRACT,
  },
  
  // Sweep thresholds
  MIN_SWEEP_AMOUNT: 10, // Minimum $10 USDT to sweep
  MIN_BALANCE_KEEP: 0.001, // Keep 0.001 BNB/ETH for gas
};

// Get available networks based on NETWORK_MODE
export function getAvailableNetworks(): string[] {
  const networkMode = process.env.NETWORK_MODE || 'mainnet';
  
  if (networkMode === 'mainnet') {
    return ['ETHEREUM_MAINNET', 'BSC_MAINNET'];
  } else {
    return ['ETHEREUM_TESTNET', 'BSC_TESTNET'];
  }
}

// Get network config by key
export function getNetworkConfig(networkKey: string) {
  return MASTER_WALLET_CONFIG.NETWORKS[networkKey as keyof typeof MASTER_WALLET_CONFIG.NETWORKS];
}

// Generate new master wallet (run once)
export function generateMasterWallet() {
  const { ethers } = require('ethers');
  const wallet = ethers.Wallet.createRandom();
  
  console.log('🔑 MASTER WALLET GENERATED');
  console.log('⚠️  SAVE THESE SECURELY - NEVER COMMIT TO GIT!');
  console.log('');
  console.log('Private Key:', wallet.privateKey);
  console.log('Address:', wallet.address);
  console.log('Mnemonic:', wallet.mnemonic.phrase);
  console.log('');
  console.log('Add to .env:');
  console.log(`MASTER_WALLET_PRIVATE_KEY=${wallet.privateKey}`);
  console.log(`MASTER_WALLET_ADDRESS=${wallet.address}`);
  
  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
    mnemonic: wallet.mnemonic.phrase,
  };
}
