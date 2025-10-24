# Withdrawal System - Quick Start Guide

## 🚀 Overview
Sistema penarikan dana USDT untuk komisi referral dengan dukungan jaringan ERC20 (Ethereum) dan BEP20 (BSC).

## ✅ Status: READY TO USE

### Fitur yang Sudah Tersedia
- ✅ Request withdrawal dengan minimum $10
- ✅ Support ERC20 dan BEP20
- ✅ Validasi wallet address otomatis
- ✅ History withdrawal lengkap
- ✅ Statistics dashboard
- ✅ Mobile responsive

## 📱 User Guide

### Cara Request Withdrawal

1. **Buka Halaman Referral**
   ```
   Navigate to: /referral
   ```

2. **Check Balance**
   - Lihat "Available Balance" di Overview card
   - Minimum withdrawal: $10.00
   - Progress bar menunjukkan kesiapan withdrawal

3. **Click Button "Request Withdrawal"**
   - Button aktif jika balance >= $10
   - Modal akan terbuka

4. **Isi Form Withdrawal**
   - **Amount:** Minimal $10, maksimal sesuai balance
   - **Network:** Pilih ERC20 (Ethereum) atau BEP20 (BSC)
   - **Wallet Address:** Masukkan address wallet (format: 0x...)
   - **Tips:** Gunakan button "Withdraw All" untuk menarik semua saldo

5. **Submit Request**
   - Klik "Submit Withdrawal Request"
   - Tunggu konfirmasi
   - Balance akan langsung berkurang
   - Status: PENDING

6. **Track Status**
   - Buka tab "Withdraw" di dashboard
   - Lihat history dan status withdrawal
   - Processing time: 24-48 jam
   - Status akan berubah: Pending → Processing → Completed

### Melihat History Withdrawal

1. **Buka Tab "Withdraw"**
   - Ada di Referral Dashboard
   - Icon: 💰

2. **Statistics Cards**
   - **Total:** Jumlah total withdrawal request
   - **Pending:** Menunggu proses (kuning)
   - **Processing:** Sedang diproses (biru)
   - **Completed:** Selesai (hijau)
   - **Total Withdrawn:** Total yang sudah ditarik

3. **Transaction Table**
   - Date & Time
   - Amount
   - Network (ERC20/BEP20)
   - Wallet Address (disingkat)
   - Status (dengan badge warna)
   - TX Hash (link ke block explorer)

4. **Check Transaction**
   - Klik TX Hash untuk lihat di blockchain
   - ERC20 → Etherscan.io
   - BEP20 → BscScan.com

## 🔧 Technical Quick Reference

### API Endpoints

#### Submit Withdrawal
```bash
POST /api/withdrawals

Body:
{
  "amount": 100,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
  "network": "ERC20",
  "type": "referral"
}
```

#### Get History
```bash
GET /api/withdrawals?status=pending&limit=50
```

#### Save Wallets
```bash
POST /api/withdrawals/wallets

Body:
{
  "erc20": "0x...",
  "bep20": "0x..."
}
```

### Database Models

**Withdrawal:**
```javascript
/models/Withdrawal.ts
Fields: userId, amount, walletAddress, network, status, transactionHash, type, timestamps
```

**User (updated):**
```javascript
/models/User.ts
New field: withdrawalWallets { erc20, bep20, verified, addedAt }
```

### Frontend Components

**Referral Page:**
```javascript
/app/referral/page.tsx
- Withdrawal modal
- History tab
- Statistics cards
```

## ⚠️ Important Notes

### Untuk User
1. **Wallet Address Harus Benar**
   - Format: 0x + 40 karakter hex
   - Double check sebelum submit
   - Salah address = dana hilang!

2. **Network Harus Match**
   - Wallet harus support USDT di network yang dipilih
   - ERC20 = Ethereum network
   - BEP20 = BSC network

3. **Processing Time**
   - Normal: 24-48 jam
   - Admin process manual
   - Notifikasi via email (coming soon)

4. **Network Fees**
   - ERC20: $5-$50 (tinggi)
   - BEP20: $0.10-$1 (murah)
   - Fee dipotong dari amount withdrawal

### Untuk Developer
1. **Balance Management**
   - Balance dikurangi saat request (bukan saat completed)
   - Prevent double-spending
   - Refund jika rejected

2. **Status Flow**
   ```
   pending → processing → completed
                      ↘ rejected
   ```

3. **Validation**
   - Client-side: Real-time
   - Server-side: Semua divalidasi ulang
   - Database: Schema validation

4. **Security**
   - Authentication required
   - Input sanitization
   - Duplicate prevention
   - Balance verification

## 🐛 Troubleshooting

### Error: "Insufficient balance"
**Cause:** Balance < amount yang diminta
**Solution:** Check balance, mungkin ada pending withdrawal

### Error: "Invalid wallet address"
**Cause:** Format wallet salah
**Solution:** Pastikan format 0x + 40 karakter hex

### Error: "Minimum withdrawal amount is $10"
**Cause:** Amount < $10
**Solution:** Minimal harus $10

### Error: "You already have a pending withdrawal"
**Cause:** Ada withdrawal yang masih pending
**Solution:** Tunggu sampai diproses atau cancelled

### Withdrawal Stuck di "Pending"
**Cause:** Admin belum proses
**Solution:** Wait 24-48 jam, atau contact support

### TX Hash Tidak Muncul
**Cause:** Admin belum input TX hash
**Solution:** Wait until status = completed

## 🔮 Coming Soon

### Phase 1 (HIGH Priority)
- [ ] 2FA requirement untuk withdrawal
- [ ] Email notifications
- [ ] Wallet management page
- [ ] Admin processing panel

### Phase 2 (MEDIUM Priority)
- [ ] Automatic USDT transfer via API
- [ ] Multi-currency support (USDC, ETH, BNB)
- [ ] QR code wallet scanner
- [ ] Mobile app

### Phase 3 (LOW Priority)
- [ ] Advanced analytics
- [ ] Fraud detection
- [ ] Daily/weekly reports
- [ ] Webhook integrations

## 📞 Support

### For Users
- Email: support@futurepilot.com (update email di docs)
- Telegram: @futurepilot_support (update telegram di docs)
- Response time: 24 hours

### For Developers
- Review: `/docs/WITHDRAWAL_SYSTEM.md`
- Logs: Check MongoDB withdrawal collection
- Debug: Enable detailed logging in API routes

## 🧪 Testing Checklist

### Before Production
- [ ] Test dengan real wallet address (testnet)
- [ ] Test semua validation rules
- [ ] Test mobile responsiveness
- [ ] Test concurrent requests
- [ ] Test error handling
- [ ] Test edge cases (exactly $10, max amount, etc)
- [ ] Load test API endpoints
- [ ] Security audit
- [ ] Backup database

### After Deployment
- [ ] Monitor first withdrawals closely
- [ ] Check logs for errors
- [ ] Verify blockchain transactions
- [ ] Get user feedback
- [ ] Monitor network fees

## 📊 Monitoring

### Daily Checks
- [ ] Pending withdrawals count
- [ ] Average processing time
- [ ] Failed requests
- [ ] User complaints

### Weekly Reports
- [ ] Total withdrawn this week
- [ ] Network usage (ERC20 vs BEP20)
- [ ] Average withdrawal amount
- [ ] Top users by withdrawal

## 🎯 Best Practices

### For Users
1. Start dengan amount kecil untuk test
2. Save wallet address untuk next time
3. Screenshot request confirmation
4. Keep TX hash untuk tracking
5. Use BEP20 untuk save fees

### For Admins
1. Process withdrawals FIFO (first in, first out)
2. Verify wallet address before sending
3. Double check network
4. Save TX hash immediately
5. Notify user when completed

### For Developers
1. Always validate on server
2. Log all withdrawal attempts
3. Monitor suspicious patterns
4. Keep code documented
5. Regular security audits

---

**Quick Links:**
- Full Documentation: `/docs/WITHDRAWAL_SYSTEM.md`
- API Reference: Section in WITHDRAWAL_SYSTEM.md
- Troubleshooting: Section in WITHDRAWAL_SYSTEM.md

**Version:** 1.0.0  
**Last Updated:** 2024-01-15
