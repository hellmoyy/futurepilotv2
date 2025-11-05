import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Trade } from '@/models/Trade';
import { User } from '@/models/User';
import { ExchangeConnection } from '@/models/ExchangeConnection';
import mongoose from 'mongoose';
import rateLimiter, { RateLimitConfigs } from '@/lib/rateLimit';

// GET dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 60 requests per minute
    const rateLimitResult = rateLimiter.check(
      session.user.email,
      RateLimitConfigs.WALLET_GET // Reuse WALLET_GET config (60 per minute)
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfter || 60;
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Parallel fetch for better performance
    const [user, trades, exchangeConnections] = await Promise.all([
      // Get user data
      User.findById(userId).select('name email').lean(),
      
      // Get all trades for statistics
      Trade.find({ userId }).lean(),
      
      // Get exchange connections for balance
      ExchangeConnection.find({ 
        userId,
        isActive: true 
      }).select('exchange balances nickname').lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate Total Balance from Exchange Connections
    let spotBalance = 0;
    let futuresBalance = 0;
    
    exchangeConnections.forEach(conn => {
      if (conn.balances) {
        spotBalance += conn.balances.spot || 0;
        futuresBalance += conn.balances.futures || 0;
      }
    });
    
    const totalBalance = spotBalance + futuresBalance;

    // Calculate Active Trades
    const activeTrades = trades.filter(t => t.status === 'open').length;

    // Calculate Total Profit
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalProfit = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    // Calculate Win Rate
    let winRate = 0;
    if (closedTrades.length > 0) {
      const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
      winRate = (winningTrades / closedTrades.length) * 100;
    }

    // Calculate additional stats
    const totalTrades = closedTrades.length;
    const profitableTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0).length;
    
    // Calculate average profit per trade
    const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

    // Calculate monthly change (compare with previous month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const lastMonthTrades = closedTrades.filter(t => {
      const exitTime = t.exitTime || t.createdAt;
      return exitTime >= lastMonth && exitTime <= lastMonthEnd;
    });
    
    const lastMonthProfit = lastMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const currentMonthTrades = closedTrades.filter(t => {
      const exitTime = t.exitTime || t.createdAt;
      return exitTime >= new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const currentMonthProfit = currentMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    let balanceChangePercent = 0;
    if (lastMonthProfit !== 0) {
      balanceChangePercent = ((currentMonthProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100;
    } else if (currentMonthProfit > 0) {
      balanceChangePercent = 100;
    }

    const stats = {
      totalBalance: parseFloat(totalBalance.toFixed(2)),
      balanceChangePercent: parseFloat(balanceChangePercent.toFixed(2)),
      activeTrades,
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(2)),
      totalTrades,
      profitableTrades,
      losingTrades,
      avgProfit: parseFloat(avgProfit.toFixed(2)),
      // Breakdown for transparency - Exchange balances
      breakdown: {
        spotBalance: parseFloat(spotBalance.toFixed(2)),
        futuresBalance: parseFloat(futuresBalance.toFixed(2)),
        connectedExchanges: exchangeConnections.length,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
