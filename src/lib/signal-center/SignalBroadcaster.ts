/**
 * 📡 SIGNAL BROADCASTER
 * 
 * Broadcasts trading signals to all connected user bots
 * Uses EventEmitter for in-memory broadcasting
 * Can be extended to use Redis pub/sub for multi-server deployment
 */

import { EventEmitter } from 'events';
import { TradingSignal } from './types';

export class SignalBroadcaster extends EventEmitter {
  private static instance: SignalBroadcaster;
  private activeSignals: Map<string, TradingSignal> = new Map();
  private signalHistory: TradingSignal[] = [];
  private maxHistorySize = 1000;
  
  private constructor() {
    super();
    this.setMaxListeners(0); // Unlimited listeners (one per user bot)
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): SignalBroadcaster {
    if (!SignalBroadcaster.instance) {
      SignalBroadcaster.instance = new SignalBroadcaster();
    }
    return SignalBroadcaster.instance;
  }
  
  /**
   * Broadcast signal to all listening bots
   */
  broadcast(signal: TradingSignal): void {
    console.log(`📡 Broadcasting signal: ${signal.symbol} ${signal.action} (${signal.strength})`);
    
    // Add to active signals
    this.activeSignals.set(signal.id, signal);
    
    // Add to history
    this.signalHistory.unshift(signal);
    if (this.signalHistory.length > this.maxHistorySize) {
      this.signalHistory.pop();
    }
    
    // Emit to all listeners
    this.emit('signal', signal);
    this.emit(`signal:${signal.symbol}`, signal);
    this.emit(`signal:${signal.action}`, signal);
    
    // Schedule expiry cleanup
    setTimeout(() => {
      this.expireSignal(signal.id);
    }, signal.expiresAt - signal.timestamp);
  }
  
  /**
   * Subscribe to signals
   */
  subscribe(callback: (signal: TradingSignal) => void): () => void {
    this.on('signal', callback);
    
    // Return unsubscribe function
    return () => {
      this.off('signal', callback);
    };
  }
  
  /**
   * Subscribe to specific symbol
   */
  subscribeToSymbol(
    symbol: string,
    callback: (signal: TradingSignal) => void
  ): () => void {
    const eventName = `signal:${symbol}`;
    this.on(eventName, callback);
    
    return () => {
      this.off(eventName, callback);
    };
  }
  
  /**
   * Subscribe to specific action (BUY/SELL)
   */
  subscribeToAction(
    action: 'BUY' | 'SELL',
    callback: (signal: TradingSignal) => void
  ): () => void {
    const eventName = `signal:${action}`;
    this.on(eventName, callback);
    
    return () => {
      this.off(eventName, callback);
    };
  }
  
  /**
   * Get active signals
   */
  getActiveSignals(symbol?: string): TradingSignal[] {
    const signals = Array.from(this.activeSignals.values());
    
    if (symbol) {
      return signals.filter(s => s.symbol === symbol);
    }
    
    return signals;
  }
  
  /**
   * Get signal history
   */
  getSignalHistory(limit = 100): TradingSignal[] {
    return this.signalHistory.slice(0, limit);
  }
  
  /**
   * Get signal by ID
   */
  getSignal(signalId: string): TradingSignal | undefined {
    return this.activeSignals.get(signalId);
  }
  
  /**
   * Update signal (e.g., mark as executed)
   */
  updateSignal(signalId: string, updates: Partial<TradingSignal>): void {
    const signal = this.activeSignals.get(signalId);
    if (signal) {
      const updated = { ...signal, ...updates };
      this.activeSignals.set(signalId, updated);
      
      // Also update in history
      const historyIndex = this.signalHistory.findIndex(s => s.id === signalId);
      if (historyIndex !== -1) {
        this.signalHistory[historyIndex] = updated;
      }
      
      // Emit update event
      this.emit('signal:updated', updated);
    }
  }
  
  /**
   * Cancel signal
   */
  cancelSignal(signalId: string, reason: string): void {
    const signal = this.activeSignals.get(signalId);
    if (signal) {
      this.updateSignal(signalId, {
        status: 'CANCELLED',
        reason: `Cancelled: ${reason}`,
      });
      
      this.activeSignals.delete(signalId);
      this.emit('signal:cancelled', signal);
    }
  }
  
  /**
   * Expire old signal
   */
  private expireSignal(signalId: string): void {
    const signal = this.activeSignals.get(signalId);
    if (signal && signal.status === 'ACTIVE') {
      this.updateSignal(signalId, {
        status: 'EXPIRED',
      });
      
      this.activeSignals.delete(signalId);
      this.emit('signal:expired', signal);
      
      console.log(`⏰ Signal expired: ${signal.symbol} ${signal.action}`);
    }
  }
  
  /**
   * Clear all signals (admin action)
   */
  clearAllSignals(): void {
    console.log('🧹 Clearing all active signals');
    this.activeSignals.clear();
    this.emit('signals:cleared');
  }
  
  /**
   * Get stats
   */
  getStats(): {
    activeCount: number;
    totalBroadcast: number;
    listenerCount: number;
  } {
    return {
      activeCount: this.activeSignals.size,
      totalBroadcast: this.signalHistory.length,
      listenerCount: this.listenerCount('signal'),
    };
  }
}

/**
 * Export singleton instance
 */
export const signalBroadcaster = SignalBroadcaster.getInstance();
