# Vision API Testing Scripts

## 🎯 Purpose
Test scripts untuk debug kenapa chart image analysis tidak bekerja dengan OpenAI Vision API.

## 📋 Test Scripts

### 1. **test-vision-api.js** - Direct OpenAI API Test
Test langsung ke OpenAI API (bypass Next.js app)

**What it tests:**
- OpenAI API key validity
- gpt-4o model access
- Vision API functionality
- Different detail modes (low, high, auto)
- Base64 image encoding

**Run:**
```bash
node scripts/test-vision-api.js
```

**Expected output if working:**
```
✅ Image loaded successfully
✅ API Response received
Response: I can see a Bitcoin (BTC) trading chart showing...
[Specific details about the chart]
```

**Expected output if NOT working:**
```
❌ API Error: 400 Bad Request
or
Response: I'm unable to view the image...
```

---

### 2. **test-ai-agent-with-image.js** - AI Agent API Test
Test melalui Next.js AI Agent API endpoint

**What it tests:**
- Image encoding in frontend format
- API endpoint with image handling
- Market data integration
- News integration
- Response time
- Token usage

**Prerequisites:**
- Server must be running: `npm run dev`

**Run:**
```bash
node scripts/test-ai-agent-with-image.js
```

**Expected output if working:**
```
✅ Success!
AI Response: 📸 Chart Analysis Report:
1️⃣ Chart Overview:
- Asset: BTCUSDT
- Current Price: $106,938.70
[Specific analysis from actual chart]

✅ SUCCESS: AI appears to have analyzed the image!
```

**Expected output if NOT working:**
```
⚠️ WARNING: AI did NOT actually see the image!
Response contains generic "unable to view" text
```

---

## 🖼️ Test Image

Location: `/public/images/test/test.png`

**Requirements:**
- Must be a valid PNG or JPG file
- Recommended size: < 5MB
- Should be a crypto trading chart (TradingView, Binance, etc.)
- Include visible: price, timeframe, indicators

**Current test image:**
```
/Users/hap/Documents/CODE-MASTER/futurepilotv2/public/images/test/test.png
```

---

## 🚀 Quick Start

### Step 1: Prepare Test Image
```bash
# Make sure test image exists
ls -lh public/images/test/test.png

# If not exists, create directory and add image
mkdir -p public/images/test
# Then copy your chart screenshot to: public/images/test/test.png
```

### Step 2: Run Direct API Test
```bash
# Test OpenAI API directly
node scripts/test-vision-api.js
```

**Look for:**
- ✅ "Image loaded successfully"
- ✅ "API Response received"
- ✅ Specific chart details in response (price, symbol, etc.)

### Step 3: Run AI Agent Test
```bash
# Start server if not running
npm run dev

# In another terminal:
node scripts/test-ai-agent-with-image.js
```

**Look for:**
- ✅ "SUCCESS: AI appears to have analyzed the image!"
- ❌ "WARNING: AI did NOT actually see the image!"

---

## 🔍 Interpreting Results

### ✅ **Both Tests Pass:**
Vision API is working! Issue is in frontend implementation.

**Fix:**
- Check browser image upload code
- Verify base64 conversion
- Check image size limits

### ❌ **Test 1 Fails (Direct API):**
Problem with OpenAI API access or image encoding.

**Common causes:**
1. **API Key issue**
   ```bash
   # Check .env file
   cat .env | grep OPENAI_API_KEY
   ```

2. **Model access issue**
   - Account doesn't have gpt-4o access
   - Insufficient credits
   - **Fix:** Use gpt-4-turbo or gpt-4-vision-preview

3. **Image encoding issue**
   - Image format invalid
   - Image too large
   - **Fix:** Use smaller PNG file

### ❌ **Test 1 Passes, Test 2 Fails:**
Problem in Next.js API route implementation.

**Check:**
- API route code in `/src/app/api/ai/agent/route.ts`
- Image validation logic
- Request body formatting

### ⚠️ **Generic Response ("Unable to view image"):**
API accepts request but doesn't process image.

**Possible causes:**
- Content policy filter (too strict)
- Image URL format issue
- Vision mode not enabled
- **Fix:** Try different detail modes, add educational context

---

## 🛠️ Troubleshooting

### Issue: "OPENAI_API_KEY not found"
```bash
# Check if .env exists
ls -la .env

# If not, create from example
cp .env.example .env

# Add your API key
echo "OPENAI_API_KEY=sk-proj-your-key-here" >> .env
```

### Issue: "Test image not found"
```bash
# Create directory
mkdir -p public/images/test

# Add your chart screenshot
# Name it: test.png
```

### Issue: "Server is not running"
```bash
# Start the server
npm run dev

# Wait for: "Ready on http://localhost:3001"

# Then run test again
node scripts/test-ai-agent-with-image.js
```

### Issue: "API Error: 400"
Check exact error message in output. Common ones:

```
"invalid_image_url" → Image encoding issue
"content_policy_violation" → Content filter triggered
"invalid_request_error" → Malformed request
"rate_limit_exceeded" → Too many requests
```

### Issue: Generic response without specifics
```
Response: "I'm unable to view the image directly..."
```

This means Vision API didn't receive/process image.

**Fixes:**
1. Try detail mode: `low` instead of `high`
2. Compress image (< 1MB)
3. Add more educational framing
4. Try different model (gpt-4-turbo)

---

## 📊 Success Criteria

### ✅ **Fully Working:**
```
Test 1: ✅ Pass - Sees specific chart details
Test 2: ✅ Pass - Analyzes chart correctly
Result: Vision API is working!
```

### ⚠️ **Partially Working:**
```
Test 1: ✅ Pass - Generic description
Test 2: ❌ Fail - Cannot see image
Result: API works but image not transmitted correctly
```

### ❌ **Not Working:**
```
Test 1: ❌ Fail - API error
Test 2: ❌ Fail - Cannot connect
Result: Fundamental issue with API access or config
```

---

## 🎯 Next Steps Based on Results

### If Test 1 PASSES:
✅ OpenAI Vision API works
→ Issue is in app implementation
→ Check frontend image upload code
→ Verify API route image handling

### If Test 1 FAILS:
❌ OpenAI API issue
→ Check API key validity
→ Verify model access (gpt-4o)
→ Try alternative model (gpt-4-turbo)
→ Check OpenAI account credits

### If Tests Pass but App Fails:
→ Frontend-backend disconnect
→ Check image encoding in browser
→ Verify API request format
→ Check CORS or network issues

---

## 📝 Reporting Results

When reporting test results, include:

```markdown
**Test Environment:**
- Node version: [run: node --version]
- OS: macOS/Windows/Linux
- Server running: Yes/No

**Test 1 Results:**
[Paste full output of test-vision-api.js]

**Test 2 Results:**
[Paste full output of test-ai-agent-with-image.js]

**Test Image:**
- Size: XXX KB
- Format: PNG/JPG
- Source: TradingView/Binance/etc

**Error Messages:**
[Copy any error messages]
```

---

## 🔗 Related Documentation

- [CHART_VISION_ANALYSIS.md](./CHART_VISION_ANALYSIS.md) - Full vision feature docs
- [CHART_UPLOAD_TROUBLESHOOTING.md](./CHART_UPLOAD_TROUBLESHOOTING.md) - Troubleshooting guide
- [CHART_UPLOAD_DEBUG_GUIDE.md](./CHART_UPLOAD_DEBUG_GUIDE.md) - Debug steps

---

**Last Updated:** October 18, 2025
**Purpose:** Debug chart image analysis with OpenAI Vision API
