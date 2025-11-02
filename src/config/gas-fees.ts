/**
 * Gas Fee Configuration
 * Different gas fee reserves for mainnet vs testnet
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
  },
  testnet: {
    // Testnet uses free faucet tokens, much smaller reserves needed
    ethereum: {
      reserve: 0.0001, // 0.0001 SepoliaETH (free from faucet)
      displayName: 'SepoliaETH',
      minForWithdrawal: 0.00005,
    },
    bsc: {
      reserve: 0.001, // 0.001 tBNB (free from faucet)
      displayName: 'tBNB',
      minForWithdrawal: 0.0005,
    },
    usdt: {
      minDeposit: 1, // Minimum $1 USDT deposit (for testing)
      minWithdrawal: 1, // Minimum $1 USDT withdrawal
    }
  }
};

/**
 * Get gas fee configuration based on current network mode
 */
export function getGasFeeConfig() {
  const networkMode = process.env.NETWORK_MODE || 'testnet';
  return GAS_FEE_CONFIG[networkMode as 'mainnet' | 'testnet'];
}

/**
 * Get minimum deposit amount based on network mode
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
