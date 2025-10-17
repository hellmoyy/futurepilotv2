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
      minConfidence = 80, // Default 80% confidence threshold
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
    
    // Fetch candles for all symbols
    console.log(`📊 Fetching candles for ${targetSymbols.length} pairs...`);
    const candlesMap = await fetchMultipleCandles(targetSymbols, timeframe as any, 100);
    
    // Generate signals
    console.log(`🚀 Generating signals with ${strategy} strategy...`);
    const engine = new LiveSignalEngine();
    
    const signals = await engine.generateMultipleSignals(candlesMap, {
      strategy,
      timeframe,
      minConfidence,
      enabledPairsOnly: true,
    });
    
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
