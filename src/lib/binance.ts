import crypto from 'crypto';

/**
 * Binance API client for validation and account operations
 */
export class BinanceClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private futuresBaseUrl: string;

  constructor(apiKey: string, apiSecret: string, testnet: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = testnet 
      ? 'https://testnet.binance.vision/api'
      : 'https://api.binance.com/api';
    this.futuresBaseUrl = testnet
      ? 'https://testnet.binancefuture.com/fapi'
      : 'https://fapi.binance.com/fapi';
  }

  /**
   * Generate signature for Binance API request
   */
  private generateSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Validate API key by testing connection to Binance account endpoint
   * @returns Promise with validation result and account info
   */
  async validateApiKey(): Promise<{
    valid: boolean;
    message: string;
    accountInfo?: {
      canTrade: boolean;
      canWithdraw: boolean;
      canDeposit: boolean;
      permissions: string[];
    };
  }> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await fetch(
        `${this.baseUrl}/v3/account?${queryString}&signature=${signature}`,
        {
          method: 'GET',
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          return {
            valid: false,
            message: 'Invalid API Key or Secret. Please check your credentials.',
          };
        }

        if (response.status === 403) {
          return {
            valid: false,
            message: 'API Key does not have required permissions. Enable Spot Trading permission.',
          };
        }

        return {
          valid: false,
          message: errorData.msg || 'Failed to validate API key. Please try again.',
        };
      }

      const data = await response.json();

      return {
        valid: true,
        message: 'API key validated successfully',
        accountInfo: {
          canTrade: data.canTrade || false,
          canWithdraw: data.canWithdraw || false,
          canDeposit: data.canDeposit || false,
          permissions: data.permissions || [],
        },
      };
    } catch (error) {
      console.error('Binance API validation error:', error);
      return {
        valid: false,
        message: 'Network error. Please check your connection and try again.',
      };
    }
  }

  /**
   * Test connection with simple ping
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/ping`);
      return response.ok;
    } catch (error) {
      console.error('Binance ping error:', error);
      return false;
    }
  }

  /**
   * Get account balances
   */
  async getAccountBalances(): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await fetch(
        `${this.baseUrl}/v3/account?${queryString}&signature=${signature}`,
        {
          method: 'GET',
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch account balances');
      }

      const data = await response.json();
      return data.balances?.filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0) || [];
    } catch (error) {
      console.error('Error fetching balances:', error);
      throw error;
    }
  }

  /**
   * Get Futures account balances (USDT-M Futures)
   */
  async getFuturesBalances(): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await fetch(
        `${this.futuresBaseUrl}/v2/account?${queryString}&signature=${signature}`,
        {
          method: 'GET',
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Futures balance fetch error:', errorData);
        throw new Error(errorData.msg || 'Failed to fetch futures balances');
      }

      const data = await response.json();
      
      // Return assets with balance > 0
      return data.assets?.filter((a: any) => parseFloat(a.walletBalance) > 0) || [];
    } catch (error) {
      console.error('Error fetching futures balances:', error);
      throw error;
    }
  }

  /**
   * Get futures candlestick data
   */
  async futuresCandles(params: {
    symbol: string;
    interval: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams({
        symbol: params.symbol,
        interval: params.interval,
        limit: (params.limit || 100).toString(),
      });

      const response = await fetch(
        `${this.futuresBaseUrl}/v1/klines?${queryParams}`,
        {
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return data.map((candle: any[]) => ({
        openTime: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        closeTime: candle[6],
      }));
    } catch (error) {
      console.error('Error fetching futures candles:', error);
      throw error;
    }
  }

  /**
   * Get futures position risk
   */
  async futuresPositionRisk(): Promise<any[]> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await fetch(
        `${this.futuresBaseUrl}/v2/positionRisk?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching position risk:', error);
      throw error;
    }
  }

  /**
   * Get futures account balance
   */
  async futuresAccountBalance(): Promise<any[]> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await fetch(
        `${this.futuresBaseUrl}/v2/balance?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching futures balance:', error);
      throw error;
    }
  }

  /**
   * Set futures leverage
   */
  async futuresLeverage(params: { symbol: string; leverage: string }): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${params.symbol}&leverage=${params.leverage}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await fetch(
        `${this.futuresBaseUrl}/v1/leverage?${queryString}&signature=${signature}`,
        {
          method: 'POST',
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting leverage:', error);
      throw error;
    }
  }

  /**
   * Place futures order
   */
  async futuresOrder(params: {
    symbol: string;
    side: string;
    type: string;
    quantity?: string;
    stopPrice?: string;
    closePosition?: string;
    reduceOnly?: string;
  }): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryParams: any = {
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        timestamp: timestamp.toString(),
      };

      if (params.quantity) queryParams.quantity = params.quantity;
      if (params.stopPrice) queryParams.stopPrice = params.stopPrice;
      if (params.closePosition) queryParams.closePosition = params.closePosition;
      if (params.reduceOnly) queryParams.reduceOnly = params.reduceOnly;

      const queryString = Object.keys(queryParams)
        .map((key) => `${key}=${queryParams[key]}`)
        .join('&');

      const signature = this.generateSignature(queryString);

      const response = await fetch(
        `${this.futuresBaseUrl}/v1/order?${queryString}&signature=${signature}`,
        {
          method: 'POST',
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error placing futures order:', error);
      throw error;
    }
  }

  /**
   * Cancel all open orders for a symbol
   */
  async futuresCancelAllOpenOrders(params: { symbol: string }): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${params.symbol}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await fetch(
        `${this.futuresBaseUrl}/v1/allOpenOrders?${queryString}&signature=${signature}`,
        {
          method: 'DELETE',
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling orders:', error);
      throw error;
    }
  }

  /**
   * Get futures mark price
   */
  async futuresMarkPrice(params: { symbol: string }): Promise<any> {
    try {
      const response = await fetch(
        `${this.futuresBaseUrl}/v1/premiumIndex?symbol=${params.symbol}`,
        {
          headers: {
            'X-MBX-APIKEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching mark price:', error);
      throw error;
    }
  }
}

/**
 * Validate Binance API credentials
 * @param apiKey - Binance API key
 * @param apiSecret - Binance API secret
 * @param testnet - Whether to use testnet (default: false)
 * @returns Validation result
 */
export async function validateBinanceCredentials(
  apiKey: string,
  apiSecret: string,
  testnet: boolean = false
): Promise<{
  valid: boolean;
  message: string;
  accountInfo?: any;
}> {
  const client = new BinanceClient(apiKey, apiSecret, testnet);
  return await client.validateApiKey();
}
