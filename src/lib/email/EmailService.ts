/**
 * Email Service for FuturePilot
 * Integrates professional email templates with Resend API
 */

import { Resend } from 'resend';
import {
  generateWithdrawalRequestEmail,
  generateWithdrawalApprovedEmail,
  generateWithdrawalRejectedEmail,
  generateDepositConfirmedEmail,
  generateTierUpgradeEmail,
  generateTradingProfitEmail,
  generateReferralCommissionEmail,
  generateLowBalanceWarningEmail
} from './templates/NotificationEmailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static instance: EmailService;
  private defaultFrom = 'FuturePilot <noreply@futurepilot.pro>';

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email using Resend
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
        return { success: false, error: 'Email service not configured' };
      }

      const result = await resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html
      });

      if (result.error) {
        console.error('❌ Email send error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
      return { success: true, messageId: result.data?.id };

    } catch (error) {
      console.error('❌ Email send exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send withdrawal request email
   */
  async sendWithdrawalRequest(data: {
    to: string;
    userName: string;
    amount: number;
    network: string;
    walletAddress: string;
  }) {
    return this.sendEmail({
      to: data.to,
      subject: `Withdrawal Request: $${data.amount.toFixed(2)} USDT`,
      html: generateWithdrawalRequestEmail({
        userName: data.userName,
        amount: data.amount,
        network: data.network,
        walletAddress: data.walletAddress
      })
    });
  }

  /**
   * Send withdrawal approved email
   */
  async sendWithdrawalApproved(data: {
    to: string;
    userName: string;
    amount: number;
    network: string;
    walletAddress: string;
    txHash: string;
  }) {
    return this.sendEmail({
      to: data.to,
      subject: `✅ Withdrawal Approved: $${data.amount.toFixed(2)} USDT`,
      html: generateWithdrawalApprovedEmail({
        userName: data.userName,
        amount: data.amount,
        network: data.network,
        walletAddress: data.walletAddress,
        txHash: data.txHash
      })
    });
  }

  /**
   * Send withdrawal rejected email
   */
  async sendWithdrawalRejected(data: {
    to: string;
    userName: string;
    amount: number;
    network: string;
    reason: string;
  }) {
    return this.sendEmail({
      to: data.to,
      subject: `Withdrawal Request Rejected: $${data.amount.toFixed(2)} USDT`,
      html: generateWithdrawalRejectedEmail({
        userName: data.userName,
        amount: data.amount,
        network: data.network,
        reason: data.reason
      })
    });
  }

  /**
   * Send deposit confirmed email
   */
  async sendDepositConfirmed(data: {
    to: string;
    userName: string;
    amount: number;
    network: string;
    txHash: string;
    newBalance: number;
  }) {
    return this.sendEmail({
      to: data.to,
      subject: `🎉 Deposit Confirmed: +$${data.amount.toFixed(2)} USDT`,
      html: generateDepositConfirmedEmail({
        userName: data.userName,
        amount: data.amount,
        network: data.network,
        txHash: data.txHash,
        newBalance: data.newBalance
      })
    });
  }

  /**
   * Send tier upgrade email
   */
  async sendTierUpgrade(data: {
    to: string;
    userName: string;
    oldTier: string;
    newTier: string;
    newRates: { level1: number; level2: number; level3: number };
    totalDeposit: number;
  }) {
    const tierEmoji: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎'
    };

    return this.sendEmail({
      to: data.to,
      subject: `${tierEmoji[data.newTier.toLowerCase()]} Tier Upgrade: ${data.newTier.toUpperCase()}!`,
      html: generateTierUpgradeEmail({
        userName: data.userName,
        oldTier: data.oldTier,
        newTier: data.newTier,
        newRates: data.newRates,
        totalDeposit: data.totalDeposit
      })
    });
  }

  /**
   * Send trading profit email
   */
  async sendTradingProfit(data: {
    to: string;
    userName: string;
    profit: number;
    position: string;
    entryPrice: number;
    exitPrice: number;
    commission: number;
    netProfit: number;
  }) {
    return this.sendEmail({
      to: data.to,
      subject: `🎯 Trade Closed: +$${data.netProfit.toFixed(2)} Profit`,
      html: generateTradingProfitEmail({
        userName: data.userName,
        profit: data.profit,
        position: data.position,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice,
        commission: data.commission,
        netProfit: data.netProfit
      })
    });
  }

  /**
   * Send referral commission email
   */
  async sendReferralCommission(data: {
    to: string;
    userName: string;
    referralName: string;
    amount: number;
    level: number;
    rate: number;
    totalEarnings: number;
  }) {
    return this.sendEmail({
      to: data.to,
      subject: `💰 Referral Commission: +$${data.amount.toFixed(2)}`,
      html: generateReferralCommissionEmail({
        userName: data.userName,
        referralName: data.referralName,
        amount: data.amount,
        level: data.level,
        rate: data.rate,
        totalEarnings: data.totalEarnings
      })
    });
  }

  /**
   * Send low balance warning email
   */
  async sendLowBalanceWarning(data: {
    to: string;
    userName: string;
    currentBalance: number;
    minimumRequired: number;
  }) {
    return this.sendEmail({
      to: data.to,
      subject: `⚠️ Low Gas Fee Balance Alert`,
      html: generateLowBalanceWarningEmail({
        userName: data.userName,
        currentBalance: data.currentBalance,
        minimumRequired: data.minimumRequired
      })
    });
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
