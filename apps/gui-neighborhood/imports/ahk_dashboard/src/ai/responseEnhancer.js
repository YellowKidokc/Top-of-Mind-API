// src/ai/responseEnhancer.js
import vocabulary from '../data/vocabulary.json';

/**
 * Emma's Response Enhancer
 * Makes Emma's speech more natural and professional by:
 * - Using business vocabulary contextually
 * - Adding warmth and personality
 * - Simplifying complex terms when speaking
 */

const greetings = [
  "Hello! I'm Emma, your strategic assistant.",
  "Hi there! Emma here, ready to help.",
  "Welcome! Emma at your service.",
  "Greetings! Emma reporting for duty."
];

const confirmations = [
  "Understood.",
  "Got it.",
  "On it.",
  "Processing that now.",
  "Right away."
];

const timeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

/**
 * Enhance response with vocabulary and personality
 * @param {string} text - Original text to enhance
 * @param {object} options - Enhancement options
 * @returns {string} Enhanced text
 */
export function enhanceResponse(text, options = {}) {
  if (!text) return text;
  
  const { useGreeting = false, addPersonality = true } = options;
  
  let enhanced = text;
  
  // Add greeting if requested
  if (useGreeting) {
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    enhanced = `${timeOfDay()}! ${greeting} ${enhanced}`;
  }
  
  // Add personality touches
  if (addPersonality) {
    // Make responses warmer
    enhanced = enhanced
      .replace(/^error/i, "Oops, we encountered an issue")
      .replace(/^failed/i, "I wasn't able to complete that")
      .replace(/^success/i, "Great news")
      .replace(/complete/i, "all done")
      .replace(/analyzing/i, "taking a look at")
      .replace(/processing/i, "working on");
  }
  
  return enhanced;
}

/**
 * Simplify technical terms for speech
 * @param {string} text - Text with technical terms
 * @returns {string} Text with simplified terms
 */
export function simplifyForSpeech(text) {
  if (!text) return text;
  
  let simplified = text;
  
  // Replace vocabulary terms with simpler spoken versions
  Object.entries(vocabulary).forEach(([term, definition]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    // Only replace if it's a standalone word and seems technical
    if (term.length > 6 && simplified.match(regex)) {
      // Use first part of definition for brevity in speech
      const simpleForm = definition.split(',')[0];
      simplified = simplified.replace(regex, simpleForm);
    }
  });
  
  return simplified;
}

/**
 * Get random confirmation phrase
 * @returns {string} Confirmation phrase
 */
export function getConfirmation() {
  return confirmations[Math.floor(Math.random() * confirmations.length)];
}

/**
 * Get contextual greeting based on time and user activity
 * @param {string} userName - Optional user name
 * @returns {string} Personalized greeting
 */
export function getGreeting(userName = "there") {
  const lastVisit = localStorage.getItem('emma-last-visit');
  const now = Date.now();
  
  if (lastVisit) {
    const hoursSince = (now - parseInt(lastVisit)) / (1000 * 60 * 60);
    if (hoursSince < 4) {
      return `Welcome back, ${userName}! Let's continue where we left off.`;
    }
  }
  
  localStorage.setItem('emma-last-visit', now.toString());
  return `${timeOfDay()}, ${userName}! How can I help you today?`;
}

/**
 * Format numbers for speech (e.g., "2.4 billion" instead of "2400000000")
 * @param {number} num - Number to format
 * @returns {string} Spoken format
 */
export function formatNumberForSpeech(num) {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)} billion`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)} thousand`;
  }
  return num.toString();
}

/**
 * Add Emma's thinking phrases for natural flow
 * @param {string} text - Original text
 * @returns {string} Text with thinking phrases
 */
export function addThinkingPhrases(text) {
  const phrases = [
    "Let me see...",
    "Looking into that...",
    "Analyzing now...",
    "One moment please..."
  ];
  
  const shouldAdd = Math.random() > 0.7; // 30% chance
  if (shouldAdd) {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    return `${phrase} ${text}`;
  }
  
  return text;
}

export default {
  enhanceResponse,
  simplifyForSpeech,
  getConfirmation,
  getGreeting,
  formatNumberForSpeech,
  addThinkingPhrases
};
