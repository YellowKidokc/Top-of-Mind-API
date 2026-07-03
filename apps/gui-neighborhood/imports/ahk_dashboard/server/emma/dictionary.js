// server/emma/dictionary.js
// Emma AI Custom Dictionary - Company-specific term lookup
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dictionary
const DICT_PATH = path.join(__dirname, 'dictionary.json');
let dictionary = null;

function loadDictionary() {
  if (!dictionary) {
    const data = fs.readFileSync(DICT_PATH, 'utf8');
    dictionary = JSON.parse(data);
    console.log(`📚 Emma Dictionary loaded: ${dictionary.terms.length} terms`);
  }
  return dictionary;
}

/**
 * Look up term in dictionary
 * @param {string} text - User input text
 * @returns {object} - { definitions: [], actions: [], matched: [] }
 */
export function lookupTerms(text) {
  const dict = loadDictionary();
  const lowerText = text.toLowerCase();
  
  const definitions = [];
  const actions = [];
  const matched = [];
  
  for (const term of dict.terms) {
    // Check main key
    if (lowerText.includes(term.key.toLowerCase())) {
      matched.push(term.key);
      
      if (term.type === 'definition') {
        definitions.push({
          term: term.key,
          definition: term.value,
          matched_in: 'key'
        });
      } else if (term.type === 'action') {
        actions.push({
          command: term.key,
          action: term.value,
          description: term.description
        });
      }
      continue;
    }
    
    // Check aliases
    if (term.aliases) {
      for (const alias of term.aliases) {
        if (lowerText.includes(alias.toLowerCase())) {
          matched.push(alias);
          
          if (term.type === 'definition') {
            definitions.push({
              term: term.key,
              definition: term.value,
              matched_in: alias
            });
          } else if (term.type === 'action') {
            actions.push({
              command: term.key,
              action: term.value,
              description: term.description
            });
          }
          break; // Don't match multiple aliases of same term
        }
      }
    }
  }
  
  return {
    definitions,
    actions,
    matched
  };
}

/**
 * Get all definitions (for reference)
 * @returns {array}
 */
export function getAllDefinitions() {
  const dict = loadDictionary();
  return dict.terms.filter(term => term.type === 'definition');
}

/**
 * Get all actions (for reference)
 * @returns {array}
 */
export function getAllActions() {
  const dict = loadDictionary();
  return dict.terms.filter(term => term.type === 'action');
}

/**
 * Add new term to dictionary
 * @param {object} term - { key, type, value, aliases?, description? }
 */
export function addTerm(term) {
  const dict = loadDictionary();
  
  // Check if term already exists
  const exists = dict.terms.find(t => t.key.toLowerCase() === term.key.toLowerCase());
  if (exists) {
    throw new Error(`Term '${term.key}' already exists in dictionary`);
  }
  
  dict.terms.push(term);
  dict.metadata.last_updated = new Date().toISOString().split('T')[0];
  
  // Save back to file
  fs.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2), 'utf8');
  
  // Reload dictionary
  dictionary = null;
  loadDictionary();
  
  console.log(`📚 Added term to dictionary: ${term.key}`);
}

/**
 * Format definitions for LLM context injection
 * @param {array} definitions - Array of definition objects
 * @returns {string}
 */
export function formatDefinitionsForContext(definitions) {
  if (definitions.length === 0) return '';
  
  const formatted = definitions.map(def => 
    `- ${def.term.toUpperCase()}: ${def.definition}`
  ).join('\n');
  
  return `\n**Company-Specific Definitions (use these exact definitions):**\n${formatted}\n`;
}

export default {
  lookupTerms,
  getAllDefinitions,
  getAllActions,
  addTerm,
  formatDefinitionsForContext
};
