// detectLang.js - Auto-detect Arabic vs English from user speech

/**
 * Detect language from user utterance
 * @param {string} utterance - User's spoken text
 * @returns {"ar" | "en"} Detected language
 */
export function detectLangFromUserUtterance(utterance) {
  if (!utterance) return "en";
  
  // Check for Arabic characters (U+0600 to U+06FF)
  const hasArabic = /[\u0600-\u06FF]/.test(utterance);
  
  return hasArabic ? "ar" : "en";
}

/**
 * Session language tracker with fallback
 */
class LanguageSession {
  constructor() {
    this.lastLang = "en";
  }

  /**
   * Detect and remember language
   * @param {string} utterance
   * @returns {"ar" | "en"}
   */
  detect(utterance) {
    const detected = detectLangFromUserUtterance(utterance);
    
    // If inconclusive (e.g., single word), keep last language
    if (utterance.trim().length < 5 && detected === "en" && this.lastLang === "ar") {
      return this.lastLang;
    }
    
    this.lastLang = detected;
    return detected;
  }

  /**
   * Get last detected language
   */
  getLast() {
    return this.lastLang;
  }

  /**
   * Manually set language
   */
  set(lang) {
    if (lang === "ar" || lang === "en") {
      this.lastLang = lang;
    }
  }

  /**
   * Reset to default
   */
  reset() {
    this.lastLang = "en";
  }
}

// Singleton instance
export const languageSession = new LanguageSession();

/**
 * Get appropriate voice name for language
 * @param {"ar" | "en"} lang
 * @param {SpeechSynthesisVoice[]} availableVoices
 * @returns {SpeechSynthesisVoice | null}
 */
export function getVoiceForLanguage(lang, availableVoices) {
  if (!availableVoices || availableVoices.length === 0) {
    return null;
  }

  if (lang === "ar") {
    // Arabic female voice patterns
    const arPatterns = [
      /hoda/i,      // Microsoft Hoda
      /hala/i,      // Microsoft Hala
      /zira.*ar/i,  // Zira Arabic variant
      /laila/i,     // Laila
      /maged/i,     // Maged (if no female available)
      /ar-/i,       // Any Arabic voice
    ];

    for (const pattern of arPatterns) {
      const voice = availableVoices.find(v => pattern.test(v.name));
      if (voice) return voice;
    }

    // Fallback: any voice with ar- lang code
    const arVoice = availableVoices.find(v => v.lang.startsWith("ar"));
    if (arVoice) return arVoice;
  }

  // English female voice patterns
  const enPatterns = [
    /zira/i,
    /samantha/i,
    /sara/i,
    /karen/i,
    /victoria/i,
    /vicki/i,
    /ava/i,
    /allison/i,
    /nicky/i,
    /susan/i,
    /alice/i,
    /anna/i,
  ];

  for (const pattern of enPatterns) {
    const voice = availableVoices.find(v => pattern.test(v.name));
    if (voice) return voice;
  }

  // Fallback: first English female voice
  const enFemale = availableVoices.find(v => 
    v.lang.startsWith("en") && (!v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("female"))
  );
  
  return enFemale || availableVoices[0];
}
