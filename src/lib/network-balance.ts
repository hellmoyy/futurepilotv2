/**
 * Network Balance Helper
 * Handles separate balances for testnet vs mainnet
 */

export type NetworkMode = 'mainnet' | 'testnet';

/**
 * Get current network mode from environment
 */
export function getNetworkMode(): NetworkMode {
  return (process.env.NETWORK_MODE || process.env.NEXT_PUBLIC_NETWORK_MODE || 'mainnet') as NetworkMode;
}

/**
 * Get the correct balance field name based on network mode
 */
export function getBalanceField(networkMode?: NetworkMode): 'walletData.balance' | 'walletData.mainnetBalance' {
  const mode = networkMode || getNetworkMode();
  return mode === 'mainnet' ? 'walletData.mainnetBalance' : 'walletData.balance';
}

/**
 * Get user's balance for current network
 */
export function getUserBalance(user: any, networkMode?: NetworkMode): number {
  const mode = networkMode || getNetworkMode();
  if (!user?.walletData) return 0;
  
  return mode === 'mainnet' 
    ? (user.walletData.mainnetBalance || 0)
    : (user.walletData.balance || 0);
}

/**
 * Update user's balance for current network
 * Returns the MongoDB update object
 */
export function createBalanceUpdate(amount: number, networkMode?: NetworkMode) {
  const field = getBalanceField(networkMode);
  return { $inc: { [field]: amount } };
}

/**
 * Set user's balance for current network
 * Returns the MongoDB update object
 */
export function setBalanceUpdate(amount: number, networkMode?: NetworkMode) {
  const field = getBalanceField(networkMode);
  return { $set: { [field]: amount } };
}

/**
 * Get network display name
 */
export function getNetworkDisplayName(networkMode?: NetworkMode): string {
  const mode = networkMode || getNetworkMode();
  return mode === 'mainnet' ? 'Mainnet' : 'Testnet';
}

/**
 * Check if user is on mainnet
 */
export function isMainnet(): boolean {
  return getNetworkMode() === 'mainnet';
}

/**
 * Format balance with network indicator
 */
export function formatBalanceWithNetwork(balance: number, networkMode?: NetworkMode): string {
  const mode = networkMode || getNetworkMode();
  const network = mode === 'mainnet' ? '' : ' (Testnet)';
  return `$${balance.toFixed(2)}${network}`;
}
