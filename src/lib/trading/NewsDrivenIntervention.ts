/**
 * 🚨 NEWS-DRIVEN INTERVENTION SYSTEM
 * 
 * Advanced news monitoring untuk emergency intervention dan auto-repositioning.
 * 
 * Features:
 * - Breaking news detection (hacks, regulations, major events)
 * - Emergency exit triggers
 * - News sentiment strength validation
 * - Auto-repositioning recommendations
 * - Multi-source news aggregation
 */

import { NewsAnalyzer, NewsSentiment, NewsItem } from './NewsAnalyzer';
import { TradingSignal } from './engines/LiveSignalEngine';

export interface NewsImpact {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'HACK' | 'REGULATION' | 'PARTNERSHIP' | 'TECHNICAL' | 'MARKET' | 'OTHER';
  action: 'EMERGENCY_EXIT' | 'CLOSE_POSITION' | 'ADJUST_SL' | 'MONITOR' | 'NO_ACTION';
  confidence: number; // 0-100
  urgency: number; // 0-100, how fast to act
  reasons: string[];
  affectedAssets: string[]; // Which symbols are affected
  timeWindow: number; // Minutes until impact fully priced in
}

export interface NewsInterventionResult {
  shouldIntervene: boolean;
  impact: NewsImpact;
  emergencyExit: boolean;
  repositionRecommendation?: {
    direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    targetSymbol: string;
    confidence: number;
    entryTiming: 'IMMEDIATE' | 'WAIT_5MIN' | 'WAIT_15MIN' | 'WAIT_1HOUR';
    reason: string;
  };
  newsItems: NewsItem[];
}

export class NewsDrivenIntervention {
  private newsAnalyzer: NewsAnalyzer;
  
  // Keywords untuk critical events
  private static CRITICAL_KEYWORDS = {
    HACK: ['hack', 'hacked', 'exploit', 'breach', 'stolen', 'attack', 'vulnerability', 'security breach'],
    REGULATION: ['sec', 'ban', 'banned', 'illegal', 'lawsuit', 'investigation', 'regulatory action', 'crackdown'],
    CRASH: ['crash', 'collapse', 'plunge', 'tank', 'dump', 'selloff', 'panic'],
    POSITIVE: ['partnership', 'adoption', 'approved', 'etf approved', 'institutional buying', 'major investment'],
  };

  constructor() {
    this.newsAnalyzer = new NewsAnalyzer();
  }

  // ==========================================================================
  // 🚨 MAIN: Check News for Intervention
  // ==========================================================================

  async checkNewsIntervention(
    symbol: string,
    currentPosition?: {
      side: 'LONG' | 'SHORT';
      entryPrice: number;
      pnlPercent: number;
    }
  ): Promise<NewsInterventionResult> {
    try {
      // Fetch latest news
      const newsItems = await this.newsAnalyzer.fetchCryptoNews(symbol);
      
      if (!newsItems || newsItems.length === 0) {
        return this.createNoActionResult();
      }

      // Analyze news for critical events
      const impact = await this.analyzeNewsImpact(newsItems, symbol, currentPosition);
      
      // Determine if intervention needed
      const shouldIntervene = this.shouldInterveneBasedOnNews(impact, currentPosition);
      
      // Emergency exit check
      const emergencyExit = impact.severity === 'CRITICAL' && 
                           impact.action === 'EMERGENCY_EXIT';

      // Generate reposition recommendation
      let repositionRecommendation = undefined;
      if (shouldIntervene && (emergencyExit || impact.action === 'CLOSE_POSITION')) {
        repositionRecommendation = await this.generateRepositionRecommendation(
          symbol,
          impact,
          newsItems
        );
      }

      return {
        shouldIntervene,
        impact,
        emergencyExit,
        repositionRecommendation,
        newsItems: newsItems.slice(0, 5), // Top 5 most relevant
      };

    } catch (error) {
      console.error('Error checking news intervention:', error);
      return this.createNoActionResult();
    }
  }

  // ==========================================================================
  // 📊 ANALYZE: News Impact
  // ==========================================================================

  private async analyzeNewsImpact(
    newsItems: NewsItem[],
    symbol: string,
    currentPosition?: any
  ): Promise<NewsImpact> {
    const recentNews = newsItems.slice(0, 10); // Focus on most recent
    const reasons: string[] = [];
    let severity: NewsImpact['severity'] = 'LOW';
    let category: NewsImpact['category'] = 'OTHER';
    let action: NewsImpact['action'] = 'NO_ACTION';
    let confidence = 0;
    let urgency = 0;
    const affectedAssets: string[] = [symbol];

    // 1. CHECK: Critical events (hacks, major regulations)
    const criticalCheck = this.checkCriticalEvents(recentNews);
    if (criticalCheck.found) {
      severity = 'CRITICAL';
      category = criticalCheck.category;
      action = 'EMERGENCY_EXIT';
      confidence = criticalCheck.confidence;
      urgency = 95;
      reasons.push(...criticalCheck.reasons);
      
      console.log(`🚨 CRITICAL EVENT DETECTED: ${criticalCheck.category}`);
      return {
        severity,
        category,
        action,
        confidence,
        urgency,
        reasons,
        affectedAssets,
        timeWindow: 5, // Act within 5 minutes
      };
    }

    // 2. ANALYZE: News sentiment with AI
    let sentimentAnalysis: NewsSentiment | null = null;
    try {
      // Use NewsAnalyzer to get sentiment
      sentimentAnalysis = await this.newsAnalyzer.analyzeNewsWithAI(
        symbol,
        recentNews,
        'HOLD' // Neutral for pure sentiment analysis
      );
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    }

    if (!sentimentAnalysis) {
      return this.createLowImpact();
    }

    // 3. CHECK: Sentiment strength and direction
    const sentimentScore = sentimentAnalysis.score; // -100 to +100
    const sentimentConfidence = sentimentAnalysis.confidence;

    // Strong negative sentiment
    if (sentimentScore < -60 && sentimentConfidence > 70) {
      severity = 'HIGH';
      category = 'MARKET';
      confidence = sentimentConfidence;
      urgency = 80;
      reasons.push(`🔴 Strong bearish sentiment (${sentimentScore})`);
      reasons.push(...sentimentAnalysis.reasons);

      // If in LONG position with negative news
      if (currentPosition?.side === 'LONG') {
        action = 'CLOSE_POSITION';
        reasons.push('💡 Recommendation: Exit LONG position due to bearish news');
      } else if (currentPosition?.side === 'SHORT') {
        action = 'MONITOR';
        reasons.push('✅ SHORT position aligned with bearish news');
      } else {
        action = 'MONITOR';
        reasons.push('💡 Wait for better entry on short side');
      }
    }
    // Strong positive sentiment
    else if (sentimentScore > 60 && sentimentConfidence > 70) {
      severity = 'HIGH';
      category = 'MARKET';
      confidence = sentimentConfidence;
      urgency = 80;
      reasons.push(`🟢 Strong bullish sentiment (${sentimentScore})`);
      reasons.push(...sentimentAnalysis.reasons);

      // If in SHORT position with positive news
      if (currentPosition?.side === 'SHORT') {
        action = 'CLOSE_POSITION';
        reasons.push('💡 Recommendation: Exit SHORT position due to bullish news');
      } else if (currentPosition?.side === 'LONG') {
        action = 'MONITOR';
        reasons.push('✅ LONG position aligned with bullish news');
      } else {
        action = 'MONITOR';
        reasons.push('💡 Consider LONG entry opportunity');
      }
    }
    // Moderate negative
    else if (sentimentScore < -40 && sentimentConfidence > 60) {
      severity = 'MEDIUM';
      category = 'MARKET';
      confidence = sentimentConfidence;
      urgency = 50;
      reasons.push(`⚠️ Moderate bearish sentiment (${sentimentScore})`);
      
      if (currentPosition?.side === 'LONG') {
        action = 'ADJUST_SL';
        reasons.push('💡 Recommendation: Tighten stop loss');
      } else {
        action = 'MONITOR';
      }
    }
    // Moderate positive
    else if (sentimentScore > 40 && sentimentConfidence > 60) {
      severity = 'MEDIUM';
      category = 'MARKET';
      confidence = sentimentConfidence;
      urgency = 50;
      reasons.push(`✅ Moderate bullish sentiment (${sentimentScore})`);
      
      if (currentPosition?.side === 'SHORT') {
        action = 'ADJUST_SL';
        reasons.push('💡 Recommendation: Tighten stop loss');
      } else {
        action = 'MONITOR';
      }
    }
    // Weak or neutral
    else {
      severity = 'LOW';
      confidence = sentimentConfidence;
      urgency = 20;
      reasons.push(`ℹ️ Neutral or weak sentiment (${sentimentScore})`);
      action = 'NO_ACTION';
    }

    // 4. CHECK: News confidence threshold
    if (sentimentConfidence < 50) {
      reasons.push(`⚠️ Low confidence news (${sentimentConfidence}%) - Treat with caution`);
      severity = 'LOW';
      action = 'NO_ACTION';
    }

    return {
      severity,
      category,
      action,
      confidence,
      urgency,
      reasons,
      affectedAssets,
      timeWindow: this.calculateTimeWindow(severity, urgency),
    };
  }

  // ==========================================================================
  // 🚨 CHECK: Critical Events
  // ==========================================================================

  private checkCriticalEvents(newsItems: NewsItem[]): {
    found: boolean;
    category: NewsImpact['category'];
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    
    for (const news of newsItems) {
      const text = `${news.title} ${news.description}`.toLowerCase();
      
      // Check for HACK
      for (const keyword of NewsDrivenIntervention.CRITICAL_KEYWORDS.HACK) {
        if (text.includes(keyword)) {
          reasons.push(`🚨 HACK DETECTED: "${news.title}"`);
          reasons.push(`   Source: ${news.source}`);
          reasons.push(`   Time: ${news.publishedAt}`);
          return {
            found: true,
            category: 'HACK',
            confidence: 95,
            reasons,
          };
        }
      }
      
      // Check for REGULATION
      for (const keyword of NewsDrivenIntervention.CRITICAL_KEYWORDS.REGULATION) {
        if (text.includes(keyword)) {
          reasons.push(`⚖️ REGULATORY ACTION: "${news.title}"`);
          reasons.push(`   Source: ${news.source}`);
          return {
            found: true,
            category: 'REGULATION',
            confidence: 90,
            reasons,
          };
        }
      }
      
      // Check for CRASH
      for (const keyword of NewsDrivenIntervention.CRITICAL_KEYWORDS.CRASH) {
        if (text.includes(keyword)) {
          reasons.push(`📉 MARKET CRASH: "${news.title}"`);
          reasons.push(`   Source: ${news.source}`);
          return {
            found: true,
            category: 'MARKET',
            confidence: 85,
            reasons,
          };
        }
      }
    }

    return { found: false, category: 'OTHER', confidence: 0, reasons: [] };
  }

  // ==========================================================================
  // 🎯 SHOULD INTERVENE: Based on News
  // ==========================================================================

  private shouldInterveneBasedOnNews(
    impact: NewsImpact,
    currentPosition?: any
  ): boolean {
    // 1. Always intervene on CRITICAL
    if (impact.severity === 'CRITICAL') {
      return true;
    }

    // 2. HIGH severity with high confidence
    if (impact.severity === 'HIGH' && impact.confidence > 70) {
      // Only if we have a position that conflicts
      if (currentPosition) {
        const conflictLong = currentPosition.side === 'LONG' && 
                            impact.action === 'CLOSE_POSITION';
        const conflictShort = currentPosition.side === 'SHORT' && 
                             impact.action === 'CLOSE_POSITION';
        return conflictLong || conflictShort;
      }
    }

    // 3. MEDIUM severity with very high confidence
    if (impact.severity === 'MEDIUM' && impact.confidence > 80) {
      return currentPosition && impact.action === 'ADJUST_SL';
    }

    return false;
  }

  // ==========================================================================
  // 🔄 GENERATE: Reposition Recommendation
  // ==========================================================================

  private async generateRepositionRecommendation(
    symbol: string,
    impact: NewsImpact,
    newsItems: NewsItem[]
  ): Promise<NewsInterventionResult['repositionRecommendation']> {
    // Analyze sentiment to determine direction
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let entryTiming: 'IMMEDIATE' | 'WAIT_5MIN' | 'WAIT_15MIN' | 'WAIT_1HOUR' = 'WAIT_15MIN';
    let confidence = 0;
    let reason = '';

    // Get sentiment
    const sentiment = await this.newsAnalyzer.analyzeNewsWithAI(
      symbol,
      newsItems,
      'HOLD' // Neutral for pure sentiment analysis
    );
    
    if (!sentiment) {
      return undefined;
    }

    const score = sentiment.score;
    const sentimentConfidence = sentiment.confidence;

    // CRITICAL NEGATIVE (Hack, regulation) → Wait then LONG recovery
    if (impact.severity === 'CRITICAL' && (impact.category === 'HACK' || impact.category === 'REGULATION')) {
      direction = 'SHORT';
      entryTiming = 'IMMEDIATE';
      confidence = 85;
      reason = `Critical negative event - Market will dump. Enter SHORT immediately, then watch for recovery LONG entry`;
    }
    // Strong BEARISH → SHORT
    else if (score < -60 && sentimentConfidence > 70) {
      direction = 'SHORT';
      entryTiming = 'WAIT_5MIN';
      confidence = sentimentConfidence;
      reason = `Strong bearish sentiment (${score}) - Consider SHORT position after initial reaction`;
    }
    // Strong BULLISH → LONG
    else if (score > 60 && sentimentConfidence > 70) {
      direction = 'LONG';
      entryTiming = 'WAIT_5MIN';
      confidence = sentimentConfidence;
      reason = `Strong bullish sentiment (${score}) - Consider LONG position after initial pump`;
    }
    // Moderate → Wait
    else {
      direction = 'NEUTRAL';
      entryTiming = 'WAIT_1HOUR';
      confidence = 50;
      reason = `Moderate sentiment - Wait for market to digest news`;
    }

    return {
      direction,
      targetSymbol: symbol,
      confidence,
      entryTiming,
      reason,
    };
  }

  // ==========================================================================
  // 🔧 HELPERS
  // ==========================================================================

  private calculateTimeWindow(severity: NewsImpact['severity'], urgency: number): number {
    if (severity === 'CRITICAL') return 5; // 5 minutes
    if (severity === 'HIGH') return 15; // 15 minutes
    if (severity === 'MEDIUM') return 60; // 1 hour
    return 240; // 4 hours
  }

  private createNoActionResult(): NewsInterventionResult {
    return {
      shouldIntervene: false,
      impact: this.createLowImpact(),
      emergencyExit: false,
      newsItems: [],
    };
  }

  private createLowImpact(): NewsImpact {
    return {
      severity: 'LOW',
      category: 'OTHER',
      action: 'NO_ACTION',
      confidence: 0,
      urgency: 0,
      reasons: ['No significant news detected'],
      affectedAssets: [],
      timeWindow: 240,
    };
  }

  // ==========================================================================
  // 📊 VALIDATE: News Strength for Intervention
  // ==========================================================================

  static validateNewsStrength(
    impact: NewsImpact,
    currentPosition?: any
  ): {
    isStrong: boolean;
    shouldAct: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let isStrong = false;
    let shouldAct = false;

    // 1. Confidence threshold
    if (impact.confidence < 60) {
      reasons.push(`⚠️ News confidence too low (${impact.confidence}% < 60%)`);
      return { isStrong: false, shouldAct: false, reasons };
    }

    // 2. Severity check
    if (impact.severity === 'CRITICAL') {
      reasons.push(`🚨 CRITICAL severity - Immediate action required`);
      isStrong = true;
      shouldAct = true;
    } else if (impact.severity === 'HIGH' && impact.confidence > 70) {
      reasons.push(`⚠️ HIGH severity with strong confidence (${impact.confidence}%)`);
      isStrong = true;
      shouldAct = currentPosition ? true : false;
    } else if (impact.severity === 'MEDIUM' && impact.confidence > 80) {
      reasons.push(`ℹ️ MEDIUM severity with very strong confidence (${impact.confidence}%)`);
      isStrong = true;
      shouldAct = currentPosition ? true : false;
    } else {
      reasons.push(`ℹ️ News not strong enough for intervention`);
      isStrong = false;
      shouldAct = false;
    }

    // 3. Position conflict check
    if (currentPosition && isStrong) {
      if (impact.action === 'CLOSE_POSITION' || impact.action === 'EMERGENCY_EXIT') {
        reasons.push(`💡 Position conflicts with news - Action recommended`);
        shouldAct = true;
      } else if (impact.action === 'ADJUST_SL') {
        reasons.push(`💡 Tighten risk management recommended`);
        shouldAct = true;
      }
    }

    return { isStrong, shouldAct, reasons };
  }
}
