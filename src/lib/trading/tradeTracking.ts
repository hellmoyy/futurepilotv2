import { TradeExecution } from '@/models/TradeExecution';
import { BotInstance } from '@/models/BotInstance';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * Trade Tracking Utilities
 * 
 * Functions to track trade execution and update bot statistics
 */

export interface CreateTradeParams {
  userId: string;
  botInstanceId: string;
  botId: number;
  botName: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  exchangeConnectionId: string;
  orderId?: string;
}

export interface CloseTradeParams {
  exitPrice: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'MANUAL' | 'EMERGENCY' | 'DAILY_LIMIT';
  orderId?: string;
  fees?: number;
}

/**
 * Create new trade execution record
 */
export async function createTradeExecution(params: CreateTradeParams): Promise<string> {
  try {
    await connectDB();

    const trade = await TradeExecution.create({
      userId: new mongoose.Types.ObjectId(params.userId),
      botInstanceId: new mongoose.Types.ObjectId(params.botInstanceId),
      botId: params.botId,
      botName: params.botName,
      symbol: params.symbol,
      side: params.side,
      entryPrice: params.entryPrice,
      entryQuantity: params.quantity,
      entryTime: new Date(),
      entryOrderId: params.orderId,
      leverage: params.leverage,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      status: 'OPEN',
      exchange: 'binance',
      exchangeConnectionId: new mongoose.Types.ObjectId(params.exchangeConnectionId),
      fees: 0,
    });

    console.log(`✅ Trade execution created: ${trade._id}`);
    return (trade._id as mongoose.Types.ObjectId).toString();
  } catch (error) {
    console.error('❌ Error creating trade execution:', error);
    throw error;
  }
}

/**
 * Close trade execution and update statistics
 */
export async function closeTradeExecution(
  tradeId: string,
  params: CloseTradeParams
): Promise<void> {
  try {
    await connectDB();

    // Update trade record
    const trade = await TradeExecution.findById(tradeId);
    if (!trade) {
      throw new Error(`Trade ${tradeId} not found`);
    }

    trade.exitPrice = params.exitPrice;
    trade.exitQuantity = trade.entryQuantity; // Full position close
    trade.exitTime = new Date();
    trade.exitOrderId = params.orderId;
    trade.exitReason = params.exitReason;
    trade.fees = params.fees || 0;
    trade.status = 'CLOSED';

    await trade.save(); // This will trigger P&L calculation in pre-save hook

    console.log(`✅ Trade execution closed: ${tradeId}`);
    console.log(`   Entry: $${trade.entryPrice} → Exit: $${trade.exitPrice}`);
    console.log(`   Net P&L: $${trade.netPnL?.toFixed(2)} (${trade.pnlPercent?.toFixed(2)}%)`);

    // Update bot instance statistics
    await updateBotStatistics(trade.botInstanceId.toString());
  } catch (error) {
    console.error('❌ Error closing trade execution:', error);
    throw error;
  }
}

/**
 * Update bot instance statistics from all trades
 */
export async function updateBotStatistics(botInstanceId: string): Promise<void> {
  try {
    await connectDB();

    // Get statistics from TradeExecution model
    const stats = await (TradeExecution as any).getStatistics(botInstanceId);

    // Update bot instance
    await BotInstance.findByIdAndUpdate(botInstanceId, {
      $set: {
        'statistics.totalTrades': stats.totalTrades,
        'statistics.winningTrades': stats.winningTrades,
        'statistics.losingTrades': stats.losingTrades,
        'statistics.totalProfit': stats.totalProfit,
        'statistics.totalLoss': stats.totalLoss,
        'statistics.winRate': stats.winRate,
        'statistics.avgProfit': stats.avgProfit,
        'statistics.dailyPnL': stats.dailyPnL,
        'statistics.lastResetDate': stats.lastResetDate,
      },
    });

    console.log(`📊 Bot statistics updated for ${botInstanceId}:`);
    console.log(`   Total Trades: ${stats.totalTrades}`);
    console.log(`   Win Rate: ${stats.winRate.toFixed(1)}%`);
    console.log(`   Total Profit: $${stats.totalProfit.toFixed(2)}`);
    console.log(`   Total Loss: $${stats.totalLoss.toFixed(2)}`);
    console.log(`   Net P&L: $${(stats.totalProfit - stats.totalLoss).toFixed(2)}`);
  } catch (error) {
    console.error('❌ Error updating bot statistics:', error);
    throw error;
  }
}

/**
 * Get current open trade for bot instance
 */
export async function getCurrentTrade(botInstanceId: string): Promise<any | null> {
  try {
    await connectDB();

    const trade = await TradeExecution.findOne({
      botInstanceId: new mongoose.Types.ObjectId(botInstanceId),
      status: 'OPEN',
    }).lean();

    return trade;
  } catch (error) {
    console.error('❌ Error getting current trade:', error);
    return null;
  }
}

/**
 * Get trade history for bot instance
 */
export async function getTradeHistory(
  botInstanceId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    await connectDB();

    const trades = await (TradeExecution as any).getHistory(botInstanceId, limit);
    return trades;
  } catch (error) {
    console.error('❌ Error getting trade history:', error);
    return [];
  }
}

/**
 * Calculate estimated fees for trade
 * Binance Futures: 0.02% maker + 0.04% taker (using taker fee as conservative estimate)
 */
export function calculateTradeFees(
  entryPrice: number,
  quantity: number,
  leverage: number
): number {
  const positionValue = entryPrice * quantity;
  const takerFeeRate = 0.0004; // 0.04%
  
  // Fee on entry + fee on exit
  const totalFees = positionValue * takerFeeRate * 2;
  
  return totalFees;
}

/**
 * Update position P&L in real-time (called during monitoring)
 */
export async function updatePositionPnL(
  botInstanceId: string,
  currentPrice: number
): Promise<void> {
  try {
    await connectDB();

    const openTrade = await getCurrentTrade(botInstanceId);
    if (!openTrade) return;

    // Calculate current P&L
    const priceDiff = openTrade.side === 'LONG'
      ? (currentPrice - openTrade.entryPrice)
      : (openTrade.entryPrice - currentPrice);

    const grossPnL = priceDiff * openTrade.entryQuantity;
    const estimatedFees = calculateTradeFees(
      openTrade.entryPrice,
      openTrade.entryQuantity,
      openTrade.leverage
    );
    const netPnL = grossPnL - estimatedFees;

    // Update bot instance currentPosition
    const entryValue = openTrade.entryPrice * openTrade.entryQuantity;
    const pnlPercent = (netPnL / entryValue) * 100 * openTrade.leverage;

    await BotInstance.findByIdAndUpdate(botInstanceId, {
      $set: {
        'currentPosition.pnl': netPnL,
        'currentPosition.pnlPercent': pnlPercent,
      },
    });
  } catch (error) {
    console.error('❌ Error updating position P&L:', error);
  }
}
