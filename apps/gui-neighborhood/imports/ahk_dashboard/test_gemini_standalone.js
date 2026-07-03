/**
 * Quick diagnostic - check if Gemini can initialize
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

console.log('🔍 Environment Check:\n');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 15)}...` : '❌ NOT SET');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? `${process.env.GOOGLE_API_KEY.substring(0, 15)}...` : '❌ NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : '❌ NOT SET');
console.log('');

// Try importing Gemini module
try {
  const { isGeminiAvailable, generateSimple } = await import('./server/emma/gemini.js');
  
  console.log('✅ Gemini module imported successfully\n');
  
  const available = isGeminiAvailable();
  console.log(`\nGemini available: ${available}\n`);
  
  if (available) {
    console.log('🧪 Testing Gemini API call...\n');
    try {
      const result = await generateSimple('Say hello in one sentence');
      console.log('✅ Gemini response:', result.reply);
      console.log('Model:', result.model);
      console.log('\n🎉 Gemini is working perfectly!');
    } catch (error) {
      console.error('❌ Gemini API call failed:', error.message);
      console.error('Error details:', error);
    }
  } else {
    console.log('⚠️ Gemini is not available (no API key)');
  }
  
} catch (error) {
  console.error('❌ Failed to import Gemini module:', error.message);
  console.error(error);
}
