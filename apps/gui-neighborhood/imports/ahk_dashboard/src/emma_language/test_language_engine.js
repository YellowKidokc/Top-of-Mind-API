/**
 * Emma Language Engine Test Suite
 * 
 * Quick validation of NLU capabilities
 * Run: node src/emma_language/test_language_engine.js
 */

import languageEngine from './languageEngine.js';

console.log('🧪 Emma Language Engine Test Suite\n');
console.log('=' .repeat(60));

const testCases = [
  // English Natural Variations
  { input: "emma start analysis", expected: "START_ANALYSIS" },
  { input: "emma can you start the analysis", expected: "START_ANALYSIS" },
  { input: "let's begin analysis", expected: "START_ANALYSIS" },
  { input: "go ahead and kick off the analysis", expected: "START_ANALYSIS" },
  
  // Report Reading
  { input: "read the report", expected: "READ_REPORT" },
  { input: "brief me", expected: "READ_REPORT" },
  { input: "what's in the report", expected: "READ_REPORT" },
  { input: "give me the findings", expected: "READ_REPORT" },
  { input: "show me what we discovered yesterday", expected: "READ_REPORT" },
  
  // Next Actions
  { input: "what do I do now", expected: "NEXT_ACTIONS" },
  { input: "what's next", expected: "NEXT_ACTIONS" },
  { input: "tell me the next steps", expected: "NEXT_ACTIONS" },
  
  // Repeat
  { input: "repeat that", expected: "REPEAT" },
  { input: "say again", expected: "REPEAT" },
  { input: "one more time", expected: "REPEAT" },
  
  // Stop
  { input: "stop", expected: "STOP" },
  { input: "cancel", expected: "STOP" },
  { input: "enough", expected: "STOP" },
  
  // Arabic
  { input: "ابدئي التحليل", expected: "START_ANALYSIS" },
  { input: "اقرئي التقرير", expected: "READ_REPORT" },
  { input: "ما الخطوة التالية", expected: "NEXT_ACTIONS" },
  { input: "أعيدي", expected: "REPEAT" },
  { input: "توقفي", expected: "STOP" },
  
  // Typos / Errors
  { input: "red the repor", expected: "READ_REPORT" },
  { input: "strt analisis", expected: "START_ANALYSIS" },
  
  // Unknown (should fail gracefully)
  { input: "blah blah random stuff", expected: "UNKNOWN" },
  { input: "xyz abc 123", expected: "UNKNOWN" },
];

let passed = 0;
let failed = 0;

console.log('\n🎯 Running Tests...\n');

testCases.forEach((test, index) => {
  const result = languageEngine.normalize(test.input);
  const success = result.action === test.expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASS`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAIL`);
  }
  
  console.log(`   Input: "${test.input}"`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Got: ${result.action} (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
  console.log(`   Language: ${result.language}`);
  console.log(`   Sentiment: ${result.sentiment.valence}\n`);
});

console.log('=' .repeat(60));
console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

// Session Statistics
console.log('=' .repeat(60));
console.log('\n📈 Session Statistics:\n');
const stats = languageEngine.getSessionStats();
console.log(`Total Interactions: ${stats.totalInteractions}`);
console.log(`Current Tone: ${stats.currentTone}`);
console.log(`Language Distribution:`, stats.languageDistribution);
console.log(`Intent Distribution:`, stats.intentDistribution);
console.log(`\n✅ Language Engine Test Complete!`);
