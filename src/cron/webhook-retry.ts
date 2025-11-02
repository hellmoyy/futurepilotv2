/**
 * Webhook Retry Cron Job
 * 
 * Processes pending webhook retries with exponential backoff.
 * 
 * Schedule: Every 1 minute
 * Batch Size: Up to 100 pending retries per run
 * 
 * Logic:
 * 1. Fetch webhooks where nextRetryAt <= now AND status = 'pending' or 'retrying'
 * 2. Process each webhook through WebhookRetryManager
 * 3. Update retry count and next retry time (exponential backoff)
 * 4. Move to DLQ if max retries exceeded
 * 5. Send admin notification when webhook moved to DLQ
 */

import { WebhookRetryManager } from '@/lib/webhookRetry';

/**
 * Main cron job function
 * Call this from your cron system (node-cron, Vercel Cron, etc.)
 */
export async function processWebhookRetries(): Promise<void> {
  console.log('⏰ [WEBHOOK RETRY CRON] Starting webhook retry processing...');
  
  const startTime = Date.now();
  
  try {
    const result = await WebhookRetryManager.processPendingRetries();
    
    const duration = Date.now() - startTime;
    
    console.log('✅ [WEBHOOK RETRY CRON] Processing complete:', {
      retriedCount: result.retriedCount,
      movedToDLQ: result.movedToDLQ,
      errors: result.errors.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Log warning if errors occurred
    if (result.errors.length > 0) {
      console.warn('⚠️ [WEBHOOK RETRY CRON] Some retries failed:', {
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 5) // Show first 5 errors
      });
    }
    
    // Log alert if items moved to DLQ
    if (result.movedToDLQ > 0) {
      console.warn('🚨 [WEBHOOK RETRY CRON] Webhooks moved to Dead Letter Queue:', {
        count: result.movedToDLQ,
        message: 'Admin notification emails should have been sent'
      });
    }
    
  } catch (error) {
    console.error('❌ [WEBHOOK RETRY CRON] Fatal error during webhook retry processing:', error);
    
    // Don't throw error - cron should continue running even if one cycle fails
    // Log to monitoring system here if available
  }
}

/**
 * Cleanup old successful/failed webhook retry records
 * Call this less frequently (e.g., daily) to keep database clean
 * 
 * Removes records older than 30 days with status 'success' or 'dead_letter'
 */
export async function cleanupOldWebhookRetries(): Promise<void> {
  console.log('🧹 [WEBHOOK RETRY CLEANUP] Starting cleanup of old webhook retry records...');
  
  try {
    const deletedCount = await WebhookRetryManager.cleanupOldRetries();
    
    console.log('✅ [WEBHOOK RETRY CLEANUP] Cleanup complete:', {
      deletedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WEBHOOK RETRY CLEANUP] Error during cleanup:', error);
  }
}

/**
 * Get statistics about webhook retry system
 * Useful for monitoring and alerting
 */
export async function getWebhookRetryStats() {
  try {
    const stats = await WebhookRetryManager.getStatistics();
    
    console.log('📊 [WEBHOOK RETRY STATS] Current statistics:', stats);
    
    return stats;
  } catch (error) {
    console.error('❌ [WEBHOOK RETRY STATS] Error getting statistics:', error);
    return null;
  }
}

// Export for use in API routes or other cron systems
export default {
  processWebhookRetries,
  cleanupOldWebhookRetries,
  getWebhookRetryStats
};
