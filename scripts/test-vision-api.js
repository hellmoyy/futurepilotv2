#!/usr/bin/env node

/**
 * Test script untuk OpenAI Vision API dengan chart image
 * Usage: node test-vision-api.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TEST_IMAGE_PATH = path.join(__dirname, '..', 'public', 'images', 'test', 'test.png');

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

if (!fs.existsSync(TEST_IMAGE_PATH)) {
  console.error('❌ Test image not found:', TEST_IMAGE_PATH);
  console.log('Please ensure the image exists at:', TEST_IMAGE_PATH);
  process.exit(1);
}

console.log('🧪 OpenAI Vision API Test\n');
console.log('📸 Loading test image:', TEST_IMAGE_PATH);

// Read and convert image to base64
const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
const base64Image = imageBuffer.toString('base64');
const imageSize = Math.round(imageBuffer.length / 1024);

console.log('✅ Image loaded successfully');
console.log('   Size:', imageSize, 'KB');
console.log('   Format: PNG');
console.log('   Base64 length:', base64Image.length, 'characters\n');

// Prepare the API request
const dataUrl = `data:image/png;base64,${base64Image}`;

console.log('🚀 Testing OpenAI Vision API...\n');
console.log('Test 1: Simple vision test with generic prompt');
console.log('─'.repeat(60));

async function testVisionAPI() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What do you see in this image? Please describe it in detail.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Error details:', JSON.stringify(data, null, 2));
      return false;
    }

    console.log('✅ API Response received\n');
    console.log('Response:');
    console.log('─'.repeat(60));
    console.log(data.choices[0].message.content);
    console.log('─'.repeat(60));
    console.log('\nToken usage:', data.usage);
    
    return true;

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function testChartAnalysis() {
  console.log('\n\nTest 2: Chart-specific analysis prompt');
  console.log('─'.repeat(60));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert trading analyst. Analyze trading charts and provide detailed technical analysis.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `[EDUCATIONAL TECHNICAL ANALYSIS REQUEST]

Please analyze this cryptocurrency trading chart for educational purposes:
1. Identify the trading pair and timeframe
2. Read the current price from the chart
3. Identify any visible technical patterns
4. Note support and resistance levels
5. Read any visible indicators (RSI, MACD, etc.)

This is for learning purposes only.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Error details:', JSON.stringify(data, null, 2));
      return false;
    }

    console.log('✅ API Response received\n');
    console.log('Chart Analysis:');
    console.log('─'.repeat(60));
    console.log(data.choices[0].message.content);
    console.log('─'.repeat(60));
    console.log('\nToken usage:', data.usage);
    
    return true;

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function testWithDetailModes() {
  console.log('\n\nTest 3: Testing different detail modes');
  console.log('─'.repeat(60));

  const modes = ['low', 'high', 'auto'];
  
  for (const mode of modes) {
    console.log(`\nTesting detail mode: "${mode}"...`);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'What is the current price shown in this chart?'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl,
                    detail: mode
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Mode "${mode}": ${data.choices[0].message.content.substring(0, 100)}...`);
        console.log(`   Tokens used: ${data.usage.total_tokens}`);
      } else {
        console.log(`❌ Mode "${mode}": Failed - ${data.error?.message}`);
      }

    } catch (error) {
      console.log(`❌ Mode "${mode}": Error - ${error.message}`);
    }
  }
}

// Run all tests
(async () => {
  const test1Success = await testVisionAPI();
  
  if (test1Success) {
    await testChartAnalysis();
    await testWithDetailModes();
    
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
    console.log('\nConclusions:');
    console.log('1. If you see actual chart details above, Vision API is working');
    console.log('2. If you see generic responses, there is an issue');
    console.log('3. Check which detail mode works best');
    console.log('\nNext steps:');
    console.log('- If working: Use the same format in your app');
    console.log('- If failing: Check API key permissions and model access');
  } else {
    console.log('\n❌ Test 1 failed. Not running additional tests.');
    console.log('\nTroubleshooting:');
    console.log('1. Check if your OpenAI API key has access to gpt-4o');
    console.log('2. Verify the API key in .env file');
    console.log('3. Check if you have sufficient credits');
    console.log('4. Try with a different model (gpt-4-turbo)');
  }
})();
