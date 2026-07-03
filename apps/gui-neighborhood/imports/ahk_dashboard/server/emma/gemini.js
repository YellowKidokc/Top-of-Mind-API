/**
 * Google Gemini AI Integration for Emma
 * Provides fast, free, and reliable AI responses
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

/**
 * Initialize Gemini client (lazy loading)
 */
function getGemini() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set');
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',  // Use latest v1.5 model
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1000,
      }
    });
    
    console.log('🤖 Gemini AI client initialized (gemini-1.5-flash)');
  }
  
  return model;
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const available = !!apiKey;
  console.log(`🔍 Gemini availability check: ${available ? '✅ Available' : '❌ Not available'}`);
  if (available) {
    console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  }
  return available;
}

/**
 * Generate response using Gemini
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Promise<Object>} - { reply, tokens }
 */
export async function generateWithGemini(messages) {
  try {
    const model = getGemini();
    
    // Convert messages to Gemini chat format
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    });
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    
    // Send message and get response
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const reply = response.text();
    
    // Estimate tokens (Gemini doesn't provide exact count in response)
    const estimatedTokens = Math.ceil((lastMessage.content.length + reply.length) / 4);
    
    return {
      reply,
      tokens: estimatedTokens,
      model: 'gemini-pro'
    };
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    throw error;
  }
}

/**
 * Simple completion without chat history (for single prompts)
 */
export async function generateSimple(prompt) {
  try {
    const model = getGemini();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();
    
    return {
      reply,
      tokens: Math.ceil((prompt.length + reply.length) / 4),
      model: 'gemini-pro'
    };
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    throw error;
  }
}

export default {
  isGeminiAvailable,
  generateWithGemini,
  generateSimple
};
