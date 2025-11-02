# 🔑 Cara Mendapatkan MORALIS_WEBHOOK_SECRET

## 📋 Overview

**MORALIS_WEBHOOK_SECRET** adalah kunci rahasia yang digunakan untuk memverifikasi bahwa webhook yang diterima benar-benar berasal dari Moralis, bukan dari attacker yang mencoba memalsukan deposit.

### 🎯 Fungsi Webhook Secret:

```
Tanpa Secret (BAHAYA):
┌──────────────┐
│   Attacker   │ ──> POST /api/webhook/moralis
└──────────────┘     { "amount": 1000000 USDT, "to": "0xAttacker..." }
                     ❌ System terima & credit balance (FAKE DEPOSIT!)

Dengan Secret (AMAN):
┌──────────────┐
│   Attacker   │ ──> POST /api/webhook/moralis
└──────────────┘     { "amount": 1000000, ... }
                     Header: x-signature: FAKE_SIGNATURE
                     ❌ System reject: "Invalid signature" ✅ PROTECTED!

┌──────────────┐
│   Moralis    │ ──> POST /api/webhook/moralis
└──────────────┘     { "amount": 100, ... }
                     Header: x-signature: VALID_HMAC_SHA256
                     ✅ System verify & accept ✅ LEGITIMATE!
```

---

## 📍 Stream Yang Sudah Ada

Dari `.env.local`, Anda sudah punya:
```bash
MORALIS_BSC_TESTNET_STREAM_ID=100e00c2-1091-4787-9725-943dd7694d2b
```

Ini berarti **stream sudah dibuat**, kita tinggal ambil secret-nya!

---

## 🔍 Langkah-Langkah Mendapatkan Secret

### **Step 1: Login ke Moralis Dashboard**

1. Buka browser, pergi ke: https://admin.moralis.io/
2. Login dengan akun Moralis Anda
3. Dashboard akan terbuka

### **Step 2: Navigate ke Streams**

```
Dashboard → Left Sidebar → Streams
```

Atau langsung ke: https://admin.moralis.io/streams

### **Step 3: Temukan Stream Anda**

Di halaman Streams, cari stream dengan ID:
```
100e00c2-1091-4787-9725-943dd7694d2b
```

**Tips:** 
- Nama stream biasanya: "BSC Testnet USDT Deposits" atau serupa
- Status harus: **Active** (hijau)
- Network: **BNB Smart Chain Testnet**

### **Step 4: Klik Stream untuk Melihat Details**

Klik pada stream name atau ID untuk membuka detail page.

### **Step 5: Temukan Webhook Secret**

Di halaman detail stream, cari section:

```
┌─────────────────────────────────────────────────────┐
│ Stream Details                                      │
├─────────────────────────────────────────────────────┤
│ Stream ID:    100e00c2-1091-4787-9725-943dd7694d2b │
│ Webhook URL:  https://your-domain.com/api/webhook/ │
│               moralis                               │
│ Status:       Active                                │
│                                                      │
│ ⚠️  Webhook Secret: [Show/Copy Button]              │
│     Click to reveal secret                          │
└─────────────────────────────────────────────────────┘
```

Atau bisa di tab **"Settings"** atau **"Security"**

### **Step 6: Copy Secret**

1. Klik tombol **"Show"** atau **"Copy"**
2. Secret akan terlihat, contoh format:
   ```
   a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```
3. Copy secret ini

### **Step 7: Paste ke .env.local**

Edit file `.env.local`:

```bash
# OLD (placeholder):
MORALIS_WEBHOOK_SECRET=your_moralis_webhook_secret_from_dashboard

# NEW (real secret):
MORALIS_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### **Step 8: Restart Server**

```bash
npm run dev
```

Server akan reload dengan secret baru.

---

## 🖼️ Visual Guide (Screenshots Reference)

### Dashboard View:
```
┌────────────────────────────────────────────────────────┐
│  Moralis Admin Dashboard                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Sidebar:                                        │  │
│  │  ├─ Home                                         │  │
│  │  ├─ Web3 Data API                                │  │
│  │  ├─ Streams  <──── KLIK INI                     │  │
│  │  ├─ Account                                      │  │
│  │  └─ Billing                                      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Streams List:
```
┌────────────────────────────────────────────────────────┐
│  Streams Overview                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🟢 BSC Testnet USDT Deposits  <──── KLIK INI   │  │
│  │     ID: 100e00c2-1091-4787-9725-943dd7694d2b    │  │
│  │     Network: BNB Smart Chain Testnet            │  │
│  │     Status: Active                               │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Stream Detail:
```
┌────────────────────────────────────────────────────────┐
│  Stream: BSC Testnet USDT Deposits                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tab: Overview | Settings | Logs                │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  Webhook URL:                                    │  │
│  │  https://your-app.com/api/webhook/moralis       │  │
│  │                                                   │  │
│  │  Webhook Secret:  [📋 Copy]  <──── KLIK INI     │  │
│  │  •••••••••••••••  (hidden)                       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## ❓ Troubleshooting

### Problem 1: "Tidak Ada Tab Webhook Secret"

**Solusi:**
- Cari di tab **"Settings"** atau **"Configuration"**
- Atau scroll ke bawah di halaman detail stream
- Kadang ada di section **"Security"**

### Problem 2: "Secret Tidak Terlihat"

**Solusi:**
- Klik tombol **"Show"** atau **"Reveal"**
- Mungkin perlu re-authenticate (masukkan password lagi)
- Pastikan Anda owner atau admin dari project

### Problem 3: "Stream Tidak Ditemukan"

**Cek:**
```bash
# Di terminal, test API:
curl -X GET \
  https://api.moralis-streams.com/streams/$STREAM_ID \
  -H "X-API-Key: $MORALIS_API_KEY"
```

Jika error 404: Stream mungkin dihapus, harus buat baru.

### Problem 4: "Tidak Punya Akses ke Moralis Dashboard"

**Solusi:**
- Tanyakan ke yang setup project
- Atau cek email untuk invite link
- Atau buat akun baru di https://moralis.io/

---

## 🧪 Cara Test Webhook Secret

### Test 1: Manual Test (Postman/cURL)

```bash
# 1. Get your webhook URL
WEBHOOK_URL="http://localhost:3000/api/webhook/moralis"

# 2. Prepare payload
PAYLOAD='{"confirmed":true,"chainId":"0x61","erc20Transfers":[{"transactionHash":"0xtest123","contract":"0x46484Aee842A735Fbf4C05Af7e371792cf52b498","from":"0xsender","to":"0xrecipient","value":"100000000","valueWithDecimals":"100"}]}'

# 3. Generate signature (same as Moralis does)
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$MORALIS_WEBHOOK_SECRET" | sed 's/.* //')

# 4. Send request
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

**Server Logs:**
```
✅ Webhook signature verified
📦 Webhook payload: { confirmed: true, ... }
```

### Test 2: Send Test Webhook from Moralis Dashboard

1. Di stream detail page
2. Cari tombol **"Send Test Webhook"** atau **"Test"**
3. Klik tombol tersebut
4. Moralis akan send webhook dengan signature yang valid
5. Check server logs untuk verification:
   ```
   🔔 Moralis webhook received
   ✅ Webhook signature verified  <──── HARUS ADA INI
   📦 Webhook payload: ...
   ```

### Test 3: Verify dengan Script

Run test script:
```bash
node scripts/test-webhook-signature.js
```

Buat script ini (baru):
```javascript
// scripts/test-webhook-signature.js
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const secret = process.env.MORALIS_WEBHOOK_SECRET;
const payload = JSON.stringify({ test: 'data' });

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('✅ Secret loaded:', secret ? 'Yes' : 'No');
console.log('📝 Test payload:', payload);
console.log('🔐 Generated signature:', signature);
console.log('\n✅ If signature is generated, webhook secret is valid!');
```

---

## 📊 Verification Checklist

Setelah mendapatkan secret, verify:

- [ ] Secret di-copy dari Moralis dashboard
- [ ] Secret di-paste ke `.env.local` tanpa quotes tambahan
- [ ] Server di-restart (`npm run dev`)
- [ ] Test webhook signature generation berhasil
- [ ] Send test webhook dari Moralis dashboard
- [ ] Check logs untuk "✅ Webhook signature verified"

---

## 🔒 Security Best Practices

### ✅ DO:
- Simpan secret di `.env.local` (NOT committed to Git)
- Gunakan secret berbeda untuk testnet & mainnet
- Rotate secret setiap 3-6 bulan
- Monitor logs untuk signature failures

### ❌ DON'T:
- Commit secret ke Git repository
- Share secret di Slack/Discord/Email
- Hardcode secret di source code
- Reuse secret across multiple projects

---

## 🆘 Masih Bingung?

### Option 1: Skip Webhook Secret (Temporary)

Untuk testing sementara, Anda bisa skip verification:

```typescript
// /src/app/api/webhook/moralis/route.ts
// Comment out verification temporarily

const webhookSecret = process.env.MORALIS_WEBHOOK_SECRET;

if (false) { // <── Change true to false temporarily
  // ... verification code
}
```

**⚠️ WARNING:** Ini TIDAK AMAN untuk production! Hanya untuk testing.

### Option 2: Contact Moralis Support

- Support: https://moralis.io/support/
- Discord: https://discord.gg/moralis
- Forum: https://forum.moralis.io/

### Option 3: Create New Stream

Jika tidak bisa akses stream lama, buat stream baru:

1. Dashboard → Streams → "Create New Stream"
2. Select Network: **BNB Smart Chain Testnet**
3. Contract Address: `0x46484Aee842A735Fbf4C05Af7e371792cf52b498` (USDT)
4. Webhook URL: `https://your-domain.com/api/webhook/moralis`
5. Save → Copy new Stream ID & Webhook Secret
6. Update `.env.local`:
   ```bash
   MORALIS_BSC_TESTNET_STREAM_ID=<new-stream-id>
   MORALIS_WEBHOOK_SECRET=<new-secret>
   ```

---

## 📖 Related Documentation

- **Moralis Streams Docs:** https://docs.moralis.io/streams-api
- **Webhook Signature:** https://docs.moralis.io/streams-api/webhooks#webhook-signature
- **Security:** `/docs/TOPUP_SECURITY_FIXES.md`
- **Architecture:** `/docs/TOPUP_SECURITY_ARCHITECTURE.md`

---

## 🎯 Quick Summary

```
1. Login: https://admin.moralis.io/
2. Navigate: Dashboard → Streams
3. Find: Stream ID 100e00c2-1091-4787-9725-943dd7694d2b
4. Click: Stream name
5. Find: "Webhook Secret" section
6. Click: "Show" or "Copy" button
7. Paste: To .env.local
8. Restart: npm run dev
9. Test: Send test webhook
10. Verify: Check logs for "✅ Webhook signature verified"
```

**Status:** ⏳ PENDING - Need to get secret from Moralis dashboard  
**Priority:** 🟡 MEDIUM - Optional but recommended for security  
**Time:** ~5 minutes once you have dashboard access

---

**Last Updated:** November 2, 2025  
**Need Help?** Ask di Discord/Slack atau create GitHub issue
