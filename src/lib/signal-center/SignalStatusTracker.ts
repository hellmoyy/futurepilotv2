import { SignalBroadcaster } from './SignalBroadcaster';
import type { TradingSignal } from './types';

/**
 * Signal Status Tracker
 * 
 * Tracks and updates signal status lifecycle:
 * ACTIVE → EXECUTED → COMPLETED
 * ACTIVE → EXPIRED (after 5 minutes)
 * ACTIVE → CANCELLED (manual or failed validation)
 */

export interface SignalUpdateResult {
  success: boolean;
  signal: TradingSignal | null;
  error?: string;
}

export interface ExecutionMetrics {
  signalId: string;
  entryPrice: number;
  actualEntryPrice: number;
  slippage: number; // Percentage difference
  latency: number; // Milliseconds from signal to execution
  timestamp: number;
}

export class SignalStatusTracker {
  private static instance: SignalStatusTracker;
  private signalBroadcaster: SignalBroadcaster;
  private executionMetrics: Map<string, ExecutionMetrics>;
  
  private constructor() {
    this.signalBroadcaster = SignalBroadcaster.getInstance();
    this.executionMetrics = new Map();
  }
  
  static getInstance(): SignalStatusTracker {
    if (!SignalStatusTracker.instance) {
      SignalStatusTracker.instance = new SignalStatusTracker();
    }
    return SignalStatusTracker.instance;
  }
  
  /**
   * Mark signal as EXECUTED (bot started executing)
   */
  async markAsExecuted(
    signalId: string,
    actualEntryPrice: number,
    latency: number
  ): Promise<SignalUpdateResult> {
    try {
      const signal = this.signalBroadcaster.getSignal(signalId);
      
      if (!signal) {
        return {
          success: false,
          signal: null,
          error: 'Signal not found',
        };
      }
      
      if (signal.status !== 'ACTIVE') {
        return {
          success: false,
          signal: null,
          error: `Cannot execute signal with status: ${signal.status}`,
        };
      }
      
      // Calculate slippage
      const slippage = Math.abs(
        ((actualEntryPrice - signal.entryPrice) / signal.entryPrice) * 100
      );
      
      // Store execution metrics
      this.executionMetrics.set(signalId, {
        signalId,
        entryPrice: signal.entryPrice,
        actualEntryPrice,
        slippage,
        latency,
        timestamp: Date.now(),
      });
      
      // Update signal status
      this.signalBroadcaster.updateSignal(signalId, { status: 'EXECUTED' });
      
      console.log(`✅ Signal ${signalId} marked as EXECUTED (slippage: ${slippage.toFixed(4)}%, latency: ${latency}ms)`);
      
      const updatedSignal = this.signalBroadcaster.getSignal(signalId);
      
      return {
        success: true,
        signal: updatedSignal || signal,
      };
    } catch (error: any) {
      console.error('❌ Error marking signal as executed:', error);
      return {
        success: false,
        signal: null,
        error: error.message,
      };
    }
  }
  
  /**
   * Mark signal as EXPIRED (5 minute TTL passed)
   */
  async markAsExpired(signalId: string): Promise<SignalUpdateResult> {
    try {
      const signal = this.signalBroadcaster.getSignal(signalId);
      
      if (!signal) {
        return {
          success: false,
          signal: null,
          error: 'Signal not found',
        };
      }
      
      this.signalBroadcaster.updateSignal(signalId, { status: 'EXPIRED' });
      
      console.log(`⏰ Signal ${signalId} marked as EXPIRED`);
      
      const updatedSignal = this.signalBroadcaster.getSignal(signalId);
      
      return {
        success: true,
        signal: updatedSignal || signal,
      };
    } catch (error: any) {
      console.error('❌ Error marking signal as expired:', error);
      return {
        success: false,
        signal: null,
        error: error.message,
      };
    }
  }
  
  /**
   * Mark signal as CANCELLED (failed validation or manual cancel)
   */
  async markAsCancelled(signalId: string, reason: string): Promise<SignalUpdateResult> {
    try {
      const signal = this.signalBroadcaster.getSignal(signalId);
      
      if (!signal) {
        return {
          success: false,
          signal: null,
          error: 'Signal not found',
        };
      }
      
      this.signalBroadcaster.cancelSignal(signalId, reason);
      
      console.log(`🚫 Signal ${signalId} marked as CANCELLED: ${reason}`);
      
      const updatedSignal = this.signalBroadcaster.getSignal(signalId);
      
      return {
        success: true,
        signal: updatedSignal || signal,
      };
    } catch (error: any) {
      console.error('❌ Error marking signal as cancelled:', error);
      return {
        success: false,
        signal: null,
        error: error.message,
      };
    }
  }
  
  /**
   * Get execution metrics for signal
   */
  getExecutionMetrics(signalId: string): ExecutionMetrics | null {
    return this.executionMetrics.get(signalId) || null;
  }
  
  /**
   * Get all execution metrics (for analytics)
   */
  getAllExecutionMetrics(): ExecutionMetrics[] {
    return Array.from(this.executionMetrics.values());
  }
  
  /**
   * Get average slippage across all executions
   */
  getAverageSlippage(): number {
    const metrics = this.getAllExecutionMetrics();
    if (metrics.length === 0) return 0;
    
    const totalSlippage = metrics.reduce((sum, m) => sum + m.slippage, 0);
    return totalSlippage / metrics.length;
  }
  
  /**
   * Get average execution latency
   */
  getAverageLatency(): number {
    const metrics = this.getAllExecutionMetrics();
    if (metrics.length === 0) return 0;
    
    const totalLatency = metrics.reduce((sum, m) => sum + m.latency, 0);
    return totalLatency / metrics.length;
  }
  
  /**
   * Get execution success rate
   */
  getSuccessRate(): number {
    const allSignals = this.signalBroadcaster.getActiveSignals();
    const history = this.signalBroadcaster.getSignalHistory();
    const combined = [...allSignals, ...history];
    
    if (combined.length === 0) return 0;
    
    const executedCount = combined.filter((s: TradingSignal) => s.status === 'EXECUTED').length;
    return (executedCount / combined.length) * 100;
  }
  
  /**
   * Get execution statistics
   */
  getStats() {
    return {
      totalExecutions: this.executionMetrics.size,
      averageSlippage: this.getAverageSlippage(),
      averageLatency: this.getAverageLatency(),
      successRate: this.getSuccessRate(),
    };
  }
  
  /**
   * Clear old metrics (older than 24 hours)
   */
  cleanupOldMetrics(): void {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const toDelete: string[] = [];
    
    this.executionMetrics.forEach((metrics, signalId) => {
      if (metrics.timestamp < dayAgo) {
        toDelete.push(signalId);
      }
    });
    
    toDelete.forEach(id => this.executionMetrics.delete(id));
  }
}

// Export singleton instance
export const signalStatusTracker = SignalStatusTracker.getInstance();
