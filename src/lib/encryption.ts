import CryptoJS from 'crypto-js';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || 'your-secret-key-change-this-in-production';

if (!process.env.ENCRYPTION_SECRET_KEY) {
  console.warn('⚠️  ENCRYPTION_SECRET_KEY not set in environment variables. Using default key (NOT SECURE FOR PRODUCTION)');
}

/**
 * Encrypt API key using AES encryption
 * @param apiKey - Plain text API key
 * @returns Encrypted API key string
 */
export function encryptApiKey(apiKey: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Error encrypting API key:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypt API key using AES decryption
 * @param encryptedKey - Encrypted API key string
 * @returns Decrypted plain text API key
 */
export function decryptApiKey(encryptedKey: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plainText) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return plainText;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Hash API key for comparison (one-way, irreversible)
 * Useful for checking if key has changed without storing plain text
 * @param apiKey - Plain text API key
 * @returns SHA256 hash of the API key
 */
export function hashApiKey(apiKey: string): string {
  return CryptoJS.SHA256(apiKey).toString();
}
