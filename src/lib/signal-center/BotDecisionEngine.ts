/**
 * 🤖 BOT DECISION ENGINE
 * 
 * Consumes signals from Signal Center and decides whether user bot should execute
 * Based on user settings, account state, and risk management rules
 * 
 * This is what each user's bot uses to make trading decisions
 */

import {
  TradingSignal,
  BotDecisionInput,
  BotDecisionOutput,
  SignalStrength,
} from './types';

export class BotDecisionEngine {
  /**
   * Main decision function: Should this bot execute the signal?
   */
  static shouldExecute(input: BotDecisionInput): BotDecisionOutput {
    const { signal, userSettings, accountState } = input;
    const rejectionReasons: string[] = [];
    
    // ===== GATE 1: Bot Enabled =====
    if (!userSettings.botEnabled) {
      return {
        shouldExecute: false,
        reason: 'Bot is disabled',
        rejectionReasons: ['Bot disabled'],
      };
    }
    
    // ===== GATE 2: Symbol Filter =====
    if (!userSettings.symbols.includes(signal.symbol)) {
      return {
        shouldExecute: false,
        reason: `Symbol ${signal.symbol} not in user's allowed list`,
        rejectionReasons: [`Symbol ${signal.symbol} not allowed`],
      };
    }
    
    // ===== GATE 3: Gas Fee Balance =====
    const MIN_GAS_FEE = 10; // $10 minimum
    if (accountState.gasFeeBalance < MIN_GAS_FEE) {
      return {
        shouldExecute: false,
        reason: `Insufficient gas fee balance ($${accountState.gasFeeBalance.toFixed(2)} < $${MIN_GAS_FEE})`,
        rejectionReasons: ['Insufficient gas fee balance'],
      };
    }
    
    // ===== GATE 4: Confidence Level =====
    if (signal.confidence < userSettings.minConfidence) {
      return {
        shouldExecute: false,
        reason: `Signal confidence ${signal.confidence.toFixed(1)}% below minimum ${userSettings.minConfidence}%`,
        rejectionReasons: [`Confidence too low: ${signal.confidence.toFixed(1)}%`],
      };
    }
    
    // ===== GATE 5: Signal Strength =====
    if (!userSettings.followStrength.includes(signal.strength)) {
      return {
        shouldExecute: false,
        reason: `Signal strength ${signal.strength} not in follow list: [${userSettings.followStrength.join(', ')}]`,
        rejectionReasons: [`Signal strength ${signal.strength} not followed`],
      };
    }
    
    // ===== GATE 6: Max Positions =====
    if (accountState.activePositions >= userSettings.maxPositions) {
      return {
        shouldExecute: false,
        reason: `Max positions reached (${accountState.activePositions}/${userSettings.maxPositions})`,
        rejectionReasons: ['Max positions reached'],
      };
    }
    
    // ===== GATE 7: Daily Loss Limit =====
    const MAX_DAILY_LOSS = accountState.balance * 0.05; // 5% of balance
    if (accountState.dailyLoss >= MAX_DAILY_LOSS) {
      return {
        shouldExecute: false,
        reason: `Daily loss limit reached ($${accountState.dailyLoss.toFixed(2)} >= $${MAX_DAILY_LOSS.toFixed(2)})`,
        rejectionReasons: ['Daily loss limit reached'],
      };
    }
    
    // ===== GATE 8: Available Balance =====
    const availableBalance = accountState.balance - accountState.usedMargin;
    const requiredMargin = this.calculateRequiredMargin(
      signal,
      accountState.balance,
      userSettings.riskMultiplier
    );
    
    if (availableBalance < requiredMargin) {
      return {
        shouldExecute: false,
        reason: `Insufficient balance: $${availableBalance.toFixed(2)} < $${requiredMargin.toFixed(2)} required`,
        rejectionReasons: ['Insufficient balance for margin'],
      };
    }
    
    // ===== GATE 9: Signal Expiry =====
    if (Date.now() > signal.expiresAt) {
      return {
        shouldExecute: false,
        reason: 'Signal has expired',
        rejectionReasons: ['Signal expired'],
      };
    }
    
    // ===== ALL GATES PASSED - CALCULATE POSITION =====
    const adjustedPosition = this.calculatePosition(
      signal,
      accountState.balance,
      userSettings
    );
    
    return {
      shouldExecute: true,
      reason: `Signal approved: ${signal.action} ${signal.symbol} @ $${signal.entryPrice.toFixed(2)} (${signal.strength}, ${signal.confidence.toFixed(1)}%)`,
      adjustedPosition,
    };
  }
  
  /**
   * Calculate required margin for trade
   */
  private static calculateRequiredMargin(
    signal: TradingSignal,
    balance: number,
    riskMultiplier: number
  ): number {
    // Risk per trade (default 2%)
    const baseRisk = 0.02;
    const adjustedRisk = baseRisk * riskMultiplier;
    const riskAmount = balance * adjustedRisk;
    
    // Stop loss distance
    const stopLossDistance = Math.abs(signal.entryPrice - signal.stopLoss);
    const stopLossPercent = stopLossDistance / signal.entryPrice;
    
    // Position size
    const positionSize = riskAmount / stopLossDistance;
    const notionalValue = positionSize * signal.entryPrice;
    
    // Margin (with leverage)
    const leverage = 10; // Default leverage
    const marginRequired = notionalValue / leverage;
    
    return marginRequired;
  }
  
  /**
   * Calculate position details with user adjustments
   */
  private static calculatePosition(
    signal: TradingSignal,
    balance: number,
    userSettings: any
  ): {
    size: number;
    stopLoss: number;
    takeProfit: number;
    leverage: number;
  } {
    // Calculate position size based on risk
    const baseRisk = 0.02; // 2%
    const adjustedRisk = baseRisk * userSettings.riskMultiplier;
    const riskAmount = balance * adjustedRisk;
    
    // Stop loss (can be overridden by user)
    let stopLoss = signal.stopLoss;
    if (userSettings.customStopLoss) {
      stopLoss =
        signal.action === 'BUY'
          ? signal.entryPrice * (1 - userSettings.customStopLoss)
          : signal.entryPrice * (1 + userSettings.customStopLoss);
    }
    
    // Take profit (can be overridden by user)
    let takeProfit = signal.takeProfit;
    if (userSettings.customTakeProfit) {
      takeProfit =
        signal.action === 'BUY'
          ? signal.entryPrice * (1 + userSettings.customTakeProfit)
          : signal.entryPrice * (1 - userSettings.customTakeProfit);
    }
    
    // Position size
    const stopLossDistance = Math.abs(signal.entryPrice - stopLoss);
    const size = riskAmount / stopLossDistance;
    
    return {
      size,
      stopLoss,
      takeProfit,
      leverage: 10, // Default leverage
    };
  }
  
  /**
   * Check if position should be closed (trailing stops, max profit/loss)
   */
  static shouldClosePosition(
    signal: TradingSignal,
    currentPrice: number,
    entryPrice: number,
    highestPrice: number,
    lowestPrice: number,
    userSettings: any
  ): {
    shouldClose: boolean;
    reason: string;
    type: 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_PROFIT' | 'TRAILING_LOSS' | 'EMERGENCY' | null;
  } {
    const profitPct = (currentPrice - entryPrice) / entryPrice;
    const isLong = signal.action === 'BUY';
    
    // Adjust profit for SHORT positions
    const adjustedProfitPct = isLong ? profitPct : -profitPct;
    
    // ===== CHECK 1: Emergency Exit (-2%) =====
    const EMERGENCY_EXIT = -0.02;
    if (adjustedProfitPct <= EMERGENCY_EXIT) {
      return {
        shouldClose: true,
        reason: `Emergency exit: ${(adjustedProfitPct * 100).toFixed(2)}% loss`,
        type: 'EMERGENCY',
      };
    }
    
    // ===== CHECK 2: Stop Loss Hit =====
    if (
      (isLong && currentPrice <= signal.stopLoss) ||
      (!isLong && currentPrice >= signal.stopLoss)
    ) {
      return {
        shouldClose: true,
        reason: `Stop loss hit: $${currentPrice.toFixed(2)} vs $${signal.stopLoss.toFixed(2)}`,
        type: 'STOP_LOSS',
      };
    }
    
    // ===== CHECK 3: Take Profit Hit =====
    if (
      (isLong && currentPrice >= signal.takeProfit) ||
      (!isLong && currentPrice <= signal.takeProfit)
    ) {
      return {
        shouldClose: true,
        reason: `Take profit hit: $${currentPrice.toFixed(2)} vs $${signal.takeProfit.toFixed(2)}`,
        type: 'TAKE_PROFIT',
      };
    }
    
    // ===== CHECK 4: Trailing Profit =====
    if (userSettings.useTrailingStops && signal.trailingStop) {
      const { profitActivate, profitDistance } = signal.trailingStop;
      
      // Check if trailing activated
      const peakProfitPct = (highestPrice - entryPrice) / entryPrice;
      const adjustedPeakProfitPct = isLong ? peakProfitPct : -peakProfitPct;
      
      if (adjustedPeakProfitPct >= profitActivate) {
        // Trail from peak
        const trailThreshold = adjustedPeakProfitPct - profitDistance;
        
        if (adjustedProfitPct <= trailThreshold) {
          return {
            shouldClose: true,
            reason: `Trailing profit: ${(adjustedProfitPct * 100).toFixed(2)}% dropped from peak ${(adjustedPeakProfitPct * 100).toFixed(2)}%`,
            type: 'TRAILING_PROFIT',
          };
        }
      }
    }
    
    // ===== CHECK 5: Trailing Loss =====
    if (userSettings.useTrailingStops && signal.trailingStop) {
      const { lossActivate, lossDistance } = signal.trailingStop;
      
      // Check if trailing activated
      const lowestLossPct = (lowestPrice - entryPrice) / entryPrice;
      const adjustedLowestLossPct = isLong ? lowestLossPct : -lowestLossPct;
      
      if (adjustedLowestLossPct <= lossActivate) {
        // Trail from lowest
        const trailThreshold = adjustedLowestLossPct + lossDistance;
        
        if (adjustedProfitPct >= trailThreshold) {
          return {
            shouldClose: true,
            reason: `Trailing loss: ${(adjustedProfitPct * 100).toFixed(2)}% recovered from lowest ${(adjustedLowestLossPct * 100).toFixed(2)}%`,
            type: 'TRAILING_LOSS',
          };
        }
      }
    }
    
    // Position stays open
    return {
      shouldClose: false,
      reason: 'Position within limits',
      type: null,
    };
  }
  
  /**
   * Validate user settings
   */
  static validateSettings(settings: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!settings.userId) errors.push('Missing userId');
    if (settings.symbols.length === 0) errors.push('No symbols selected');
    if (settings.maxPositions < 1) errors.push('maxPositions must be >= 1');
    if (settings.riskMultiplier < 0.1 || settings.riskMultiplier > 3)
      errors.push('riskMultiplier must be between 0.1 and 3');
    if (settings.minConfidence < 0 || settings.minConfidence > 100)
      errors.push('minConfidence must be between 0 and 100');
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
