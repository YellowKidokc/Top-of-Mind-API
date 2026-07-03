// test_emma_chat_api.js
// Test Emma AI chat endpoint
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

async function testEmmaChat() {
  console.log('🧪 Testing Emma AI Chat API\n');
  
  try {
    // Test 1: Create new session
    console.log('📝 Test 1: Creating new session...');
    const sessionRes = await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'ashraf', topicTags: ['testing'] })
    });
    const { session } = await sessionRes.json();
    console.log('✅ Session created:', session.id, '\n');
    
    // Test 2: Send first message
    console.log('💬 Test 2: Sending first message to Emma...');
    const chat1Res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello Emma! What projects are we currently working on?',
        sessionId: session.id
      })
    });
    const chat1 = await chat1Res.json();
    if (!chat1.reply) {
      console.log('❌ Error response:', JSON.stringify(chat1, null, 2));
      throw new Error('No reply from Emma');
    }
    console.log('Emma:', chat1.reply.substring(0, 200) + '...');
    console.log('Tokens used:', chat1.tokens, '\n');
    
    // Test 3: Follow-up question with dictionary term
    console.log('💬 Test 3: Follow-up with ROI question...');
    const chat2Res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the ROI on Q-VAN?',
        sessionId: session.id
      })
    });
    const chat2 = await chat2Res.json();
    console.log('Emma:', chat2.reply.substring(0, 200) + '...');
    console.log('Tokens used:', chat2.tokens, '\n');
    
    // Test 4: Get session messages
    console.log('📖 Test 4: Retrieving conversation history...');
    const messagesRes = await fetch(`${API_BASE}/session/${session.id}/messages`);
    const { messages } = await messagesRes.json();
    console.log(`✅ Retrieved ${messages.length} messages:`);
    messages.forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role}]: ${msg.content.substring(0, 60)}...`);
    });
    console.log('');
    
    // Test 5: Action command
    console.log('⚡ Test 5: Testing action command...');
    const chat3Res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Emma, save this point',
        sessionId: session.id
      })
    });
    const chat3 = await chat3Res.json();
    console.log('Emma:', chat3.reply.substring(0, 100) + '...');
    if (chat3.actions && chat3.actions.length > 0) {
      console.log('Actions detected:', chat3.actions.map(a => a.action).join(', '));
    }
    console.log('');
    
    // Test 6: List sessions
    console.log('📋 Test 6: Listing all sessions...');
    const sessionsRes = await fetch(`${API_BASE}/sessions?userId=ashraf`);
    const { sessions } = await sessionsRes.json();
    console.log(`✅ Found ${sessions.length} sessions:`);
    sessions.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.id} - ${new Date(s.updated_at).toLocaleString()}`);
    });
    console.log('');
    
    console.log('✅ All Emma AI Chat API tests passed! 🎉');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Wait 2 seconds for server to be ready, then test
setTimeout(testEmmaChat, 2000);
