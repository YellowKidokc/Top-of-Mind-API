// test_all_apis.js - Comprehensive API Test Suite
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('🧪 COMPREHENSIVE API TEST SUITE\n');
console.log('═'.repeat(60));

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${name}: ${status}`);
  if (details) console.log(`   ${details}`);
  
  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else results.failed++;
}

// ============================================================================
// TEST 1: OPENAI API
// ============================================================================
async function testOpenAI() {
  console.log('\n📋 TEST 1: OpenAI API (GPT-4)');
  console.log('─'.repeat(60));
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey.includes('your_') || apiKey.length < 20) {
      logTest('OpenAI Configuration', 'FAIL', 'API key missing or invalid');
      return;
    }
    
    logTest('OpenAI Configuration', 'PASS', `Key: ${apiKey.substring(0, 20)}...`);
    
    const openai = new OpenAI({ apiKey });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say "Hello from OpenAI!" in exactly 3 words.' }],
      max_tokens: 10
    });
    
    const response = completion.choices[0].message.content.trim();
    logTest('OpenAI API Call', 'PASS', `Response: "${response}"`);
    logTest('OpenAI Model', 'PASS', `Using: ${completion.model}`);
    
  } catch (error) {
    logTest('OpenAI API Call', 'FAIL', error.message);
  }
}

// ============================================================================
// TEST 2: GROK API (X.AI)
// ============================================================================
async function testGrok() {
  console.log('\n📋 TEST 2: Grok API (X.AI)');
  console.log('─'.repeat(60));
  
  try {
    const apiKey = process.env.GROK_API_KEY;
    
    if (!apiKey || apiKey.includes('your_') || apiKey.length < 20) {
      logTest('Grok Configuration', 'FAIL', 'API key missing or invalid');
      return;
    }
    
    logTest('Grok Configuration', 'PASS', `Key: ${apiKey.substring(0, 20)}...`);
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are Grok, a helpful assistant.' },
          { role: 'user', content: 'Say "Hello from Grok!" in exactly 3 words.' }
        ],
        max_tokens: 10
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logTest('Grok API Call', 'FAIL', `HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      return;
    }
    
    const data = await response.json();
    const message = data.choices[0].message.content.trim();
    
    logTest('Grok API Call', 'PASS', `Response: "${message}"`);
    logTest('Grok Model', 'PASS', `Using: ${data.model || 'grok-beta'}`);
    
  } catch (error) {
    logTest('Grok API Call', 'FAIL', error.message);
  }
}

// ============================================================================
// TEST 3: GEMINI 2.0 FLASH API
// ============================================================================
async function testGemini() {
  console.log('\n📋 TEST 3: Gemini 2.0 Flash API');
  console.log('─'.repeat(60));
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey.includes('your_') || apiKey.length < 20) {
      logTest('Gemini Configuration', 'FAIL', 'API key missing or invalid');
      return;
    }
    
    logTest('Gemini Configuration', 'PASS', `Key: ${apiKey.substring(0, 20)}...`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test with Gemini 2.0 Flash (the latest model)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent('Say "Hello from Gemini 2.0!" in exactly 4 words.');
    const response = result.response.text().trim();
    
    logTest('Gemini API Call', 'PASS', `Response: "${response}"`);
    logTest('Gemini Model', 'PASS', 'Using: gemini-2.0-flash-exp');
    
  } catch (error) {
    // If 2.0 fails, try 1.5 Pro
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const result = await model.generateContent('Say "Hello from Gemini!" in exactly 3 words.');
      const response = result.response.text().trim();
      
      logTest('Gemini API Call', 'PASS', `Response: "${response}" (fallback to 1.5-pro)`);
      logTest('Gemini Model', 'PASS', 'Using: gemini-1.5-pro (2.0 unavailable)');
      
    } catch (fallbackError) {
      logTest('Gemini API Call', 'FAIL', error.message + ' | Fallback: ' + fallbackError.message);
    }
  }
}

// ============================================================================
// TEST 4: GOOGLE DRIVE OAUTH
// ============================================================================
async function testGoogleDrive() {
  console.log('\n📋 TEST 4: Google Drive OAuth2');
  console.log('─'.repeat(60));
  
  try {
    const refreshToken = process.env.GOOGLE_PERSONAL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const activeUser = process.env.EMMA_DRIVE_ACTIVE_USER;
    
    if (!refreshToken || !clientId) {
      logTest('Google Drive Configuration', 'FAIL', 'OAuth credentials missing');
      return;
    }
    
    logTest('Google Drive Configuration', 'PASS', `Active User: ${activeUser}`);
    logTest('OAuth Refresh Token', 'PASS', `Token length: ${refreshToken.length} chars`);
    
    // Test via backend API
    const response = await fetch('http://localhost:4000/api/google-drive/status');
    
    if (!response.ok) {
      logTest('Google Drive API Call', 'FAIL', `Backend returned ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.ok) {
      logTest('Google Drive API Call', 'PASS', `Connected to: ${data.user}`);
      logTest('Google Drive User', 'PASS', `Display Name: ${data.displayName}`);
    } else {
      logTest('Google Drive API Call', 'FAIL', data.error || 'Unknown error');
    }
    
  } catch (error) {
    logTest('Google Drive API Call', 'FAIL', error.message);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
  console.log(`\n🚀 Testing 4 AI APIs for ashraf.kahoush@gmail.com\n`);
  
  await testOpenAI();
  await testGrok();
  await testGemini();
  await testGoogleDrive();
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📋 Total:  ${results.tests.length}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! All APIs are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.');
  }
  
  console.log('═'.repeat(60));
}

runAllTests().catch(err => {
  console.error('💥 Test suite crashed:', err);
  process.exit(1);
});
