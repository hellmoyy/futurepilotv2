# Moralis Webhook Setup Guide

## 🎯 Overview

Moralis Streams memungkinkan real-time detection untuk USDT deposits. Setiap kali user menerima USDT, Moralis akan otomatis kirim webhook ke server kita.

## ✅ Prerequisites

1. ✅ MORALIS_API_KEY sudah ada di `.env`
2. ✅ Webhook endpoint sudah dibuat: `/api/webhook/moralis`
3. ✅ Server bisa diakses dari internet (untuk production)

---

## 📋 Setup Steps

### **1. Login ke Moralis Dashboard**

1. Buka: https://admin.moralis.io
2. Login dengan akun Anda
3. Pilih project Anda (atau buat baru)

### **2. Setup Streams untuk Ethereum (ERC-20)**

1. Di dashboard, klik **"Streams"** di sidebar kiri
2. Klik tombol **"+ New Stream"**
3. Pilih **"Create From Scratch"**

**Stream Configuration:**

```
Stream Name: FuturePilot USDT Deposits (Ethereum)
Description: Monitor USDT deposits on Ethereum mainnet
Network: Ethereum Mainnet
```

**Webhook URL:**
```
Production: https://futurepilot.pro/api/webhook/moralis
Development: https://your-ngrok-url.ngrok.io/api/webhook/moralis
```

**Contract Address (ERC-20 USDT):**
```
0xdAC17F958D2ee523a2206206994597C13D831ec7
```

**ABI - Tambahkan Transfer Event:**
```json
[
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  }
]
```

**Advanced Options:**
- ✅ Include Contract Logs: ON
- ✅ Include Internal Transactions: OFF
- ✅ Include Native Transactions: OFF

**Tag:** `usdt_ethereum`

4. Klik **"Create Stream"**

### **3. Setup Streams untuk BSC (BEP-20)**

Ulangi langkah yang sama untuk BSC:

**Stream Configuration:**
```
Stream Name: FuturePilot USDT Deposits (BSC)
Description: Monitor USDT deposits on Binance Smart Chain
Network: BSC Mainnet
```

**Contract Address (BEP-20 USDT):**
```
0x55d398326f99059fF775485246999027B3197955
```

**ABI:** (sama seperti di atas)

**Tag:** `usdt_bsc`

### **4. Add Wallet Addresses to Streams**

Setiap kali user membuat wallet baru, kita perlu add address mereka ke stream:

**Manual (via Dashboard):**
1. Buka stream yang sudah dibuat
2. Klik tab **"Address"**
3. Klik **"Add Address"**
4. Masukkan wallet address user
5. Klik **"Add"**

**Automatic (via Code):**

```typescript
// Saat user generate wallet
import { addAddressToStream } from '@/lib/moralis';

// Add ke Ethereum stream
await addAddressToStream('your_ethereum_stream_id', userWalletAddress);

// Add ke BSC stream  
await addAddressToStream('your_bsc_stream_id', userWalletAddress);
```

---

## 🧪 Testing

### **Development Testing dengan ngrok:**

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start Next.js server:**
   ```bash
   npm run dev
   ```

3. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copy ngrok URL** (contoh: `https://abc123.ngrok.io`)

5. **Update Moralis Stream webhook URL:**
   ```
   https://abc123.ngrok.io/api/webhook/moralis
   ```

6. **Test webhook:**
   - Send test USDT ke wallet address yang sudah di-monitor
   - Check terminal untuk logs
   - Check database untuk new transaction

### **Test Webhook Manually:**

```bash
curl -X POST http://localhost:3000/api/webhook/moralis \
  -H "Content-Type: application/json" \
  -d '{
    "confirmed": true,
    "chainId": "0x1",
    "streamId": "test",
    "tag": "usdt_ethereum",
    "erc20Transfers": [
      {
        "transactionHash": "0xtest123",
        "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "from": "0xSenderAddress",
        "to": "0xYourWalletAddress",
        "value": "100000000",
        "valueWithDecimals": "100",
        "tokenName": "Tether USD",
        "tokenSymbol": "USDT"
      }
    ],
    "block": {
      "number": "18000000",
      "hash": "0xblockhash",
      "timestamp": "1698765432"
    }
  }'
```

---

## 🔍 Monitoring & Logs

### **Check Webhook Status:**

```bash
# GET request ke endpoint
curl http://localhost:3000/api/webhook/moralis
```

Response:
```json
{
  "message": "Moralis webhook endpoint is active",
  "timestamp": "2025-11-02T10:30:00.000Z",
  "supportedNetworks": ["0x1", "0x38", "0xaa36a7", "0x61"]
}
```

### **Moralis Dashboard:**

1. Buka Streams di dashboard
2. Klik stream yang ingin di-monitor
3. Tab **"Logs"** - lihat webhook deliveries
4. Tab **"Analytics"** - lihat statistics

### **Server Logs:**

Terminal akan show:
```
🔔 Moralis webhook received
📦 Webhook payload: { confirmed: true, chainId: '0x1', ... }
💸 Processing transfer: { txHash: '0x...', amount: 100 }
✅ User found: user@example.com
💰 Processing deposit: { user: 'user@example.com', amount: 100 }
✅ Deposit processed successfully
```

---

## 🚨 Troubleshooting

### **Webhook not received:**
- ✅ Check webhook URL is accessible from internet
- ✅ Check ngrok is running (development)
- ✅ Check Moralis stream is active
- ✅ Check wallet address is added to stream

### **Transaction not processed:**
- ✅ Check USDT contract address is correct
- ✅ Check user wallet exists in database
- ✅ Check transaction not duplicate
- ✅ Check server logs for errors

### **Balance not updated:**
- ✅ Check user.walletData exists
- ✅ Check amount parsing (USDT has 6 decimals)
- ✅ Check database connection
- ✅ Check transaction status is 'confirmed'

---

## 📊 Production Deployment

### **1. Deploy to Production:**

```bash
# Build
npm run build

# Deploy to Vercel/Railway
git push origin main
```

### **2. Update Moralis Webhook URL:**

Production URL:
```
https://futurepilot.pro/api/webhook/moralis
```

### **3. Add Production Wallet Addresses:**

Setiap kali user baru register dan generate wallet:
```typescript
// In /api/wallet/generate
await addAddressToStream(
  process.env.MORALIS_ETHEREUM_STREAM_ID!,
  walletData.erc20Address
);

await addAddressToStream(
  process.env.MORALIS_BSC_STREAM_ID!,
  walletData.bep20Address
);
```

---

## 💡 Best Practices

1. **Backup System:**
   - Keep cron job as backup
   - Run every 5 minutes to catch missed webhooks

2. **Security:**
   - Add webhook secret verification
   - Validate all incoming data
   - Check transaction confirmations

3. **Monitoring:**
   - Set up alerts for failed webhooks
   - Monitor Moralis dashboard daily
   - Check server logs regularly

4. **Rate Limits:**
   - Moralis free tier: 40M compute units/month
   - Monitor usage in dashboard
   - Upgrade if needed

---

## 📞 Support

- **Moralis Docs:** https://docs.moralis.io/streams-api
- **Moralis Discord:** https://moralis.io/discord
- **FuturePilot Support:** admin@futurepilot.pro

---

## ✅ Checklist

- [ ] Moralis account created
- [ ] MORALIS_API_KEY added to .env
- [ ] Ethereum stream created
- [ ] BSC stream created
- [ ] Webhook URL configured
- [ ] Test wallet address added
- [ ] Test deposit sent
- [ ] Balance updated correctly
- [ ] Production deployment done
- [ ] Monitoring setup

---

🎉 **Setup Complete!** Deposits will now be detected automatically in real-time!
