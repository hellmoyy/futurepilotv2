/**
 * Rate Limiting System
 * 
 * Prevents brute force attacks by limiting login attempts per IP/email
 * Uses in-memory storage for simplicity (can be upgraded to Redis for production)
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   * @param key - Unique identifier (IP address, email, or combination)
   * @param config - Rate limit configuration
   * @returns Object with allowed status and retry information
   */
  check(key: string, config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    // No previous attempts or window expired
    if (!entry || now - entry.firstAttempt > config.windowMs) {
      this.store.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs),
      };
    }

    // Increment attempts
    entry.attempts++;
    entry.lastAttempt = now;

    // Check if limit exceeded
    if (entry.attempts > config.maxAttempts) {
      entry.blockedUntil = now + config.blockDurationMs;
      this.store.set(key, entry);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        retryAfter: Math.ceil(config.blockDurationMs / 1000),
      };
    }

    this.store.set(key, entry);
    return {
      allowed: true,
      remaining: config.maxAttempts - entry.attempts,
      resetAt: new Date(entry.firstAttempt + config.windowMs),
    };
  }

  /**
   * Record a successful action (e.g., successful login) - resets counter
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Manually block a key
   */
  block(key: string, durationMs: number): void {
    const now = Date.now();
    this.store.set(key, {
      attempts: 999,
      firstAttempt: now,
      lastAttempt: now,
      blockedUntil: now + durationMs,
    });
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.store.forEach((entry, key) => {
      // Remove if window expired and not blocked, or if block expired
      if (
        (now - entry.firstAttempt > 15 * 60 * 1000 && !entry.blockedUntil) ||
        (entry.blockedUntil && entry.blockedUntil < now)
      ) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.store.delete(key));
  }

  /**
   * Get current status for a key (for debugging/monitoring)
   */
  getStatus(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  /**
   * Clear all entries (use with caution!)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup interval on shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Predefined configurations
export const RateLimitConfigs = {
  // Login attempts: 5 attempts per 15 minutes, block for 30 minutes
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  // Registration: 3 attempts per hour
  REGISTER: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  // Password reset: 3 attempts per hour
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  // 2FA verification: 10 attempts per 15 minutes
  TWO_FACTOR: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  // API endpoints: 100 requests per 15 minutes
  API: {
    maxAttempts: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
  },
};

// Helper function to get client IP from request
export function getClientIP(request: Request): string {
  // Check common headers for real IP (behind proxy/CDN)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

export default rateLimiter;
