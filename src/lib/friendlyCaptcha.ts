/**
 * Friendly Captcha Verification Library
 * 
 * Server-side verification for friendly-challenge CAPTCHA
 * Provides secure validation without external API calls
 */

interface VerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Verify Friendly Captcha solution
 * @param solution - The solution string from the CAPTCHA widget
 * @param secret - Your site secret key
 * @returns Promise with verification result
 */
export async function verifyFriendlyCaptcha(
  solution: string,
  secret?: string
): Promise<VerificationResult> {
  try {
    // Validate input
    if (!solution || typeof solution !== 'string') {
      return {
        success: false,
        error: 'Invalid CAPTCHA solution',
      };
    }

    // Get secret from environment
    const siteSecret = secret || process.env.FRIENDLY_CAPTCHA_SECRET;
    if (!siteSecret) {
      console.error('❌ FRIENDLY_CAPTCHA_SECRET not configured');
      return {
        success: false,
        error: 'CAPTCHA configuration error',
      };
    }

    // Verify with Friendly Captcha API
    const verifyEndpoint = process.env.FRIENDLY_CAPTCHA_VERIFY_ENDPOINT || 
      'https://api.friendlycaptcha.com/api/v1/siteverify';

    const response = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        solution,
        secret: siteSecret,
        sitekey: process.env.NEXT_PUBLIC_FRIENDLY_CAPTCHA_SITEKEY,
      }),
    });

    if (!response.ok) {
      console.error('❌ CAPTCHA verification failed:', response.status);
      return {
        success: false,
        error: 'CAPTCHA verification failed',
      };
    }

    const data = await response.json();

    if (data.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.errors?.[0] || 'CAPTCHA verification failed',
      };
    }
  } catch (error) {
    console.error('❌ CAPTCHA verification error:', error);
    return {
      success: false,
      error: 'CAPTCHA verification error',
    };
  }
}

/**
 * Middleware to check CAPTCHA in API routes
 * @param solution - The CAPTCHA solution from request body
 * @returns true if valid, throws error if invalid
 */
export async function requireCaptcha(solution: string | undefined): Promise<boolean> {
  if (!solution) {
    throw new Error('CAPTCHA solution is required');
  }

  const result = await verifyFriendlyCaptcha(solution);

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
  return process.env.NEXT_PUBLIC_FRIENDLY_CAPTCHA_SITEKEY || '';
}
