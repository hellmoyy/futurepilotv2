/**
 * Cloudflare Turnstile Verification Library
 * 
 * Server-side verification for Cloudflare Turnstile CAPTCHA
 * Provides secure validation with Cloudflare's infrastructure
 */

interface VerificationResult {
  success: boolean;
  error?: string;
  challengeTs?: string;
  hostname?: string;
}

/**
 * Verify Cloudflare Turnstile token
 * @param token - The token from the Turnstile widget
 * @param secret - Your site secret key
 * @param remoteip - Optional: User's IP address for additional validation
 * @returns Promise with verification result
 */
export async function verifyTurnstile(
  token: string,
  secret?: string,
  remoteip?: string
): Promise<VerificationResult> {
  try {
    // Validate input
    if (!token || typeof token !== 'string') {
      return {
        success: false,
        error: 'Invalid CAPTCHA token',
      };
    }

    // Get secret from environment
    const siteSecret = secret || process.env.TURNSTILE_SECRET_KEY;
    if (!siteSecret) {
      console.error('❌ TURNSTILE_SECRET_KEY not configured');
      return {
        success: false,
        error: 'CAPTCHA configuration error',
      };
    }

    // Verify with Cloudflare Turnstile API
    const verifyEndpoint = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    const formData = new URLSearchParams();
    formData.append('secret', siteSecret);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('❌ Turnstile verification failed:', response.status);
      return {
        success: false,
        error: 'CAPTCHA verification failed',
      };
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
      };
    } else {
      return {
        success: false,
        error: data['error-codes']?.[0] || 'CAPTCHA verification failed',
      };
    }
  } catch (error) {
    console.error('❌ Turnstile verification error:', error);
    return {
      success: false,
      error: 'CAPTCHA verification error',
    };
  }
}

/**
 * Middleware to check CAPTCHA in API routes
 * @param token - The CAPTCHA token from request body
 * @param remoteip - Optional: User's IP address
 * @returns true if valid, throws error if invalid
 */
export async function requireCaptcha(token: string | undefined, remoteip?: string): Promise<boolean> {
  if (!token) {
    throw new Error('CAPTCHA token is required');
  }

  const result = await verifyTurnstile(token, undefined, remoteip);

  if (!result.success) {
    throw new Error(result.error || 'Invalid CAPTCHA');
  }

  return true;
}

/**
 * Check if CAPTCHA is enabled (for development)
 */
export function isCaptchaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CAPTCHA_ENABLED !== 'false';
}

/**
 * Get CAPTCHA sitekey
 */
export function getCaptchaSitekey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
}
