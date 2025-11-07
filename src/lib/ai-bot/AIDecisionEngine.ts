/**
 * 🧠 AI Decision Engine
 * 
 * Core decision-making system that evaluates signals using:
 * 1. Technical analysis (75-85% base confidence)
 * 2. News sentiment (±10% adjustment)
 * 3. Recent backtest performance (±5% adjustment)
 * 4. Learning patterns (±3% adjustment)
 * 
 * Total adjustment range: ±18%
 * Execution threshold: ≥82% confidence
 */

import { Types } from 'mongoose';
import { getDeepSeekClient } from './DeepSeekClient';
import UserBot from '@/models/UserBot';
import AIDecision from '@/models/AIDecision';
import NewsEvent from '@/models/NewsEvent';
import LearningPattern from '@/models/LearningPattern';

export interface Signal {
  id: string;
  symbol: string;
  action: 'LONG' | 'SHORT';
  confidence: number;                  // 0-1 (technical confidence)
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  indicators?: {
    rsi?: number;
    macd?: number;
    adx?: number;
    volume?: number;
  };
  timestamp?: Date;
}

export interface DecisionResult {
  decision: 'EXECUTE' | 'SKIP';
  confidenceBreakdown: {
    technical: number;
    news: number;
    backtest: number;
    learning: number;
    total: number;
  };
  reason: string;
  newsContext?: {
    sentiment: number;
    headlines: string[];
    sources: string[];
    impactScore: number;
  };
  backtestContext?: {
    recentWinRate: number;
    recentTrades: number;
    avgProfit: number;
    avgLoss: number;
    performanceScore: number;
  };
  learningContext?: {
    patternsMatched: string[];
    patternsAvoided: string[];
    confidenceAdjustment: number;
  };
  aiCost: number;
  balanceSnapshot: {
    binanceBalance: number;
    gasFeeBalance: number;
    availableMargin: number;
  };
}

export class AIDecisionEngine {
  private deepseek = getDeepSeekClient();
  
  constructor() {
    if (!this.deepseek.isConfigured()) {
      console.warn('⚠️ DeepSeek API not configured - AI decisions will use rule-based fallback');
    }
  }
  
  /**
   * Evaluate signal and make decision
   */
  async evaluate(
    userId: string | Types.ObjectId,
    signal: Signal
  ): Promise<DecisionResult> {
    console.log(`🧠 Evaluating signal ${signal.id} for user ${userId}`);
    
    // 1. Load user bot configuration
    const userBot = await UserBot.findOne({ userId });
    if (!userBot) {
      throw new Error('UserBot not found');
    }
    
    // 2. Check if bot can trade (skip in test environment)
    const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                              process.env.SKIP_BALANCE_CHECK === 'true';
    
    if (!isTestEnvironment) {
      const canTradeCheck = userBot.canTrade();
      if (!canTradeCheck.allowed) {
        console.log(`⛔ Bot cannot trade: ${canTradeCheck.reason}`);
        
        return {
          decision: 'SKIP',
          confidenceBreakdown: {
            technical: signal.confidence,
            news: 0,
            backtest: 0,
            learning: 0,
            total: signal.confidence,
          },
          reason: `Trading blocked: ${canTradeCheck.reason}`,
          aiCost: 0,
          balanceSnapshot: {
            binanceBalance: userBot.lastBalanceCheck?.binanceBalance || 0,
            gasFeeBalance: userBot.lastBalanceCheck?.gasFeeBalance || 0,
            availableMargin: userBot.lastBalanceCheck?.availableMargin || 0,
          },
        };
      }
    } else {
      console.log(`⚠️ Test environment detected - skipping balance check`);
    }
    
    // 3. Get news sentiment
    const newsContext = await this.getNewsContext(signal.symbol);
    
    // 4. Get recent backtest performance
    const backtestContext = await this.getBacktestContext(userId);
    
    // 5. Check learning patterns
    const learningContext = await this.getLearningContext(userId, signal);
    
    // 6. Calculate base confidence adjustments (rule-based)
    let newsAdjustment = 0;
    let backtestAdjustment = 0;
    let learningAdjustment = 0;
    
    // News impact (±10%)
    if (newsContext) {
      newsAdjustment = newsContext.sentiment * userBot.aiConfig.newsWeight;
    }
    
    // Backtest impact (±5%)
    if (backtestContext) {
      const performanceScore = (backtestContext.recentWinRate - 0.5) * 2; // -1 to 1
      backtestAdjustment = performanceScore * userBot.aiConfig.backtestWeight;
    }
    
    // Learning impact (±3%)
    if (learningContext) {
      learningAdjustment = learningContext.confidenceAdjustment;
    }
    
    // 7. Call DeepSeek AI for final decision (if configured)
    let aiResult;
    let aiCost = 0;
    
    if (this.deepseek.isConfigured()) {
      aiResult = await this.deepseek.analyzeSignal(signal, {
        newsSentiment: newsContext?.sentiment,
        recentWinRate: backtestContext?.recentWinRate,
        lossPatterns: learningContext?.patternsAvoided,
      });
      
      aiCost = aiResult.cost || 0.001; // Default $0.001
      
      // Parse AI response
      if (aiResult.success && aiResult.response) {
        try {
          const aiDecision = JSON.parse(aiResult.response);
          
          // Use AI adjustments if available
          if (aiDecision.newsImpact !== undefined) {
            newsAdjustment = aiDecision.newsImpact;
          }
          if (aiDecision.backtestImpact !== undefined) {
            backtestAdjustment = aiDecision.backtestImpact;
          }
          if (aiDecision.learningImpact !== undefined) {
            learningAdjustment = aiDecision.learningImpact;
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse AI response, using rule-based decision');
        }
      }
    }
    
    // 8. Calculate final confidence
    const totalAdjustment = newsAdjustment + backtestAdjustment + learningAdjustment;
    const finalConfidence = Math.max(0, Math.min(1, signal.confidence + totalAdjustment));
    
    // 9. Make decision
    const decision: 'EXECUTE' | 'SKIP' = finalConfidence >= userBot.aiConfig.confidenceThreshold 
      ? 'EXECUTE' 
      : 'SKIP';
    
    // 10. Build reasoning
    const reasoning = this.buildReasoning({
      decision,
      baseConfidence: signal.confidence,
      finalConfidence,
      newsAdjustment,
      backtestAdjustment,
      learningAdjustment,
      threshold: userBot.aiConfig.confidenceThreshold,
      aiResponse: aiResult?.response,
    });
    
    // 11. Save decision to database
    const aiDecision = new AIDecision({
      userId,
      userBotId: userBot._id,
      signalId: signal.id,
      signal: {
        symbol: signal.symbol,
        action: signal.action,
        technicalConfidence: signal.confidence,
        entryPrice: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        indicators: signal.indicators || {},
      },
      confidenceBreakdown: {
        technical: signal.confidence,
        news: newsAdjustment,
        backtest: backtestAdjustment,
        learning: learningAdjustment,
        total: finalConfidence,
      },
      decision,
      reason: reasoning,
      newsContext,
      backtestContext,
      learningContext,
      aiCost,
      provider: 'deepseek',
      aiModel: 'deepseek-chat',
      balanceSnapshot: {
        binanceBalance: userBot.lastBalanceCheck?.binanceBalance || 0,
        gasFeeBalance: userBot.lastBalanceCheck?.gasFeeBalance || 0,
        availableMargin: userBot.lastBalanceCheck?.availableMargin || 0,
      },
      timestamp: new Date(),
    });
    
    await aiDecision.save();
    
    // 12. Update user bot stats
    await userBot.recordSignalReceived();
    if (decision === 'EXECUTE') {
      await userBot.recordSignalExecuted();
    } else {
      await userBot.recordSignalRejected();
    }
    
    console.log(`${decision === 'EXECUTE' ? '✅' : '⏭️'} Decision: ${decision} (${(finalConfidence * 100).toFixed(1)}%)`);
    
    return {
      decision,
      confidenceBreakdown: {
        technical: signal.confidence,
        news: newsAdjustment,
        backtest: backtestAdjustment,
        learning: learningAdjustment,
        total: finalConfidence,
      },
      reason: reasoning,
      newsContext,
      backtestContext,
      learningContext,
      aiCost,
      balanceSnapshot: {
        binanceBalance: userBot.lastBalanceCheck?.binanceBalance || 0,
        gasFeeBalance: userBot.lastBalanceCheck?.gasFeeBalance || 0,
        availableMargin: userBot.lastBalanceCheck?.availableMargin || 0,
      },
    };
  }
  
  /**
   * Get news context for decision
   */
  private async getNewsContext(symbol: string): Promise<any> {
    try {
      // Get aggregate sentiment from last 24 hours
      const sentiment = await NewsEvent.getAggregateSentiment(symbol, 24);
      
      if (sentiment.count === 0) {
        return null;
      }
      
      // Get top 3 most impactful news
      const topNews = await NewsEvent.getRecentNews({
        limit: 3,
        symbol,
      });
      
      return {
        sentiment: sentiment.avgSentiment,
        headlines: topNews.map((n: any) => n.title),
        sources: topNews.map((n: any) => n.source),
        impactScore: sentiment.highImpact / Math.max(sentiment.count, 1),
      };
    } catch (error) {
      console.error('❌ Error getting news context:', error);
      return null;
    }
  }
  
  /**
   * Get backtest performance context
   */
  private async getBacktestContext(userId: string | Types.ObjectId): Promise<any> {
    try {
      // Get last 20 decisions with results
      const recentDecisions = await AIDecision.find({
        userId,
        'execution.result': { $exists: true },
      })
        .sort({ timestamp: -1 })
        .limit(20);
      
      if (recentDecisions.length === 0) {
        return null;
      }
      
      const wins = recentDecisions.filter(d => d.execution?.result === 'WIN').length;
      const winRate = wins / recentDecisions.length;
      
      const profits = recentDecisions
        .filter(d => d.execution?.result === 'WIN')
        .map(d => d.execution?.profit || 0);
      
      const losses = recentDecisions
        .filter(d => d.execution?.result === 'LOSS')
        .map(d => Math.abs(d.execution?.profit || 0));
      
      const avgProfit = profits.length > 0 
        ? profits.reduce((a, b) => a + b, 0) / profits.length 
        : 0;
      
      const avgLoss = losses.length > 0 
        ? losses.reduce((a, b) => a + b, 0) / losses.length 
        : 0;
      
      // Performance score: -1 (terrible) to 1 (excellent)
      const performanceScore = (winRate - 0.5) * 2;
      
      return {
        recentWinRate: winRate,
        recentTrades: recentDecisions.length,
        avgProfit,
        avgLoss,
        performanceScore,
      };
    } catch (error) {
      console.error('❌ Error getting backtest context:', error);
      return null;
    }
  }
  
  /**
   * Get learning patterns context
   */
  private async getLearningContext(
    userId: string | Types.ObjectId,
    signal: Signal
  ): Promise<any> {
    try {
      const currentHour = new Date().getUTCHours();
      const currentDay = new Date().getUTCDay();
      
      // Build market conditions from signal
      const marketConditions = {
        rsi: signal.indicators?.rsi,
        macd: signal.indicators?.macd,
        adx: signal.indicators?.adx,
        timeOfDay: currentHour,
        dayOfWeek: currentDay,
        symbol: signal.symbol,
      };
      
      // Get matching patterns
      const patterns = await LearningPattern.getForDecision(
        userId as Types.ObjectId,
        marketConditions
      );
      
      if (patterns.length === 0) {
        return null;
      }
      
      // Calculate confidence adjustment based on patterns
      let adjustment = 0;
      const patternsMatched: string[] = [];
      const patternsAvoided: string[] = [];
      
      for (const pattern of patterns) {
        patternsMatched.push(pattern.pattern.description);
        
        if (pattern.pattern.type === 'loss') {
          // Loss pattern: reduce confidence
          const penalty = pattern.strength / 100 * pattern.confidence * -0.03;
          adjustment += penalty;
          patternsAvoided.push(pattern.pattern.description);
        } else {
          // Win pattern: increase confidence
          const bonus = pattern.strength / 100 * pattern.confidence * 0.03;
          adjustment += bonus;
        }
        
        // Record that pattern was matched
        await pattern.recordMatch(pattern.pattern.type === 'loss');
      }
      
      // Cap adjustment at ±3%
      adjustment = Math.max(-0.03, Math.min(0.03, adjustment));
      
      return {
        patternsMatched,
        patternsAvoided,
        confidenceAdjustment: adjustment,
      };
    } catch (error) {
      console.error('❌ Error getting learning context:', error);
      return null;
    }
  }
  
  /**
   * Build human-readable reasoning
   */
  private buildReasoning(params: {
    decision: 'EXECUTE' | 'SKIP';
    baseConfidence: number;
    finalConfidence: number;
    newsAdjustment: number;
    backtestAdjustment: number;
    learningAdjustment: number;
    threshold: number;
    aiResponse?: string;
  }): string {
    const parts: string[] = [];
    
    // Base confidence
    parts.push(`Technical analysis: ${(params.baseConfidence * 100).toFixed(1)}%`);
    
    // News impact
    if (params.newsAdjustment !== 0) {
      const sign = params.newsAdjustment > 0 ? '+' : '';
      parts.push(`News sentiment: ${sign}${(params.newsAdjustment * 100).toFixed(1)}%`);
    }
    
    // Backtest impact
    if (params.backtestAdjustment !== 0) {
      const sign = params.backtestAdjustment > 0 ? '+' : '';
      parts.push(`Recent performance: ${sign}${(params.backtestAdjustment * 100).toFixed(1)}%`);
    }
    
    // Learning impact
    if (params.learningAdjustment !== 0) {
      const sign = params.learningAdjustment > 0 ? '+' : '';
      parts.push(`Pattern learning: ${sign}${(params.learningAdjustment * 100).toFixed(1)}%`);
    }
    
    // Final confidence
    parts.push(`Final confidence: ${(params.finalConfidence * 100).toFixed(1)}%`);
    
    // Decision
    if (params.decision === 'EXECUTE') {
      parts.push(`✅ EXECUTE - Confidence above threshold (${(params.threshold * 100).toFixed(0)}%)`);
    } else {
      parts.push(`⏭️ SKIP - Confidence below threshold (${(params.threshold * 100).toFixed(0)}%)`);
    }
    
    // AI reasoning (if available)
    if (params.aiResponse) {
      try {
        const aiDecision = JSON.parse(params.aiResponse);
        if (aiDecision.reasoning) {
          parts.push(`AI: ${aiDecision.reasoning}`);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return parts.join(' | ');
  }
}

// Singleton instance
let engineInstance: AIDecisionEngine | null = null;

export function getAIDecisionEngine(): AIDecisionEngine {
  if (!engineInstance) {
    engineInstance = new AIDecisionEngine();
  }
  return engineInstance;
}

export default AIDecisionEngine;
