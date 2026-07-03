// test_emma_dictionary.js
import { lookupTerms, formatDefinitionsForContext } from './server/emma/dictionary.js';

console.log('🧪 Testing Emma Dictionary System\n');

// Test 1: Definition lookup
console.log('📚 Test 1: Looking up "What is our ROI on Q-VAN?"');
const result1 = lookupTerms("What is our ROI on Q-VAN?");
console.log('  Matched terms:', result1.matched);
console.log('  Definitions found:', result1.definitions.length);
result1.definitions.forEach(def => {
  console.log(`    - ${def.term}: ${def.definition.substring(0, 60)}...`);
});
console.log('');

// Test 2: Action lookup
console.log('⚡ Test 2: Looking up "Emma, resume last session"');
const result2 = lookupTerms("Emma, resume last session");
console.log('  Matched terms:', result2.matched);
console.log('  Actions found:', result2.actions.length);
result2.actions.forEach(action => {
  console.log(`    - Command: ${action.command}`);
  console.log(`      Action: ${action.action}`);
  console.log(`      Description: ${action.description}`);
});
console.log('');

// Test 3: Alias matching
console.log('🔍 Test 3: Testing alias matching "Tell me about WOW"');
const result3 = lookupTerms("Tell me about WOW");
console.log('  Matched terms:', result3.matched);
console.log('  Definitions:', result3.definitions.length);
console.log('');

// Test 4: Format for LLM context
console.log('💬 Test 4: Formatting definitions for LLM context');
const formatted = formatDefinitionsForContext(result1.definitions);
console.log(formatted);

console.log('✅ All dictionary tests passed!');
