# 🧪 Testing Moralis Integration - BSC Testnet

## ✅ Setup Complete!

Stream ID: `100e00c2-1091-4787-9725-943dd7694d2b`
Network: BSC Testnet (Chain ID: 0x61)
Webhook: https://futurepilot.pro/api/webhook/moralis

---

## 📋 Testing Steps

### **Step 1: Generate Test Wallet**

1. Go to http://localhost:3000/topup (atau production URL)
2. Login dengan akun test
3. Click "Generate Wallet"
4. Copy wallet address (BEP-20 address)

### **Step 2: Add Wallet to Moralis Stream**

```bash
# Replace with your actual wallet address
node scripts/setup-moralis-testnet.js add-wallet \
  100e00c2-1091-4787-9725-943dd7694d2b \
  0xYourWalletAddressHere
```

### **Step 3: Get BSC Testnet BNB (for gas fees)**

1. Go to: https://testnet.bnbchain.org/faucet-smart
2. Enter your wallet address
3. Request BNB (you'll get 0.5 BNB)
4. Wait ~30 seconds for confirmation

### **Step 4: Get Test USDT (BEP-20)**

**Option A: Using Test Token Faucet**
1. Go to BSC Testnet explorer: https://testnet.bscscan.com
2. Find test USDT contract: `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd`
3. Use "Write Contract" to mint test tokens

**Option B: Deploy Your Own Test Token**
```javascript
// Simple ERC20 token for testing
// Can use Remix IDE to deploy on BSC Testnet
```

**Option C: Use BUSD Testnet**
Contract: `0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee`

### **Step 5: Send Test USDT**

1. Open MetaMask
2. Switch to BSC Testnet
3. Send test USDT to your generated wallet address
4. Amount: 10 USDT (or any amount)

### **Step 6: Monitor Webhook**

**Check Server Logs:**
```bash
# If running locally
npm run dev

# Watch for:
# 🔔 Moralis webhook received
# 💸 Processing transfer
# ✅ Deposit processed successfully
```

**Check Database:**
```bash
# Check if transaction was recorded
curl http://localhost:3000/api/wallet/transactions
```

**Check Balance:**
```bash
# Balance should update automatically
# Check in /topup page
```

---

## 🔍 Debugging

### **Webhook Not Received?**

1. **Check Moralis Dashboard:**
   - Login: https://admin.moralis.io
   - Go to: Streams
   - Check: Delivery logs

2. **Check Webhook URL is accessible:**
   ```bash
   curl https://futurepilot.pro/api/webhook/moralis
   # Should return: "Moralis webhook endpoint is active"
   ```

3. **Use ngrok for local testing:**
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   ngrok http 3000
   
   # Update webhook URL in Moralis:
   # https://your-ngrok-url.ngrok.io/api/webhook/moralis
   ```

### **Transaction Not Processed?**

Check server logs for errors:
```bash
# Look for:
❌ User not found
❌ Transaction already processed
❌ Not a USDT transfer
```

### **Balance Not Updated?**

1. Check transaction status in database
2. Verify user.walletData exists
3. Check MongoDB connection

---

## 📊 Verify Stream Configuration

```bash
# List all Moralis streams
node scripts/setup-moralis-testnet.js list
```

Expected output:
```
📊 Found 1 streams:

1. usdt_bsc_testnet
   ID: 100e00c2-1091-4787-9725-943dd7694d2b
   Chains: 0x61
   Status: active
   Webhook: https://futurepilot.pro/api/webhook/moralis
```

---

## ✅ Success Indicators

When test is successful, you should see:

1. **Server Logs:**
   ```
   🔔 Moralis webhook received
   📦 Webhook payload: { confirmed: true, chainId: '0x61' }
   💸 Processing transfer: { txHash: '0x...', amount: 10 }
   ✅ User found: test@example.com
   💰 Processing deposit: { amount: 10, network: 'BEP20' }
   ✅ Deposit processed successfully
   ```

2. **Database:**
   - New transaction record created
   - User balance updated (+10 USDT)

3. **Frontend:**
   - Balance shows updated amount
   - Transaction appears in history

---

## 🎯 Quick Test Checklist

- [ ] Wallet generated
- [ ] Wallet added to Moralis stream
- [ ] BNB testnet received (for gas)
- [ ] Test USDT received
- [ ] Test USDT sent to wallet
- [ ] Webhook received
- [ ] Transaction processed
- [ ] Balance updated
- [ ] Transaction in history

---

## 🚀 Next Steps After Successful Test

1. **Test on Mainnet:**
   - Change `NETWORK_MODE=mainnet` in .env
   - Create mainnet streams
   - Use real USDT (small amount)

2. **Add Ethereum Support:**
   - Create ERC-20 stream
   - Test with Ethereum testnet

3. **Production Deployment:**
   - Update webhook URLs
   - Add all user wallets to streams
   - Monitor production logs

---

## 📞 Support

**Issues?**
- Check: `/docs/MORALIS_WEBHOOK_SETUP.md`
- Moralis Docs: https://docs.moralis.io/streams-api
- Discord: https://moralis.io/discord

**Stream ID:** `100e00c2-1091-4787-9725-943dd7694d2b`
**Webhook:** https://futurepilot.pro/api/webhook/moralis
**Network:** BSC Testnet (0x61)
