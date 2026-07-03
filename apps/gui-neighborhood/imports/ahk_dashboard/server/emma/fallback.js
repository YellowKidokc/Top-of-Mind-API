/**
 * Emma Fallback Response System
 * Provides intelligent responses without OpenAI API
 * Uses pattern matching, dictionary lookup, and template responses
 */

import { lookupTerms } from './dictionary.js';

// Response templates organized by intent
const RESPONSE_TEMPLATES = {
  greeting: [
    "Hello! I'm Emma, your Executive Meta Mind Advisor. How can I assist you with AHK Strategies today?",
    "Welcome back! I'm here to help with your mobility innovation projects and MENA market strategies.",
    "Good to see you! What would you like to discuss today - Q-VAN, WOW MENA, or perhaps the EV Logistics hub?"
  ],
  
  projects: [
    "AHK Strategies is currently focused on three flagship projects:\n\n1. **Q-VAN** (Queue-less Autonomous Vehicle Network) - Our autonomous shuttle system in Saudi Arabia, currently in feasibility phase with projected 28% IRR\n\n2. **WOW MENA** - The World on Wheels autonomous vehicle expo targeting Saudi Arabia in Q2 2026\n\n3. **EV Logistics Hub** - Strategic electric vehicle distribution center in Jeddah\n\nWhich project would you like to explore further?",
    "We're advancing multiple mobility innovation initiatives across the MENA region. Our portfolio includes Q-VAN autonomous shuttles, the WOW MENA expo, and our EV Logistics infrastructure. Each project is designed to align with Vision 2030 goals."
  ],
  
  roi_finance: [
    "Financial performance is a key priority. Our projects target minimum 15% ROI, with Q-VAN projected at 28% IRR. Would you like detailed financial projections for any specific initiative?",
    "Based on our MENA Horizon 2030 analysis, we're targeting strong returns across all ventures. Q-VAN shows exceptional IRR potential at 28%, while maintaining strategic alignment with regional development goals."
  ],
  
  vision2030: [
    "Saudi Vision 2030 is central to our strategy. Our projects support key pillars including economic diversification, infrastructure modernization, and sustainable transport. The autonomous mobility sector represents a $2B+ opportunity through 2030.",
    "Vision 2030 creates unprecedented opportunities in mobility innovation. We're positioned to capture market share in autonomous vehicles, smart logistics, and sustainable transport infrastructure across Saudi Arabia and the broader MENA region."
  ],
  
  dictionary_term: (term, definition) => {
    const defText = typeof definition === 'string' ? definition : definition.value || definition.description || JSON.stringify(definition);
    return `**${term.toUpperCase()}**: ${defText}\n\nWould you like more details or information about how this relates to our current projects?`;
  },
  
  report_generation: [
    "I can help generate executive reports. Currently, our report generation system is integrated with the dashboard. Would you like me to explain what's included in our standard reports?",
    "Our reporting system covers project status, financial metrics, market analysis, and strategic recommendations. Reports are generated in markdown format with visualizations."
  ],
  
  help: [
    "I can assist you with:\n\n• **Project Information** - Details about Q-VAN, WOW MENA, and EV Logistics\n• **Financial Analysis** - ROI, IRR, and investment metrics\n• **Market Intelligence** - MENA region insights and Vision 2030 alignment\n• **Session Management** - Resume previous conversations or save important points\n• **Report Generation** - Executive summaries and strategic analysis\n\nWhat would you like to know more about?",
    "As your Executive Meta Mind Advisor, I'm here to help with project status, financial analysis, market research, and strategic planning. I maintain conversation history and can recall previous discussions. How can I support you today?"
  ],
  
  farewell: [
    "Thank you for the conversation. I'll remember our discussion for next time. Feel free to resume this session anytime!",
    "I've saved our conversation. Looking forward to our next discussion about AHK Strategies!",
    "Session saved successfully. Until next time!"
  ],
  
  unknown: [
    "I'm currently running in fallback mode with limited capabilities. I understand you're asking about {topic}, but I'd need my full AI capabilities to provide a comprehensive answer. However, I can share information about our core projects (Q-VAN, WOW MENA, EV Logistics) or help with session management.",
    "That's an interesting question about {topic}. In fallback mode, I have access to our dictionary of key terms and project summaries. Would you like me to share what I know about our current initiatives?",
    "I'm operating with basic response capabilities right now. I can help with project overviews, definition lookups, and session management. For more detailed analysis on {topic}, my full AI mode would be needed."
  ]
};

// Intent detection patterns
const INTENT_PATTERNS = {
  greeting: /\b(hello|hi|hey|good morning|good afternoon|good evening|greetings|what's up)\b/i,
  farewell: /\b(bye|goodbye|see you|talk to you later|thanks|thank you|that's all)\b/i,
  projects: /\b(projects?|initiatives?|what are we working on|current work|portfolio)\b/i,
  roi_finance: /\b(roi|return|irr|financial|revenue|profit|cost|investment|money|budget)\b/i,
  vision2030: /\b(vision 2030|saudi vision|ksa|saudi arabia development|economic diversification)\b/i,
  report_generation: /\b(generate|create|make|build|produce)\b.*\b(report|summary|analysis|document)\b/i,
  help: /\b(help|what can you do|capabilities|features|how do|assist me)\b/i,
};

/**
 * Detect user intent from message
 */
function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(lowerMessage)) {
      return intent;
    }
  }
  
  return 'unknown';
}

/**
 * Extract topic from message for unknown intent responses
 */
function extractTopic(message) {
  // Simple extraction - take first meaningful phrase
  const words = message.split(' ').filter(w => w.length > 3);
  return words.slice(0, 3).join(' ') || 'that';
}

/**
 * Generate fallback response
 */
export function generateFallbackResponse(message, conversationHistory = []) {
  console.log('🔄 Generating fallback response (no OpenAI API)');
  
  // Check dictionary first
  const dictLookup = lookupTerms(message);
  if (dictLookup.definitions.length > 0) {
    const term = dictLookup.matched[0];
    const definition = dictLookup.definitions[0];
    return {
      reply: RESPONSE_TEMPLATES.dictionary_term(term, definition),
      usedFallback: true,
      matchedTerms: dictLookup.matched
    };
  }
  
  // Detect intent
  const intent = detectIntent(message);
  console.log(`📋 Detected intent: ${intent}`);
  
  // Get appropriate response
  let reply;
  if (intent === 'unknown') {
    const topic = extractTopic(message);
    const templates = RESPONSE_TEMPLATES.unknown;
    reply = templates[Math.floor(Math.random() * templates.length)].replace('{topic}', topic);
  } else {
    const templates = RESPONSE_TEMPLATES[intent];
    reply = templates[Math.floor(Math.random() * templates.length)];
  }
  
  // Add context awareness based on conversation history
  if (conversationHistory.length > 0 && intent !== 'greeting') {
    const recentTopics = conversationHistory
      .slice(-3)
      .map(m => m.content)
      .join(' ');
    
    if (recentTopics.includes('Q-VAN') || recentTopics.includes('qvan')) {
      reply += '\n\n💡 I notice we were discussing Q-VAN. This autonomous shuttle project remains our highest-priority initiative with strong IRR projections.';
    } else if (recentTopics.includes('WOW MENA') || recentTopics.includes('wow')) {
      reply += '\n\n💡 Continuing our WOW MENA discussion - this expo is scheduled for Q2 2026 in Saudi Arabia.';
    }
  }
  
  return {
    reply,
    usedFallback: true,
    intent,
    note: '⚠️ Response generated in fallback mode. For deeper analysis, OpenAI API access is needed.'
  };
}

/**
 * Generate response for special actions
 */
export function generateActionResponse(action, context = {}) {
  switch (action) {
    case 'resume_session':
      return {
        reply: `I've loaded your previous session from ${context.sessionDate || 'earlier'}. We were discussing ${context.topics || 'various projects'}. What would you like to continue with?`,
        usedFallback: true
      };
      
    case 'mark_important':
      return {
        reply: "✅ I've saved this point in your conversation history. You can reference it in future sessions.",
        usedFallback: true
      };
      
    case 'navigate_dashboard':
      return {
        reply: "Opening the main dashboard view... You'll see project status, financial metrics, and recent updates there.",
        usedFallback: true
      };
      
    case 'trigger_report_generation':
      return {
        reply: "I'll initiate report generation. This typically takes 30-60 seconds to compile project data, financial metrics, and strategic analysis.",
        usedFallback: true
      };
      
    default:
      return {
        reply: `I understand you want to ${action}, but I need more details to proceed. Could you clarify what you'd like me to do?`,
        usedFallback: true
      };
  }
}

/**
 * Check if fallback mode should be used
 */
export function shouldUseFallback() {
  // Check if OpenAI API key is available
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  if (!hasApiKey) {
    console.log('⚠️ No OpenAI API key found - using fallback mode');
    return true;
  }
  
  return false;
}

export default {
  generateFallbackResponse,
  generateActionResponse,
  shouldUseFallback
};
