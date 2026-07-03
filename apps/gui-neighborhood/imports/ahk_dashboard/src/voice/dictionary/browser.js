/**
 * Browser-Compatible Dictionary Bridge
 * Provides dictionary functionality in browser environment
 * Uses pre-loaded dictionary data instead of file system access
 */

// Dictionary data storage
let dictionaryData = {
  synonymMap: new Map(),
  intentMap: new Map(),
  stopwords: new Set(),
  multilingual: new Map(),
  contextualAnswers: {},
  metadata: {
    totalSynonyms: 0,
    totalIntents: 0,
    languages: [],
    lastBuild: null,
  }
};

/**
 * Load dictionary from JSON objects
 * @param {Object[]} dictionaries - Array of dictionary objects
 * @returns {Object} Build statistics
 */
export function loadDictionaries(dictionaries) {
  console.log('📚 Loading dictionaries into browser index...');
  
  // Reset
  dictionaryData.synonymMap.clear();
  dictionaryData.intentMap.clear();
  dictionaryData.stopwords.clear();
  dictionaryData.multilingual.clear();
  dictionaryData.contextualAnswers = {};
  
  const languages = new Set();
  
  for (const dict of dictionaries) {
    processDictionary(dict, languages);
  }
  
  dictionaryData.metadata = {
    totalSynonyms: dictionaryData.synonymMap.size,
    totalIntents: dictionaryData.intentMap.size,
    languages: Array.from(languages),
    lastBuild: new Date().toISOString(),
  };
  
  console.log(`✅ Dictionary loaded: ${dictionaryData.metadata.totalIntents} intents, ${dictionaryData.metadata.totalSynonyms} synonyms`);
  
  return dictionaryData.metadata;
}

/**
 * Process dictionary data
 * @param {Object} dict - Dictionary object
 * @param {Set} languages - Language set
 */
function processDictionary(dict, languages) {
  const lang = dict.language || 'en';
  languages.add(lang);
  
  // Process synonyms
  if (dict.synonyms) {
    for (const [canonical, variants] of Object.entries(dict.synonyms)) {
      const normalizedCanonical = normalizePhrase(canonical);
      dictionaryData.synonymMap.set(normalizedCanonical, canonical);
      
      if (Array.isArray(variants)) {
        for (const variant of variants) {
          const normalizedVariant = normalizePhrase(variant);
          dictionaryData.synonymMap.set(normalizedVariant, canonical);
        }
      }
    }
  }
  
  // Process intents
  if (dict.intents) {
    for (const [intent, phrases] of Object.entries(dict.intents)) {
      if (Array.isArray(phrases)) {
        for (const phrase of phrases) {
          const normalizedPhrase = normalizePhrase(phrase);
          const canonical = dictionaryData.synonymMap.get(normalizedPhrase) || phrase;
          const normalizedCanonical = normalizePhrase(canonical);
          dictionaryData.intentMap.set(normalizedCanonical, intent);
        }
      }
    }
  }
  
  // Process stopwords
  if (dict.stopwords && Array.isArray(dict.stopwords)) {
    for (const word of dict.stopwords) {
      dictionaryData.stopwords.add(normalizePhrase(word));
    }
  }
  
  // Process multilingual
  if (dict.multilingual) {
    for (const [targetLang, mappings] of Object.entries(dict.multilingual)) {
      languages.add(targetLang);
      
      for (const [canonical, variants] of Object.entries(mappings)) {
        if (Array.isArray(variants)) {
          for (const variant of variants) {
            const normalizedVariant = normalizePhrase(variant);
            dictionaryData.multilingual.set(normalizedVariant, canonical);
            dictionaryData.synonymMap.set(normalizedVariant, canonical);
          }
        }
      }
    }
  }
  
  // Store contextual answers
  if (dict.contextual_answers) {
    dictionaryData.contextualAnswers = {
      ...dictionaryData.contextualAnswers,
      ...dict.contextual_answers
    };
  }
}

/**
 * Normalize phrase
 * @param {string} phrase - Input phrase
 * @returns {string} Normalized phrase
 */
export function normalizePhrase(phrase) {
  return phrase
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect language
 * @param {string} text - Input text
 * @returns {string} Language code
 */
export function detectLanguage(text) {
  return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
}

/**
 * Map phrase to canonical
 * @param {string} phrase - Input phrase
 * @returns {string|null} Canonical phrase
 */
export function mapToCanonical(phrase) {
  const normalized = normalizePhrase(phrase);
  return dictionaryData.synonymMap.get(normalized) || 
         dictionaryData.multilingual.get(normalized) || 
         null;
}

/**
 * Detect intent
 * @param {string} phrase - Input phrase
 * @returns {Object} {intent, confidence, canonical, matched}
 */
export function detectIntent(phrase) {
  const normalized = normalizePhrase(phrase);
  
  // Try direct lookup
  let canonical = mapToCanonical(phrase);
  if (!canonical) canonical = phrase;
  
  const normalizedCanonical = normalizePhrase(canonical);
  const intent = dictionaryData.intentMap.get(normalizedCanonical);
  
  if (intent) {
    return {
      intent,
      confidence: 1.0,
      canonical,
      matched: phrase,
    };
  }
  
  // Try partial matching
  const tokens = normalized.split(' ');
  const bestMatch = findBestPartialMatch(tokens);
  
  return bestMatch || {
    intent: 'UNKNOWN',
    confidence: 0.0,
    canonical: null,
    matched: null,
  };
}

/**
 * Find best partial match
 * @param {string[]} tokens - Input tokens
 * @returns {Object|null} Best match
 */
function findBestPartialMatch(tokens) {
  let bestMatch = null;
  let maxScore = 0;
  
  for (const [phrase, canonical] of dictionaryData.synonymMap.entries()) {
    const phraseTokens = phrase.split(' ');
    const overlap = calculateTokenOverlap(tokens, phraseTokens);
    const score = overlap / Math.max(tokens.length, phraseTokens.length);
    
    if (score > maxScore && score >= 0.5) {
      const normalizedCanonical = normalizePhrase(canonical);
      const intent = dictionaryData.intentMap.get(normalizedCanonical);
      
      if (intent) {
        maxScore = score;
        bestMatch = {
          intent,
          confidence: score,
          canonical,
          matched: phrase,
        };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Calculate token overlap
 * @param {string[]} tokens1 - First token array
 * @param {string[]} tokens2 - Second token array
 * @returns {number} Overlap count
 */
function calculateTokenOverlap(tokens1, tokens2) {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  let overlap = 0;
  
  for (const token of set1) {
    if (set2.has(token)) overlap++;
  }
  
  return overlap;
}

/**
 * Check if word is stopword
 * @param {string} word - Word to check
 * @returns {boolean} True if stopword
 */
export function isStopword(word) {
  return dictionaryData.stopwords.has(normalizePhrase(word));
}

/**
 * Get contextual answers for a context
 * @param {string} context - Context name (e.g., 'report_choice', 'yes_no')
 * @returns {Object} Contextual answers
 */
export function getContextualAnswers(context) {
  return dictionaryData.contextualAnswers[context] || {};
}

/**
 * Match against expected answers (context-aware)
 * @param {string} text - User input
 * @param {string[]} expectedAnswers - Expected answer phrases
 * @returns {Object} {matched, confidence, canonical}
 */
export function matchExpectedAnswer(text, expectedAnswers) {
  const normalized = normalizePhrase(text);
  let bestMatch = null;
  let maxScore = 0;
  
  for (const expected of expectedAnswers) {
    const normalizedExpected = normalizePhrase(expected);
    const score = calculateSimilarity(normalized, normalizedExpected);
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = {
        matched: expected,
        confidence: score,
        canonical: mapToCanonical(expected) || expected,
      };
    }
  }
  
  return bestMatch || {
    matched: null,
    confidence: 0,
    canonical: null,
  };
}

/**
 * Calculate similarity between phrases
 * @param {string} phrase1 - First phrase
 * @param {string} phrase2 - Second phrase
 * @returns {number} Similarity score 0-1
 */
function calculateSimilarity(phrase1, phrase2) {
  if (phrase1 === phrase2) return 1.0;
  
  const tokens1 = phrase1.split(' ');
  const tokens2 = phrase2.split(' ');
  
  const overlap = calculateTokenOverlap(tokens1, tokens2);
  const maxTokens = Math.max(tokens1.length, tokens2.length);
  
  if (maxTokens === 0) return 0;
  
  const tokenScore = overlap / maxTokens;
  const substringBonus = phrase1.includes(phrase2) || phrase2.includes(phrase1) ? 0.2 : 0;
  
  return Math.min(1.0, tokenScore + substringBonus);
}

/**
 * Get statistics
 * @returns {Object} Metadata
 */
export function getStats() {
  return { ...dictionaryData.metadata };
}

export default {
  loadDictionaries,
  normalizePhrase,
  detectLanguage,
  mapToCanonical,
  detectIntent,
  isStopword,
  getContextualAnswers,
  matchExpectedAnswer,
  getStats,
};
