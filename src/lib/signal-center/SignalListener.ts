import { EventEmitter } from 'events';
import { signalBroadcaster } from './SignalBroadcaster';
import { BotExecutor } from './BotExecutor';
import { User } from '@/models/User';
import type { TradingSignal, SignalStrength } from './types';
import mongoose from 'mongoose';
import { AIDecisionEngine } from '@/lib/ai-bot/AIDecisionEngine';
import type { Signal as AISignal } from '@/lib/ai-bot/AIDecisionEngine';

/**
 * Signal Listener
 * 
 * Per-user signal listener that:
 * - Subscribes to signalBroadcaster
 * - Filters signals by user preferences
 * - Queues and executes signals automatically
 * - Manages bot lifecycle (start/stop)
 */

export interface ListenerStats {
  signalsReceived: number;
  signalsFiltered: number;
  signalsExecuted: number;
  signalsFailed: number;
  signalsSkippedByAI: number;
  lastSignalTime: number;
  status: 'RUNNING' | 'STOPPED' | 'ERROR';
}

export class SignalListener extends EventEmitter {
  private userId: mongoose.Types.ObjectId;
  private botExecutor: BotExecutor | null = null;
  private unsubscribe: (() => void) | null = null;
  private stats: ListenerStats;
  private isRunning = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  
  constructor(userId: mongoose.Types.ObjectId) {
    super();
    this.userId = userId;
    this.stats = {
      signalsReceived: 0,
      signalsFiltered: 0,
      signalsExecuted: 0,
      signalsFailed: 0,
      signalsSkippedByAI: 0,
      lastSignalTime: 0,
      status: 'STOPPED',
    };
  }
  
  /**
   * Start listening to signals
   */
  async start(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isRunning) {
        return { success: false, error: 'Listener already running' };
      }
      
      // Load user and validate
      const user = await User.findById(this.userId).select('+binanceApiKey +binanceApiSecret');
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      if (!user.binanceApiKey || !user.binanceApiSecret) {
        return { success: false, error: 'Binance API credentials not configured' };
      }
      
      if (!user.botSettings?.enabled) {
        return { success: false, error: 'Bot not enabled in settings' };
      }
      
      // Initialize bot executor (mainnet only)
      this.botExecutor = new BotExecutor(
        this.userId,
        user.binanceApiKey,
        user.binanceApiSecret
      );
      
      // Subscribe to signal broadcaster
      this.unsubscribe = signalBroadcaster.subscribe((signal) => {
        this.handleSignal(signal, user.botSettings!);
      });
      
      // Start position monitoring (every 10 seconds)
      this.monitorInterval = setInterval(() => {
        this.monitorPositions();
      }, 10000);
      
      this.isRunning = true;
      this.stats.status = 'RUNNING';
      
      console.log(`🤖 Signal listener started for user ${this.userId}`);
      this.emit('started');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to start listener:', error);
      this.stats.status = 'ERROR';
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Stop listening to signals
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    // Unsubscribe from signals
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    // Stop position monitoring
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.isRunning = false;
    this.stats.status = 'STOPPED';
    
    console.log(`🛑 Signal listener stopped for user ${this.userId}`);
    this.emit('stopped');
  }
  
  /**
   * Handle incoming signal
   */
  private async handleSignal(signal: TradingSignal, userSettings: any): Promise<void> {
    try {
      this.stats.signalsReceived++;
      this.stats.lastSignalTime = Date.now();
      
      console.log(`📡 Signal received: ${signal.symbol} ${signal.action} (${signal.strength})`);
      
      // Filter by user preferences (NOW ASYNC - checks per-user execution)
      const shouldExecute = await this.shouldExecuteSignal(signal, userSettings);
      if (!shouldExecute) {
        this.stats.signalsFiltered++;
        console.log(`⏭️  Signal filtered: ${signal.symbol}`);
        return;
      }
      
      // 🧠 AI DECISION LAYER INTEGRATION
      // Check if AI evaluation is enabled for this user
      if (userSettings.aiDecisionEnabled !== false) { // Default: enabled
        console.log(`🧠 Evaluating signal with AI Decision Engine...`);
        
        try {
          // Convert TradingSignal to AISignal format
          const aiSignal = this.convertSignalToAI(signal);
          
          // Evaluate with AI Decision Engine
          const aiEngine = new AIDecisionEngine();
          const aiResult = await aiEngine.evaluate(this.userId.toString(), aiSignal);
          
          console.log(`🧠 AI Decision: ${aiResult.decision} (confidence: ${(aiResult.confidenceBreakdown.total * 100).toFixed(1)}%)`);
          console.log(`   Reason: ${aiResult.reason}`);
          console.log(`   AI Cost: $${aiResult.aiCost.toFixed(4)}`);
          
          // If AI says SKIP, don't execute
          if (aiResult.decision === 'SKIP') {
            this.stats.signalsSkippedByAI++;
            console.log(`⏭️  Signal skipped by AI: ${signal.symbol}`);
            this.emit('signalSkippedByAI', { signal, aiResult });
            return;
          }
          
          // AI approved, continue to execution
          console.log(`✅ Signal approved by AI, proceeding to execution...`);
          
        } catch (aiError: any) {
          console.error('❌ AI evaluation error:', aiError);
          
          // Fallback behavior: execute signal without AI (configurable)
          if (userSettings.aiDecisionFallbackEnabled === false) {
            // If fallback disabled, skip signal on AI error
            this.stats.signalsFailed++;
            console.log(`⏭️  Signal skipped due to AI error (no fallback)`);
            this.emit('aiError', { signal, error: aiError.message });
            return;
          } else {
            // Default: continue to execution even if AI fails
            console.log(`⚠️  AI evaluation failed, using fallback (direct execution)`);
            this.emit('aiError', { signal, error: aiError.message });
          }
        }
      } else {
        console.log(`⚠️  AI evaluation disabled, executing signal directly`);
      }
      
      // Execute signal
      if (!this.botExecutor) {
        console.error('❌ Bot executor not initialized');
        return;
      }
      
      const result = await this.botExecutor.execute(signal, userSettings);
      
      if (result.success) {
        this.stats.signalsExecuted++;
        console.log(`✅ Signal executed: ${signal.symbol} (Position: ${result.positionId})`);
        this.emit('signalExecuted', { signal, positionId: result.positionId });
      } else {
        this.stats.signalsFailed++;
        console.log(`❌ Signal execution failed: ${result.error}`);
        this.emit('signalFailed', { signal, error: result.error });
      }
    } catch (error: any) {
      console.error('❌ Error handling signal:', error);
      this.stats.signalsFailed++;
    }
  }
  
  /**
   * Check if signal should be executed based on user settings
   */
  private async shouldExecuteSignal(signal: TradingSignal, userSettings: any): Promise<boolean> {
    // ✅ NEW: Check if signal is still ACTIVE or EXPIRED only
    // REMOVED: Don't filter 'EXECUTED' status (allow multi-user execution)
    if (signal.status !== 'ACTIVE') {
      // Only block if EXPIRED or CANCELLED
      if (signal.status === 'EXPIRED' || signal.status === 'CANCELLED') {
        // Increment skipped count for expired/cancelled signals
        const { default: SignalCenterSignal } = await import('@/models/SignalCenterSignal');
        await SignalCenterSignal.incrementSkipped(signal.id);
        return false;
      }
      // For 'EXECUTED', continue checking (allow other users to execute)
    }
    
    // ✅ NEW: Check if THIS USER already executed this signal
    const { default: SignalExecution } = await import('@/models/SignalExecution');
    const hasExecuted = await SignalExecution.hasUserExecuted(signal.id, this.userId);
    
    if (hasExecuted) {
      console.log(`[SignalListener] User ${this.userId} already executed signal ${signal.id}`);
      return false;
    }
    
    // Check symbol filter
    if (!userSettings.symbols.includes(signal.symbol)) {
      // Increment skipped count for filtered signals
      const { default: SignalCenterSignal } = await import('@/models/SignalCenterSignal');
      await SignalCenterSignal.incrementSkipped(signal.id);
      return false;
    }
    
    // Check strength filter
    const strengthOrder = ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'];
    const signalStrengthIndex = strengthOrder.indexOf(signal.strength);
    const minStrengthIndex = strengthOrder.indexOf(userSettings.minStrength);
    
    if (signalStrengthIndex < minStrengthIndex) {
      // Increment skipped count for strength filter
      const { default: SignalCenterSignal } = await import('@/models/SignalCenterSignal');
      await SignalCenterSignal.incrementSkipped(signal.id);
      return false;
    }
    
    // Check if signal expired (5 minute TTL)
    const now = Date.now();
    if (now > signal.expiresAt) {
      // Increment skipped count for expired signals
      const { default: SignalCenterSignal } = await import('@/models/SignalCenterSignal');
      await SignalCenterSignal.incrementSkipped(signal.id);
      return false;
    }
    
    return true;
  }
  
  /**
   * Convert SignalAction to AI action format
   */
  private convertActionToAI(action: string): 'LONG' | 'SHORT' {
    // Map BUY/SELL to LONG/SHORT
    if (action === 'BUY' || action === 'CLOSE_SHORT') {
      return 'LONG';
    }
    return 'SHORT';
  }
  
  /**
   * Normalize signal strength to confidence (0-1)
   */
  private normalizeStrengthToConfidence(strength: SignalStrength): number {
    const strengthMap: Record<SignalStrength, number> = {
      'WEAK': 0.65,
      'MODERATE': 0.75,
      'STRONG': 0.85,
      'VERY_STRONG': 0.95,
    };
    return strengthMap[strength] || 0.75;
  }
  
  /**
   * Convert TradingSignal to AISignal format
   */
  private convertSignalToAI(signal: TradingSignal): AISignal {
    return {
      id: signal.id,
      symbol: signal.symbol,
      action: this.convertActionToAI(signal.action),
      confidence: this.normalizeStrengthToConfidence(signal.strength),
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      indicators: {
        rsi: signal.indicators.rsi,
        macd: signal.indicators.macd.histogram,
        adx: signal.indicators.adx,
        volume: signal.indicators.volume.ratio,
      },
      timestamp: new Date(signal.timestamp),
    };
  }
  
  /**
   * Monitor all active positions
   */
  private async monitorPositions(): Promise<void> {
    try {
      if (!this.botExecutor) return;
      
      const positions = await this.botExecutor.getActivePositions();
      
      for (const position of positions) {
        await this.botExecutor.monitorPosition(position._id.toString());
      }
    } catch (error: any) {
      console.error('❌ Error monitoring positions:', error);
    }
  }
  
  /**
   * Get listener statistics
   */
  getStats(): ListenerStats {
    return { ...this.stats };
  }
  
  /**
   * Check if listener is running
   */
  isListening(): boolean {
    return this.isRunning;
  }
  
  /**
   * Get active positions
   */
  async getActivePositions(): Promise<any[]> {
    if (!this.botExecutor) return [];
    return this.botExecutor.getActivePositions();
  }
  
  /**
   * Manually close a position
   */
  async closePosition(positionId: string): Promise<void> {
    if (!this.botExecutor) {
      throw new Error('Bot executor not initialized');
    }
    
    const position = await this.botExecutor.getPosition(positionId);
    if (!position) {
      throw new Error('Position not found');
    }
    
    const currentPrice = await this.botExecutor['trader'].getMarkPrice(position.symbol);
    await this.botExecutor.closePosition(positionId, 'MANUAL', currentPrice);
  }
}

/**
 * Global listener manager (singleton per user)
 */
class ListenerManager {
  private static instance: ListenerManager;
  private listeners: Map<string, SignalListener> = new Map();
  
  private constructor() {}
  
  static getInstance(): ListenerManager {
    if (!ListenerManager.instance) {
      ListenerManager.instance = new ListenerManager();
    }
    return ListenerManager.instance;
  }
  
  /**
   * Get or create listener for user
   */
  getListener(userId: mongoose.Types.ObjectId): SignalListener {
    const key = userId.toString();
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new SignalListener(userId));
    }
    
    return this.listeners.get(key)!;
  }
  
  /**
   * Remove listener
   */
  async removeListener(userId: mongoose.Types.ObjectId): Promise<void> {
    const key = userId.toString();
    const listener = this.listeners.get(key);
    
    if (listener) {
      await listener.stop();
      this.listeners.delete(key);
    }
  }
  
  /**
   * Get all active listeners
   */
  getActiveListeners(): SignalListener[] {
    return Array.from(this.listeners.values()).filter(l => l.isListening());
  }
  
  /**
   * Stop all listeners
   */
  async stopAll(): Promise<void> {
    const promises = Array.from(this.listeners.values()).map(l => l.stop());
    await Promise.all(promises);
    this.listeners.clear();
  }
}

export const listenerManager = ListenerManager.getInstance();
