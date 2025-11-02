/**
 * Network Configuration Helper
 * Centralized network configuration for all blockchain interactions
 * Supports 4 networks with automatic filtering based on NETWORK_MODE
 */

export type NetworkKey = 'BSC_MAINNET' | 'ETHEREUM_MAINNET' | 'BSC_TESTNET' | 'ETHEREUM_TESTNET';
export type NetworkMode = 'mainnet' | 'testnet';

export interface NetworkConfig {
  key: NetworkKey;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  usdtContract: string;
  moralisChainId: string; // Moralis format (0x1, 0x38, etc)
}

// All network configurations
export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  // Mainnet Networks
  BSC_MAINNET: {
    key: 'BSC_MAINNET',
    name: 'BNB Smart Chain Mainnet',
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || 'https://1rpc.io/bnb',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    usdtContract: process.env.USDT_BEP20_CONTRACT || '0x55d398326f99059fF775485246999027B3197955',
    moralisChainId: '0x38',
  },
  ETHEREUM_MAINNET: {
    key: 'ETHEREUM_MAINNET',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://ethereum.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    usdtContract: process.env.USDT_ERC20_CONTRACT || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    moralisChainId: '0x1',
  },
  
  // Testnet Networks
  BSC_TESTNET: {
    key: 'BSC_TESTNET',
    name: 'BNB Smart Chain Testnet',
    chainId: 97,
    rpcUrl: process.env.TESTNET_BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    usdtContract: process.env.TESTNET_USDT_BEP20_CONTRACT || '0x46484Aee842A735Fbf4C05Af7e371792cf52b498',
    moralisChainId: '0x61',
  },
  ETHEREUM_TESTNET: {
    key: 'ETHEREUM_TESTNET',
    name: 'Ethereum Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: process.env.TESTNET_ETHEREUM_RPC_URL || 'https://rpc.ankr.com/eth_sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'SepoliaETH',
      decimals: 18,
    },
    usdtContract: process.env.TESTNET_USDT_ERC20_CONTRACT || '0x46484Aee842A735Fbf4C05Af7e371792cf52b498',
    moralisChainId: '0xaa36a7',
  },
};

/**
 * Get current network mode from environment
 */
export function getNetworkMode(): NetworkMode {
  const mode = process.env.NETWORK_MODE || process.env.NEXT_PUBLIC_NETWORK_MODE || 'testnet';
  return mode as NetworkMode;
}

/**
 * Get available networks based on NETWORK_MODE
 * Returns only mainnet or testnet networks
 */
export function getAvailableNetworks(): NetworkConfig[] {
  const mode = getNetworkMode();
  
  if (mode === 'mainnet') {
    return [NETWORKS.BSC_MAINNET, NETWORKS.ETHEREUM_MAINNET];
  } else {
    return [NETWORKS.BSC_TESTNET, NETWORKS.ETHEREUM_TESTNET];
  }
}

/**
 * Get available network keys
 */
export function getAvailableNetworkKeys(): NetworkKey[] {
  const mode = getNetworkMode();
  
  if (mode === 'mainnet') {
    return ['BSC_MAINNET', 'ETHEREUM_MAINNET'];
  } else {
    return ['BSC_TESTNET', 'ETHEREUM_TESTNET'];
  }
}

/**
 * Get network config by key
 */
export function getNetworkConfig(networkKey: NetworkKey): NetworkConfig | undefined {
  return NETWORKS[networkKey];
}

/**
 * Get network config by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
}

/**
 * Get network config by Moralis chain ID
 */
export function getNetworkByMoralisChainId(moralisChainId: string): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(network => network.moralisChainId === moralisChainId);
}

/**
 * Validate if network is available in current mode
 */
export function isNetworkAvailable(networkKey: NetworkKey): boolean {
  const availableKeys = getAvailableNetworkKeys();
  return availableKeys.includes(networkKey);
}

/**
 * Get default network for current mode
 */
export function getDefaultNetwork(): NetworkConfig {
  const mode = getNetworkMode();
  
  if (mode === 'mainnet') {
    return NETWORKS.BSC_MAINNET;
  } else {
    return NETWORKS.BSC_TESTNET;
  }
}

/**
 * Get all Moralis chain IDs for current mode
 */
export function getAvailableMoralisChainIds(): string[] {
  const networks = getAvailableNetworks();
  return networks.map(network => network.moralisChainId);
}

/**
 * Format network name with icon
 */
export function formatNetworkName(networkKey: NetworkKey): string {
  const config = getNetworkConfig(networkKey);
  if (!config) return networkKey;
  
  const mode = getNetworkMode();
  const icon = mode === 'mainnet' ? '🟢' : '🧪';
  
  return `${icon} ${config.name}`;
}

/**
 * Client-side hook to get network mode
 * (use in React components)
 */
export function useNetworkMode(): NetworkMode {
  if (typeof window !== 'undefined') {
    return (process.env.NEXT_PUBLIC_NETWORK_MODE || 'testnet') as NetworkMode;
  }
  return 'testnet';
}

// Export constants for easy access
export const NETWORK_MODE = getNetworkMode();
export const AVAILABLE_NETWORKS = getAvailableNetworks();
export const AVAILABLE_NETWORK_KEYS = getAvailableNetworkKeys();
export const DEFAULT_NETWORK = getDefaultNetwork();
