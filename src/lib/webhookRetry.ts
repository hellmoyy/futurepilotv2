/**
 * Webhook Retry Manager
 * 
 * Handles webhook processing failures with exponential backoff retry strategy
 * 
 * Features:
 * - Automatic retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
 * - Dead Letter Queue (DLQ) for persistent failures
 * - Admin notifications for critical failures
 * - Comprehensive error tracking
 * 
 * Usage:
 * ```typescript
 * import { WebhookRetryManager } from '@/lib/webhookRetry';
 * 
 * // In webhook handler (catch block)
 * try {
 *   await processWebhook(payload);
 * } catch (error) {
 *   await WebhookRetryManager.saveForRetry({
 *     webhookType: 'moralis',
 *     payload,
 *     headers: req.headers,
 *     error
 *   });
 * }
 * 
 * // In cron job
 * await WebhookRetryManager.processPendingRetries();
 * ```
 */

import { WebhookRetry, IWebhookRetry } from '@/models/WebhookRetry';
import { connectDB } from '@/lib/mongodb';
import { EmailService } from '@/lib/email/EmailService';

export interface SaveForRetryOptions {
  webhookType: 'moralis' | 'binance' | 'other';
  payload: any;
  headers?: Record<string, string>;
  error: Error | string;
  maxRetries?: number;
  sourceIP?: string;
  userAgent?: string;
}

export interface RetryResult {
  success: boolean;
  retriedCount: number;
  movedToDLQ: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export class WebhookRetryManager {
  /**
   * Save failed webhook for retry
   */
  static async saveForRetry(options: SaveForRetryOptions): Promise<IWebhookRetry> {
    await connectDB();
    
    const {
      webhookType,
      payload,
      headers = {},
      error,
      maxRetries = 5,
      sourceIP,
      userAgent
    } = options;
    
    console.log('💾 Saving failed webhook for retry:', {
      type: webhookType,
      maxRetries,
      payload: JSON.stringify(payload).substring(0, 100) + '...'
    });
    
    // Check if already exists (prevent duplicates)
    const txHash = payload?.transactionHash || payload?.txHash;
    if (txHash) {
      const existing = await WebhookRetry.findOne({
        'payload.transactionHash': txHash,
        status: { $in: ['pending', 'retrying'] }
      });
      
      if (existing) {
        console.log('⚠️ Webhook already in retry queue:', txHash);
        return existing;
      }
    }
    
    // Create retry record
    const retry = new WebhookRetry({
      webhookType,
      payload,
      headers,
      maxRetries,
      nextRetryAt: new Date(), // Retry immediately
      status: 'pending',
      sourceIP,
      userAgent,
      errorHistory: []
    });
    
    // Add initial error
    retry.addError(error);
    
    await retry.save();
    
    console.log('✅ Webhook saved for retry:', retry._id);
    
    return retry;
  }
  
  /**
   * Process pending retries (called by cron job)
   */
  static async processPendingRetries(limit: number = 100): Promise<RetryResult> {
    await connectDB();
    
    const result: RetryResult = {
      success: true,
      retriedCount: 0,
      movedToDLQ: 0,
      errors: []
    };
    
    console.log('🔄 Processing pending webhook retries...');
    
    // Get pending retries
    const pendingRetries = await WebhookRetry.getPendingRetries(limit);
    
    if (pendingRetries.length === 0) {
      console.log('✅ No pending retries');
      return result;
    }
    
    console.log(`📋 Found ${pendingRetries.length} pending retries`);
    
    // Process each retry
    for (const retry of pendingRetries) {
      try {
        // Mark as retrying
        retry.status = 'retrying';
        await retry.save();
        
        console.log(`🔁 Retrying webhook ${retry._id} (attempt ${retry.retryCount + 1}/${retry.maxRetries})`);
        
        // Attempt to process webhook
        const success = await this.processWebhook(retry);
        
        if (success) {
          // Success!
          retry.markSuccess();
          await retry.save();
          
          console.log(`✅ Webhook ${retry._id} processed successfully`);
          result.retriedCount++;
        } else {
          // Failed, schedule next retry
          retry.retryCount++;
          
          if (retry.shouldMoveToDLQ()) {
            // Max retries reached, move to DLQ
            retry.moveToDLQ(`Max retries (${retry.maxRetries}) reached`);
            await retry.save();
            
            console.log(`❌ Webhook ${retry._id} moved to DLQ after ${retry.maxRetries} attempts`);
            result.movedToDLQ++;
            
            // Notify admin
            await this.notifyAdminDLQ(retry);
          } else {
            // Schedule next retry with exponential backoff
            retry.nextRetryAt = retry.calculateNextRetry();
            retry.status = 'pending';
            await retry.save();
            
            const delaySeconds = Math.pow(2, retry.retryCount);
            console.log(`⏳ Webhook ${retry._id} scheduled for retry in ${delaySeconds}s`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        console.error(`❌ Error processing retry ${retry._id}:`, errorMessage);
        
        retry.addError(error instanceof Error ? error : new Error(errorMessage));
        retry.retryCount++;
        
        if (retry.shouldMoveToDLQ()) {
          retry.moveToDLQ(`Exception during retry: ${errorMessage}`);
          result.movedToDLQ++;
          
          await this.notifyAdminDLQ(retry);
        } else {
          retry.nextRetryAt = retry.calculateNextRetry();
          retry.status = 'pending';
        }
        
        await retry.save();
        
        result.errors.push({
          id: String(retry._id),
          error: errorMessage
        });
      }
    }
    
    console.log('✅ Retry processing complete:', {
      total: pendingRetries.length,
      retried: result.retriedCount,
      dlq: result.movedToDLQ,
      errors: result.errors.length
    });
    
    return result;
  }
  
  /**
   * Process individual webhook
   */
  private static async processWebhook(retry: IWebhookRetry): Promise<boolean> {
    switch (retry.webhookType) {
      case 'moralis':
        return await this.processMoralisWebhook(retry);
      
      case 'binance':
        return await this.processBinanceWebhook(retry);
      
      default:
        console.warn(`⚠️ Unknown webhook type: ${retry.webhookType}`);
        return false;
    }
  }
  
  /**
   * Process Moralis webhook (deposit detection)
   */
  private static async processMoralisWebhook(retry: IWebhookRetry): Promise<boolean> {
    try {
      // Import the webhook processor
      const { processMoralisWebhookPayload } = await import('@/lib/webhookProcessors/moralis');
      
      // Process the webhook payload
      await processMoralisWebhookPayload(retry.payload);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('❌ Error processing Moralis webhook:', errorMessage);
      retry.addError(error instanceof Error ? error : new Error(errorMessage));
      
      return false;
    }
  }
  
  /**
   * Process Binance webhook (future use)
   */
  private static async processBinanceWebhook(retry: IWebhookRetry): Promise<boolean> {
    try {
      // TODO: Implement Binance webhook processing
      console.log('⚠️ Binance webhook processing not yet implemented');
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('❌ Error processing Binance webhook:', errorMessage);
      retry.addError(error instanceof Error ? error : new Error(errorMessage));
      
      return false;
    }
  }
  
  /**
   * Notify admin about DLQ items
   */
  private static async notifyAdminDLQ(retry: IWebhookRetry): Promise<void> {
    if (retry.adminNotified) {
      return; // Already notified
    }
    
    try {
      const emailService = EmailService.getInstance();
      
      const errorSummary = retry.errorHistory
        .map((err, idx) => `Attempt ${idx + 1}: ${err.error}`)
        .join('\n');
      
      await emailService.sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@futurepilot.pro',
        subject: `⚠️ Webhook Failed After ${retry.maxRetries} Retries`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Webhook Processing Failed</h2>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p><strong>A webhook has failed after ${retry.maxRetries} retry attempts and has been moved to the Dead Letter Queue.</strong></p>
            </div>
            
            <h3>Details:</h3>
            <ul>
              <li><strong>Webhook ID:</strong> ${retry._id}</li>
              <li><strong>Type:</strong> ${retry.webhookType}</li>
              <li><strong>Created:</strong> ${retry.createdAt.toLocaleString()}</li>
              <li><strong>Total Attempts:</strong> ${retry.retryCount}</li>
              <li><strong>Status:</strong> Dead Letter Queue</li>
            </ul>
            
            <h3>Error History:</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">
${errorSummary}
            </pre>
            
            <h3>Payload (first 500 chars):</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(retry.payload, null, 2).substring(0, 500)}...
            </pre>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
              <p style="color: #666;">
                <strong>Action Required:</strong> Please review this failure in the admin dashboard and take appropriate action.
              </p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/administrator/webhook-failures" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  View Failed Webhooks
                </a>
              </p>
            </div>
          </div>
        `
      });
      
      retry.adminNotified = true;
      await retry.save();
      
      console.log('📧 Admin notified about DLQ item:', retry._id);
    } catch (error) {
      console.error('❌ Failed to notify admin:', error);
    }
  }
  
  /**
   * Get retry statistics
   */
  static async getStatistics() {
    await connectDB();
    return await WebhookRetry.getStatistics();
  }
  
  /**
   * Get DLQ items
   */
  static async getDLQItems(limit: number = 50) {
    await connectDB();
    return await WebhookRetry.getDLQItems(limit);
  }
  
  /**
   * Manual retry for DLQ item (admin action)
   */
  static async manualRetry(retryId: string): Promise<boolean> {
    await connectDB();
    
    const retry = await WebhookRetry.findById(retryId);
    
    if (!retry) {
      throw new Error('Retry record not found');
    }
    
    if (retry.status === 'success') {
      throw new Error('Webhook already processed successfully');
    }
    
    console.log(`🔄 Manual retry initiated for ${retryId}`);
    
    // Reset retry count and status
    const wasDLQ = retry.status === 'dead_letter';
    retry.retryCount = 0;
    retry.status = 'pending';
    retry.nextRetryAt = new Date();
    retry.adminNotified = false;
    
    // Clear DLQ fields if present
    if (wasDLQ) {
      retry.movedToDLQAt = undefined;
      retry.dlqReason = undefined;
    }
    
    await retry.save();
    
    // Try to process immediately
    try {
      const success = await this.processWebhook(retry);
      
      if (success) {
        retry.markSuccess();
        await retry.save();
        return true;
      } else {
        // Will be picked up by cron
        return false;
      }
    } catch (error) {
      retry.addError(error instanceof Error ? error : new Error(String(error)));
      await retry.save();
      return false;
    }
  }
  
  /**
   * Clean up old successful retries (optional housekeeping)
   */
  static async cleanupOldRetries(daysOld: number = 30): Promise<number> {
    await connectDB();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await WebhookRetry.deleteMany({
      status: 'success',
      successAt: { $lte: cutoffDate }
    });
    
    console.log(`🗑️ Cleaned up ${result.deletedCount} old successful retries`);
    
    return result.deletedCount;
  }
}
