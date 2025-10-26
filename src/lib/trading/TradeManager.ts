/**
 * Trade Manager - Handles trade record creation and updates
 * Integrates bot trading activity with Trade database model
 */

import { Trade } from '@/models/Trade';
import mongoose from 'mongoose';

export interface TradeParams {
  userId: string;
  botInstanceId?: string;
  symbol: string;
  type: 'buy' | 'sell';
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  exchange: string;
  leverage?: number;
  notes?: string;
}

export interface TradeExitParams {
  exitPrice: number;
  exitTime?: Date;
  fees?: number;
  notes?: string;
}

export class TradeManager {
  /**
   * Create a new trade record when bot opens a position
   */
  static async createTrade(params: TradeParams): Promise<any> {
    try {
      const trade = await Trade.create({
        userId: new mongoose.Types.ObjectId(params.userId),
        strategyId: params.botInstanceId ? new mongoose.Types.ObjectId(params.botInstanceId) : undefined,
        symbol: params.symbol.toUpperCase(),
        type: params.type,
        side: params.side,
        entryPrice: params.entryPrice,
        quantity: params.quantity,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
        status: 'open',
        entryTime: new Date(),
        exchange: params.exchange,
        notes: params.notes || `Opened by bot at ${new Date().toISOString()}`,
      });

      console.log(`✅ Trade created: ${trade._id} - ${params.side.toUpperCase()} ${params.symbol} @ $${params.entryPrice}`);
      
      return trade;
    } catch (error: any) {
      console.error('❌ Error creating trade:', error);
      throw new Error(`Failed to create trade: ${error.message}`);
    }
  }

  /**
   * Update trade when bot closes a position
   */
  static async closeTrade(tradeId: string, exitParams: TradeExitParams): Promise<any> {
    try {
      const trade = await Trade.findById(tradeId);
      
      if (!trade) {
        throw new Error('Trade not found');
      }

      if (trade.status !== 'open') {
        throw new Error('Trade is not open');
      }

      // Calculate PNL
      const pnl = this.calculatePnL(
        trade.entryPrice,
        exitParams.exitPrice,
        trade.quantity,
        trade.side,
        exitParams.fees || 0
      );

      const pnlPercentage = ((exitParams.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;

      // Update trade
      const updatedTrade = await Trade.findByIdAndUpdate(
        tradeId,
        {
          status: 'closed',
          exitPrice: exitParams.exitPrice,
          exitTime: exitParams.exitTime || new Date(),
          pnl: pnl,
          pnlPercentage: pnlPercentage,
          fees: exitParams.fees,
          notes: trade.notes + `\nClosed at ${new Date().toISOString()}: ${exitParams.notes || 'Position closed'}`,
        },
        { new: true }
      );

      console.log(`✅ Trade closed: ${tradeId} - PNL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercentage.toFixed(2)}%)`);
      
      return updatedTrade;
    } catch (error: any) {
      console.error('❌ Error closing trade:', error);
      throw new Error(`Failed to close trade: ${error.message}`);
    }
  }

  /**
   * Cancel an open trade
   */
  static async cancelTrade(tradeId: string, reason?: string): Promise<any> {
    try {
      const trade = await Trade.findById(tradeId);
      
      if (!trade) {
        throw new Error('Trade not found');
      }

      if (trade.status !== 'open') {
        throw new Error('Trade is not open');
      }

      const updatedTrade = await Trade.findByIdAndUpdate(
        tradeId,
        {
          status: 'cancelled',
          notes: trade.notes + `\nCancelled at ${new Date().toISOString()}: ${reason || 'Position cancelled'}`,
        },
        { new: true }
      );

      console.log(`⚠️ Trade cancelled: ${tradeId} - ${reason || 'No reason provided'}`);
      
      return updatedTrade;
    } catch (error: any) {
      console.error('❌ Error cancelling trade:', error);
      throw new Error(`Failed to cancel trade: ${error.message}`);
    }
  }

  /**
   * Get all open trades for a user
   */
  static async getOpenTrades(userId: string): Promise<any[]> {
    try {
      const trades = await Trade.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'open',
      }).sort({ entryTime: -1 });

      return trades;
    } catch (error: any) {
      console.error('❌ Error fetching open trades:', error);
      return [];
    }
  }

  /**
   * Get trade statistics for a user
   */
  static async getTradeStats(userId: string): Promise<any> {
    try {
      const trades = await Trade.find({
        userId: new mongoose.Types.ObjectId(userId),
      });

      const openTrades = trades.filter(t => t.status === 'open');
      const closedTrades = trades.filter(t => t.status === 'closed');
      
      const totalProfit = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
      const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
      
      const winRate = closedTrades.length > 0 
        ? (winningTrades.length / closedTrades.length) * 100 
        : 0;

      return {
        openTrades: openTrades.length,
        closedTrades: closedTrades.length,
        totalProfit,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate,
        avgProfit: closedTrades.length > 0 ? totalProfit / closedTrades.length : 0,
      };
    } catch (error: any) {
      console.error('❌ Error fetching trade stats:', error);
      return null;
    }
  }

  /**
   * Calculate PNL for a trade
   */
  private static calculatePnL(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    side: 'long' | 'short',
    fees: number = 0
  ): number {
    let pnl = 0;

    if (side === 'long') {
      // Long: profit when price goes up
      pnl = (exitPrice - entryPrice) * quantity;
    } else {
      // Short: profit when price goes down
      pnl = (entryPrice - exitPrice) * quantity;
    }

    // Subtract fees
    pnl -= fees;

    return parseFloat(pnl.toFixed(2));
  }

  /**
   * Update stop loss for an open trade
   */
  static async updateStopLoss(tradeId: string, newStopLoss: number): Promise<any> {
    try {
      const trade = await Trade.findByIdAndUpdate(
        tradeId,
        { 
          stopLoss: newStopLoss,
          notes: (await Trade.findById(tradeId))?.notes + `\nStop loss updated to $${newStopLoss} at ${new Date().toISOString()}`
        },
        { new: true }
      );

      if (!trade) {
        throw new Error('Trade not found');
      }

      console.log(`📝 Stop loss updated: ${tradeId} - New SL: $${newStopLoss}`);
      
      return trade;
    } catch (error: any) {
      console.error('❌ Error updating stop loss:', error);
      throw new Error(`Failed to update stop loss: ${error.message}`);
    }
  }

  /**
   * Update take profit for an open trade
   */
  static async updateTakeProfit(tradeId: string, newTakeProfit: number): Promise<any> {
    try {
      const trade = await Trade.findByIdAndUpdate(
        tradeId,
        { 
          takeProfit: newTakeProfit,
          notes: (await Trade.findById(tradeId))?.notes + `\nTake profit updated to $${newTakeProfit} at ${new Date().toISOString()}`
        },
        { new: true }
      );

      if (!trade) {
        throw new Error('Trade not found');
      }

      console.log(`📝 Take profit updated: ${tradeId} - New TP: $${newTakeProfit}`);
      
      return trade;
    } catch (error: any) {
      console.error('❌ Error updating take profit:', error);
      throw new Error(`Failed to update take profit: ${error.message}`);
    }
  }
}
