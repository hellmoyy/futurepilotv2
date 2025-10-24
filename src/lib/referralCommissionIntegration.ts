/**
 * INTEGRATION GUIDE: Commission Auto-Calculation
 * 
 * Cara mengintegrasikan commission calculation ke existing trading/deposit endpoints
 */

import { calculateReferralCommission } from '@/lib/referralCommission';

/**
 * EXAMPLE 1: Trading Fee Commission
 * 
 * Tambahkan di endpoint trading (setelah trade executed)
 * File: /app/api/trading/execute/route.ts atau similar
 */

/*
export async function POST(request: NextRequest) {
  try {
    // ... existing trading logic ...
    
    // After successful trade
    const tradeResult = await executeTrade({
      userId,
      symbol,
      amount,
      // ... other params
    });

    // Calculate trading fee (misalnya 0.1% dari trade amount)
    const tradingFee = tradeAmount * 0.001; // 0.1%

    // 🎯 AUTO-CALCULATE COMMISSION
    await calculateReferralCommission({
      userId: userId,
      amount: tradingFee,
      source: 'trading_fee',
      sourceTransactionId: tradeResult._id,
      notes: `Trading fee commission from ${symbol} trade`,
    });

    return NextResponse.json({ success: true, trade: tradeResult });
  } catch (error) {
    // ... error handling
  }
}
*/

/**
 * EXAMPLE 2: Deposit Fee Commission
 * 
 * Tambahkan di endpoint deposit (setelah deposit confirmed)
 * File: /app/api/wallet/deposit/route.ts atau similar
 */

/*
export async function POST(request: NextRequest) {
  try {
    // ... existing deposit logic ...
    
    const deposit = await processDeposit({
      userId,
      amount,
      currency,
      // ... other params
    });

    // Calculate deposit fee (misalnya 0.5% dari deposit amount)
    const depositFee = depositAmount * 0.005; // 0.5%

    // 🎯 AUTO-CALCULATE COMMISSION
    await calculateReferralCommission({
      userId: userId,
      amount: depositFee,
      source: 'deposit_fee',
      sourceTransactionId: deposit._id,
      notes: `Deposit fee commission: $${depositAmount}`,
    });

    return NextResponse.json({ success: true, deposit });
  } catch (error) {
    // ... error handling
  }
}
*/

/**
 * EXAMPLE 3: Manual Commission Trigger
 * 
 * Jika ingin trigger manual dari admin atau cron job
 */

/*
// Trigger commission untuk semua pending trades
async function processPendingCommissions() {
  const pendingTrades = await Trade.find({ 
    status: 'completed',
    commissionProcessed: false 
  });

  for (const trade of pendingTrades) {
    const fee = trade.amount * 0.001; // 0.1% trading fee
    
    await calculateReferralCommission({
      userId: trade.userId,
      amount: fee,
      source: 'trading_fee',
      sourceTransactionId: trade._id,
    });

    // Mark as processed
    trade.commissionProcessed = true;
    await trade.save();
  }
}
*/

/**
 * EXAMPLE 4: Testing Commission Calculation
 * 
 * Untuk testing manual di development
 */

/*
// Test endpoint: /api/test/commission
import { NextRequest, NextResponse } from 'next/server';
import { calculateReferralCommission } from '@/lib/referralCommission';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json();

    const result = await calculateReferralCommission({
      userId,
      amount,
      source: 'trading_fee',
      notes: 'Test commission',
    });

    return NextResponse.json({
      success: result.success,
      commissions: result.commissions,
      totalCommission: result.totalCommission,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
*/

/**
 * IMPORTANT NOTES:
 * 
 * 1. Commission Distribution:
 *    - Level 1 (Direct referral): 50% of base commission
 *    - Level 2 (2nd generation): 30% of base commission
 *    - Level 3 (3rd generation): 20% of base commission
 * 
 * 2. Membership Rates:
 *    - Bronze: 10% base rate
 *    - Silver: 20% base rate
 *    - Gold: 30% base rate
 *    - Platinum: 50% base rate
 * 
 * 3. Example Calculation:
 *    Trading fee: $100
 *    Level 1 user (Bronze 10%):
 *      - Base: $100 × 10% = $10
 *      - Gets: $10 × 50% = $5
 *    Level 2 user (Silver 20%):
 *      - Base: $100 × 20% = $20
 *      - Gets: $20 × 30% = $6
 *    Level 3 user (Gold 30%):
 *      - Base: $100 × 30% = $30
 *      - Gets: $30 × 20% = $6
 *    Total commission: $5 + $6 + $6 = $17
 * 
 * 4. Auto-update totalEarnings:
 *    Function automatically updates User.totalEarnings field
 * 
 * 5. Status:
 *    All commissions created with status='pending'
 *    Can be auto-paid or require admin approval
 */

export const INTEGRATION_NOTES = {
  tradingFeeRate: 0.001, // 0.1%
  depositFeeRate: 0.005, // 0.5%
  withdrawalFeeRate: 0.002, // 0.2%
  
  // Endpoints to integrate:
  endpoints: [
    '/api/trading/execute',
    '/api/wallet/deposit',
    '/api/wallet/withdraw',
    '/api/subscription/purchase',
  ],
  
  // Commission will be calculated automatically for all users in referral tree
  autoCalculate: true,
  
  // User's totalEarnings will be updated immediately
  autoUpdateBalance: true,
};
