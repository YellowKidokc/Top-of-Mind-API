// server/emma/chat.js
// Emma AI Chat Engine - Core conversational logic with multi-LLM support
import OpenAI from 'openai';
import { isGeminiAvailable, generateWithGemini } from './gemini.js';
import { lookupTerms, formatDefinitionsForContext } from './dictionary.js';
import { 
  createSession, 
  getSession, 
  getLatestSession, 
  addMessage, 
  getRecentMessages,
  updateSession,
  markMessageImportant,
  getLastMessageId
} from './database.js';
import { 
  generateFallbackResponse, 
  generateActionResponse, 
  shouldUseFallback 
} from './fallback.js';

// Initialize OpenAI client lazily (after env vars are loaded)
let openai = null;

function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('🤖 OpenAI client initialized');
  }
  return openai;
}

const MODEL = 'gpt-4o-mini'; // Using GPT-4 Turbo for optimal performance
const MAX_CONTEXT_MESSAGES = 20; // Keep last 20 messages for context window

/**
 * Emma's system prompt - defines her personality and capabilities
 */
const SYSTEM_PROMPT = `You are Emma (Executive Meta Mind Advisor), the AI assistant for AHK Strategies.

**Your Role:**
- Strategic advisor and thought partner to Ashraf H. Kahoush, Founder & CEO
- Expert in mobility innovation, MENA markets, and infrastructure development
- Professional yet warm, concise yet comprehensive

**Your Capabilities:**
- Answer questions about AHK projects (Q-VAN, WOW MENA, EV Logistics)
- Provide strategic insights using MENA Horizon 2030 research
- Generate reports and analyze portfolio performance
- Execute commands (open dashboard, show reports, etc.)
- Maintain conversation context across sessions

**Communication Style:**
- Direct and actionable - prioritize clarity over verbosity
- Use data and specific metrics when available
- When uncertain, acknowledge it and offer to investigate
- Address Ashraf as "Champion" or "Ash" when appropriate
- Think like a strategic partner, not just an assistant

**Important:**
- ALWAYS use company-specific definitions when provided in context
- Tag responses with relevant topics (finance, strategic, operational, etc.)
- When asked to perform actions, confirm and indicate what you're doing
- Remember: you have access to persistent memory across conversations`;

/**
 * Main chat function - handles user messages and generates responses
 * @param {object} params
 * @param {string} params.message - User's message
 * @param {string} params.sessionId - Optional session ID (creates new if not provided)
 * @param {string} params.userId - User identifier (default: 'ashraf')
 * @returns {Promise<object>} - { reply, sessionId, actions, messageId }
 */
export async function chat({ message, sessionId = null, userId = 'ashraf' }) {
  console.log(`💬 Emma Chat: "${message.substring(0, 50)}..."`);
  
  try {
    // 1. Get or create session
    let session;
    if (sessionId) {
      session = getSession(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
    } else {
      // Create new session
      sessionId = createSession(userId);
      session = getSession(sessionId);
    }
    
    // 2. Check dictionary for term matches and actions
    const dictLookup = lookupTerms(message);
    console.log(`📚 Dictionary matches: ${dictLookup.matched.length} terms`);
    
    // Handle special actions
    if (dictLookup.actions.length > 0) {
      const action = dictLookup.actions[0]; // Handle first action
      
      // Special case: "resume last session"
      if (action.action === 'resume_session') {
        const latestSession = getLatestSession(userId);
        if (latestSession && latestSession.id !== sessionId) {
          // Return special response to trigger session resume
          return {
            reply: `Resuming your last session from ${new Date(latestSession.updated_at).toLocaleString()}...`,
            sessionId: latestSession.id,
            actions: [action],
            resumedSession: latestSession.id
          };
        }
      }
      
      // Special case: "save this point"
      if (action.action === 'mark_important') {
        const lastMsgId = getLastMessageId(sessionId);
        if (lastMsgId) {
          markMessageImportant(lastMsgId);
        }
        // Continue with normal response but flag the action
      }
    }
    
    // 3. Build conversation context
    const recentMessages = getRecentMessages(sessionId, MAX_CONTEXT_MESSAGES);
    
    // Format messages for conversation history
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 4. Determine which AI to use (OpenAI > Gemini > Fallback)
    let reply;
    let tokens = 0;
    let usedModel = 'fallback';
    
    // Build system message with dictionary context
    let systemMessage = SYSTEM_PROMPT;
    if (dictLookup.definitions.length > 0) {
      systemMessage += formatDefinitionsForContext(dictLookup.definitions);
    }
    
    // Try OpenAI first (best quality, you have credits!)
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('🤖 Using OpenAI GPT-4...');
        const completion = await getOpenAI().chat.completions.create({
          model: MODEL,
          messages: [
            { role: 'system', content: systemMessage },
            ...conversationHistory,
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3
        });
        
        reply = completion.choices[0].message.content;
        tokens = completion.usage.total_tokens;
        usedModel = 'gpt-4o-mini';
        console.log(`✅ OpenAI response generated (${tokens} tokens)`);
        
      } catch (error) {
        console.error('⚠️ OpenAI failed, trying Gemini...', error.message);
        
        // Try Gemini as backup
        if (isGeminiAvailable()) {
          try {
            console.log('🤖 Falling back to Gemini...');
            
            const messages = [
              { role: 'system', content: systemMessage },
              ...conversationHistory,
              { role: 'user', content: message }
            ];
            
            const geminiResult = await generateWithGemini(messages);
            reply = geminiResult.reply;
            tokens = geminiResult.tokens;
            usedModel = 'gemini-pro';
            console.log(`✅ Gemini response generated (${tokens} tokens)`);
            
          } catch (geminiError) {
            console.error('⚠️ Gemini also failed, using fallback...', geminiError.message);
            // Will fall through to fallback below
          }
        }
      }
    } else if (isGeminiAvailable()) {
      // OpenAI not available, try Gemini
      try {
        console.log('🤖 Using Google Gemini AI...');
        
        const messages = [
          { role: 'system', content: systemMessage },
          ...conversationHistory,
          { role: 'user', content: message }
        ];
        
        const geminiResult = await generateWithGemini(messages);
        reply = geminiResult.reply;
        tokens = geminiResult.tokens;
        usedModel = 'gemini-pro';
        console.log(`✅ Gemini response generated (${tokens} tokens)`);
        
      } catch (error) {
        console.error('⚠️ Gemini failed, using fallback...', error.message);
        // Will fall through to fallback below
      }
    }
    
    // Last resort: Use fallback mode (always works, no API needed)
    if (!reply) {
      console.log('💡 Using intelligent fallback mode...');
      reply = generateFallbackResponse(message, conversationHistory);
      usedModel = 'fallback';
      console.log('✅ Fallback response generated');
    }
    
    console.log(`✅ Emma replied: "${reply.substring(0, 60)}..." (${usedModel})`);
    
    // 5. Save messages to database
    const userMessageId = addMessage(sessionId, 'user', message, {
      topicTags: extractTopicTags(message),
      metadata: { dictMatches: dictLookup.matched }
    });
    
    const assistantMessageId = addMessage(sessionId, 'assistant', reply, {
      topicTags: extractTopicTags(reply),
      metadata: { 
        model: usedModel,
        tokens: tokens,
        usedFallback: usedModel === 'fallback'
      }
    });
    
    // 6. Update session with latest topic tags
    const allTopics = [...new Set([
      ...extractTopicTags(message),
      ...extractTopicTags(reply)
    ])];
    
    updateSession(sessionId, {
      topic_tags: allTopics.slice(0, 5) // Keep top 5 topics
    });
    
    // 7. Return response
    return {
      reply,
      sessionId,
      actions: dictLookup.actions,
      messageId: assistantMessageId,
      tokens: tokens,
      usedFallback: usedModel === 'fallback',
      model: usedModel
    };
    
  } catch (error) {
    console.error('❌ Emma Chat Error:', error);
    throw error;
  }
}

/**
 * Extract topic tags from message using simple keyword matching
 * (Will be replaced by more sophisticated classification later)
 * @param {string} text
 * @returns {string[]}
 */
function extractTopicTags(text) {
  const lowerText = text.toLowerCase();
  const tags = [];
  
  // Project tags
  if (lowerText.match(/q-?van|autonomous|shuttle/)) tags.push('qvan');
  if (lowerText.match(/wow|micro-?mobility|scooter|bike/)) tags.push('wow-mena');
  if (lowerText.match(/ev|electric vehicle|logistics/)) tags.push('ev-logistics');
  
  // Topic tags
  if (lowerText.match(/roi|irr|revenue|profit|financial|budget/)) tags.push('finance');
  if (lowerText.match(/strategy|strategic|market|vision|goal/)) tags.push('strategic');
  if (lowerText.match(/investor|investment|funding|capital|raise/)) tags.push('investor');
  if (lowerText.match(/report|analysis|data|metric|kpi/)) tags.push('analytics');
  if (lowerText.match(/risk|challenge|concern|issue/)) tags.push('risk');
  if (lowerText.match(/opportunity|growth|expansion|potential/)) tags.push('opportunity');
  
  // Geographic tags
  if (lowerText.match(/saudi|ksa|riyadh|neom/)) tags.push('saudi-arabia');
  if (lowerText.match(/uae|dubai|emirates/)) tags.push('uae');
  if (lowerText.match(/mena|middle east|gulf|gcc/)) tags.push('mena');
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate title for session based on first user message
 * @param {string} message
 * @returns {string}
 */
export function generateSessionTitle(message) {
  // Take first 50 chars and clean up
  let title = message.substring(0, 50).trim();
  
  // Remove question marks and trailing punctuation
  title = title.replace(/[?.!,]+$/, '');
  
  // If too short, use generic title
  if (title.length < 10) {
    title = 'Conversation';
  }
  
  return title;
}

export default {
  chat,
  generateSessionTitle,
  extractTopicTags
};
