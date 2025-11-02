/**
 * 🔍 POSITION MONITOR
 * 
 * Continuous monitoring untuk trade yang aktif.
 * Features:
 * - Real-time position monitoring
 * - Signal reversal detection
 * - Auto-intervention (early exit, trailing stop, SL adjustment)
 * - Emergency exit on dangerous conditions
 * - Break-even stop automation
 */

import { BinanceClient } from '../binance';
import { LiveSignalEngine, TradingSignal } from './engines/LiveSignalEngine';
import { fetchBinanceCandles } from './engines/CandleFetcher';
import { TradeManager } from './TradeManager';
import { TradeLog } from '@/models/TradeLog';
import { Trade } from '@/models/Trade';
import { SmartInterventionValidator, ValidationResult } from './SmartInterventionValidator';
import { NewsDrivenIntervention, NewsInterventionResult } from './NewsDrivenIntervention';
import { onProfitUpdate } from './hooks';

export interface MonitorConfig {
  checkInterval: number; // Check every X seconds (default: 10s)
  enableTrailingStop: boolean; // Enable trailing stop
  trailingStopPercent: number; // Trailing stop distance (default: 2%)
  enableBreakEven: boolean; // Move SL to break-even when in profit
  breakEvenTriggerPercent: number; // Trigger break-even at X% profit (default: 1.5%)
  enableSignalReversal?: boolean; // Monitor for signal reversals
  signalReversalThreshold?: number; // Confidence threshold for reversal (default: 75%)
  enableEarlyExit?: boolean; // Exit early on weak signals
  earlyExitThreshold?: number; // Exit if signal confidence drops below X% (default: 40%)
  enableNewsMonitoring?: boolean; // Monitor news for fundamental changes
  enablePartialTP?: boolean; // Enable partial take profit
  partialTPLevels?: Array<{ profit: number; closePercent: number }>; // Partial TP levels
  enableNewsIntervention?: boolean; // Enable news-driven emergency intervention
  enableSmartValidation?: boolean; // Enable smart intervention validation
}

export interface MonitorAlert {
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  reason: string;
  action: 'HOLD' | 'ADJUST_SL' | 'ADJUST_TP' | 'CLOSE_POSITION' | 'ENABLE_TRAILING';
  details?: any;
}

export interface PositionStatus {
  tradeId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  stopLoss: number;
  takeProfit: number;
  highestPrice?: number; // For trailing stop (LONG)
  lowestPrice?: number; // For trailing stop (SHORT)
  breakEvenEnabled: boolean;
  trailingStopEnabled: boolean;
  alerts: MonitorAlert[];
}

export class PositionMonitor {
  private userId: string;
  private tradeId: string;
  private binanceApiKey: string;
  private binanceApiSecret: string;
  private config: MonitorConfig;
  private signalEngine: LiveSignalEngine;
  private newsInterventionSystem: NewsDrivenIntervention;
  private isMonitoring: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private positionStatus: PositionStatus | null = null;

  constructor(
    userId: string,
    tradeId: string,
    apiKey: string,
    apiSecret: string,
    config?: Partial<MonitorConfig>
  ) {
    this.userId = userId;
    this.tradeId = tradeId;
    this.binanceApiKey = apiKey;
    this.binanceApiSecret = apiSecret;
    
    // Default config
    this.config = {
      checkInterval: 10, // 10 seconds
      enableTrailingStop: true,
      trailingStopPercent: 2.0,
      enableBreakEven: true,
      breakEvenTriggerPercent: 1.5,
      enableSignalReversal: true,
      signalReversalThreshold: 75,
      enableEarlyExit: true,
      earlyExitThreshold: 40,
      enableNewsMonitoring: true,
      ...config,
    };

    this.signalEngine = new LiveSignalEngine();
    this.newsInterventionSystem = new NewsDrivenIntervention();
  }

  // ==========================================================================
  // 🚀 START MONITORING
  // ==========================================================================

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Position monitor already running');
      return;
    }

    console.log(`🔍 Starting position monitor for trade ${this.tradeId}...`);
    this.isMonitoring = true;

    // Initial check
    await this.checkPosition();

    // Schedule continuous checks
    this.monitorInterval = setInterval(async () => {
      try {
        await this.checkPosition();
      } catch (error) {
        console.error('❌ Error in position monitor:', error);
        await this.logError(error, 'MONITOR_ERROR');
      }
    }, this.config.checkInterval * 1000);

    console.log(`✅ Position monitor started (checking every ${this.config.checkInterval}s)`);
  }

  // ==========================================================================
  // 🛑 STOP MONITORING
  // ==========================================================================

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Position monitor stopped');
  }

  // ==========================================================================
  // 🔍 CHECK POSITION
  // ==========================================================================

  private async checkPosition(): Promise<void> {
    try {
      // Get trade from database
      const trade = await Trade.findById(this.tradeId);
      if (!trade) {
        console.log('❌ Trade not found, stopping monitor');
        this.stopMonitoring();
        return;
      }

      // If trade is closed, stop monitoring
      if (trade.status === 'closed') {
        console.log('✅ Trade closed, stopping monitor');
        this.stopMonitoring();
        return;
      }

      // Get current price from Binance
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);
      const ticker = await binance.futuresMarkPrice({ symbol: trade.symbol });
      const currentPrice = parseFloat(ticker.markPrice);

      // Calculate current PnL (assume 10x leverage if not specified)
      const leverage = 10;
      const pnl = this.calculatePnL(
        trade.side,
        trade.entryPrice,
        currentPrice,
        trade.quantity,
        leverage
      );
      const pnlPercent = ((pnl / (trade.entryPrice * trade.quantity)) * 100);

      // Initialize position status
      if (!this.positionStatus) {
        this.positionStatus = {
          tradeId: this.tradeId,
          symbol: trade.symbol,
          side: trade.side.toUpperCase() as 'LONG' | 'SHORT',
          entryPrice: trade.entryPrice,
          currentPrice,
          quantity: trade.quantity,
          pnl,
          pnlPercent,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          highestPrice: trade.side === 'long' ? currentPrice : undefined,
          lowestPrice: trade.side === 'short' ? currentPrice : undefined,
          breakEvenEnabled: false,
          trailingStopEnabled: false,
          alerts: [],
        };
      } else {
        // Update position status
        this.positionStatus.currentPrice = currentPrice;
        this.positionStatus.pnl = pnl;
        this.positionStatus.pnlPercent = pnlPercent;
        this.positionStatus.alerts = [];

        // Track highest/lowest price for trailing stop
        if (trade.side === 'long' && (!this.positionStatus.highestPrice || currentPrice > this.positionStatus.highestPrice)) {
          this.positionStatus.highestPrice = currentPrice;
        }
        if (trade.side === 'short' && (!this.positionStatus.lowestPrice || currentPrice < this.positionStatus.lowestPrice)) {
          this.positionStatus.lowestPrice = currentPrice;
        }
      }

      console.log(`📊 Position Status: ${trade.symbol} ${trade.side.toUpperCase()} | Entry: $${trade.entryPrice} | Current: $${currentPrice} | P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);

      // � TRADING COMMISSION: Check if position should auto-close (profit approaching gas fee balance limit)
      if (pnl > 0) {
        const autoCloseCheck = await onProfitUpdate(this.userId, pnl, trade._id?.toString());
        
        if (autoCloseCheck.shouldClose) {
          console.log(`🚨 AUTO-CLOSE TRIGGERED: ${autoCloseCheck.reason}`);
          console.log(`💰 Current Profit: $${autoCloseCheck.currentProfit.toFixed(2)}`);
          console.log(`📊 Max Profit: $${autoCloseCheck.maxProfit.toFixed(2)}`);
          console.log(`🎯 Threshold: $${autoCloseCheck.threshold.toFixed(2)}`);
          
          this.positionStatus.alerts.push({
            type: 'CRITICAL',
            reason: `AUTO-CLOSE: ${autoCloseCheck.reason}`,
            action: 'CLOSE_POSITION',
            details: {
              currentProfit: autoCloseCheck.currentProfit,
              maxProfit: autoCloseCheck.maxProfit,
              threshold: autoCloseCheck.threshold,
            },
          });
          
          // Immediately process alert to close position
          await this.processAlerts(trade);
          return; // Exit monitoring after auto-close
        }
      }

      // �🚨 PRIORITY 1: Check NEWS for critical events (hacks, regulations)
      await this.checkNewsIntervention(trade);

      // Run all monitoring checks
      await this.checkBreakEven(trade);
      await this.checkTrailingStop(trade);
      await this.checkSignalReversal(trade);
      await this.checkEarlyExit(trade);
      await this.checkEmergencyConditions(trade);

      // Process alerts
      if (this.positionStatus.alerts.length > 0) {
        await this.processAlerts(trade);
      }

    } catch (error) {
      console.error('Error checking position:', error);
      throw error;
    }
  }

  // ==========================================================================
  // � CHECK NEWS INTERVENTION (PRIORITY 1)
  // ==========================================================================

  private async checkNewsIntervention(trade: any): Promise<void> {
    if (!this.config.enableNewsMonitoring || !this.positionStatus) return;

    try {
      console.log(`📰 Checking news for ${trade.symbol}...`);

      // Get news intervention analysis
      const newsResult = await this.newsInterventionSystem.checkNewsIntervention(
        trade.symbol,
        {
          side: this.positionStatus.side,
          entryPrice: this.positionStatus.entryPrice,
          pnlPercent: this.positionStatus.pnlPercent,
        }
      );

      if (!newsResult.shouldIntervene) {
        console.log(`   No news intervention needed (${newsResult.impact.severity} impact)`);
        return;
      }

      // Validate news strength
      const validation = NewsDrivenIntervention.validateNewsStrength(
        newsResult.impact,
        {
          side: this.positionStatus.side,
          entryPrice: this.positionStatus.entryPrice,
          pnlPercent: this.positionStatus.pnlPercent,
        }
      );

      console.log(`🔍 News Validation: ${validation.isStrong ? 'STRONG' : 'WEAK'}`);
      validation.reasons.forEach(r => console.log(`   ${r}`));

      if (!validation.shouldAct) {
        console.log(`   News not strong enough for intervention`);
        return;
      }

      // Create alert based on severity
      const alertType: 'CRITICAL' | 'WARNING' | 'INFO' = 
        newsResult.emergencyExit ? 'CRITICAL' :
        newsResult.impact.severity === 'HIGH' ? 'WARNING' : 'INFO';

      const action: MonitorAlert['action'] = 
        newsResult.emergencyExit ? 'CLOSE_POSITION' :
        newsResult.impact.action === 'CLOSE_POSITION' ? 'CLOSE_POSITION' :
        newsResult.impact.action === 'ADJUST_SL' ? 'ADJUST_SL' : 'HOLD';

      // Build detailed reason
      let reason = `📰 NEWS-DRIVEN INTERVENTION (${newsResult.impact.confidence}% confidence)\n`;
      reason += `Severity: ${newsResult.impact.severity} | Category: ${newsResult.impact.category}\n`;
      reason += newsResult.impact.reasons.join('\n');

      if (newsResult.emergencyExit) {
        reason = `🚨 EMERGENCY EXIT - CRITICAL NEWS DETECTED!\n` + reason;
      }

      // Add reposition recommendation if available
      if (newsResult.repositionRecommendation) {
        const recom = newsResult.repositionRecommendation;
        reason += `\n\n💡 REPOSITION RECOMMENDATION:`;
        reason += `\n   Direction: ${recom.direction}`;
        reason += `\n   Entry Timing: ${recom.entryTiming}`;
        reason += `\n   Confidence: ${recom.confidence}%`;
        reason += `\n   Reason: ${recom.reason}`;
      }

      this.positionStatus.alerts.push({
        type: alertType,
        reason,
        action,
        details: {
          newsImpact: newsResult.impact,
          newsItems: newsResult.newsItems,
          repositionRecommendation: newsResult.repositionRecommendation,
          emergencyExit: newsResult.emergencyExit,
        },
      });

      if (newsResult.emergencyExit) {
        console.log(`🚨 EMERGENCY EXIT TRIGGERED BY NEWS!`);
        console.log(`   Category: ${newsResult.impact.category}`);
        console.log(`   Action within: ${newsResult.impact.timeWindow} minutes`);
      } else {
        console.log(`⚠️ News intervention required: ${action}`);
      }

    } catch (error) {
      console.error('Error checking news intervention:', error);
    }
  }

  // ==========================================================================
  // �📈 CHECK BREAK-EVEN STOP
  // ==========================================================================

  private async checkBreakEven(trade: any): Promise<void> {
    if (!this.config.enableBreakEven || !this.positionStatus) return;
    if (this.positionStatus.breakEvenEnabled) return; // Already enabled

    const profitPercent = Math.abs(this.positionStatus.pnlPercent);

    if (profitPercent >= this.config.breakEvenTriggerPercent) {
      // 🧠 SMART VALIDATION: Use enhanced market regime detection
      try {
        const smartValidation = await this.validateBreakEvenTiming();

        if (smartValidation.shouldTrigger) {
          // Move stop loss to break-even (entry price)
          this.positionStatus.alerts.push({
            type: 'INFO',
            reason: `✅ Break-even SMART validation (${profitPercent.toFixed(2)}% profit)\n${smartValidation.reason}`,
            action: 'ADJUST_SL',
            details: {
              oldStopLoss: this.positionStatus.stopLoss,
              newStopLoss: this.positionStatus.entryPrice,
              type: 'BREAK_EVEN',
              validationConfidence: smartValidation.confidence,
              smartReason: smartValidation.reason,
            },
          });

          this.positionStatus.breakEvenEnabled = true;
          console.log(`✅ Break-even SMART validated at ${profitPercent.toFixed(2)}% profit`);
          console.log(`   Reason: ${smartValidation.reason}`);
        } else {
          console.log(`🧠 Break-even DELAYED by smart validation`);
          console.log(`   Reason: ${smartValidation.reason}`);
          console.log(`   Confidence: ${smartValidation.confidence}%`);
        }
      } catch (error) {
        console.error('Error in smart break-even validation:', error);
        // Fallback to basic break-even without validation
        this.positionStatus.alerts.push({
          type: 'INFO',
          reason: `Position in profit ${profitPercent.toFixed(2)}% - Moving SL to break-even (fallback)`,
          action: 'ADJUST_SL',
          details: {
            oldStopLoss: this.positionStatus.stopLoss,
            newStopLoss: this.positionStatus.entryPrice,
            type: 'BREAK_EVEN',
          },
        });
        this.positionStatus.breakEvenEnabled = true;
      }
    }
  }

  // ==========================================================================
  // 📉 CHECK TRAILING STOP
  // ==========================================================================

  private async checkTrailingStop(trade: any): Promise<void> {
    if (!this.config.enableTrailingStop || !this.positionStatus) return;

    const trailingPercent = this.config.trailingStopPercent / 100;
    let shouldEnableTrailing = false;
    let newStopLoss = this.positionStatus.stopLoss;

    if (this.positionStatus.side === 'LONG' && this.positionStatus.highestPrice) {
      // For LONG: Trail below highest price
      const trailingStopPrice = this.positionStatus.highestPrice * (1 - trailingPercent);
      
      if (trailingStopPrice > this.positionStatus.stopLoss) {
        shouldEnableTrailing = true;
        newStopLoss = trailingStopPrice;
      }
    } else if (this.positionStatus.side === 'SHORT' && this.positionStatus.lowestPrice) {
      // For SHORT: Trail above lowest price
      const trailingStopPrice = this.positionStatus.lowestPrice * (1 + trailingPercent);
      
      if (trailingStopPrice < this.positionStatus.stopLoss) {
        shouldEnableTrailing = true;
        newStopLoss = trailingStopPrice;
      }
    }

    if (shouldEnableTrailing) {
      // 🧠 SMART VALIDATION: Check if adjustment is warranted
      try {
        const candles = await fetchBinanceCandles(trade.symbol, '15m', 50);
        
        const validation = SmartInterventionValidator.validateTrailingStopAdjustment(
          {
            side: this.positionStatus.side,
            entryPrice: this.positionStatus.entryPrice,
            currentPrice: this.positionStatus.currentPrice,
            stopLoss: this.positionStatus.stopLoss,
            highestPrice: this.positionStatus.highestPrice,
            lowestPrice: this.positionStatus.lowestPrice,
          },
          newStopLoss,
          {
            volatility: 'normal', // Simplified
            trendStrength: 70,
            volumeConfirmation: true,
            isConsolidation: false,
            isBreakout: false,
          }
        );

        if (validation.isValidIntervention) {
          this.positionStatus.alerts.push({
            type: 'INFO',
            reason: `✅ Trailing stop validated - Moving SL to $${newStopLoss.toFixed(2)}\n${validation.reasons.join('\n')}`,
            action: 'ADJUST_SL',
            details: {
              oldStopLoss: this.positionStatus.stopLoss,
              newStopLoss: newStopLoss,
              type: 'TRAILING_STOP',
              highestPrice: this.positionStatus.highestPrice,
              lowestPrice: this.positionStatus.lowestPrice,
              validationConfidence: validation.confidence,
            },
          });

          this.positionStatus.trailingStopEnabled = true;
          console.log(`✅ Trailing stop validated and updated to $${newStopLoss.toFixed(2)}`);
        } else {
          console.log(`ℹ️ Trailing stop adjustment NOT validated`);
          if (validation.warnings.length > 0) {
            validation.warnings.forEach(w => console.log(`   ${w}`));
          }
        }
      } catch (error) {
        console.error('Error validating trailing stop:', error);
        // Fallback to basic trailing stop
        this.positionStatus.alerts.push({
          type: 'INFO',
          reason: `Trailing stop activated - Moving SL to $${newStopLoss.toFixed(2)}`,
          action: 'ADJUST_SL',
          details: {
            oldStopLoss: this.positionStatus.stopLoss,
            newStopLoss: newStopLoss,
            type: 'TRAILING_STOP',
            highestPrice: this.positionStatus.highestPrice,
            lowestPrice: this.positionStatus.lowestPrice,
          },
        });
        this.positionStatus.trailingStopEnabled = true;
      }
    }
  }

  // ==========================================================================
  // 🔄 CHECK SIGNAL REVERSAL
  // ==========================================================================

  private async checkSignalReversal(trade: any): Promise<void> {
    if (!this.config.enableSignalReversal || !this.positionStatus) return;

    try {
      // Fetch recent candles
      const candles = await fetchBinanceCandles(trade.symbol, '15m', 100);
      
      // Generate fresh signal
      const signal = await this.signalEngine.generateSignal(trade.symbol, candles, {
        strategy: 'balanced',
        minConfidence: 0, // Allow any signal for validation
        validateWithNews: this.config.enableNewsMonitoring,
        requireNewsAlignment: false, // Don't reject, just check
      });

      if (!signal) return; // No signal generated

      // Check for reversal
      const isReversal = 
        (this.positionStatus.side === 'LONG' && signal.action === 'SHORT') ||
        (this.positionStatus.side === 'SHORT' && signal.action === 'LONG');

      if (!isReversal) return; // Not a reversal

      // 🧠 SMART VALIDATION: Check if this is a REAL reversal or just noise
      const validation = SmartInterventionValidator.validateSignalReversal(
        {
          side: this.positionStatus.side,
          entryPrice: this.positionStatus.entryPrice,
          currentPrice: this.positionStatus.currentPrice,
          pnlPercent: this.positionStatus.pnlPercent,
        },
        signal,
        candles
      );

      console.log(`🔍 Smart Validation: ${validation.isValidIntervention ? 'VALID' : 'INVALID'} (${validation.confidence.toFixed(0)}%)`);
      console.log(`   Recommendation: ${validation.recommendedAction}`);
      
      if (validation.reasons.length > 0) {
        console.log(`   Reasons:`);
        validation.reasons.forEach(r => console.log(`      ${r}`));
      }
      
      if (validation.warnings.length > 0) {
        console.log(`   Warnings:`);
        validation.warnings.forEach(w => console.log(`      ${w}`));
      }

      // Only trigger alert if validation confirms it's a real reversal
      if (validation.isValidIntervention) {
        const alertType: 'CRITICAL' | 'WARNING' | 'INFO' = 
          validation.confidence >= 80 ? 'CRITICAL' : 'WARNING';

        this.positionStatus.alerts.push({
          type: alertType,
          reason: `🚨 VALIDATED SIGNAL REVERSAL (${validation.confidence.toFixed(0)}% confidence)\n${validation.reasons.join('\n')}`,
          action: validation.recommendedAction === 'CLOSE_NOW' ? 'CLOSE_POSITION' : 
                  validation.recommendedAction === 'ADJUST_SL' ? 'ADJUST_SL' : 'HOLD',
          details: {
            oldDirection: this.positionStatus.side,
            newDirection: signal.action,
            signalConfidence: signal.confidence,
            validationConfidence: validation.confidence,
            reasons: validation.reasons,
            warnings: validation.warnings,
            newsValidation: signal.newsValidation,
            recommendedAction: validation.recommendedAction,
          },
        });

        console.log(`✅ REAL REVERSAL CONFIRMED: ${this.positionStatus.side} → ${signal.action}`);
      } else {
        // Log but don't trigger alert - likely just noise
        console.log(`ℹ️ Signal reversal detected but NOT validated (${validation.confidence.toFixed(0)}%)`);
        console.log(`   ${validation.shouldWait ? 'Waiting for confirmation...' : 'Likely market noise'}`);
        
        // Add info alert for monitoring
        this.positionStatus.alerts.push({
          type: 'INFO',
          reason: `ℹ️ Potential reversal detected but not confirmed (${validation.confidence.toFixed(0)}%)\n${validation.warnings.join('\n')}`,
          action: 'HOLD',
          details: {
            validationResult: validation,
            signalConfidence: signal.confidence,
          },
        });
      }

    } catch (error) {
      console.error('Error checking signal reversal:', error);
    }
  }

  // ==========================================================================
  // 📉 CHECK EARLY EXIT
  // ==========================================================================

  private async checkEarlyExit(trade: any): Promise<void> {
    if (!this.config.enableEarlyExit || !this.positionStatus) return;

    try {
      // Fetch recent candles
      const candles = await fetchBinanceCandles(trade.symbol, '15m', 100);
      
      // Generate fresh signal
      const signal = await this.signalEngine.generateSignal(trade.symbol, candles, {
        strategy: 'balanced',
        minConfidence: 0, // Allow any signal
        validateWithNews: this.config.enableNewsMonitoring,
      });

      if (!signal) return;

      // Check if current direction signal is weakening
      const isSameDirection = 
        (this.positionStatus.side === 'LONG' && signal.action === 'LONG') ||
        (this.positionStatus.side === 'SHORT' && signal.action === 'SHORT');

      if (!isSameDirection) return; // This is handled by reversal check

      // 🧠 SMART VALIDATION: Check if early exit is warranted
      const holdingTimeMinutes = (Date.now() - new Date(trade.entryTime).getTime()) / (1000 * 60);
      
      const validation = SmartInterventionValidator.validateEarlyExit(
        {
          side: this.positionStatus.side,
          entryPrice: this.positionStatus.entryPrice,
          currentPrice: this.positionStatus.currentPrice,
          pnlPercent: this.positionStatus.pnlPercent,
          holdingTimeMinutes,
        },
        signal,
        candles
      );

      const earlyExitThreshold = this.config.earlyExitThreshold ?? 40;
      console.log(`🔍 Early Exit Check: Signal ${signal.confidence.toFixed(0)}% (threshold: ${earlyExitThreshold}%)`);
      console.log(`   Validation: ${validation.isValidIntervention ? 'EXIT' : 'HOLD'} (${validation.confidence.toFixed(0)}%)`);

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => console.log(`   ${w}`));
      }

      // Only trigger exit if validation confirms
      if (validation.isValidIntervention && signal.confidence < earlyExitThreshold) {
        this.positionStatus.alerts.push({
          type: 'WARNING',
          reason: `⚠️ Signal weakening confirmed (${signal.confidence.toFixed(0)}% < ${earlyExitThreshold}%)\n${validation.reasons.join('\n')}`,
          action: validation.recommendedAction === 'CLOSE_NOW' ? 'CLOSE_POSITION' : 'HOLD',
          details: {
            signalConfidence: signal.confidence,
            threshold: earlyExitThreshold,
            currentPnL: this.positionStatus.pnl,
            validationConfidence: validation.confidence,
            recommendation: validation.recommendedAction,
            reasons: validation.reasons,
          },
        });

        console.log(`⚠️ Early exit validated: ${validation.recommendedAction}`);
      } else if (signal.confidence < earlyExitThreshold) {
        // Weak signal but not validated for exit
        console.log(`ℹ️ Signal weak but early exit NOT recommended (hold time: ${holdingTimeMinutes.toFixed(0)}m)`);
      }

    } catch (error) {
      console.error('Error checking early exit:', error);
    }
  }

  // ==========================================================================
  // 🚨 CHECK EMERGENCY CONDITIONS
  // ==========================================================================

  private async checkEmergencyConditions(trade: any): Promise<void> {
    if (!this.positionStatus) return;

    // Check for extreme loss
    if (this.positionStatus.pnlPercent < -15) {
      this.positionStatus.alerts.push({
        type: 'CRITICAL',
        reason: `🚨 EXTREME LOSS: ${this.positionStatus.pnlPercent.toFixed(2)}% - Consider emergency exit`,
        action: 'CLOSE_POSITION',
        details: {
          pnl: this.positionStatus.pnl,
          pnlPercent: this.positionStatus.pnlPercent,
        },
      });
    }

    // Check for stagnant position (no profit after long time)
    // TODO: Implement time-based checks
  }

  // ==========================================================================
  // ⚡ PROCESS ALERTS
  // ==========================================================================

  private async processAlerts(trade: any): Promise<void> {
    if (!this.positionStatus) return;

    for (const alert of this.positionStatus.alerts) {
      // Log alert
      await this.logAlert(alert);

      // Execute action
      switch (alert.action) {
        case 'ADJUST_SL':
          await this.adjustStopLoss(trade, alert.details.newStopLoss);
          this.positionStatus.stopLoss = alert.details.newStopLoss;
          break;

        case 'CLOSE_POSITION':
          if (alert.type === 'CRITICAL') {
            // Auto-close on critical alerts
            await this.closePosition(trade, alert.reason);
          } else {
            // Just log warning for non-critical
            console.log(`⚠️ Close position recommended: ${alert.reason}`);
          }
          break;

        case 'HOLD':
          // Just monitor
          break;
      }
    }
  }

  // ==========================================================================
  // 🔧 ADJUST STOP LOSS
  // ==========================================================================

  private async adjustStopLoss(trade: any, newStopLoss: number): Promise<void> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);

      // Cancel existing stop loss orders using Binance REST API
      // Note: BinanceClient may need futuresOpenOrders method
      // For now, we'll just place the new stop loss
      // TODO: Add proper order cancellation

      // Place new stop loss
      await binance.futuresOrder({
        symbol: trade.symbol,
        side: trade.side === 'long' ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        stopPrice: newStopLoss.toFixed(2),
        quantity: trade.quantity.toString(),
        closePosition: 'true',
      });

      // Update database
      await TradeManager.updateStopLoss(this.tradeId, newStopLoss);

      console.log(`✅ Stop loss adjusted: $${trade.stopLoss.toFixed(2)} → $${newStopLoss.toFixed(2)}`);

    } catch (error) {
      console.error('Error adjusting stop loss:', error);
      throw error;
    }
  }

  // ==========================================================================
  // 🚪 CLOSE POSITION (EARLY EXIT)
  // ==========================================================================

  private async closePosition(trade: any, reason: string): Promise<void> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);

      // Cancel all open orders
      await binance.futuresCancelAllOpenOrders({ symbol: trade.symbol });

      // Close position
      await binance.futuresOrder({
        symbol: trade.symbol,
        side: trade.side === 'long' ? 'SELL' : 'BUY',
        type: 'MARKET',
        quantity: trade.quantity.toString(),
        reduceOnly: 'true',
      });

      // Update database
      await TradeManager.closeTrade(this.tradeId, {
        exitPrice: this.positionStatus?.currentPrice || trade.entryPrice,
        exitTime: new Date(),
        notes: `Early exit by Position Monitor: ${reason}`,
      });

      console.log(`✅ Position closed early: ${reason}`);

      // Stop monitoring
      this.stopMonitoring();

    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }

  // ==========================================================================
  // 🧠 SMART ANALYSIS - Market Regime Detection
  // ==========================================================================

  /**
   * Detect current market regime for smart decision making
   * Returns: STRONG_TREND | TREND | CHOPPY | CONSOLIDATION
   */
  private async detectMarketRegime(): Promise<{
    regime: 'STRONG_TREND' | 'TREND' | 'CHOPPY' | 'CONSOLIDATION';
    confidence: number;
    details: {
      trendStrength: number;
      volatility: number;
      volumeProfile: string;
    };
  }> {
    try {
      // Fetch candles for analysis
      const candles = await fetchBinanceCandles(
        this.positionStatus!.symbol,
        '15m',
        100
      );

      // Get current signal with full analysis
      const signal = await this.signalEngine.generateSignal(
        this.positionStatus!.symbol,
        candles,
        { validateWithNews: false } // Skip news validation for speed
      );

      if (!signal) {
        return {
          regime: 'CONSOLIDATION',
          confidence: 50,
          details: {
            trendStrength: 50,
            volatility: 50,
            volumeProfile: 'NORMAL',
          },
        };
      }

      // Analyze trend strength (from EMA alignment and market regime)
      const trendStrength = this.analyzeTrendStrength(signal);
      
      // Analyze volatility (from indicators)
      const volatility = this.analyzeVolatility(signal);
      
      // Determine regime
      let regime: 'STRONG_TREND' | 'TREND' | 'CHOPPY' | 'CONSOLIDATION';
      let confidence = 0;

      if (trendStrength > 80 && volatility > 70) {
        regime = 'STRONG_TREND';
        confidence = 90;
      } else if (trendStrength > 60 && volatility > 50) {
        regime = 'TREND';
        confidence = 75;
      } else if (volatility > 70 && trendStrength < 50) {
        regime = 'CHOPPY';
        confidence = 80;
      } else {
        regime = 'CONSOLIDATION';
        confidence = 70;
      }

      return {
        regime,
        confidence,
        details: {
          trendStrength,
          volatility,
          volumeProfile: signal.marketRegime?.volatilityLevel ? 
            (signal.marketRegime.volatilityLevel > 70 ? 'HIGH' : 'NORMAL') : 'NORMAL',
        },
      };
    } catch (error) {
      console.error('Error detecting market regime:', error);
      return {
        regime: 'CONSOLIDATION',
        confidence: 50,
        details: {
          trendStrength: 50,
          volatility: 50,
          volumeProfile: 'NORMAL',
        },
      };
    }
  }

  private analyzeTrendStrength(signal: TradingSignal): number {
    // Strong trend if:
    // - Clear direction (confidence > 70%)
    // - Market regime aligned
    // - Good signal strength
    let strength = 0;

    if (signal.confidence > 70) strength += 40;
    else if (signal.confidence > 60) strength += 30;
    else if (signal.confidence > 50) strength += 20;

    if (signal.strength === 'strong') strength += 30;
    else if (signal.strength === 'moderate') strength += 15;

    // Check market regime if available
    if (signal.marketRegime) {
      const regime = signal.marketRegime.regime;
      if (regime === 'trending_up' || regime === 'trending_down') {
        strength += signal.marketRegime.trendStrength * 0.3; // Scale to 30 max
      }
    }

    return Math.min(100, strength);
  }

  private analyzeVolatility(signal: TradingSignal): number {
    // High volatility indicators:
    // - Large price swings
    // - High ATR
    // - RSI extremes
    let volatility = 50; // Default

    // Use market regime volatility if available
    if (signal.marketRegime?.volatilityLevel) {
      volatility = signal.marketRegime.volatilityLevel;
    }

    // Use RSI extremes as volatility indicator
    if (signal.indicators?.rsi) {
      const rsiValue = typeof signal.indicators.rsi === 'number' ? 
        signal.indicators.rsi : signal.indicators.rsi.value;
      
      if (rsiValue > 75 || rsiValue < 25) {
        volatility = Math.max(volatility, 85);
      } else if (rsiValue > 70 || rsiValue < 30) {
        volatility = Math.max(volatility, 70);
      }
    }

    // Adjust for MACD histogram (momentum)
    if (signal.indicators?.macd?.histogram) {
      const absHistogram = Math.abs(signal.indicators.macd.histogram);
      if (absHistogram > 100) volatility = Math.min(100, volatility + 15);
      else if (absHistogram > 50) volatility = Math.min(100, volatility + 10);
    }

    return Math.min(100, volatility);
  }

  /**
   * Smart validation for break-even timing
   * Ensures we don't break-even too early in strong trends
   */
  private async validateBreakEvenTiming(): Promise<{
    shouldTrigger: boolean;
    reason: string;
    confidence: number;
  }> {
    try {
      // Get market regime
      const regime = await this.detectMarketRegime();
      
      // Fetch candles
      const candles = await fetchBinanceCandles(
        this.positionStatus!.symbol,
        '15m',
        100
      );

      // Get current signal
      const signal = await this.signalEngine.generateSignal(
        this.positionStatus!.symbol,
        candles,
        { validateWithNews: false }
      );

      if (!signal) {
        return {
          shouldTrigger: true,
          reason: 'Unable to validate, proceeding with standard break-even',
          confidence: 50,
        };
      }

      let shouldTrigger = true;
      let reason = 'Break-even timing validated';
      let confidence = 80;

      // Check 1: Don't break-even in STRONG_TREND (let it run!)
      if (regime.regime === 'STRONG_TREND') {
        // Only break-even if we're deep in profit (>5%)
        if (this.positionStatus!.pnlPercent < 5) {
          shouldTrigger = false;
          reason = 'Delaying break-even: Strong trend detected, let profits run';
          confidence = 90;
        }
      }

      // Check 2: Strong signal continuation
      if (signal.strength === 'strong' && signal.confidence > 70) {
        // Strong signal = likely continuation
        if (this.positionStatus!.pnlPercent < 3) {
          shouldTrigger = false;
          reason = 'Delaying break-even: Strong signal continuation likely';
          confidence = 85;
        }
      }

      // Check 3: Quick break-even in CHOPPY market
      if (regime.regime === 'CHOPPY') {
        shouldTrigger = true;
        reason = 'Break-even NOW: Choppy market, secure gains quickly';
        confidence = 95;
      }

      // Check 4: Trend alignment with position
      const positionDirection = this.positionStatus!.side === 'LONG' ? 'LONG' : 'SHORT';
      if (signal.action === positionDirection && signal.confidence > 70) {
        // Signal still in our favor
        if (regime.regime === 'TREND' || regime.regime === 'STRONG_TREND') {
          shouldTrigger = false;
          reason = 'Delaying break-even: Signal still favorable, trend intact';
          confidence = 80;
        }
      }

      console.log(`🧠 Break-Even Smart Validation:`, {
        shouldTrigger,
        reason,
        confidence,
        regime: regime.regime,
        signalStrength: signal.strength,
        signalConfidence: signal.confidence,
        currentPnL: this.positionStatus!.pnlPercent.toFixed(2) + '%',
      });

      return { shouldTrigger, reason, confidence };
    } catch (error) {
      console.error('Error validating break-even timing:', error);
      return {
        shouldTrigger: true,
        reason: 'Validation failed, proceeding with standard break-even',
        confidence: 50,
      };
    }
  }

  /**
   * Smart adjustment of partial take profit levels
   * Adjusts levels based on market conditions
   */
  private async adjustPartialTPLevels(): Promise<{
    adjustedLevels: Array<{ profit: number; closePercent: number }>;
    reason: string;
  }> {
    try {
      // Get market regime
      const regime = await this.detectMarketRegime();
      
      let adjustedLevels = this.config.partialTPLevels || [];
      let reason = 'Using configured levels';

      // Smart adjustment based on regime
      if (regime.regime === 'STRONG_TREND') {
        // STRONG TREND: Delay first exit, target bigger profits
        adjustedLevels = [
          { profit: 5, closePercent: 30 },  // Close only 30% at +5%
          { profit: 10, closePercent: 70 }, // Close 70% at +10%
        ];
        reason = `Strong trend detected (${regime.confidence}%): Adjusted to ride momentum`;
        
      } else if (regime.regime === 'CHOPPY') {
        // CHOPPY: Take profits early and secure them
        adjustedLevels = [
          { profit: 2, closePercent: 70 },  // Close 70% at +2%
          { profit: 4, closePercent: 30 },  // Close 30% at +4%
        ];
        reason = `Choppy market (${regime.confidence}%): Taking profits early`;
        
      } else if (regime.regime === 'TREND') {
        // MODERATE TREND: Balanced approach
        adjustedLevels = [
          { profit: 3, closePercent: 50 },  // Close 50% at +3%
          { profit: 7, closePercent: 50 },  // Close 50% at +7%
        ];
        reason = `Moderate trend (${regime.confidence}%): Balanced profit taking`;
        
      } else {
        // CONSOLIDATION: Conservative
        adjustedLevels = [
          { profit: 2.5, closePercent: 60 },  // Close 60% at +2.5%
          { profit: 5, closePercent: 40 },    // Close 40% at +5%
        ];
        reason = `Consolidation (${regime.confidence}%): Conservative approach`;
      }

      console.log(`🧠 Partial TP Smart Adjustment:`, {
        regime: regime.regime,
        originalLevels: this.config.partialTPLevels,
        adjustedLevels,
        reason,
      });

      return { adjustedLevels, reason };
    } catch (error) {
      console.error('Error adjusting partial TP levels:', error);
      return {
        adjustedLevels: this.config.partialTPLevels || [],
        reason: 'Error in adjustment, using configured levels',
      };
    }
  }

  // ==========================================================================
  // 📊 HELPERS
  // ==========================================================================

  private calculatePnL(
    side: string,
    entryPrice: number,
    currentPrice: number,
    quantity: number,
    leverage: number
  ): number {
    if (side === 'long') {
      return ((currentPrice - entryPrice) / entryPrice) * (entryPrice * quantity) * leverage;
    } else {
      return ((entryPrice - currentPrice) / entryPrice) * (entryPrice * quantity) * leverage;
    }
  }

  private async logAlert(alert: MonitorAlert): Promise<void> {
    try {
      await TradeLog.create({
        userId: this.userId,
        botInstanceId: null,
        botName: 'Position Monitor',
        logType: 'MONITOR',
        severity: alert.type === 'CRITICAL' ? 'CRITICAL' : alert.type === 'WARNING' ? 'WARNING' : 'INFO',
        action: alert.action,
        message: alert.reason,
        tradeData: {
          tradeId: this.tradeId,
          ...alert.details,
        },
      });
    } catch (error) {
      console.error('Error logging alert:', error);
    }
  }

  private async logError(error: any, action: string): Promise<void> {
    try {
      await TradeLog.create({
        userId: this.userId,
        botInstanceId: null,
        botName: 'Position Monitor',
        logType: 'ERROR',
        severity: 'ERROR',
        action,
        message: error.message || 'Unknown error',
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
    } catch (logError) {
      console.error('Error logging error:', logError);
    }
  }

  // ==========================================================================
  // 📊 GET STATUS
  // ==========================================================================

  getStatus(): PositionStatus | null {
    return this.positionStatus;
  }

  isActive(): boolean {
    return this.isMonitoring;
  }
}
