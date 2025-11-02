import CryptoJS from 'crypto-js';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || 'your-secret-key-change-this-in-production';
const ENCRYPTION_KEY_LEGACY = process.env.ENCRYPTION_SECRET_KEY_LEGACY;

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
 * Tries current key first, then fallback to legacy key if available
 * @param encryptedKey - Encrypted API key string
 * @returns Decrypted plain text API key
 */
export function decryptApiKey(encryptedKey: string): string {
  // Try with current key
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (plainText) {
      return plainText;
    }
  } catch (error) {
    // Current key failed, will try legacy
    console.log('⚠️  Current encryption key failed');
  }
  
  // If current key failed and legacy key exists, try legacy key
  if (ENCRYPTION_KEY_LEGACY) {
    try {
      console.log('🔄 Trying legacy encryption key...');
      const decryptedLegacy = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY_LEGACY);
      const plainTextLegacy = decryptedLegacy.toString(CryptoJS.enc.Utf8);
      
      if (plainTextLegacy) {
        console.log('✅ Successfully decrypted with legacy key');
        return plainTextLegacy;
      }
    } catch (error) {
      console.error('❌ Legacy encryption key also failed:', error);
    }
  }
  
  // Both keys failed
  throw new Error('Failed to decrypt API key - invalid encryption key or corrupted data');
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
