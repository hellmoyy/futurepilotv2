/**
 * Network Balance Helper
 * Mainnet-only balance management
 */

/**
 * Get the balance field name (mainnet only)
 */
export function getBalanceField(): 'walletData.mainnetBalance' {
  return 'walletData.mainnetBalance';
}

/**
 * Get user's balance (mainnet only)
 */
export function getUserBalance(user: any): number {
  if (!user?.walletData) return 0;
  return user.walletData.mainnetBalance || 0;
}

/**
 * Update user's balance (mainnet only)
 * Returns the MongoDB update object
 */
export function createBalanceUpdate(amount: number) {
  return { $inc: { 'walletData.mainnetBalance': amount } };
}

/**
 * Set user's balance (mainnet only)
 * Returns the MongoDB update object
 */
export function setBalanceUpdate(amount: number) {
  return { $set: { 'walletData.mainnetBalance': amount } };
}

/**
 * Get network display name (always Mainnet)
 */
export function getNetworkDisplayName(): string {
  return 'Mainnet';
}

/**
 * Check if user is on mainnet (always true)
 */
export function isMainnet(): boolean {
  return true;
}

/**
 * Format balance (mainnet only)
 */
export function formatBalanceWithNetwork(balance: number): string {
  return `$${balance.toFixed(2)}`;
}
