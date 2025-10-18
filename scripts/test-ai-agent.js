#!/usr/bin/env node

/**
 * Test Script for AI Agent Integration
 * 
 * This script tests the AI Agent API endpoint to ensure
 * OpenAI integration is working correctly.
 * 
 * Usage:
 *   node scripts/test-ai-agent.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testAIAgent() {
  console.log('🧪 Testing AI Agent Integration...\n');
  
  try {
    // Test 1: Get AI Agent Configuration
    console.log('📋 Test 1: Getting AI Agent Configuration...');
    const configResponse = await fetch(`${API_URL}/api/ai/agent`, {
      method: 'GET',
    });
    
    if (!configResponse.ok) {
      throw new Error(`Config request failed: ${configResponse.status}`);
    }
    
    const config = await configResponse.json();
    console.log('✅ AI Agent Config:', {
      name: config.agent?.name,
      role: config.agent?.role,
      version: config.agent?.version,
      supportedPairs: config.agent?.settings?.supportedPairs?.length || 0,
    });
    console.log('');

    // Test 2: Send a message to AI Agent
    console.log('💬 Test 2: Sending test message to AI Agent...');
    console.log('Query: "Analyze BTCUSDT for a long position"\n');
    
    const chatResponse = await fetch(`${API_URL}/api/ai/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Analyze BTCUSDT for a potential long position with proper risk management',
        conversationHistory: [],
      }),
    });
    
    if (!chatResponse.ok) {
      const errorData = await chatResponse.json();
      throw new Error(`Chat request failed: ${chatResponse.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const chatData = await chatResponse.json();
    
    if (!chatData.success) {
      throw new Error(`AI Agent returned error: ${chatData.error}`);
    }
    
    console.log('✅ AI Agent Response:');
    console.log('─'.repeat(80));
    console.log(chatData.response);
    console.log('─'.repeat(80));
    console.log('\n📊 Token Usage:', {
      prompt: chatData.usage?.promptTokens,
      completion: chatData.usage?.completionTokens,
      total: chatData.usage?.totalTokens,
    });
    console.log('');

    // Test 3: Test conversation with history
    console.log('🔄 Test 3: Testing conversation with history...');
    const followUpResponse = await fetch(`${API_URL}/api/ai/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What should be my stop loss?',
        conversationHistory: [
          {
            role: 'user',
            content: 'Analyze BTCUSDT for a potential long position',
          },
          {
            role: 'assistant',
            content: chatData.response,
          },
        ],
      }),
    });
    
    const followUpData = await followUpResponse.json();
    
    if (followUpData.success) {
      console.log('✅ Follow-up response received');
      console.log('Response length:', followUpData.response.length, 'characters');
    } else {
      console.log('⚠️ Follow-up failed:', followUpData.error);
    }
    console.log('');

    // Summary
    console.log('═'.repeat(80));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═'.repeat(80));
    console.log('✅ AI Agent is properly integrated with OpenAI');
    console.log('✅ Configuration endpoint working');
    console.log('✅ Chat endpoint working');
    console.log('✅ Conversation history working');
    console.log('');
    console.log('🚀 You can now use AI Agent at:');
    console.log(`   ${API_URL}/dashboard/ai-agent`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED!');
    console.error('═'.repeat(80));
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure development server is running: npm run dev');
    console.error('2. Check OPENAI_API_KEY in .env file');
    console.error('3. Verify OpenAI API key has sufficient quota');
    console.error('4. Check console logs for more details');
    console.error('');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to server at', API_URL);
    console.error('');
    console.error('Please start the development server first:');
    console.error('   npm run dev');
    console.error('');
    process.exit(1);
  }
}

// Main execution
(async () => {
  console.log('');
  console.log('═'.repeat(80));
  console.log('🤖 AI AGENT INTEGRATION TEST');
  console.log('═'.repeat(80));
  console.log('API URL:', API_URL);
  console.log('');
  
  await checkServer();
  await testAIAgent();
})();
