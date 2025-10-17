import { NextRequest, NextResponse } from 'next/server';
import { getGeneratorStatus } from '@/lib/cron/signal-generator';
import connectDB from '@/lib/mongodb';

/**
 * 🏥 Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Returns:
 * - Server status (alive)
 * - Database connectivity
 * - Signal generator status
 * - Uptime
 * 
 * Used by:
 * - UptimeRobot monitoring
 * - Load balancers
 * - Health check services
 */

const startTime = Date.now();

export async function GET(request: NextRequest) {
  const checks: any = {
    server: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000), // seconds
  };

  let allHealthy = true;

  // 1. Check Database Connection
  try {
    await connectDB();
    checks.database = 'connected';
  } catch (error: any) {
    checks.database = 'disconnected';
    checks.databaseError = error.message;
    allHealthy = false;
  }

  // 2. Check Signal Generator
  try {
    const generatorStatus = getGeneratorStatus();
    checks.generator = {
      status: generatorStatus.isRunning ? 'running' : 'stopped',
      hasInterval: generatorStatus.hasInterval,
    };

    // Warning if generator should be running but isn't
    if (process.env.AUTO_START_SIGNAL_GENERATOR === 'true' && !generatorStatus.isRunning) {
      checks.generator.warning = 'Auto-start enabled but generator not running';
      allHealthy = false;
    }
  } catch (error: any) {
    checks.generator = {
      status: 'error',
      error: error.message,
    };
    allHealthy = false;
  }

  // 3. Check Environment Variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'BINANCE_API_KEY',
    'BINANCE_API_SECRET',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    checks.environment = {
      status: 'incomplete',
      missing: missingEnvVars,
    };
    allHealthy = false;
  } else {
    checks.environment = 'configured';
  }

  // 4. Overall Status
  const status = allHealthy ? 'healthy' : 'degraded';
  const statusCode = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status,
      checks,
      version: process.env.npm_package_version || '1.0.0',
    },
    { status: statusCode }
  );
}
