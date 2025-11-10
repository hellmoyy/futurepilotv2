import crypto from 'crypto';

/**
 * Binance Futures Trader (Mainnet only)
 * 
 * Execute trades on Binance Futures API with proper risk management
 * Supports MARKET/LIMIT orders, stop loss, take profit, and position management
 */

const BINANCE_FUTURES_API = 'https://fapi.binance.com';

export interface OrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number; // Required for LIMIT orders
  stopPrice?: number; // For stop orders
  reduceOnly?: boolean; // Close position only
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface PositionInfo {
  symbol: string;
  positionAmt: number; // Can be negative for SHORT
  entryPrice: number;
  markPrice: number;
  unRealizedProfit: number;
  liquidationPrice: number;
  leverage: number;
  marginType: 'ISOLATED' | 'CROSSED';
  isolatedMargin: number;
  positionSide: 'BOTH' | 'LONG' | 'SHORT';
}

export interface OrderResult {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  status: string;
  executedQty: number;
  cumQuote: number;
  avgPrice: number;
  updateTime: number;
}

export class FuturesTrader {
  private apiKey: string;
  private apiSecret: string;
  
  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }
  
  private getBaseUrl(): string {
    return BINANCE_FUTURES_API;
  }
  
  /**
   * Create HMAC SHA256 signature for Binance API
   */
  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }
  
  /**
   * Make signed API request
   */
  private async request(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    params: Record<string, any> = {}
  ): Promise<any> {
    const timestamp = Date.now();
    const queryParams = {
      ...params,
      timestamp,
      recvWindow: 5000,
    };
    
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const signature = this.createSignature(queryString);
    const url = `${this.getBaseUrl()}${endpoint}?${queryString}&signature=${signature}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Binance API Error: ${error.msg || response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Set leverage for symbol
   */
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    await this.request('/fapi/v1/leverage', 'POST', {
      symbol,
      leverage,
    });
  }
  
  /**
   * Set margin type (ISOLATED or CROSSED)
   */
  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void> {
    try {
      await this.request('/fapi/v1/marginType', 'POST', {
        symbol,
        marginType,
      });
    } catch (error: any) {
      // Ignore error if margin type is already set
      if (!error.message.includes('No need to change margin type')) {
        throw error;
      }
    }
  }
  
  /**
   * Place market order (immediate execution)
   */
  async marketOrder(params: OrderParams): Promise<OrderResult> {
    const orderParams: Record<string, any> = {
      symbol: params.symbol,
      side: params.side,
      type: 'MARKET',
      quantity: params.quantity,
    };
    
    if (params.reduceOnly) {
      orderParams.reduceOnly = 'true';
    }
    
    return this.request('/fapi/v1/order', 'POST', orderParams);
  }
  
  /**
   * Place limit order (at specific price)
   */
  async limitOrder(params: OrderParams): Promise<OrderResult> {
    if (!params.price) {
      throw new Error('Price is required for LIMIT orders');
    }
    
    const orderParams: Record<string, any> = {
      symbol: params.symbol,
      side: params.side,
      type: 'LIMIT',
      quantity: params.quantity,
      price: params.price,
      timeInForce: params.timeInForce || 'GTC',
    };
    
    if (params.reduceOnly) {
      orderParams.reduceOnly = 'true';
    }
    
    return this.request('/fapi/v1/order', 'POST', orderParams);
  }
  
  /**
   * Place STOP_MARKET order (stop loss)
   */
  async stopLossOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    stopPrice: number
  ): Promise<OrderResult> {
    return this.request('/fapi/v1/order', 'POST', {
      symbol,
      side,
      type: 'STOP_MARKET',
      quantity,
      stopPrice,
      reduceOnly: 'true',
      closePosition: 'true', // Close entire position
    });
  }
  
  /**
   * Place TAKE_PROFIT_MARKET order (take profit)
   */
  async takeProfitOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    stopPrice: number
  ): Promise<OrderResult> {
    return this.request('/fapi/v1/order', 'POST', {
      symbol,
      side,
      type: 'TAKE_PROFIT_MARKET',
      quantity,
      stopPrice,
      reduceOnly: 'true',
      closePosition: 'true', // Close entire position
    });
  }
  
  /**
   * Cancel order by ID
   */
  async cancelOrder(symbol: string, orderId: string): Promise<void> {
    await this.request('/fapi/v1/order', 'DELETE', {
      symbol,
      orderId,
    });
  }
  
  /**
   * Cancel all open orders for symbol
   */
  async cancelAllOrders(symbol: string): Promise<void> {
    await this.request('/fapi/v1/allOpenOrders', 'DELETE', {
      symbol,
    });
  }
  
  /**
   * Get current position information
   */
  async getPosition(symbol: string): Promise<PositionInfo | null> {
    const positions = await this.request('/fapi/v2/positionRisk', 'GET', {
      symbol,
    });
    
    const position = positions.find((p: any) => p.symbol === symbol);
    
    if (!position || parseFloat(position.positionAmt) === 0) {
      return null;
    }
    
    return {
      symbol: position.symbol,
      positionAmt: parseFloat(position.positionAmt),
      entryPrice: parseFloat(position.entryPrice),
      markPrice: parseFloat(position.markPrice),
      unRealizedProfit: parseFloat(position.unRealizedProfit),
      liquidationPrice: parseFloat(position.liquidationPrice),
      leverage: parseInt(position.leverage),
      marginType: position.marginType,
      isolatedMargin: parseFloat(position.isolatedMargin),
      positionSide: position.positionSide,
    };
  }
  
  /**
   * Get all open positions
   */
  async getAllPositions(): Promise<PositionInfo[]> {
    const positions = await this.request('/fapi/v2/positionRisk', 'GET');
    
    return positions
      .filter((p: any) => parseFloat(p.positionAmt) !== 0)
      .map((p: any) => ({
        symbol: p.symbol,
        positionAmt: parseFloat(p.positionAmt),
        entryPrice: parseFloat(p.entryPrice),
        markPrice: parseFloat(p.markPrice),
        unRealizedProfit: parseFloat(p.unRealizedProfit),
        liquidationPrice: parseFloat(p.liquidationPrice),
        leverage: parseInt(p.leverage),
        marginType: p.marginType,
        isolatedMargin: parseFloat(p.isolatedMargin),
        positionSide: p.positionSide,
      }));
  }
  
  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    const account = await this.request('/fapi/v2/account', 'GET');
    const usdtBalance = account.assets.find((a: any) => a.asset === 'USDT');
    return usdtBalance ? parseFloat(usdtBalance.availableBalance) : 0;
  }
  
  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/fapi/v1/ping', 'GET');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get current mark price
   */
  async getMarkPrice(symbol: string): Promise<number> {
    const ticker = await fetch(
      `${this.getBaseUrl()}/fapi/v1/ticker/price?symbol=${symbol}`
    ).then(res => res.json());
    
    return parseFloat(ticker.price);
  }
}
