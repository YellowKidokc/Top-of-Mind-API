/**
 * SSML Utilities
 * Speech Synthesis Markup Language helpers for clean, natural speech output
 */

import { DICTIONARY_CONFIG } from '../dictionary/config.mjs';

/**
 * Strip HTML tags from text
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
export function stripHTML(html) {
  if (typeof html !== 'string') return '';
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Sanitize text for speech synthesis
 * Remove problematic characters and normalize
 * @param {string} text - Input text
 * @returns {string} Sanitized text
 */
export function sanitizeForSpeech(text) {
  if (typeof text !== 'string') return '';
  
  // Strip HTML first
  let clean = stripHTML(text);
  
  // Remove URLs
  clean = clean.replace(/https?:\/\/[^\s]+/g, '');
  
  // Remove email addresses
  clean = clean.replace(/[\w.-]+@[\w.-]+\.\w+/g, '');
  
  // Remove special characters that might break speech
  clean = clean.replace(/[<>{}[\]]/g, '');
  
  // Normalize quotes
  clean = clean.replace(/[""]/g, '"');
  clean = clean.replace(/['']/g, "'");
  
  // Collapse whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean;
}

/**
 * Chunk text into speech-friendly segments
 * Max 180 characters per chunk, break on sentence boundaries
 * @param {string} text - Input text
 * @param {number} maxLength - Max characters per chunk
 * @returns {string[]} Array of text chunks
 */
export function chunkText(text, maxLength = DICTIONARY_CONFIG.ssml.maxChunkLength) {
  if (!text || typeof text !== 'string') return [];
  
  const clean = sanitizeForSpeech(text);
  
  // If text is short enough, return as single chunk
  if (clean.length <= maxLength) {
    return [clean];
  }
  
  const chunks = [];
  let remaining = clean;
  
  // Sentence boundaries (. ! ? followed by space or end)
  const sentenceBreakRegex = /[.!?]+\s+/g;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    
    // Try to break on sentence boundary within maxLength
    const segment = remaining.substring(0, maxLength);
    const matches = Array.from(segment.matchAll(sentenceBreakRegex));
    
    if (matches.length > 0) {
      // Break at last sentence boundary
      const lastMatch = matches[matches.length - 1];
      const breakPoint = lastMatch.index + lastMatch[0].length;
      chunks.push(remaining.substring(0, breakPoint).trim());
      remaining = remaining.substring(breakPoint).trim();
    } else {
      // No sentence boundary, try comma or space
      const commaIndex = segment.lastIndexOf(',');
      const spaceIndex = segment.lastIndexOf(' ');
      const breakPoint = commaIndex > spaceIndex ? commaIndex + 1 : spaceIndex;
      
      if (breakPoint > 0) {
        chunks.push(remaining.substring(0, breakPoint).trim());
        remaining = remaining.substring(breakPoint).trim();
      } else {
        // Force break at maxLength
        chunks.push(remaining.substring(0, maxLength));
        remaining = remaining.substring(maxLength);
      }
    }
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Wrap text in SSML tags
 * @param {string} text - Plain text
 * @param {Object} options - SSML options
 * @param {string} options.lang - Language code (en-US, ar-SA, etc.)
 * @param {string} options.voice - Voice name
 * @param {number} options.rate - Speech rate (0.5 - 2.0)
 * @param {number} options.pitch - Speech pitch (-10 to +10)
 * @param {number} options.volume - Volume (0 - 100)
 * @returns {string} SSML-wrapped text
 */
export function wrapSSML(text, options = {}) {
  if (!DICTIONARY_CONFIG.ssml.enabled) {
    return sanitizeForSpeech(text);
  }
  
  const {
    lang = 'en-US',
    voice = null,
    rate = 1.0,
    pitch = 0,
    volume = 100,
  } = options;
  
  const clean = sanitizeForSpeech(text);
  
  let ssml = '<speak';
  if (lang) ssml += ` xml:lang="${lang}"`;
  ssml += '>';
  
  if (voice) {
    ssml += `<voice name="${voice}">`;
  }
  
  ssml += '<prosody';
  if (rate !== 1.0) ssml += ` rate="${rate}"`;
  if (pitch !== 0) ssml += ` pitch="${pitch > 0 ? '+' : ''}${pitch}st"`;
  if (volume !== 100) ssml += ` volume="${volume}"`;
  ssml += '>';
  
  // Wrap in paragraph and sentence tags
  ssml += `<p><s>${clean}</s></p>`;
  
  ssml += '</prosody>';
  
  if (voice) {
    ssml += '</voice>';
  }
  
  ssml += '</speak>';
  
  return ssml;
}

/**
 * Create chunked SSML with pauses between chunks
 * @param {string} text - Input text
 * @param {Object} options - Speech options
 * @returns {string[]} Array of SSML chunks
 */
export function createChunkedSSML(text, options = {}) {
  const chunks = chunkText(text, options.maxLength);
  const ssmlChunks = [];
  
  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];
    
    // Add pause after chunk (except last one)
    if (i < chunks.length - 1) {
      const pauseMs = options.pauseBetweenChunks || DICTIONARY_CONFIG.ssml.pauseBetweenChunks;
      chunk += ` <break time="${pauseMs}ms"/>`;
    }
    
    ssmlChunks.push(wrapSSML(chunk, options));
  }
  
  return ssmlChunks;
}

/**
 * Add emphasis to specific words
 * @param {string} text - Input text
 * @param {string[]} words - Words to emphasize
 * @param {string} level - Emphasis level (strong, moderate, reduced)
 * @returns {string} Text with emphasis markup
 */
export function addEmphasis(text, words, level = 'moderate') {
  if (!words || words.length === 0) return text;
  
  let result = text;
  
  for (const word of words) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, `<emphasis level="${level}">$&</emphasis>`);
  }
  
  return result;
}

/**
 * Convert text to phonetic pronunciation (for challenging words)
 * @param {string} text - Input text
 * @param {Object} phonemeMap - Map of word → phoneme
 * @returns {string} Text with phoneme markup
 */
export function addPhonemes(text, phonemeMap = {}) {
  let result = text;
  
  for (const [word, phoneme] of Object.entries(phonemeMap)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, `<phoneme alphabet="ipa" ph="${phoneme}">${word}</phoneme>`);
  }
  
  return result;
}

/**
 * Format number for speech
 * @param {number|string} num - Number to format
 * @param {string} interpretAs - How to interpret (cardinal, ordinal, digits, fraction, unit, date, time, telephone)
 * @returns {string} SSML say-as markup
 */
export function formatNumber(num, interpretAs = 'cardinal') {
  return `<say-as interpret-as="${interpretAs}">${num}</say-as>`;
}

export default {
  stripHTML,
  sanitizeForSpeech,
  chunkText,
  wrapSSML,
  createChunkedSSML,
  addEmphasis,
  addPhonemes,
  formatNumber,
};
