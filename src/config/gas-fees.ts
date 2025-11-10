/**
 * Gas Fee Configuration (Mainnet only)
 */

export const GAS_FEE_CONFIG = {
  mainnet: {
    // Mainnet requires real ETH/BNB for gas
    ethereum: {
      reserve: 0.001, // 0.001 ETH (~$2-3 at current prices)
      displayName: 'ETH',
      minForWithdrawal: 0.0005, // Minimum to allow withdrawal
    },
    bsc: {
      reserve: 0.01, // 0.01 BNB (~$5-6)
      displayName: 'BNB',
      minForWithdrawal: 0.005,
    },
    usdt: {
      minDeposit: 10, // Minimum $10 USDT deposit
      minWithdrawal: 10, // Minimum $10 USDT withdrawal
    }
  }
};

/**
 * Get gas fee configuration (always mainnet)
 */
export function getGasFeeConfig() {
  return GAS_FEE_CONFIG.mainnet;
}

/**
 * Get minimum deposit amount (always mainnet)
 */
export function getMinDepositAmount(): number {
  const config = getGasFeeConfig();
  return config.usdt.minDeposit;
}

/**
 * Get minimum withdrawal amount based on network mode
 */
export function getMinWithdrawalAmount(): number {
  const config = getGasFeeConfig();
  return config.usdt.minWithdrawal;
}

/**
 * Check if user has enough gas fee balance for withdrawal
 * @param network 'ethereum' or 'bsc'
 * @param gasFeeBalance User's current gas fee balance
 */
export function hasEnoughGasForWithdrawal(
  network: 'ethereum' | 'bsc',
  gasFeeBalance: number
): boolean {
  const config = getGasFeeConfig();
  const required = config[network].minForWithdrawal;
  return gasFeeBalance >= required;
}

/**
 * Get required gas fee reserve for a network
 */
export function getRequiredGasFee(network: 'ethereum' | 'bsc'): number {
  const config = getGasFeeConfig();
  return config[network].reserve;
}

/**
 * Get gas token display name for UI
 */
export function getGasTokenName(network: 'ethereum' | 'bsc'): string {
  const config = getGasFeeConfig();
  return config[network].displayName;
}

/**
 * Format gas fee amount for display
 */
export function formatGasFee(network: 'ethereum' | 'bsc', amount: number): string {
  const tokenName = getGasTokenName(network);
  return `${amount.toFixed(6)} ${tokenName}`;
}
