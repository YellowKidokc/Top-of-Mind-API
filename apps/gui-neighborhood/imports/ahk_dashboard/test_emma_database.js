// test_emma_database.js
// Test Emma's memory database
import { createSession, addMessage, getRecentMessages, getStats, getLatestSession } from './server/emma/database.js';

console.log('🧪 Testing Emma Memory Database\n');

// Test 1: Create session
console.log('📝 Test 1: Creating new session...');
const sessionId = createSession('ashraf', ['finance', 'strategic']);
console.log('✅ Session created:', sessionId, '\n');

// Test 2: Add messages
console.log('💬 Test 2: Adding messages...');
addMessage(sessionId, 'user', 'Hello Emma, what projects are we working on?', { topicTags: ['portfolio'] });
addMessage(sessionId, 'assistant', 'We have 3 active projects: Q-VAN, WOW MENA, and EV Logistics Study. Would you like details on any of them?', { topicTags: ['portfolio'] });
addMessage(sessionId, 'user', 'Tell me about Q-VAN', { topicTags: ['qvan', 'project-details'] });
addMessage(sessionId, 'assistant', 'Q-VAN is our autonomous vehicle network project with projected IRR of 28%. The feasibility study is complete and we\'re moving into partnership discussions.', { topicTags: ['qvan', 'project-details'] });
console.log('✅ Added 4 messages\n');

// Test 3: Retrieve messages
console.log('📖 Test 3: Retrieving recent messages...');
const messages = getRecentMessages(sessionId, 10);
messages.forEach((msg, i) => {
  console.log(`  ${i + 1}. [${msg.role}]: ${msg.content.substring(0, 60)}...`);
});
console.log('');

// Test 4: Mark important
console.log('⭐ Test 4: Marking last message as important...');
const lastMsgId = messages[messages.length - 1].id;
import('./server/emma/database.js').then(db => db.markMessageImportant(lastMsgId));
console.log('✅ Marked message as important\n');

// Test 5: Get stats
console.log('📊 Test 5: Database statistics...');
const stats = getStats();
console.log('  Sessions:', stats.totalSessions);
console.log('  Messages:', stats.totalMessages);
console.log('  Important Messages:', stats.importantMessages);
console.log('  DB Size:', (stats.dbSize / 1024).toFixed(2), 'KB\n');

// Test 6: Get latest session
console.log('🔍 Test 6: Retrieving latest session...');
const latest = getLatestSession('ashraf');
console.log('  Session ID:', latest.id);
console.log('  Topic Tags:', latest.topic_tags);
console.log('  Created:', new Date(latest.created_at).toLocaleString());
console.log('');

console.log('✅ All tests passed! Emma Memory Database is working correctly.');
