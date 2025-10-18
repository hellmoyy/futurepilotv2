/**
 * 🚀 GENERATE SIGNALS API
 * 
 * POST /api/signals/generate
 * 
 * Generate trading signals untuk enabled pairs
 * Supports single pair or multiple pairs
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Signal from '@/models/Signal';
import LiveSignalEngine from '@/lib/trading/engines/LiveSignalEngine';
import { fetchBinanceCandles, fetchMultipleCandles } from '@/lib/trading/engines/CandleFetcher';
import TradingPairs from '@/config/trading-pairs';

// ============================================================================
// 🔧 INTERFACES
// ============================================================================

interface GenerateSignalsRequest {
  symbols?: string[]; // Specific symbols to generate signals for
  strategy?: 'conservative' | 'balanced' | 'aggressive' | 'custom';
  timeframe?: string;
  minConfidence?: number;
  saveToDb?: boolean;
}

// ============================================================================
// 🚀 POST - Generate Signals
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body: GenerateSignalsRequest = await req.json();
    
    const {
      symbols,
      strategy = 'balanced',
      timeframe = '15m',
      minConfidence = 60, // Lowered to 60% for testing
      saveToDb = true,
    } = body;
    
    // Connect to DB if saving
    if (saveToDb) {
      await connectDB();
    }
    
    // Get symbols to analyze
    let targetSymbols: string[];
    
    if (symbols && symbols.length > 0) {
      // Validate provided symbols
      targetSymbols = symbols.filter(symbol => {
        const pair = TradingPairs.getPair(symbol);
        return pair && pair.settings.enabled;
      });
      
      if (targetSymbols.length === 0) {
        return NextResponse.json(
          { error: 'No valid enabled pairs provided' },
          { status: 400 }
        );
      }
    } else {
      // Use all enabled pairs
      const enabledPairs = TradingPairs.getEnabledPairs();
      targetSymbols = enabledPairs.map(p => p.symbol);
    }
    
    // ✅ COOLDOWN CHECK: Prevent duplicate signals
    const cooldownMinutes = 15; // 15 minutes cooldown per symbol
    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    
    if (saveToDb) {
      // Check for recent signals
      const recentSignals = await Signal.find({
        symbol: { $in: targetSymbols },
        generatedAt: { $gte: cooldownTime },
        status: 'active',
      }).select('symbol action generatedAt').lean();

      if (recentSignals.length > 0) {
        const recentSymbols = recentSignals.map(s => s.symbol);
        const cooldownInfo = recentSignals.map(s => ({
          symbol: s.symbol,
          action: s.action,
          generatedAt: s.generatedAt,
          minutesAgo: Math.floor((Date.now() - new Date(s.generatedAt).getTime()) / 60000),
          remainingCooldown: cooldownMinutes - Math.floor((Date.now() - new Date(s.generatedAt).getTime()) / 60000),
        }));

        console.log(`⏳ ${recentSymbols.length} symbols in cooldown:`, recentSymbols);
        
        // Filter out symbols in cooldown
        targetSymbols = targetSymbols.filter(s => !recentSymbols.includes(s));
        
        if (targetSymbols.length === 0) {
          return NextResponse.json({
            success: false,
            message: 'All symbols are in cooldown period',
            cooldown: cooldownInfo,
          });
        }
        
        console.log(`📊 Proceeding with ${targetSymbols.length} symbols (${recentSymbols.length} in cooldown)`);
      }
    }
    
    // Fetch candles for all symbols
    console.log(`📊 Fetching candles for ${targetSymbols.length} pairs...`);
    const candlesMap = await fetchMultipleCandles(targetSymbols, timeframe as any, 100);
    
    // Generate signals
    console.log(`🚀 Generating signals with ${strategy} strategy...`);
    const engine = new LiveSignalEngine();
    
    const allSignals = await engine.generateMultipleSignals(candlesMap, {
      strategy,
      timeframe,
      minConfidence,
      enabledPairsOnly: true,
      validateWithNews: true, // ✅ Enable news validation
      requireNewsAlignment: true, // ✅ Reject conflicting signals
    });
    
    // Filter out HOLD signals (only show actionable LONG/SHORT)
    const signals = allSignals.filter(s => s.action !== 'HOLD');
    
    // Save to database if requested
    if (saveToDb && signals.length > 0) {
      console.log(`💾 Saving ${signals.length} signals to database...`);
      
      const savedSignals = await Promise.all(
        signals.map(async (signalData) => {
          try {
            const signal = new Signal({
              ...signalData,
              generatedAt: new Date(signalData.timestamp),
              expiresAt: new Date(signalData.expiresAt),
              status: 'active',
              isPublic: true,
              viewCount: 0,
            });
            
            return await signal.save();
          } catch (error) {
            console.error(`Error saving signal for ${signalData.symbol}:`, error);
            return null;
          }
        })
      );
      
      const successCount = savedSignals.filter(s => s !== null).length;
      console.log(`✅ Saved ${successCount}/${signals.length} signals`);
    }
    
    // Format response
    const response = {
      success: true,
      count: signals.length,
      strategy,
      timeframe,
      minConfidence,
      signals: signals.map(s => ({
        symbol: s.symbol,
        action: s.action,
        confidence: s.confidence,
        strength: s.strength,
        entryPrice: s.entryPrice,
        takeProfitLevels: s.takeProfitLevels,
        stopLoss: s.stopLoss,
        riskRewardRatio: s.riskRewardRatio,
        reasons: s.reasons,
        warnings: s.warnings,
        indicatorSummary: s.indicatorSummary,
        newsValidation: s.newsValidation,
        newsSentiment: s.newsSentiment,
        timestamp: s.timestamp,
        expiresAt: s.expiresAt,
      })),
      generatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Error generating signals:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate signals',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🔧 GET - Generate Single Signal
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const strategy = searchParams.get('strategy') || 'balanced';
    const timeframe = searchParams.get('timeframe') || '15m';
    const saveToDb = searchParams.get('save') !== 'false';
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }
    
    // Validate pair
    const pair = TradingPairs.getPair(symbol.toUpperCase());
    if (!pair || !pair.settings.enabled) {
      return NextResponse.json(
        { error: `Trading pair ${symbol} is not enabled` },
        { status: 400 }
      );
    }
    
    // Connect to DB if saving
    if (saveToDb) {
      await connectDB();
    }
    
    // Fetch candles
    console.log(`📊 Fetching candles for ${symbol}...`);
    const candles = await fetchBinanceCandles(symbol.toUpperCase(), timeframe as any, 100);
    
    if (candles.length < 50) {
      return NextResponse.json(
        { error: 'Insufficient candle data for analysis' },
        { status: 400 }
      );
    }
    
    // Generate signal
    console.log(`🚀 Generating signal for ${symbol}...`);
    const engine = new LiveSignalEngine();
    const signalData = await engine.generateSignal(symbol.toUpperCase(), candles, {
      strategy: strategy as any,
      timeframe,
    });
    
    // Check if signal was rejected (e.g., due to news conflict)
    if (!signalData) {
      return NextResponse.json({
        success: false,
        message: 'No valid signal generated',
        reason: 'Signal rejected due to quality threshold or news conflict',
        symbol: symbol.toUpperCase(),
        generatedAt: new Date().toISOString(),
      });
    }
    
    // Save to database if requested
    let savedSignal = null;
    if (saveToDb) {
      const signal = new Signal({
        ...signalData,
        generatedAt: new Date(signalData.timestamp),
        expiresAt: new Date(signalData.expiresAt),
      });
      
      savedSignal = await signal.save();
      console.log(`✅ Signal saved with ID: ${savedSignal._id}`);
    }
    
    // Format response
    const response = {
      success: true,
      signal: {
        id: savedSignal?._id,
        symbol: signalData.symbol,
        action: signalData.action,
        confidence: signalData.confidence,
        strength: signalData.strength,
        entryPrice: signalData.entryPrice,
        takeProfitLevels: signalData.takeProfitLevels,
        stopLoss: signalData.stopLoss,
        riskRewardRatio: signalData.riskRewardRatio,
        maxLeverage: signalData.maxLeverage,
        recommendedPositionSize: signalData.recommendedPositionSize,
        reasons: signalData.reasons,
        warnings: signalData.warnings,
        indicatorSummary: signalData.indicatorSummary,
        indicators: signalData.indicators,
        strategy: signalData.strategy,
        timeframe: signalData.timeframe,
        timestamp: signalData.timestamp,
        expiresAt: signalData.expiresAt,
        newsValidation: signalData.newsValidation,
        newsSentiment: signalData.newsSentiment,
      },
      generatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Error generating signal:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate signal',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
