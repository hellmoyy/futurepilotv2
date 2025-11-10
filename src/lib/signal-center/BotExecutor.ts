import { FuturesTrader } from '../binance/FuturesTrader';
import { signalStatusTracker } from './SignalStatusTracker';
import { Position } from '@/models/Position';
import { BotExecution } from '@/models/BotExecution';
import { User } from '@/models/User';
import type { TradingSignal } from './types';
import { getUserBalance } from '@/lib/network-balance';
import { deductTradingCommission } from '@/lib/tradingCommission';
import mongoose from 'mongoose';

/**
 * Bot Executor
 * 
 * Core execution engine:
 * - Validates signals before execution
 * - Executes trades on Binance Futures
 * - Manages positions with trailing stops
 * - Handles commission deduction
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ExecutionResult {
  success: boolean;
  positionId?: string;
  executionId?: string;
  error?: string;
}

export class BotExecutor {
  private userId: mongoose.Types.ObjectId;
  private trader: FuturesTrader;
  private activePositions: Map<string, string> = new Map(); // signalId -> positionId
  
  constructor(
    userId: mongoose.Types.ObjectId,
    apiKey: string,
    apiSecret: string,
    useTestnet: boolean = false
  ) {
    this.userId = userId;
    this.trader = new FuturesTrader(apiKey, apiSecret, useTestnet);
  }
  
  /**
   * Validate signal before execution
   */
  async validate(signal: TradingSignal, userSettings: any): Promise<ValidationResult> {
    const errors: string[] = [];
    
    try {
      // 1. Check gas fee balance (minimum $10)
      const user = await User.findById(this.userId);
      if (!user) {
        errors.push('User not found');
        return { valid: false, errors };
      }
      
      const gasFeeBalance = getUserBalance(user);
      if (gasFeeBalance < 10) {
        errors.push(`Insufficient gas fee balance: $${gasFeeBalance.toFixed(2)} (minimum: $10)`);
      }
      
      // 2. Check Binance API connection
      const connectionOk = await this.trader.testConnection();
      if (!connectionOk) {
        errors.push('Binance API connection failed');
      }
      
      // 3. Validate entry price still valid (within 0.2% threshold)
      try {
        const currentPrice = await this.trader.getMarkPrice(signal.symbol);
        const priceDiff = Math.abs((currentPrice - signal.entryPrice) / signal.entryPrice) * 100;
        
        if (priceDiff > 0.2) {
          errors.push(`Entry price moved too much: ${priceDiff.toFixed(2)}% (max: 0.2%)`);
        }
      } catch (error: any) {
        errors.push(`Failed to get current price: ${error.message}`);
      }
      
      // 4. Check position limits
      const openPositions = await Position.find({
        userId: this.userId,
        status: 'OPEN',
      }).countDocuments();
      
      if (openPositions >= userSettings.maxPositions) {
        errors.push(`Max positions reached: ${openPositions}/${userSettings.maxPositions}`);
      }
      
      // 5. Check symbol filter
      if (!userSettings.symbols.includes(signal.symbol)) {
        errors.push(`Symbol ${signal.symbol} not in allowed list: ${userSettings.symbols.join(', ')}`);
      }
      
      // 6. Check strength filter
      const strengthOrder = ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'];
      const signalStrengthIndex = strengthOrder.indexOf(signal.strength);
      const minStrengthIndex = strengthOrder.indexOf(userSettings.minStrength);
      
      if (signalStrengthIndex < minStrengthIndex) {
        errors.push(`Signal strength ${signal.strength} below minimum: ${userSettings.minStrength}`);
      }
      
      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      errors.push(`Validation error: ${error.message}`);
      return { valid: false, errors };
    }
  }
  
  /**
   * Execute trade on Binance
   */
  async execute(signal: TradingSignal, userSettings: any): Promise<ExecutionResult> {
    const executionStart = Date.now();
    
    try {
      // Import models at top of function
      const { default: SignalExecution } = await import('@/models/SignalExecution');
      const { default: SignalCenterSignal } = await import('@/models/SignalCenterSignal');
      
      // ✅ NEW: Record execution attempt in SignalExecution model
      const user = await User.findById(this.userId).select('email +binanceApiKey +binanceApiSecret');
      if (!user) throw new Error('User not found');
      
      let signalExecution;
      try {
        signalExecution = await SignalExecution.recordExecution(
          signal.id,
          this.userId,
          user.email,
          {
            aiDecisionApplied: false, // Will be updated if AI was used
          }
        );
      } catch (error: any) {
        // User already executed this signal
        console.log(`❌ Duplicate execution blocked: User ${this.userId} already executed signal ${signal.id}`);
        return {
          success: false,
          error: 'You have already executed this signal',
        };
      }
      
      // Create legacy execution record (for backward compatibility)
      const execution = new BotExecution({
        userId: this.userId,
        signalId: signal.id,
        symbol: signal.symbol,
        action: signal.action,
        strength: signal.strength,
        status: 'PENDING',
        validationPassed: false,
        signalReceivedAt: new Date(signal.timestamp),
        signalPrice: signal.entryPrice,
        botSettings: {
          riskPerTrade: userSettings.riskPerTrade,
          maxPositions: userSettings.maxPositions,
          leverage: userSettings.leverage,
        },
      });
      
      // Validate signal
      const validation = await this.validate(signal, userSettings);
      execution.validationPassed = validation.valid;
      execution.validationErrors = validation.errors;
      
      if (!validation.valid) {
        execution.status = 'FAILED';
        execution.failureReason = 'Validation failed';
        execution.errorDetails = validation.errors.join('; ');
        await execution.save();
        
        // ✅ NEW: Mark SignalExecution as failed
        await SignalExecution.markAsFailed(
          signal.id,
          this.userId,
          'Validation failed',
          validation.errors.join('; ')
        );
        
        // ❌ REMOVED: Don't mark signal as cancelled globally
        // await signalStatusTracker.markAsCancelled(signal.id, validation.errors[0]);
        // Other users can still execute this signal!
        
        return {
          success: false,
          executionId: (execution._id as mongoose.Types.ObjectId).toString(),
          error: validation.errors.join('; '),
        };
      }
      
      const gasFeeBalance = getUserBalance(user);
      
      // Calculate position size (risk per trade)
      const accountBalance = await this.trader.getBalance();
      const riskAmount = accountBalance * (userSettings.riskPerTrade / 100);
      const stopLossDistance = Math.abs(signal.entryPrice - signal.stopLoss);
      const quantity = riskAmount / stopLossDistance;
      
      // Set leverage
      await this.trader.setLeverage(signal.symbol, userSettings.leverage);
      await this.trader.setMarginType(signal.symbol, 'ISOLATED');
      
      // Execute market order
      const side = signal.action === 'BUY' ? 'BUY' : 'SELL';
      const entryOrder = await this.trader.marketOrder({
        symbol: signal.symbol,
        side,
        type: 'MARKET',
        quantity: parseFloat(quantity.toFixed(3)),
      });
      
      const actualEntryPrice = parseFloat(entryOrder.avgPrice.toString());
      const latency = Date.now() - executionStart;
      
      // Set stop loss and take profit
      const slSide = side === 'BUY' ? 'SELL' : 'BUY';
      const slOrder = await this.trader.stopLossOrder(
        signal.symbol,
        slSide,
        parseFloat(quantity.toFixed(3)),
        signal.stopLoss
      );
      
      const tpOrder = await this.trader.takeProfitOrder(
        signal.symbol,
        slSide,
        parseFloat(quantity.toFixed(3)),
        signal.takeProfit
      );
      
      // Create position record
      const position = new Position({
        userId: this.userId,
        signalId: signal.id,
        symbol: signal.symbol,
        side: side === 'BUY' ? 'LONG' : 'SHORT',
        status: 'OPEN',
        entryPrice: actualEntryPrice,
        entryTime: new Date(),
        quantity: parseFloat(quantity.toFixed(3)),
        leverage: userSettings.leverage,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        initialStopLoss: signal.stopLoss,
        initialTakeProfit: signal.takeProfit,
        trailingProfitActive: false,
        trailingLossActive: false,
        highestProfit: 0,
        lowestLoss: 0,
        gasFeeBalanceBefore: gasFeeBalance,
        entryOrderId: entryOrder.orderId,
        stopLossOrderId: slOrder.orderId,
        takeProfitOrderId: tpOrder.orderId,
      });
      
      await position.save();
      
      // Update legacy execution record
      execution.status = 'EXECUTED';
      execution.executionTime = new Date();
      execution.actualEntryPrice = actualEntryPrice;
      execution.slippage = Math.abs((actualEntryPrice - signal.entryPrice) / signal.entryPrice) * 100;
      execution.latency = latency;
      execution.gasFeeBalanceAtExecution = gasFeeBalance;
      execution.positionId = position._id as mongoose.Types.ObjectId;
      await execution.save();
      
      // ✅ NEW: Update SignalExecution record
      await SignalExecution.markAsExecuted(signal.id, this.userId, {
        actualEntryPrice,
        quantity: parseFloat(quantity.toFixed(3)),
        leverage: userSettings.leverage,
        orderId: entryOrder.orderId,
        positionId: position._id as mongoose.Types.ObjectId,
        slippage: Math.abs((actualEntryPrice - signal.entryPrice) / signal.entryPrice) * 100,
        latency,
      });
      
      // ✅ NEW: Increment executed bots count in SignalCenterSignal
      await SignalCenterSignal.incrementExecuted(signal.id);
      
      // ❌ REMOVED: Don't mark signal as executed globally
      // await signalStatusTracker.markAsExecuted(signal.id, actualEntryPrice, latency);
      // Signal stays ACTIVE for other users!
      
      // ✅ NEW: Log execution stats
      console.log(`✅ Signal executed by user ${this.userId}`);
      const execStats = await SignalExecution.getSignalStats(signal.id);
      console.log(`   Signal stats: ${JSON.stringify(execStats)}`);
      
      // Track active position
      this.activePositions.set(signal.id, (position._id as mongoose.Types.ObjectId).toString());
      
      console.log(`✅ Position opened: ${signal.symbol} ${side} ${quantity} @ $${actualEntryPrice}`);
      
      return {
        success: true,
        positionId: (position._id as mongoose.Types.ObjectId).toString(),
        executionId: (execution._id as mongoose.Types.ObjectId).toString(),
      };
    } catch (error: any) {
      console.error('❌ Execution error:', error);
      
      // Update execution record
      try {
        const execution = await BotExecution.findOne({
          userId: this.userId,
          signalId: signal.id,
        }).sort({ createdAt: -1 });
        
        if (execution) {
          execution.status = 'FAILED';
          execution.failureReason = 'Execution error';
          execution.errorDetails = error.message;
          await execution.save();
        }
        
        // ✅ NEW: Update SignalExecution record
        const { default: SignalExecution } = await import('@/models/SignalExecution');
        await SignalExecution.markAsFailed(
          signal.id,
          this.userId,
          'Execution error',
          error.message
        );
      } catch (err) {
        console.error('Failed to update execution record:', err);
      }
      
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Monitor position and update trailing stops
   */
  async monitorPosition(positionId: string): Promise<void> {
    try {
      const position = await Position.findById(positionId);
      if (!position || position.status !== 'OPEN') return;
      
      // Get current price
      const currentPrice = await this.trader.getMarkPrice(position.symbol);
      
      // Calculate current PnL
      const priceDiff = position.side === 'LONG'
        ? currentPrice - position.entryPrice
        : position.entryPrice - currentPrice;
      
      const pnl = priceDiff * position.quantity;
      const pnlPercentage = (priceDiff / position.entryPrice) * 100;
      
      // Check trailing profit activation (+0.4%)
      if (pnlPercentage >= 0.4 && !position.trailingProfitActive) {
        position.trailingProfitActive = true;
        position.highestProfit = pnlPercentage;
        console.log(`📈 Trailing profit activated for ${position.symbol}`);
      }
      
      // Update highest profit
      if (position.trailingProfitActive && pnlPercentage > position.highestProfit) {
        position.highestProfit = pnlPercentage;
      }
      
      // Check trailing profit exit (drops 0.3% from peak)
      if (position.trailingProfitActive && pnlPercentage <= position.highestProfit - 0.3) {
        await this.closePosition(positionId, 'TRAILING_PROFIT', currentPrice);
        return;
      }
      
      // Check trailing loss activation (-0.3%)
      if (pnlPercentage <= -0.3 && !position.trailingLossActive) {
        position.trailingLossActive = true;
        position.lowestLoss = pnlPercentage;
        console.log(`📉 Trailing loss activated for ${position.symbol}`);
      }
      
      // Update lowest loss
      if (position.trailingLossActive && pnlPercentage < position.lowestLoss) {
        position.lowestLoss = pnlPercentage;
      }
      
      // Check trailing loss exit (recovers 0.2% from lowest)
      if (position.trailingLossActive && pnlPercentage >= position.lowestLoss + 0.2) {
        await this.closePosition(positionId, 'TRAILING_LOSS', currentPrice);
        return;
      }
      
      // Check emergency exit (-2% hard cap)
      if (pnlPercentage <= -2) {
        await this.closePosition(positionId, 'EMERGENCY_EXIT', currentPrice);
        return;
      }
      
      await position.save();
    } catch (error: any) {
      console.error('❌ Monitor position error:', error);
    }
  }
  
  /**
   * Close position and deduct commission
   */
  async closePosition(
    positionId: string,
    reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_PROFIT' | 'TRAILING_LOSS' | 'EMERGENCY_EXIT' | 'MANUAL' | 'SIGNAL_EXPIRED',
    exitPrice: number
  ): Promise<void> {
    try {
      const position = await Position.findById(positionId);
      if (!position || position.status !== 'OPEN') return;
      
      // Cancel existing orders
      await this.trader.cancelAllOrders(position.symbol);
      
      // Close position
      const closeSide = position.side === 'LONG' ? 'SELL' : 'BUY';
      const closeOrder = await this.trader.marketOrder({
        symbol: position.symbol,
        side: closeSide,
        type: 'MARKET',
        quantity: position.quantity,
        reduceOnly: true,
      });
      
      // Calculate final PnL
      const priceDiff = position.side === 'LONG'
        ? exitPrice - position.entryPrice
        : position.entryPrice - exitPrice;
      
      const realizedPnL = priceDiff * position.quantity;
      const realizedPnLPercentage = (priceDiff / position.entryPrice) * 100;
      
      // Deduct commission if profitable
      let commission = 0;
      if (realizedPnL > 0) {
        const result = await deductTradingCommission({
          userId: this.userId.toString(),
          profit: realizedPnL,
          positionId: positionId,
        });
        if (result.success) {
          commission = result.commission || 0;
        }
      }
      
      // Update position
      position.status = 'CLOSED';
      position.exitPrice = exitPrice;
      position.exitTime = new Date();
      position.exitReason = reason;
      position.exitOrderId = closeOrder.orderId;
      position.realizedPnL = realizedPnL;
      position.realizedPnLPercentage = realizedPnLPercentage;
      position.commission = commission;
      
      const user = await User.findById(this.userId);
      if (user) {
        position.gasFeeBalanceAfter = getUserBalance(user);
      }
      
      await position.save();
      
      // Remove from active positions
      this.activePositions.delete(position.signalId);
      
      console.log(`🏁 Position closed: ${position.symbol} ${reason} PnL: $${realizedPnL.toFixed(2)} (${realizedPnLPercentage.toFixed(2)}%)`);
    } catch (error: any) {
      console.error('❌ Close position error:', error);
    }
  }
  
  /**
   * Get all active positions for this user
   */
  async getActivePositions(): Promise<any[]> {
    return Position.find({
      userId: this.userId,
      status: 'OPEN',
    }).sort({ createdAt: -1 });
  }
  
  /**
   * Get position by ID
   */
  async getPosition(positionId: string): Promise<any> {
    return Position.findById(positionId);
  }
}
