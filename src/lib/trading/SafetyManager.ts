import { BotInstance } from '@/models/BotInstance';
import { TradeLog } from '@/models/TradeLog';

export interface SafetyCheck {
  passed: boolean;
  reason?: string;
  action: 'ALLOW' | 'BLOCK' | 'WARN';
  details?: any;
}

export class SafetyManager {
  private botInstanceId: string;
  private userId: string;
  private config: any;

  constructor(botInstanceId: string, userId: string, config: any) {
    this.botInstanceId = botInstanceId;
    this.userId = userId;
    this.config = config;
  }

  /**
   * Check if daily loss limit has been exceeded
   */
  async checkDailyLossLimit(currentDailyPnL: number): Promise<SafetyCheck> {
    const maxDailyLoss = this.config.maxDailyLoss || 100;

    if (Math.abs(currentDailyPnL) >= maxDailyLoss && currentDailyPnL < 0) {
      // Log safety trigger
      await TradeLog.create({
        userId: this.userId,
        botInstanceId: this.botInstanceId,
        botName: 'Safety Manager',
        logType: 'SAFETY',
        severity: 'CRITICAL',
        action: 'DAILY_LIMIT_REACHED',
        message: `Daily loss limit of $${maxDailyLoss} exceeded. Current loss: $${Math.abs(currentDailyPnL)}`,
        safetyTrigger: {
          triggered: true,
          reason: 'DAILY_LOSS_LIMIT',
          threshold: maxDailyLoss,
          currentValue: Math.abs(currentDailyPnL),
        },
      });

      return {
        passed: false,
        reason: `Daily loss limit exceeded: -$${Math.abs(currentDailyPnL).toFixed(2)} / $${maxDailyLoss}`,
        action: 'BLOCK',
        details: { currentDailyPnL, maxDailyLoss },
      };
    }

    // Warning at 80% of limit
    if (Math.abs(currentDailyPnL) >= maxDailyLoss * 0.8 && currentDailyPnL < 0) {
      await TradeLog.create({
        userId: this.userId,
        botInstanceId: this.botInstanceId,
        botName: 'Safety Manager',
        logType: 'SAFETY',
        severity: 'WARNING',
        action: 'APPROACHING_DAILY_LIMIT',
        message: `Approaching daily loss limit: $${Math.abs(currentDailyPnL)} / $${maxDailyLoss}`,
        safetyTrigger: {
          triggered: false,
          reason: 'DAILY_LOSS_WARNING',
          threshold: maxDailyLoss,
          currentValue: Math.abs(currentDailyPnL),
        },
      });

      return {
        passed: true,
        reason: `Warning: Approaching daily loss limit (${((Math.abs(currentDailyPnL) / maxDailyLoss) * 100).toFixed(0)}%)`,
        action: 'WARN',
        details: { currentDailyPnL, maxDailyLoss },
      };
    }

    return {
      passed: true,
      action: 'ALLOW',
    };
  }

  /**
   * Check if position size is within limits
   */
  async checkPositionSize(
    proposedQuantity: number,
    currentPrice: number,
    balance: number
  ): Promise<SafetyCheck> {
    const positionValue = proposedQuantity * currentPrice;
    const maxPositionPercent = this.config.positionSizePercent || 10;
    const maxPositionValue = (balance * maxPositionPercent) / 100;

    if (positionValue > maxPositionValue) {
      await TradeLog.create({
        userId: this.userId,
        botInstanceId: this.botInstanceId,
        botName: 'Safety Manager',
        logType: 'SAFETY',
        severity: 'ERROR',
        action: 'POSITION_SIZE_EXCEEDED',
        message: `Position size exceeds limit: $${positionValue.toFixed(2)} > $${maxPositionValue.toFixed(2)}`,
        safetyTrigger: {
          triggered: true,
          reason: 'POSITION_SIZE_EXCEEDED',
          threshold: maxPositionValue,
          currentValue: positionValue,
        },
        data: {
          proposedQuantity,
          currentPrice,
          balance,
          maxPositionPercent,
        },
      });

      return {
        passed: false,
        reason: `Position size exceeds ${maxPositionPercent}% of balance`,
        action: 'BLOCK',
        details: { positionValue, maxPositionValue, proposedQuantity },
      };
    }

    return {
      passed: true,
      action: 'ALLOW',
    };
  }

  /**
   * Check if leverage is within safe limits
   */
  async checkLeverage(leverage: number): Promise<SafetyCheck> {
    const maxLeverage = this.config.leverage || 10;

    if (leverage > maxLeverage) {
      await TradeLog.create({
        userId: this.userId,
        botInstanceId: this.botInstanceId,
        botName: 'Safety Manager',
        logType: 'SAFETY',
        severity: 'ERROR',
        action: 'LEVERAGE_EXCEEDED',
        message: `Leverage exceeds configured limit: ${leverage}x > ${maxLeverage}x`,
        safetyTrigger: {
          triggered: true,
          reason: 'LEVERAGE_EXCEEDED',
          threshold: maxLeverage,
          currentValue: leverage,
        },
      });

      return {
        passed: false,
        reason: `Leverage ${leverage}x exceeds limit ${maxLeverage}x`,
        action: 'BLOCK',
        details: { leverage, maxLeverage },
      };
    }

    return {
      passed: true,
      action: 'ALLOW',
    };
  }

  /**
   * Check consecutive losses
   */
  async checkConsecutiveLosses(
    recentTrades: any[]
  ): Promise<SafetyCheck> {
    const maxConsecutiveLosses = 5;
    let consecutiveLosses = 0;

    for (const trade of recentTrades) {
      if (trade.pnl < 0) {
        consecutiveLosses++;
      } else {
        break;
      }
    }

    if (consecutiveLosses >= maxConsecutiveLosses) {
      await TradeLog.create({
        userId: this.userId,
        botInstanceId: this.botInstanceId,
        botName: 'Safety Manager',
        logType: 'SAFETY',
        severity: 'CRITICAL',
        action: 'CONSECUTIVE_LOSSES',
        message: `${consecutiveLosses} consecutive losses detected. Bot paused for safety.`,
        safetyTrigger: {
          triggered: true,
          reason: 'CONSECUTIVE_LOSSES',
          threshold: maxConsecutiveLosses,
          currentValue: consecutiveLosses,
        },
      });

      return {
        passed: false,
        reason: `${consecutiveLosses} consecutive losses. Bot paused for safety review.`,
        action: 'BLOCK',
        details: { consecutiveLosses, maxConsecutiveLosses },
      };
    }

    // Warning at 3 consecutive losses
    if (consecutiveLosses >= 3) {
      await TradeLog.create({
        userId: this.userId,
        botInstanceId: this.botInstanceId,
        botName: 'Safety Manager',
        logType: 'SAFETY',
        severity: 'WARNING',
        action: 'MULTIPLE_LOSSES',
        message: `${consecutiveLosses} consecutive losses. Monitor closely.`,
        data: { consecutiveLosses },
      });

      return {
        passed: true,
        reason: `Warning: ${consecutiveLosses} consecutive losses`,
        action: 'WARN',
        details: { consecutiveLosses },
      };
    }

    return {
      passed: true,
      action: 'ALLOW',
    };
  }

  /**
   * Log trade execution
   */
  async logTrade(
    action: string,
    tradeDetails: any,
    message?: string
  ): Promise<void> {
    await TradeLog.create({
      userId: this.userId,
      botInstanceId: this.botInstanceId,
      botName: tradeDetails.botName || 'Trading Bot',
      logType: 'TRADE',
      severity: 'INFO',
      action,
      message: message || `${action} executed successfully`,
      tradeDetails: {
        symbol: tradeDetails.symbol,
        side: tradeDetails.side,
        entryPrice: tradeDetails.entryPrice,
        exitPrice: tradeDetails.exitPrice,
        quantity: tradeDetails.quantity,
        leverage: tradeDetails.leverage,
        pnl: tradeDetails.pnl,
        pnlPercent: tradeDetails.pnlPercent,
        fees: tradeDetails.fees,
        orderId: tradeDetails.orderId,
      },
    });
  }

  /**
   * Log error
   */
  async logError(error: Error, action?: string): Promise<void> {
    await TradeLog.create({
      userId: this.userId,
      botInstanceId: this.botInstanceId,
      botName: 'Trading Bot',
      logType: 'ERROR',
      severity: 'ERROR',
      action: action || 'ERROR',
      message: error.message,
      data: {
        stack: error.stack,
        name: error.name,
      },
    });
  }

  /**
   * Log analysis result
   */
  async logAnalysis(signal: any, message: string): Promise<void> {
    await TradeLog.create({
      userId: this.userId,
      botInstanceId: this.botInstanceId,
      botName: 'Trading Bot',
      logType: 'ANALYSIS',
      severity: 'INFO',
      action: signal.action,
      message,
      data: {
        signal,
        confidence: signal.confidence,
        reason: signal.reason,
        indicators: signal.indicators,
      },
    });
  }

  /**
   * Emergency stop - immediately halt all trading
   */
  async emergencyStop(reason: string): Promise<void> {
    await TradeLog.create({
      userId: this.userId,
      botInstanceId: this.botInstanceId,
      botName: 'Safety Manager',
      logType: 'SAFETY',
      severity: 'CRITICAL',
      action: 'EMERGENCY_STOP',
      message: `Emergency stop triggered: ${reason}`,
      safetyTrigger: {
        triggered: true,
        reason: 'EMERGENCY_STOP',
      },
    });

    // Update bot status to PAUSED
    await BotInstance.findByIdAndUpdate(this.botInstanceId, {
      status: 'PAUSED',
      lastError: {
        timestamp: new Date(),
        message: `Emergency stop: ${reason}`,
      },
    });
  }

  /**
   * Run all safety checks before allowing a trade
   */
  async runPreTradeChecks(params: {
    currentDailyPnL: number;
    proposedQuantity: number;
    currentPrice: number;
    balance: number;
    leverage: number;
    recentTrades: any[];
  }): Promise<{ passed: boolean; failures: SafetyCheck[] }> {
    const checks: SafetyCheck[] = [];

    // Daily loss limit check
    const lossCheck = await this.checkDailyLossLimit(params.currentDailyPnL);
    checks.push(lossCheck);

    // Position size check
    const positionCheck = await this.checkPositionSize(
      params.proposedQuantity,
      params.currentPrice,
      params.balance
    );
    checks.push(positionCheck);

    // Leverage check
    const leverageCheck = await this.checkLeverage(params.leverage);
    checks.push(leverageCheck);

    // Consecutive losses check
    const lossesCheck = await this.checkConsecutiveLosses(params.recentTrades);
    checks.push(lossesCheck);

    // Check if any critical checks failed
    const failures = checks.filter((c) => c.action === 'BLOCK');
    const passed = failures.length === 0;

    if (!passed) {
      await this.logError(
        new Error('Pre-trade safety checks failed'),
        'SAFETY_CHECK_FAILED'
      );
    }

    return { passed, failures };
  }
}
