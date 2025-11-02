/**
 * Email Preview Endpoint
 * For testing and previewing email templates
 * Access: /api/email/preview?template=withdrawal_request
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateWithdrawalRequestEmail,
  generateWithdrawalApprovedEmail,
  generateWithdrawalRejectedEmail,
  generateDepositConfirmedEmail,
  generateTierUpgradeEmail,
  generateTradingProfitEmail,
  generateReferralCommissionEmail,
  generateLowBalanceWarningEmail
} from '@/lib/email/templates/NotificationEmailTemplates';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const template = searchParams.get('template') || 'withdrawal_request';

    let html = '';

    // Sample data for previews
    switch (template) {
      case 'withdrawal_request':
        html = generateWithdrawalRequestEmail({
          userName: 'John Doe',
          amount: 100.50,
          network: 'ERC20',
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
        });
        break;

      case 'withdrawal_approved':
        html = generateWithdrawalApprovedEmail({
          userName: 'John Doe',
          amount: 100.50,
          network: 'BEP20',
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          txHash: '0x8e5a3f7b2d91c4e6a8b1f3d5c7e9a2b4d6f8e0c2a4b6d8f0e2c4a6b8d0f2e4c6'
        });
        break;

      case 'withdrawal_rejected':
        html = generateWithdrawalRejectedEmail({
          userName: 'John Doe',
          amount: 100.50,
          network: 'ERC20',
          reason: 'Wallet address verification failed. Please ensure the wallet address is correct and belongs to you.'
        });
        break;

      case 'deposit_confirmed':
        html = generateDepositConfirmedEmail({
          userName: 'John Doe',
          amount: 500.00,
          network: 'BEP20',
          txHash: '0x8e5a3f7b2d91c4e6a8b1f3d5c7e9a2b4d6f8e0c2a4b6d8f0e2c4a6b8d0f2e4c6',
          newBalance: 1250.75
        });
        break;

      case 'tier_upgrade':
        html = generateTierUpgradeEmail({
          userName: 'John Doe',
          oldTier: 'Silver',
          newTier: 'Gold',
          newRates: { level1: 30, level2: 5, level3: 5 },
          totalDeposit: 2500.00
        });
        break;

      case 'trading_profit':
        html = generateTradingProfitEmail({
          userName: 'John Doe',
          profit: 250.00,
          position: 'BTCUSDT Long',
          entryPrice: 68000.00,
          exitPrice: 68500.00,
          commission: 50.00,
          netProfit: 200.00
        });
        break;

      case 'referral_commission':
        html = generateReferralCommissionEmail({
          userName: 'John Doe',
          referralName: 'Jane Smith',
          amount: 50.00,
          level: 1,
          rate: 30,
          totalEarnings: 1250.50
        });
        break;

      case 'low_balance':
        html = generateLowBalanceWarningEmail({
          userName: 'John Doe',
          currentBalance: 8.50,
          minimumRequired: 10.00
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid template', available: [
            'withdrawal_request',
            'withdrawal_approved',
            'withdrawal_rejected',
            'deposit_confirmed',
            'tier_upgrade',
            'trading_profit',
            'referral_commission',
            'low_balance'
          ]},
          { status: 400 }
        );
    }

    // Return HTML for preview
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('❌ Email preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}
