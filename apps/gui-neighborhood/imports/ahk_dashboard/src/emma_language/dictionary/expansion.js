/**
 * Dictionary Expansion Layer
 * Expands user input with synonym clusters and multi-language mappings
 * to improve intent matching accuracy
 */

import dictionaryCore from '../dictionary_core.json';

/**
 * Expand text with dictionary synonyms and language mappings
 * @param {string} text - Cleaned input text
 * @param {string} language - Detected language ('en' or 'ar')
 * @returns {Object} - Expanded text and candidate phrases
 */
export function expandWithDictionary(text, language) {
  const tokens = tokenize(text);
  const expanded = new Set([text]); // Start with original
  const candidates = [];
  const matches = {
    actions: [],
    targets: [],
    modifiers: []
  };
  
  if (language === 'ar') {
    // Arabic expansion
    expandArabic(tokens, expanded, matches);
  } else {
    // English expansion
    expandEnglish(tokens, expanded, matches);
  }
  
  // Generate candidate phrases from matches
  if (matches.actions.length > 0 && matches.targets.length > 0) {
    matches.actions.forEach(action => {
      matches.targets.forEach(target => {
        candidates.push(`${action} ${target}`);
        expanded.add(`${action} ${target}`);
      });
    });
  }
  
  // Add cross-language common mappings
  addCommonMappings(text, expanded, language);
  
  return {
    original: text,
    expanded: Array.from(expanded),
    candidates: candidates,
    matches: matches,
    confidence: calculateExpansionConfidence(matches)
  };
}

/**
 * Expand English text with synonyms
 */
function expandEnglish(tokens, expanded, matches) {
  const vocab = dictionaryCore.vocabulary;
  
  // Match actions
  tokens.forEach(token => {
    Object.entries(vocab.actions).forEach(([action, synonyms]) => {
      if (synonyms.includes(token) || action === token) {
        matches.actions.push(action);
        expanded.add(action);
        // Add all synonyms to expansion
        synonyms.forEach(syn => expanded.add(syn));
      }
    });
  });
  
  // Match targets
  tokens.forEach(token => {
    Object.entries(vocab.targets).forEach(([target, synonyms]) => {
      if (synonyms.includes(token) || target === token) {
        matches.targets.push(target);
        expanded.add(target);
        synonyms.forEach(syn => expanded.add(syn));
      }
    });
  });
  
  // Match modifiers
  tokens.forEach(token => {
    Object.entries(vocab.modifiers).forEach(([modifier, synonyms]) => {
      if (synonyms.includes(token) || modifier === token) {
        matches.modifiers.push(modifier);
        expanded.add(modifier);
      }
    });
  });
  
  // Handle common phrases
  handleCommonPhrases(tokens, expanded, matches);
}

/**
 * Expand Arabic text with synonyms
 */
function expandArabic(tokens, expanded, matches) {
  const arabicVocab = dictionaryCore.arabic_vocabulary;
  
  // Match Arabic actions
  tokens.forEach(token => {
    Object.entries(arabicVocab.actions).forEach(([action, synonyms]) => {
      if (synonyms.includes(token)) {
        matches.actions.push(action); // Store English equivalent
        expanded.add(action);
        synonyms.forEach(syn => expanded.add(syn));
      }
    });
  });
  
  // Match Arabic targets
  tokens.forEach(token => {
    Object.entries(arabicVocab.targets).forEach(([target, synonyms]) => {
      if (synonyms.includes(token)) {
        matches.targets.push(target);
        expanded.add(target);
        synonyms.forEach(syn => expanded.add(syn));
      }
    });
  });
  
  // Match Arabic modifiers
  tokens.forEach(token => {
    Object.entries(arabicVocab.modifiers).forEach(([modifier, synonyms]) => {
      if (synonyms.includes(token)) {
        matches.modifiers.push(modifier);
        expanded.add(modifier);
      }
    });
  });
}

/**
 * Handle common multi-word phrases
 */
function handleCommonPhrases(tokens, expanded, matches) {
  const text = tokens.join(' ');
  
  // Common phrase mappings
  const phraseMappings = {
    'brief me': ['read report', 'executive summary', 'show report'],
    'continue': ['resume', 'keep going', 'proceed', 'next'],
    'resume': ['continue', 'keep going', 'proceed'],
    'what next': ['next actions', 'show actions', 'next steps'],
    'wrap up': ['stop', 'finish', 'end'],
    'go ahead': ['start', 'begin', 'proceed'],
    'show me': ['display', 'read', 'present'],
    'tell me': ['read', 'explain', 'describe']
  };
  
  Object.entries(phraseMappings).forEach(([phrase, expansions]) => {
    if (text.includes(phrase)) {
      expansions.forEach(exp => {
        expanded.add(exp);
        // Parse expansion for matches
        const expTokens = tokenize(exp);
        expTokens.forEach(token => {
          // Check if it's an action or target
          Object.entries(dictionaryCore.vocabulary.actions).forEach(([action, syns]) => {
            if (action === token || syns.includes(token)) {
              matches.actions.push(action);
            }
          });
          Object.entries(dictionaryCore.vocabulary.targets).forEach(([target, syns]) => {
            if (target === token || syns.includes(token)) {
              matches.targets.push(target);
            }
          });
        });
      });
    }
  });
}

/**
 * Add cross-language common mappings
 */
function addCommonMappings(text, expanded, language) {
  const commonMappings = {
    // English variations
    'brief': ['read report', 'summary', 'executive summary'],
    'continue': ['resume', 'next', 'proceed', 'keep going'],
    'stop': ['halt', 'cease', 'end', 'finish'],
    
    // Arabic variations
    'كملي': ['continue', 'resume', 'proceed'],
    'تابعي': ['continue', 'next', 'proceed'],
    'اعطيني': ['give', 'show', 'read'],
    'ملخص': ['summary', 'report', 'brief'],
    'تنفيذي': ['executive', 'strategic']
  };
  
  Object.entries(commonMappings).forEach(([key, expansions]) => {
    if (text.includes(key)) {
      expansions.forEach(exp => expanded.add(exp));
    }
  });
  
  // Handle "Emma" wake word variations
  const emmaVariations = ['emma', 'ima', 'em', 'إيما', 'ايما', 'يما'];
  emmaVariations.forEach(variation => {
    if (text.includes(variation)) {
      expanded.add('emma');
    }
  });
}

/**
 * Calculate confidence based on match quality
 */
function calculateExpansionConfidence(matches) {
  let confidence = 0.0;
  
  // Action match adds 40% confidence
  if (matches.actions.length > 0) confidence += 0.4;
  
  // Target match adds 40% confidence
  if (matches.targets.length > 0) confidence += 0.4;
  
  // Modifier adds 20% confidence
  if (matches.modifiers.length > 0) confidence += 0.2;
  
  return Math.min(confidence, 1.0);
}

/**
 * Simple tokenizer
 */
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Get expansion suggestions for low-confidence scenarios
 * @param {Object} expansionResult - Result from expandWithDictionary
 * @returns {string} - Top candidate suggestion
 */
export function getTopCandidate(expansionResult) {
  if (expansionResult.candidates.length > 0) {
    return expansionResult.candidates[0];
  }
  
  // Construct from matches
  const { matches } = expansionResult;
  if (matches.actions.length > 0 && matches.targets.length > 0) {
    return `${matches.actions[0]} ${matches.targets[0]}`;
  }
  
  return expansionResult.original;
}

export default { expandWithDictionary, getTopCandidate };
