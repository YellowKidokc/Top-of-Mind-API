/**
 * Emma Language Engine v2.0 (Dictionary-Driven)
 * 
 * Comprehensive NLU system combining:
 * - Dictionary-driven normalization with synonym expansion
 * - Intent matching with confidence boosting
 * - Sentiment analysis (simple keyword-based)
 * - Tone profile management
 * - Multi-language support (EN/AR)
 * - Live dictionary reloading
 * - Context-aware answer matching
 */

// Load language resources
import dictionaryCore from './dictionary_core.json';
import intentPhrases from './intent_phrases.json';
import toneProfiles from './tone_profiles.json';
import { expandWithDictionary, getTopCandidate } from './dictionary/expansion.js';

// Import new dictionary system
import dictionary from '../voice/dictionary/browser.js';

// Import session context for persistent memory
import sessionContext from '../engine/sessionContext.js';

// Import EN/AR dictionaries
import enCore from '../../Emma/Dictionaries/en-core.json';
import arCore from '../../Emma/Dictionaries/ar-core.json';

// Initialize dictionary system
dictionary.loadDictionaries([enCore, arCore]);
console.log('📚 Dictionary system initialized:', dictionary.getStats());

/**
 * Simple tokenizer (splits on whitespace and punctuation)
 */
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Simple sentiment analyzer
 */
function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'problem', 'issue', 'error', 'fail'];
  
  const words = tokenize(text);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score++;
    if (negativeWords.includes(word)) score--;
  });
  
  return {
    score,
    comparative: score / (words.length || 1),
    valence: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
    tokens: words
  };
}

/**
 * Language Engine Core Class
 */
class LanguageEngine {
  constructor() {
    this.dictionary = dictionaryCore;
    this.intents = intentPhrases.intents;
    this.toneProfiles = toneProfiles.tone_profiles;
    this.currentTone = toneProfiles.tone_selection.default;
    this.sessionContext = {
      languagePreference: 'auto',
      lastIntent: null,
      lastUtterance: null,
      conversationHistory: [],
      preferredTone: null
    };
    
    // Build TF-IDF index for intent matching
    this.buildIntentIndex();
    
    console.log('🧠 Emma Language Engine v1.0 initialized');
    console.log(`📚 Loaded ${Object.keys(this.intents).length} intent categories`);
    console.log(`🎭 Available tones: ${Object.keys(this.toneProfiles).join(', ')}`);
  }

  /**
   * Build simple keyword index for intent matching
   */
  buildIntentIndex() {
    // Simple keyword-based index (no TF-IDF needed for browser)
    this.intentKeywords = {};
    
    Object.entries(this.intents).forEach(([intent, config]) => {
      this.intentKeywords[intent] = {
        keywords: config.keywords.map(k => k.toLowerCase()),
        phrases: config.phrases.map(p => p.toLowerCase())
      };
    });
    
    console.log('📊 Intent keyword index built');
  }

  /**
   * Main normalization function - processes raw speech input with dictionary-driven NLU
   * @param {string} rawInput - Raw speech recognition text
   * @returns {object} - Structured intent with metadata
   */
  normalize(rawInput, contextData = null) {
    console.log('🎤 Raw input:', rawInput);
    
    // Stage 0: DICTIONARY-FIRST LAYER (NEW)
    // Check dictionary before any other processing
    const quickDictMatch = dictionary.detectIntent(rawInput);
    if (quickDictMatch && quickDictMatch.confidence >= 0.75) {
      console.log('⚡ DICTIONARY-FIRST HIT:', quickDictMatch.intent, 'confidence:', (quickDictMatch.confidence * 100).toFixed(0) + '%');
      
      // Update session context immediately
      sessionContext.updateIntent(quickDictMatch.intent, quickDictMatch.entities || []);
      
      return {
        action: quickDictMatch.intent,
        confidence: quickDictMatch.confidence,
        language: dictionary.detectLanguage(rawInput),
        sentiment: analyzeSentiment(rawInput),
        tone: this.currentTone,
        context: contextData || sessionContext.getContextSummary(),
        originalInput: rawInput,
        cleanedInput: rawInput,
        dictionaryResult: quickDictMatch,
        source: 'dictionary-first',
        metadata: {
          timestamp: Date.now(),
          processingStages: 1,
          fastPath: true
        }
      };
    }
    
    // Stage 1: Clean and preprocess
    const cleaned = this.cleanInput(rawInput);
    console.log('🧹 Cleaned:', cleaned);
    
    // Stage 2: Detect language (use new dictionary system)
    const detectedLang = dictionary.detectLanguage(cleaned);
    console.log('🌍 Language:', detectedLang);
    
    // Stage 3: NEW - Dictionary-driven intent detection (PRIMARY)
    const dictionaryResult = dictionary.detectIntent(cleaned);
    console.log('📚 Dictionary intent:', dictionaryResult.intent, 'confidence:', (dictionaryResult.confidence * 100).toFixed(0) + '%');
    
    // Stage 4: Remove filler words (using dictionary stopwords)
    const withoutFillers = this.removeFillers(cleaned, detectedLang);
    console.log('✂️ Without fillers:', withoutFillers);
    
    // Stage 5: Legacy dictionary expansion (backward compatibility)
    const expansionResult = expandWithDictionary(withoutFillers, detectedLang);
    console.log('📚 Legacy expansion:', expansionResult.expanded.slice(0, 5).join(', '));
    
    // Stage 6: Legacy synonym expansion
    const expanded = this.expandSynonyms(withoutFillers, detectedLang);
    const combinedExpanded = `${expanded} ${expansionResult.expanded.join(' ')}`;
    
    // Stage 7: Extract intent with CONFIDENCE BOOSTING
    // Priority: dictionary intent > legacy intent matching
    let finalIntent;
    if (dictionaryResult.confidence >= 0.5) {
      // Use dictionary intent with +0.2 boost
      finalIntent = {
        action: dictionaryResult.intent,
        confidence: Math.min(1.0, dictionaryResult.confidence + 0.2),
        source: 'dictionary',
        canonical: dictionaryResult.canonical,
        matched: dictionaryResult.matched,
      };
      console.log('✅ Using dictionary intent with +0.2 boost:', finalIntent.confidence.toFixed(2));
    } else {
      // Fallback to legacy intent extraction
      finalIntent = this.extractIntent(combinedExpanded, withoutFillers, expansionResult);
      finalIntent.source = 'legacy';
      console.log('⚠️ Fallback to legacy intent:', finalIntent.action);
    }
    
    console.log('🎯 Final intent:', finalIntent.action, 'confidence:', (finalIntent.confidence * 100).toFixed(0) + '%');
    
    // Stage 8: Analyze sentiment
    const sentimentScore = analyzeSentiment(cleaned);
    console.log('😊 Sentiment:', sentimentScore.score);
    
    // Stage 9: Determine appropriate tone
    const tone = this.selectTone(finalIntent, sentimentScore);
    console.log('🎭 Tone:', tone);
    
    // Stage 10: Build context
    const context = this.buildContext(finalIntent, detectedLang, sentimentScore);
    
    // Update session
    this.updateSession(rawInput, finalIntent.action, detectedLang);
    
    // Update persistent session context
    sessionContext.updateIntent(finalIntent.action, context.entities || []);
    if (finalIntent.confidence >= 0.7) {
      sessionContext.setState('processing');
    }
    
    // Return structured result with dictionary metadata
    const result = {
      action: finalIntent.action,
      confidence: finalIntent.confidence,
      language: detectedLang,
      sentiment: sentimentScore,
      tone: tone,
      context: contextData || sessionContext.getContextSummary(),
      originalInput: rawInput,
      cleanedInput: withoutFillers,
      dictionaryResult: dictionaryResult,
      expansionResult: expansionResult,
      metadata: {
        timestamp: Date.now(),
        processingStages: 9
      }
    };
    
    // Add suggestion if confidence is low
    if (intent.confidence < 0.6) {
      result.suggestion = getTopCandidate(expansionResult);
      console.log('💡 Low confidence - Suggestion:', result.suggestion);
    }
    
    return result;
  }

  /**
   * Clean input: lowercase, trim, normalize whitespace
   */
  cleanInput(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[،؛]/g, ',') // Normalize Arabic punctuation
      .replace(/[؟]/g, '?');
  }

  /**
   * Detect language (English vs Arabic)
   */
  detectLanguage(text) {
    // Check for Arabic Unicode range
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) {
      return 'ar';
    }
    
    // Check for Arabic keywords
    const arabicWords = [
      ...this.dictionary.arabic_vocabulary.actions.start,
      ...this.dictionary.arabic_vocabulary.actions.stop,
      ...this.dictionary.arabic_vocabulary.actions.read
    ];
    
    for (const word of arabicWords) {
      if (text.includes(word)) {
        return 'ar';
      }
    }
    
    return 'en';
  }

  /**
   * Remove filler words that don't contribute to intent
   */
  removeFillers(text, language) {
    const fillers = language === 'ar' 
      ? this.dictionary.filler_words.arabic 
      : this.dictionary.filler_words.english;
    
    let cleaned = text;
    fillers.forEach(filler => {
      const regex = new RegExp(`\\b${this.escapeRegex(filler)}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  /**
   * Expand synonyms to match intent patterns (dictionary-based)
   */
  expandSynonyms(text, language) {
    if (language === 'ar') {
      return text; // Arabic synonyms handled in dictionary
    }
    
    const words = tokenize(text);
    let expanded = text;
    
    // Match words to action synonyms
    Object.entries(this.dictionary.vocabulary.actions).forEach(([action, synonyms]) => {
      words.forEach(word => {
        if (synonyms.includes(word)) {
          expanded += ` ${action}`;
        }
      });
    });
    
    // Match words to target synonyms
    Object.entries(this.dictionary.vocabulary.targets).forEach(([target, synonyms]) => {
      words.forEach(word => {
        if (synonyms.includes(word)) {
          expanded += ` ${target}`;
        }
      });
    });
    
    return expanded;
  }

  /**
   * Extract intent using multi-strategy approach
   * Now includes dictionary expansion results
   */
  extractIntent(expandedText, originalText, expansionResult = null) {
    // Strategy 0: Use expansion matches if high confidence
    if (expansionResult && expansionResult.confidence >= 0.8) {
      const { matches } = expansionResult;
      // Try to map action+target to intent
      if (matches.actions.length > 0 && matches.targets.length > 0) {
        const mappedIntent = this.mapActionTargetToIntent(matches.actions[0], matches.targets[0]);
        if (mappedIntent) {
          console.log('✨ Mapped from expansion:', mappedIntent);
          return { action: mappedIntent, confidence: 0.92 };
        }
      }
    }
    
    // Strategy 1: Exact phrase match (highest confidence)
    const exactMatch = this.exactPhraseMatch(originalText);
    if (exactMatch) {
      return { action: exactMatch, confidence: 0.95 };
    }
    
    // Strategy 2: Keyword matching with TF-IDF
    const tfidfMatch = this.tfidfMatch(expandedText);
    if (tfidfMatch.confidence > 0.6) {
      return tfidfMatch;
    }
    
    // Strategy 3: Fuzzy matching with Levenshtein distance
    const fuzzyMatch = this.fuzzyMatch(originalText);
    if (fuzzyMatch.confidence > 0.5) {
      return fuzzyMatch;
    }
    
    // Strategy 4: Keyword presence (lower confidence)
    const keywordMatch = this.keywordMatch(expandedText);
    if (keywordMatch.confidence > 0.4) {
      return keywordMatch;
    }
    
    // No match found
    return { action: 'UNKNOWN', confidence: 0 };
  }

  /**
   * Exact phrase matching
   */
  exactPhraseMatch(text) {
    const normalized = text.toLowerCase().trim();
    
    for (const [intent, config] of Object.entries(this.intents)) {
      for (const phrase of config.phrases) {
        if (normalized.includes(phrase.toLowerCase())) {
          return intent;
        }
      }
    }
    
    return null;
  }

  /**
   * Map action+target combination to intent
   */
  mapActionTargetToIntent(action, target) {
    const mappings = {
      'read_report': 'READ_REPORT',
      'read_analysis': 'READ_REPORT',
      'read_summary': 'READ_REPORT',
      'read_brief': 'READ_REPORT',
      'start_analysis': 'START_ANALYSIS',
      'begin_analysis': 'START_ANALYSIS',
      'run_analysis': 'START_ANALYSIS',
      'stop_': 'STOP',
      'halt_': 'STOP',
      'repeat_': 'REPEAT',
      'show_report': 'READ_REPORT',
      'display_report': 'DISPLAY_REPORT',
      'send_email': 'EMAIL_REPORT',
      'analyze_risk': 'RISK_ANALYSIS',
      'read_data': 'NEXT_ACTIONS'
    };
    
    // Try action_target combination
    const key = `${action}_${target}`;
    if (mappings[key]) {
      return mappings[key];
    }
    
    // Try action alone
    const actionKey = `${action}_`;
    if (mappings[actionKey]) {
      return mappings[actionKey];
    }
    
    return null;
  }

  /**
   * Simple keyword scoring (replaces TF-IDF for browser)
   */
  tfidfMatch(text) {
    const words = tokenize(text);
    const scores = [];
    
    Object.entries(this.intentKeywords).forEach(([intent, data]) => {
      let score = 0;
      
      // Score based on keyword matches
      data.keywords.forEach(keyword => {
        if (words.includes(keyword)) {
          score += 2; // Keywords are worth more
        }
      });
      
      // Score based on phrase partial matches
      data.phrases.forEach(phrase => {
        const phraseWords = tokenize(phrase);
        const matchCount = phraseWords.filter(pw => words.includes(pw)).length;
        score += matchCount / phraseWords.length;
      });
      
      if (score > 0) {
        scores.push({ intent, score });
      }
    });
    
    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    
    if (scores.length > 0 && scores[0].score > 0) {
      return {
        action: scores[0].intent,
        confidence: Math.min(scores[0].score / 5, 0.9) // Normalize to 0-0.9
      };
    }
    
    return { action: 'UNKNOWN', confidence: 0 };
  }

  /**
   * Fuzzy matching using Levenshtein distance
   */
  fuzzyMatch(text) {
    const normalized = text.toLowerCase().trim();
    let bestMatch = { intent: 'UNKNOWN', distance: Infinity, confidence: 0 };
    
    for (const [intent, config] of Object.entries(this.intents)) {
      for (const phrase of config.phrases) {
        const distance = levenshteinDistance(normalized, phrase.toLowerCase());
        const maxLength = Math.max(normalized.length, phrase.length);
        const similarity = 1 - (distance / maxLength);
        
        if (similarity > 0.5 && distance < bestMatch.distance) {
          bestMatch = {
            intent: intent,
            distance: distance,
            confidence: similarity
          };
        }
      }
    }
    
    return {
      action: bestMatch.intent,
      confidence: bestMatch.confidence
    };
  }

  /**
   * Simple keyword matching
   */
  keywordMatch(text) {
    const words = tokenize(text.toLowerCase());
    let bestMatch = { intent: 'UNKNOWN', score: 0, confidence: 0 };
    
    for (const [intent, config] of Object.entries(this.intents)) {
      let matchCount = 0;
      
      for (const keyword of config.keywords) {
        if (words.includes(keyword.toLowerCase()) || text.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }
      
      const score = matchCount / config.keywords.length;
      
      if (score > bestMatch.score) {
        bestMatch = {
          intent: intent,
          score: score,
          confidence: Math.min(score * 0.7, 0.8)
        };
      }
    }
    
    return {
      action: bestMatch.intent,
      confidence: bestMatch.confidence
    };
  }

  /**
   * Select appropriate tone based on intent and sentiment
   */
  selectTone(intent, sentimentData) {
    // Check for user override
    if (this.sessionContext.preferredTone) {
      return this.sessionContext.preferredTone;
    }
    
    // Check context triggers
    const triggers = toneProfiles.tone_selection.context_triggers;
    
    if (intent.action.includes('RISK')) {
      return triggers.risk_detected;
    }
    
    if (sentimentData.valence === 'negative') {
      return 'calm_supportive';
    }
    
    // Default tone
    return this.currentTone;
  }

  /**
   * Build rich context for response generation
   */
  buildContext(intent, language, sentiment) {
    return {
      hasHistory: this.sessionContext.conversationHistory.length > 0,
      isFollowUp: this.sessionContext.lastIntent === intent.action,
      language: language,
      sentiment: sentiment.valence,
      timeOfDay: this.getTimeOfDay(),
      sessionLength: this.sessionContext.conversationHistory.length
    };
  }

  /**
   * Get time of day for contextual greetings
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  }

  /**
   * Update session context
   */
  updateSession(input, intent, language) {
    this.sessionContext.lastUtterance = input;
    this.sessionContext.lastIntent = intent;
    this.sessionContext.conversationHistory.push({
      input,
      intent,
      language,
      timestamp: Date.now()
    });
    
    // Keep only last 10 interactions
    if (this.sessionContext.conversationHistory.length > 10) {
      this.sessionContext.conversationHistory.shift();
    }
  }

  /**
   * Get tone configuration
   */
  getToneConfig(toneName = null) {
    const tone = toneName || this.currentTone;
    return this.toneProfiles[tone];
  }

  /**
   * Set user preferred tone
   */
  setTone(toneName) {
    if (this.toneProfiles[toneName]) {
      this.currentTone = toneName;
      this.sessionContext.preferredTone = toneName;
      console.log(`🎭 Tone changed to: ${toneName}`);
      return true;
    }
    return false;
  }

  /**
   * Get fallback response for unknown intent
   */
  getFallbackResponse(language = 'en') {
    const fallbacks = intentPhrases.fallback_patterns;
    return language === 'ar' ? fallbacks.unclear[1] : fallbacks.unclear[0];
  }

  /**
   * Reload dictionary (for live updates)
   * @returns {Object} Updated dictionary statistics
   */
  reloadDictionary() {
    console.log('📚 Reloading dictionary...');
    // Re-import and reload dictionaries
    dictionary.loadDictionaries([enCore, arCore]);
    const stats = dictionary.getStats();
    console.log(`✅ Dictionary reloaded: ${stats.totalIntents} intents, ${stats.totalSynonyms} synonyms`);
    return stats;
  }

  /**
   * Get confidence-gated response
   * Implements 3-tier confidence system:
   * - >= 0.7: Execute immediately
   * - 0.4-0.69: Ask clarification
   * - < 0.4: Show fallback with examples
   * 
   * @param {Object} intent - Intent result
   * @param {string} language - Language code
   * @returns {Object} {action, needsClarification, fallbackMessage, suggestedPhrase}
   */
  getConfidenceGatedResponse(intent, language = 'en') {
    const CONFIDENCE_ACCEPT = 0.7;
    const CONFIDENCE_CLARIFY = 0.4;
    
    if (intent.confidence >= CONFIDENCE_ACCEPT) {
      // High confidence - execute immediately
      return {
        action: 'execute',
        intent: intent.action,
        confidence: intent.confidence,
        needsClarification: false,
      };
    } else if (intent.confidence >= CONFIDENCE_CLARIFY) {
      // Medium confidence - ask for clarification
      const clarifyMsg = language === 'ar'
        ? `هل تقصد: "${intent.canonical || intent.action}"؟ هل أكمل؟`
        : `I think you meant: "${intent.canonical || intent.action}". Shall I proceed?`;
      
      return {
        action: 'clarify',
        intent: intent.action,
        confidence: intent.confidence,
        needsClarification: true,
        clarificationMessage: clarifyMsg,
        suggestedPhrase: intent.canonical || intent.matched,
      };
    } else {
      // Low confidence - show fallback with examples
      const examples = this.getIntentExamples(language);
      const fallbackMsg = language === 'ar'
        ? `لم أفهم تماماً. جرب أحد هذه الأمثلة: ${examples.join('، ')}`
        : `I didn't fully catch that, Ash. Try rephrasing with one of these: ${examples.join(', ')}`;
      
      return {
        action: 'fallback',
        intent: 'UNKNOWN',
        confidence: intent.confidence,
        needsClarification: false,
        fallbackMessage: fallbackMsg,
        examples,
      };
    }
  }

  /**
   * Get example phrases for user guidance
   * @param {string} language - Language code
   * @returns {string[]} Array of example phrases
   */
  getIntentExamples(language = 'en') {
    const contextAnswers = dictionary.getContextualAnswers('report_choice');
    const examples = [];
    
    if (language === 'ar') {
      examples.push('ابدئي التحليل', 'اقري التقرير', 'الملخص التنفيذي');
    } else {
      examples.push('start analysis', 'read report', 'executive summary');
    }
    
    return examples.slice(0, 3); // Max 3 examples
  }

  /**
   * Match against expected answers (context-aware mode)
   * Used when Emma is awaiting a specific answer
   * 
   * @param {string} text - User's response
   * @param {string[]} expectedAnswers - Expected phrases
   * @returns {Object} {matched, confidence, canonical}
   */
  matchExpectedAnswer(text, expectedAnswers) {
    return dictionary.matchExpectedAnswer(text, expectedAnswers);
  }

  /**
   * Get contextual answers for a specific context
   * @param {string} context - Context name ('report_choice', 'yes_no', etc.)
   * @returns {Object} Contextual answer mappings
   */
  getContextualAnswers(context) {
    return dictionary.getContextualAnswers(context);
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    // Manual count by implementation (no lodash)
    const langDist = {};
    const intentDist = {};
    
    this.sessionContext.conversationHistory.forEach(item => {
      langDist[item.language] = (langDist[item.language] || 0) + 1;
      intentDist[item.intent] = (intentDist[item.intent] || 0) + 1;
    });
    
    return {
      totalInteractions: this.sessionContext.conversationHistory.length,
      currentTone: this.currentTone,
      languageDistribution: langDist,
      intentDistribution: intentDist,
      lastInteraction: this.sessionContext.lastUtterance
    };
  }
}

// Export singleton instance
const languageEngine = new LanguageEngine();
export default languageEngine;

// Also export class for testing
export { LanguageEngine };
