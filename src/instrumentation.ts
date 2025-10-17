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
