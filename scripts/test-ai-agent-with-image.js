#!/usr/bin/env node

/**
 * Test script untuk AI Agent API endpoint dengan test image
 * Usage: node test-ai-agent-with-image.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api/ai/agent';
const TEST_IMAGE_PATH = path.join(__dirname, '..', 'public', 'images', 'test', 'test.png');

if (!fs.existsSync(TEST_IMAGE_PATH)) {
  console.error('❌ Test image not found:', TEST_IMAGE_PATH);
  process.exit(1);
}

console.log('🧪 AI Agent API Test with Image\n');
console.log('📸 Loading test image:', TEST_IMAGE_PATH);

// Read and convert image to base64
const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
const base64Image = imageBuffer.toString('base64');
const imageSize = Math.round(imageBuffer.length / 1024);
const dataUrl = `data:image/png;base64,${base64Image}`;

console.log('✅ Image loaded');
console.log('   Size:', imageSize, 'KB');
console.log('   Data URL length:', dataUrl.length, 'characters\n');

async function testAIAgentAPI() {
  console.log('🚀 Testing AI Agent API...\n');
  
  const testCases = [
    {
      name: 'Test 1: Simple chart analysis request',
      payload: {
        message: 'Please analyze this chart for educational purposes',
        imageUrl: dataUrl,
        includeMarketData: false,
        includeNews: false,
      }
    },
    {
      name: 'Test 2: Detailed analysis with context',
      payload: {
        message: 'For educational purposes: Identify the trading pair, current price, timeframe, and any visible patterns in this chart',
        imageUrl: dataUrl,
        includeMarketData: false,
        includeNews: false,
      }
    },
    {
      name: 'Test 3: With market data and news',
      payload: {
        message: 'Analyze this BTCUSDT chart with current market context',
        imageUrl: dataUrl,
        includeMarketData: true,
        includeNews: true,
      }
    }
  ];

  for (const testCase of testCases) {
    console.log('─'.repeat(60));
    console.log(testCase.name);
    console.log('─'.repeat(60));
    
    try {
      console.log('Sending request...');
      const startTime = Date.now();
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        console.error('❌ API Error:', response.status);
        console.error('Error:', data.error);
        console.error('Details:', data.details);
      } else {
        console.log('✅ Success!');
        console.log('Response time:', responseTime, 'ms');
        console.log('\nAI Response:');
        console.log('─'.repeat(60));
        console.log(data.response.substring(0, 500) + '...');
        console.log('─'.repeat(60));
        
        console.log('\nMetadata:');
        console.log('- Has Image:', data.hasImage);
        console.log('- Has Market Data:', data.hasMarketData);
        console.log('- Has News:', data.hasNews);
        console.log('- Tokens used:', data.usage?.totalTokens || 'N/A');
        
        // Check if AI actually analyzed the image
        const responseText = data.response.toLowerCase();
        if (responseText.includes('unable to view') || 
            responseText.includes("can't see") ||
            responseText.includes('cannot view')) {
          console.log('\n⚠️  WARNING: AI did NOT actually see the image!');
          console.log('   Response contains generic "unable to view" text');
        } else if (responseText.includes('$') || 
                   responseText.includes('price') ||
                   responseText.includes('btc') ||
                   responseText.includes('chart shows')) {
          console.log('\n✅ SUCCESS: AI appears to have analyzed the image!');
          console.log('   Response contains specific details from chart');
        } else {
          console.log('\n❓ UNCLEAR: Cannot determine if AI saw the image');
        }
      }

    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
    
    console.log('\n');
    
    // Wait between tests
    if (testCase !== testCases[testCases.length - 1]) {
      console.log('Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function testImageValidation() {
  console.log('🔍 Testing image validation endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/ai/test-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: dataUrl }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Image validation results:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Validation failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Validation endpoint not available:', error.message);
  }
  
  console.log('\n');
}

// Run tests
(async () => {
  console.log('Checking if server is running...');
  
  try {
    const healthCheck = await fetch('http://localhost:3001/api/health', {
      method: 'GET',
    });
    
    if (!healthCheck.ok) {
      throw new Error('Server not healthy');
    }
    
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running at http://localhost:3001');
    console.error('   Please start the server with: npm run dev');
    process.exit(1);
  }

  await testImageValidation();
  await testAIAgentAPI();

  console.log('='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('='.repeat(60));
  console.log('\nInterpretation:');
  console.log('1. If AI provides specific chart details → Vision is working ✅');
  console.log('2. If AI says "unable to view" → Vision is NOT working ❌');
  console.log('3. Check console logs for exact error messages');
})();
