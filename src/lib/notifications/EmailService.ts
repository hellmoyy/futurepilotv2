/**
 * Email Service
 * Handles email notifications with HTML templates
 * Uses Resend for email delivery (same as password reset/verification)
 */

import { resend } from '@/lib/email'; // Use existing Resend instance
import type { NotificationPayload } from '@/types/notification';

export class EmailService {
  private isConfigured: boolean = false;

  constructor() {
    this.checkConfiguration();
  }

  /**
   * Check if Resend is configured
   */
  private checkConfiguration() {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EmailService] RESEND_API_KEY not configured. Email notifications disabled.');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
      console.log('[EmailService] Resend email service initialized');
    }
  }

  /**
   * Get user email by userId
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const { default: connectDB } = await import('@/lib/mongodb');
      const mongoose = await import('mongoose');
      
      await connectDB();
      
      const User = mongoose.default.models.futurepilotcols || 
        mongoose.default.model('futurepilotcols', new mongoose.Schema({}, { strict: false, collection: 'futurepilotcols' }));
      
      const user: any = await User.findById(userId).select('email name').lean();
      return user?.email || null;
    } catch (error) {
      console.error('[EmailService] Failed to get user email:', error);
      return null;
    }
  }

  /**
   * Send tier upgrade email
   */
  async sendTierUpgradeEmail(payload: NotificationPayload): Promise<void> {
    if (!this.isConfigured) return;

    const userEmail = await this.getUserEmail(payload.userId);
    if (!userEmail) {
      console.warn('[EmailService] User email not found');
      return;
    }

    const { oldTier, newTier, oldRate, newRate, totalDeposit } = payload.metadata || {};

    const html = this.getTierUpgradeTemplate({
      oldTier: oldTier || 'Bronze',
      newTier: newTier || 'Silver',
      oldRate: oldRate || { level1: 10, level2: 5, level3: 5 },
      newRate: newRate || { level1: 20, level2: 5, level3: 5 },
      totalDeposit: totalDeposit || 0,
    });

    try {
      const { data, error } = await resend.emails.send({
        from: 'FuturePilot <noreply@mail.futurepilot.pro>',
        to: userEmail,
        subject: `🎉 Congratulations! You've been upgraded to ${newTier}`,
        html,
      });

      if (error) {
        console.error('[EmailService] Failed to send tier upgrade email:', error);
        return;
      }

      console.log(`[EmailService] Tier upgrade email sent to ${userEmail}`, data);
    } catch (error) {
      console.error('[EmailService] Error sending tier upgrade email:', error);
    }
  }

  /**
   * Send trading alert email
   */
  async sendTradingAlertEmail(payload: NotificationPayload): Promise<void> {
    if (!this.isConfigured) return;

    const userEmail = await this.getUserEmail(payload.userId);
    if (!userEmail) return;

    const html = this.getTradingAlertTemplate({
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
      metadata: payload.metadata,
    });

    try {
      const { data, error } = await resend.emails.send({
        from: 'FuturePilot <noreply@mail.futurepilot.pro>',
        to: userEmail,
        subject: payload.title,
        html,
      });

      if (error) {
        console.error('[EmailService] Failed to send trading alert email:', error);
        return;
      }

      console.log(`[EmailService] Trading alert email sent to ${userEmail}`, data);
    } catch (error) {
      console.error('[EmailService] Error sending trading alert email:', error);
    }
  }

  /**
   * Send position notification email
   */
  async sendPositionNotificationEmail(payload: NotificationPayload): Promise<void> {
    if (!this.isConfigured) return;

    const userEmail = await this.getUserEmail(payload.userId);
    if (!userEmail) return;

    const html = this.getPositionNotificationTemplate({
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
      metadata: payload.metadata,
    });

    try {
      const { data, error } = await resend.emails.send({
        from: 'FuturePilot <noreply@mail.futurepilot.pro>',
        to: userEmail,
        subject: `📊 Position Update: ${payload.title}`,
        html,
      });

      if (error) {
        console.error('[EmailService] Failed to send position notification email:', error);
        return;
      }

      console.log(`[EmailService] Position notification email sent to ${userEmail}`, data);
    } catch (error) {
      console.error('[EmailService] Error sending position notification email:', error);
    }
  }

  /**
   * Send generic email
   */
  async sendGenericEmail(payload: NotificationPayload): Promise<void> {
    if (!this.isConfigured) return;

    const userEmail = await this.getUserEmail(payload.userId);
    if (!userEmail) return;

    const html = this.getGenericTemplate({
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
    });

    try {
      const { data, error } = await resend.emails.send({
        from: 'FuturePilot <noreply@mail.futurepilot.pro>',
        to: userEmail,
        subject: payload.title,
        html,
      });

      if (error) {
        console.error('[EmailService] Failed to send generic email:', error);
        return;
      }

      console.log(`[EmailService] Generic email sent to ${userEmail}`, data);
    } catch (error) {
      console.error('[EmailService] Error sending generic email:', error);
    }
  }

  /**
   * Tier upgrade email template
   */
  private getTierUpgradeTemplate(data: {
    oldTier: string;
    newTier: string;
    oldRate: any;
    newRate: any;
    totalDeposit: number;
  }): string {
    const tierColors: Record<string, string> = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };

    const newTierColor = tierColors[data.newTier.toLowerCase()] || '#FFD700';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tier Upgrade</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Tier Upgrade!</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0;">Congratulations!</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      You've been upgraded from <strong>${data.oldTier}</strong> to <strong style="color: ${newTierColor};">${data.newTier}</strong>!
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      Your total deposit has reached <strong>$${data.totalDeposit.toFixed(2)}</strong>, unlocking higher commission rates.
                    </p>
                    
                    <!-- Rate Comparison -->
                    <table width="100%" cellpadding="15" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 30px;">
                      <tr style="background-color: #f8f9fa;">
                        <th style="text-align: left; padding: 15px; border-bottom: 2px solid #e0e0e0;">Level</th>
                        <th style="text-align: center; padding: 15px; border-bottom: 2px solid #e0e0e0;">Old Rate</th>
                        <th style="text-align: center; padding: 15px; border-bottom: 2px solid #e0e0e0;">New Rate</th>
                      </tr>
                      <tr>
                        <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">Level 1</td>
                        <td style="text-align: center; padding: 15px; border-bottom: 1px solid #e0e0e0; color: #999;">${data.oldRate.level1}%</td>
                        <td style="text-align: center; padding: 15px; border-bottom: 1px solid #e0e0e0; color: #10b981; font-weight: bold;">${data.newRate.level1}%</td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">Level 2</td>
                        <td style="text-align: center; padding: 15px; border-bottom: 1px solid #e0e0e0; color: #999;">${data.oldRate.level2}%</td>
                        <td style="text-align: center; padding: 15px; border-bottom: 1px solid #e0e0e0; color: #10b981; font-weight: bold;">${data.newRate.level2}%</td>
                      </tr>
                      <tr>
                        <td style="padding: 15px;">Level 3</td>
                        <td style="text-align: center; padding: 15px; color: #999;">${data.oldRate.level3}%</td>
                        <td style="text-align: center; padding: 15px; color: #10b981; font-weight: bold;">${data.newRate.level3}%</td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://futurepilot.com'}/referral" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Commission Rates</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="color: #999999; font-size: 14px; margin: 0;">
                      © 2025 FuturePilot. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Trading alert email template
   */
  private getTradingAlertTemplate(data: any): string {
    const priorityColors: Record<string, string> = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    };

    const color = priorityColors[data.priority] || '#3b82f6';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trading Alert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: ${color}; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${data.title}</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      ${data.message}
                    </p>
                    
                    ${data.metadata?.gasFeeBalance !== undefined ? `
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                        <strong>Gas Fee Balance:</strong> $${data.metadata.gasFeeBalance.toFixed(2)}
                      </p>
                    ` : ''}
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                      <tr>
                        <td align="center">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://futurepilot.com'}/dashboard" style="display: inline-block; padding: 15px 40px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Dashboard</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="color: #999999; font-size: 14px; margin: 0;">
                      © 2025 FuturePilot. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Position notification email template
   */
  private getPositionNotificationTemplate(data: any): string {
    return this.getTradingAlertTemplate(data); // Reuse trading alert template
  }

  /**
   * Generic email template
   */
  private getGenericTemplate(data: any): string {
    return this.getTradingAlertTemplate(data); // Reuse trading alert template
  }
}

export default EmailService;
