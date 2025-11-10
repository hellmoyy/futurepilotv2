# 🧪 Tests Directory

Testing scripts untuk FuturePilot.

---

## 📁 Test Files

### **test-bot-integration.js**
- **Purpose:** Test bot integration dengan signal system
- **Usage:** `node tests/test-bot-integration.js`
- **Tests:** Bot signal processing, trade execution

### **test-bot-quick.sh**
- **Purpose:** Quick test script untuk bot functionality
- **Usage:** `bash tests/test-bot-quick.sh`
- **Tests:** Fast bot validation

### **test-env-pin.js**
- **Purpose:** Test PIN_SIGNAL_CONFIGURATION environment variable
- **Usage:** `node tests/test-env-pin.js`
- **Tests:** Signal Center PIN protection
- **Expected:** PIN should be `366984`

### **test-rss.js**
- **Purpose:** Test RSS feed integration (crypto news)
- **Usage:** `node tests/test-rss.js`
- **Tests:** News feed fetching and parsing

---

## 🚀 Running Tests

**Run Individual Test:**
```bash
node tests/test-bot-integration.js
node tests/test-env-pin.js
node tests/test-rss.js
bash tests/test-bot-quick.sh
```

**Run All Tests:**
```bash
# Add to package.json scripts:
npm run test
```

---

## 📝 Notes

- All tests require `.env` file with proper configuration
- Some tests require MongoDB connection
- Bot tests may require Binance API keys
- Environment variables should be set before running tests

---

**Last Updated:** November 11, 2025
