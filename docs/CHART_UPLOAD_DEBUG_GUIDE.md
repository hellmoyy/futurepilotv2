# Chart Upload Debug & Fix Guide

## 🔍 Current Issue: "I'm sorry, I can't assist with this request"

### Langkah-Langkah Debug

#### **Step 1: Check Terminal Logs**

Saat upload chart, check terminal untuk melihat exact error:

```bash
# Look for these lines:
📸 Processing image upload...
Image format: data:image/png;base64,iVBORw...
Image size: 2500 KB

# Then look for error:
AI Agent API Error: {...}
Error details: {
  message: "...",
  code: "...",
  type: "...",
  hasImage: true
}
```

---

#### **Step 2: Test Image Encoding**

Buka browser console dan test image encoding:

```javascript
// Paste ini di browser console setelah upload image:

// 1. Check if image selected
console.log('Selected image:', selectedImage);

// 2. Check image preview
console.log('Image preview length:', imagePreview?.length);

// 3. Test base64 encoding
const testEncode = async (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target.result;
    console.log('Encoding result:', {
      starts_with: result.substring(0, 30),
      length: result.length,
      size_kb: Math.round(result.length / 1024)
    });
  };
  reader.readAsDataURL(file);
};
```

---

#### **Step 3: Test dengan API Endpoint**

Saya sudah buat test endpoint: `/api/ai/test-image`

Test dari browser console:

```javascript
// Get image from upload
const imageData = imagePreview; // atau dari selected image

// Test validation
fetch('/api/ai/test-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl: imageData })
})
.then(r => r.json())
.then(data => console.log('Image validation:', data));
```

Expected response:
```json
{
  "success": true,
  "validation": {
    "isValidFormat": true,
    "imageType": "image/png",
    "isBase64": true,
    "sizeKB": 2500,
    "withinLimit": true
  },
  "recommendations": {
    "format": "✅ Valid data URI",
    "encoding": "✅ Base64 encoded",
    "size": "✅ Within 10MB limit"
  }
}
```

---

#### **Step 4: Check OpenAI API Key**

```bash
# Terminal:
echo $OPENAI_API_KEY

# Should show: sk-proj-...
# If empty, add to .env.local:
OPENAI_API_KEY=sk-proj-your-key-here
```

---

#### **Step 5: Test Langsung dengan cURL**

Bypass frontend, test API directly:

```bash
# Buat test image base64 (small test image)
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Test API
curl -X POST http://localhost:3001/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Please analyze this chart for educational purposes",
    "imageUrl": "'"$TEST_IMAGE"'",
    "includeMarketData": false,
    "includeNews": false
  }' | jq
```

---

## 🛠️ Alternative Solutions

### **Solution 1: Use Lower Detail Mode**

Edit `/src/app/api/ai/agent/route.ts`:

```typescript
// Change from:
detail: 'high'

// To:
detail: 'low'  // or 'auto'
```

Lower detail = less likely to trigger content filter.

---

### **Solution 2: Compress Image Before Upload**

Add image compression di frontend:

```bash
npm install browser-image-compression
```

Then update `/src/app/dashboard/ai-agent/page.tsx`:

```typescript
import imageCompression from 'browser-image-compression';

const handleImageSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    // Compress image
    const options = {
      maxSizeMB: 1,  // Max 1MB
      maxWidthOrHeight: 1920,  // Max dimension
      useWebWorker: true,
    };
    
    const compressedFile = await imageCompression(file, options);
    console.log('Original:', file.size / 1024, 'KB');
    console.log('Compressed:', compressedFile.size / 1024, 'KB');
    
    setSelectedImage(compressedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(compressedFile);
    
  } catch (error) {
    console.error('Compression error:', error);
    setError('Failed to process image');
  }
};
```

---

### **Solution 3: Use External Image URL Instead**

Instead of base64, use image URL:

```typescript
// User uploads to temporary storage first
// Then pass URL to API:

const imageUrl = 'https://i.imgur.com/chart.png';

// API accepts both base64 AND URLs:
{
  type: 'image_url',
  image_url: {
    url: imageUrl,  // Can be data:image or https://
    detail: 'high'
  }
}
```

---

### **Solution 4: Fallback to Text-Only Analysis**

Jika image terus rejected, extract text from chart:

```typescript
// Add OCR library
npm install tesseract.js

// Extract text from chart
import Tesseract from 'tesseract.js';

const extractChartData = async (imageFile) => {
  const { data: { text } } = await Tesseract.recognize(
    imageFile,
    'eng',
    { logger: m => console.log(m) }
  );
  
  // Parse extracted text
  const priceMatch = text.match(/\$?([\d,]+\.?\d*)/g);
  const symbolMatch = text.match(/BTC|ETH|SOL/i);
  
  return {
    prices: priceMatch,
    symbol: symbolMatch?.[0],
    rawText: text
  };
};

// Send extracted data instead of image
const chartData = await extractChartData(selectedImage);
const message = `Analyze this ${chartData.symbol} chart with prices: ${chartData.prices.join(', ')}`;
```

---

### **Solution 5: Try Different OpenAI Model**

Jika GPT-4o vision bermasalah, try GPT-4-turbo:

Edit `/src/config/ai-agent-persona.ts`:

```typescript
model: {
  name: 'gpt-4-turbo',  // Instead of 'gpt-4o'
  // OR
  name: 'gpt-4-vision-preview',  // Older but more permissive
  // ...
}
```

**Note:** Check which models support vision:
- `gpt-4o` ✅ (newest, strict policy)
- `gpt-4-turbo` ✅ (with vision)
- `gpt-4-vision-preview` ✅ (older, more permissive)

---

## 🧪 Testing Checklist

Try these in order:

### ✅ Test 1: Simple Text Query (No Image)
```
Query: "What's Bitcoin price today?"
Expected: Should work fine
```

### ✅ Test 2: Image Test Endpoint
```
POST /api/ai/test-image
Expected: Validation success
```

### ✅ Test 3: Small Test Image
Upload 1x1 pixel test image (100 bytes):
```javascript
const testImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
```

### ✅ Test 4: Real Chart with Educational Prompt
Upload TradingView chart + prompt:
```
"For educational purposes: Please identify patterns in this chart"
```

### ✅ Test 5: Check Exact Error Message
Look at terminal for exact error code/message

---

## 📊 Common Error Messages & Fixes

### Error 1: "Invalid image format"
```
❌ Issue: Image not properly base64 encoded
✅ Fix: Check handleImageSelect() function
```

### Error 2: "Content policy violation"
```
❌ Issue: OpenAI flagging chart as financial advice
✅ Fix: Add more educational framing in prompt
```

### Error 3: "Rate limit exceeded"
```
❌ Issue: Too many API calls
✅ Fix: Wait 60 seconds, check API quota
```

### Error 4: "Invalid request error"
```
❌ Issue: Malformed API request
✅ Fix: Check request body structure
```

### Error 5: "Can't assist with this request"
```
❌ Issue: Content filter triggered (no specific reason)
✅ Fix: Try alternative approaches above
```

---

## 🎯 Quick Fix Checklist

Try these quick fixes:

```bash
# 1. Clear all caches
rm -rf .next
npm run dev

# 2. Check environment
cat .env.local | grep OPENAI

# 3. Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data[0]'

# 4. Check logs
# Terminal should show detailed error

# 5. Try with detail: 'low'
# Edit route.ts, change detail mode

# 6. Try compression
# Add browser-image-compression package

# 7. Try different model
# Change from gpt-4o to gpt-4-turbo
```

---

## 💬 Report Issue Format

If still failing, provide this info:

```
**Environment:**
- OS: macOS/Windows/Linux
- Node version: 
- OpenAI API key valid: Yes/No
- Model used: gpt-4o

**Error from terminal:**
```
[Paste exact error from terminal]
```

**Browser console:**
```
[Paste browser console errors]
```

**Image details:**
- Format: PNG/JPG
- Size: XXX KB
- Dimensions: 1920x1080
- Source: TradingView/Binance/etc

**Prompt used:**
```
[Paste your prompt]
```

**Request payload:**
```json
{
  "message": "...",
  "imageUrl": "data:image/png;base64,... (truncated)",
  "includeMarketData": true
}
```

**Response:**
```json
{
  "success": false,
  "error": "..."
}
```
```

---

## 🚀 Next Steps

1. **Try Test Endpoint First:**
   ```bash
   # Test image validation
   curl -X POST http://localhost:3001/api/ai/test-image \
     -H "Content-Type: application/json" \
     -d '{"imageUrl": "data:image/png;base64,..."}'
   ```

2. **Check Terminal Logs:**
   - Upload chart
   - Look at terminal output
   - Copy error details

3. **Try Alternative Solution:**
   - Start with Solution 1 (lower detail)
   - Then Solution 2 (compression)
   - Last resort: Solution 4 (OCR fallback)

4. **Report Results:**
   - Share terminal error
   - Share browser console
   - I'll provide specific fix

---

**Current Status:**
- ✅ Enhanced error logging added
- ✅ Image validation added
- ✅ Test endpoint created
- ⏳ Waiting for detailed error logs to provide specific fix

**Your Action:**
1. Upload chart again
2. Check terminal output
3. Share exact error message
4. I'll provide targeted solution

