/**
 * 🚀 Next.js Instrumentation Hook
 * 
 * This file runs once when the Next.js server starts
 * Use it to initialize background tasks
 * 
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // ========================================
    // 🔇 Disable console logs in production
    // ========================================
    if (process.env.NODE_ENV === 'production') {
      const noop = () => {};
      console.log = noop;
      console.info = noop;
      console.debug = noop;
      // Keep console.warn and console.error for debugging
      console.warn('[PRODUCTION] Console logs disabled. Only errors and warnings will be shown.');
    }
    
    // Fix SSL certificate issue in development
    // This allows fetch() to work with Binance API on macOS
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.log('🔧 [INIT] SSL verification disabled for development');
    }
    
    console.log('🚀 [INIT] Next.js server starting...');

    // Auto-start signal generator if enabled
    const AUTO_START_GENERATOR = process.env.AUTO_START_SIGNAL_GENERATOR === 'true';
    const GENERATOR_INTERVAL = parseInt(process.env.SIGNAL_GENERATOR_INTERVAL || '5');

    if (AUTO_START_GENERATOR) {
      console.log(`🤖 [INIT] Auto-starting signal generator (${GENERATOR_INTERVAL}s interval)...`);
      
      try {
        // Dynamic import to avoid circular dependencies
        const { startSignalGenerator } = await import('@/lib/cron/signal-generator');
        
        // Start generator with configured interval
        await startSignalGenerator(GENERATOR_INTERVAL);
        
        console.log(`✅ [INIT] Signal generator started successfully`);
      } catch (error: any) {
        console.error(`❌ [INIT] Failed to start signal generator:`, error.message);
      }
    } else {
      console.log('ℹ️  [INIT] Auto-start disabled. Use POST /api/cron/control to start manually.');
    }
  }
}
