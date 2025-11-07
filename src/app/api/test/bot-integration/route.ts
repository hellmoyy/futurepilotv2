/**
 * 🧪 API ENDPOINT: Test Bot Integration
 * 
 * Test AI Decision Layer integration with Signal Listener
 * 
 * POST /api/test/bot-integration
 * 
 * Test Cases:
 * 1. Signal conversion (TradingSignal → AISignal)
 * 2. AI approval (high confidence signal)
 * 3. AI rejection (low confidence signal)
 * 4. Statistics tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AIDecisionEngine } from '@/lib/ai-bot/AIDecisionEngine';
import type { Signal as AISignal } from '@/lib/ai-bot/AIDecisionEngine';
import { User } from '@/models/User';
import UserBot from '@/models/UserBot';
import AIDecision from '@/models/AIDecision';

export const dynamic = 'force-dynamic';

interface TestResult {
  testName: string;
  status: 'PASSED' | 'FAILED';
  details: string;
  data?: any;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const results: TestResult[] = [];
    
    // Get test user
    const testUser = await User.findOne({ email: 'test@futurepilot.pro' });
    if (!testUser) {
      return NextResponse.json({
        success: false,
        error: 'Test user not found. Please create test@futurepilot.pro first.',
      }, { status: 404 });
    }
    
    const userId = testUser._id as any; // Type assertion for MongoDB ObjectId
    
    // Ensure UserBot exists
    let userBot = await UserBot.findOne({ userId: testUser._id });
    if (!userBot) {
      userBot = await UserBot.create({
        userId: testUser._id,
        aiConfig: {
          confidenceThreshold: 0.82,
          newsWeight: 0.10,
          backtestWeight: 0.05,
          learningEnabled: true,
        },
      });
    }
    
    // TEST 1: Signal Conversion
    console.log('\n🧪 TEST 1: Signal Conversion');
    try {
      const mockTradingSignal = {
        id: `test_conversion_${Date.now()}`,
        symbol: 'BTCUSDT',
        action: 'BUY' as const,
        strength: 'STRONG' as const,
        entryPrice: 68000,
        stopLoss: 67450,
        takeProfit: 68550,
        indicators: {
          rsi: 62,
          macd: { histogram: 30 },
          adx: 35,
          volume: { ratio: 1.2 },
        },
        timestamp: Date.now(),
      };
      
      // Conversion logic (from SignalListener)
      const convertActionToAI = (action: string): 'LONG' | 'SHORT' => {
        if (action === 'BUY' || action === 'CLOSE_SHORT') return 'LONG';
        return 'SHORT';
      };
      
      const normalizeStrengthToConfidence = (strength: string): number => {
        const strengthMap: Record<string, number> = {
          'WEAK': 0.65,
          'MODERATE': 0.75,
          'STRONG': 0.85,
          'VERY_STRONG': 0.95,
        };
        return strengthMap[strength] || 0.75;
      };
      
      const aiSignal: AISignal = {
        id: mockTradingSignal.id,
        symbol: mockTradingSignal.symbol,
        action: convertActionToAI(mockTradingSignal.action),
        confidence: normalizeStrengthToConfidence(mockTradingSignal.strength),
        entryPrice: mockTradingSignal.entryPrice,
        stopLoss: mockTradingSignal.stopLoss,
        takeProfit: mockTradingSignal.takeProfit,
        indicators: {
          rsi: mockTradingSignal.indicators.rsi,
          macd: mockTradingSignal.indicators.macd.histogram,
          adx: mockTradingSignal.indicators.adx,
          volume: mockTradingSignal.indicators.volume.ratio,
        },
        timestamp: new Date(mockTradingSignal.timestamp),
      };
      
      const conversionCorrect = (
        aiSignal.action === 'LONG' &&
        aiSignal.confidence === 0.85 &&
        aiSignal.indicators?.rsi === 62
      );
      
      results.push({
        testName: 'Signal Conversion (TradingSignal → AISignal)',
        status: conversionCorrect ? 'PASSED' : 'FAILED',
        details: conversionCorrect 
          ? 'Conversion successful: BUY→LONG, STRONG→0.85' 
          : 'Conversion failed',
        data: {
          original: { action: mockTradingSignal.action, strength: mockTradingSignal.strength },
          converted: { action: aiSignal.action, confidence: aiSignal.confidence },
        },
      });
    } catch (error: any) {
      results.push({
        testName: 'Signal Conversion',
        status: 'FAILED',
        details: error.message,
      });
    }
    
    // TEST 2: AI Approval (High Confidence)
    console.log('\n🧪 TEST 2: AI Approval (High Confidence)');
    try {
      const strongSignal: AISignal = {
        id: `test_approval_${Date.now()}`,
        symbol: 'BTCUSDT',
        action: 'LONG',
        confidence: 0.88, // High confidence
        entryPrice: 68000,
        stopLoss: 67450,
        takeProfit: 68550,
        indicators: {
          rsi: 62,
          macd: 30,
          adx: 35,
          volume: 1.2,
        },
        timestamp: new Date(),
      };
      
      const engine = new AIDecisionEngine();
      const result = await engine.evaluate(userId, strongSignal);
      
      // Verify decision saved
      const savedDecision = await AIDecision.findOne({
        userId: testUser._id,
        signalId: strongSignal.id,
      });
      
      results.push({
        testName: 'AI Approval (High Confidence Signal)',
        status: result.decision === 'EXECUTE' && savedDecision ? 'PASSED' : 'FAILED',
        details: `AI ${result.decision} signal with ${(result.confidenceBreakdown.total * 100).toFixed(1)}% confidence`,
        data: {
          decision: result.decision,
          confidence: result.confidenceBreakdown,
          reason: result.reason,
          aiCost: result.aiCost,
          savedToDb: !!savedDecision,
        },
      });
    } catch (error: any) {
      results.push({
        testName: 'AI Approval',
        status: 'FAILED',
        details: error.message,
      });
    }
    
    // TEST 3: AI Rejection (Low Confidence)
    console.log('\n🧪 TEST 3: AI Rejection (Low Confidence)');
    try {
      const weakSignal: AISignal = {
        id: `test_rejection_${Date.now()}`,
        symbol: 'BTCUSDT',
        action: 'LONG',
        confidence: 0.65, // Low confidence
        entryPrice: 68000,
        stopLoss: 67450,
        takeProfit: 68550,
        indicators: {
          rsi: 45,
          macd: 5,
          adx: 18,
          volume: 0.7,
        },
        timestamp: new Date(),
      };
      
      const engine = new AIDecisionEngine();
      const result = await engine.evaluate(userId, weakSignal);
      
      results.push({
        testName: 'AI Rejection (Low Confidence Signal)',
        status: result.decision === 'SKIP' ? 'PASSED' : 'FAILED',
        details: `AI ${result.decision} signal with ${(result.confidenceBreakdown.total * 100).toFixed(1)}% confidence`,
        data: {
          decision: result.decision,
          confidence: result.confidenceBreakdown,
          reason: result.reason,
        },
      });
    } catch (error: any) {
      results.push({
        testName: 'AI Rejection',
        status: 'FAILED',
        details: error.message,
      });
    }
    
    // TEST 4: Decision Logging
    console.log('\n🧪 TEST 4: Decision Logging');
    try {
      const initialDecisionCount = await AIDecision.countDocuments({
        userId: testUser._id,
      });
      
      // Trigger signal evaluation (will save decision)
      const engine = new AIDecisionEngine();
      await engine.evaluate(userId.toString(), {
        id: `test_logging_${Date.now()}`,
        symbol: 'BTCUSDT',
        action: 'LONG',
        confidence: 0.88,
        entryPrice: 68000,
        stopLoss: 67450,
        takeProfit: 68550,
        timestamp: new Date(),
      });
      
      const updatedDecisionCount = await AIDecision.countDocuments({
        userId: testUser._id,
      });
      
      const decisionSaved = updatedDecisionCount > initialDecisionCount;
      
      results.push({
        testName: 'Decision Logging to Database',
        status: decisionSaved ? 'PASSED' : 'FAILED',
        details: decisionSaved 
          ? `Decision saved successfully (${initialDecisionCount} → ${updatedDecisionCount})` 
          : 'Decision not saved',
        data: {
          before: initialDecisionCount,
          after: updatedDecisionCount,
        },
      });
    } catch (error: any) {
      results.push({
        testName: 'Decision Logging',
        status: 'FAILED',
        details: error.message,
      });
    }
    
    // Calculate summary
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    
    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        passed,
        failed,
        passRate: `${((passed / results.length) * 100).toFixed(1)}%`,
      },
      results,
    });
    
  } catch (error: any) {
    console.error('❌ Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
