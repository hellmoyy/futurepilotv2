import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorSecret {
  secret: string;
  otpauth_url: string;
  qr_code: string;
}

/**
 * Generate 2FA secret for user
 */
export async function generateTwoFactorSecret(email: string): Promise<TwoFactorSecret> {
  const secret = speakeasy.generateSecret({
    name: `FuturePilot (${email})`,
    issuer: 'FuturePilot',
    length: 32,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32!,
    otpauth_url: secret.otpauth_url!,
    qr_code: qrCode,
  };
}

/**
 * Verify 2FA token
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow 2 time steps before and after
  });
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup code for storage
 */
export async function hashBackupCode(code: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(code: string, hashedCode: string): Promise<boolean> {
  const hashedInput = await hashBackupCode(code);
  return hashedInput === hashedCode;
}
