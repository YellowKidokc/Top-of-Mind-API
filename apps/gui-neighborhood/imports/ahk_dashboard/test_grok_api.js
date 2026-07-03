// Test Grok API connectivity
import 'dotenv/config';

const GROK_API_KEY = process.env.GROK_API_KEY;

console.log('🔍 Testing Grok API (X.AI)...\n');
console.log('API Key:', GROK_API_KEY ? `${GROK_API_KEY.substring(0, 20)}...` : '❌ NOT SET');

if (!GROK_API_KEY) {
  console.error('❌ GROK_API_KEY not found in .env.local');
  process.exit(1);
}

async function testGrok() {
  try {
    console.log('\n🧪 Testing Grok chat completion...');
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are Grok, a helpful AI assistant.'
          },
          {
            role: 'user',
            content: 'Say hello and confirm you are working correctly.'
          }
        ],
        model: 'grok-beta',
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Grok API Error (${response.status}):`, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Grok Response:');
    console.log('   Message:', data.choices[0].message.content);
    console.log('   Model:', data.model);
    console.log('   Tokens:', data.usage?.total_tokens || 'unknown');
    
    return true;

  } catch (error) {
    console.error('❌ Grok Test Failed:', error.message);
    return false;
  }
}

testGrok().then(success => {
  if (success) {
    console.log('\n✅ Grok API is working correctly!');
  } else {
    console.log('\n❌ Grok API test failed.');
  }
});
