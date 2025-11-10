/**
 * Network Configuration Helper
 * Mainnet-only network configuration for all blockchain interactions
 */

export type NetworkKey = 'BSC_MAINNET' | 'ETHEREUM_MAINNET';

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

// Mainnet network configurations only
export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
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
};

/**
 * Get available networks (mainnet only)
 */
export function getAvailableNetworks(): NetworkConfig[] {
  return [NETWORKS.BSC_MAINNET, NETWORKS.ETHEREUM_MAINNET];
}

/**
 * Get available network keys (mainnet only)
 */
export function getAvailableNetworkKeys(): NetworkKey[] {
  return ['BSC_MAINNET', 'ETHEREUM_MAINNET'];
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
 * Validate if network is available (always true for mainnet keys)
 */
export function isNetworkAvailable(networkKey: NetworkKey): boolean {
  return networkKey === 'BSC_MAINNET' || networkKey === 'ETHEREUM_MAINNET';
}

/**
 * Get default network (BSC Mainnet)
 */
export function getDefaultNetwork(): NetworkConfig {
  return NETWORKS.BSC_MAINNET;
}

/**
 * Get all Moralis chain IDs (mainnet only)
 */
export function getAvailableMoralisChainIds(): string[] {
  return ['0x38', '0x1'];
}

/**
 * Format network name with icon
 */
export function formatNetworkName(networkKey: NetworkKey): string {
  const config = getNetworkConfig(networkKey);
  if (!config) return networkKey;
  return `🟢 ${config.name}`;
}

// Export constants for easy access
export const AVAILABLE_NETWORKS = getAvailableNetworks();
export const AVAILABLE_NETWORK_KEYS = getAvailableNetworkKeys();
export const DEFAULT_NETWORK = getDefaultNetwork();
