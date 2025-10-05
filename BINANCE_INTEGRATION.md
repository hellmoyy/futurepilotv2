# Binance API Integration - Security & Validation

## Overview
Sistem integrase Binance API dengan enkripsi dan validasi real-time untuk keamanan maksimal.

## Features Implemented

### 1. API Key Encryption ✅
- **Library**: crypto-js (AES-256 encryption)
- **Storage**: API keys di-encrypt sebelum disimpan ke database
- **Decryption**: Automatic decryption saat dibutuhkan via model methods

### 2. Real-time Validation ✅
- Validasi API key dengan Binance live API sebelum save
- Check permissions (Spot, Futures, Margin)
- Verify account access dan trading capabilities
- Error handling untuk invalid credentials

### 3. Security Features ✅
- API keys tidak pernah di-return ke client
- Mongoose `select: false` untuk apiKey dan apiSecret fields
- Pre-save middleware untuk auto-encryption
- Separate encryption key dari environment variable

## Setup Instructions

### 1. Environment Variables
Add to your `.env.local`:

```bash
# Encryption key untuk API keys (WAJIB!)
ENCRYPTION_SECRET_KEY=your-super-secret-encryption-key-min-32-chars
```

**Important**: Gunakan encryption key yang kuat (minimal 32 characters, random string)

### 2. Generate Strong Encryption Key
```bash
# Di terminal, generate random key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## How It Works

### Adding Binance Connection Flow:
1. User input API Key & Secret di UI
2. Frontend POST ke `/api/exchange/connections`
3. **Backend validates** API key dengan Binance API:
   - Test connection ke `GET /api/v3/account`
   - Verify signature dengan HMAC-SHA256
   - Check account permissions
4. **If valid**: 
   - API keys di-**encrypt** dengan AES-256
   - Save encrypted keys ke MongoDB
   - Return success (tanpa credentials)
5. **If invalid**:
   - Return error message ke user
   - Connection tidak di-save

### Validation Errors:
- `401`: Invalid API Key or Secret
- `403`: Missing permissions (enable Spot Trading)
- `400`: Network error atau invalid format
- `409`: Connection already exists

## Security Best Practices

### DO ✅
- Use strong ENCRYPTION_SECRET_KEY (32+ chars)
- Store encryption key in environment variables
- Never log decrypted API keys
- Use HTTPS for all API communication
- Rotate API keys regularly

### DON'T ❌
- Don't commit encryption key to git
- Don't return API keys to frontend
- Don't use same key for dev/prod
- Don't store plain text credentials

## API Endpoints

### POST /api/exchange/connections
Add new exchange connection with validation

**Request Body:**
```json
{
  "exchange": "binance",
  "apiKey": "your-binance-api-key",
  "apiSecret": "your-binance-api-secret",
  "nickname": "My Binance Account",
  "testnet": false,
  "permissions": {
    "spot": true,
    "futures": true,
    "margin": false
  }
}
```

**Success Response (200):**
```json
{
  "message": "Exchange connection added successfully",
  "connection": {
    "_id": "...",
    "exchange": "binance",
    "nickname": "My Binance Account",
    "isActive": true,
    "testnet": false,
    "permissions": { "spot": true, "futures": true, "margin": false },
    "createdAt": "2024-..."
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid API Key or Secret. Please check your credentials.",
  "details": "Please verify your API Key and Secret are correct and have proper permissions."
}
```

## Model Methods

### Get Decrypted Credentials
```typescript
// Get connection with credentials
const connection = await ExchangeConnection.findById(id).select('+apiKey +apiSecret');

// Decrypt for use
const plainApiKey = connection.getDecryptedApiKey();
const plainApiSecret = connection.getDecryptedApiSecret();
```

## Testing

### Test with Valid Binance API Key:
1. Generate API key di Binance: https://www.binance.com/en/my/settings/api-management
2. Enable "Enable Spot & Margin Trading" permission
3. Add IP whitelist (optional but recommended)
4. Copy API Key & Secret
5. Test add connection via UI

### Test with Invalid API Key:
1. Enter random/invalid API key
2. Should see error: "Invalid API Key or Secret"
3. Connection should NOT be saved

## Troubleshooting

### Error: "Decryption failed"
- Encryption key changed or missing
- Database has old encrypted data with different key
- Solution: Re-add connection with current encryption key

### Error: "Invalid API Key or Secret"
- Wrong credentials
- API key disabled/deleted on Binance
- Solution: Check Binance API management page

### Error: "API Key does not have required permissions"
- Missing Spot Trading permission
- Solution: Enable permissions in Binance API settings

## Future Enhancements
- [ ] Support untuk Bybit, KuCoin, OKX validation
- [ ] API key expiration tracking
- [ ] Rate limiting untuk validation requests
- [ ] Webhook notifications untuk API key issues
- [ ] Audit log untuk API key access

## Files Modified/Created
1. `/src/lib/encryption.ts` - Encryption utilities
2. `/src/lib/binance.ts` - Binance API client & validation
3. `/src/models/ExchangeConnection.ts` - Model with encryption hooks
4. `/src/app/api/exchange/connections/route.ts` - API with validation
5. `.env.example` - Updated with ENCRYPTION_SECRET_KEY

---

**Security Note**: Sistem ini menggunakan industry-standard AES-256 encryption. Namun, keamanan ultimate bergantung pada:
1. Strong encryption key
2. Secure server environment
3. HTTPS communication
4. Regular security audits
