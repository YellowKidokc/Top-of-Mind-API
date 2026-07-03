// executive.js - Strategic Executive persona for Emma

/**
 * Executive communication style configuration
 * @param {"en"|"ar"} lang
 * @returns {Object} Style settings
 */
export function executiveStyle(lang) {
  return {
    rate: 0.98,         // Calm, deliberate pace
    pitch: 0.95,        // Grounded, authoritative
    
    // Opening statement (said once per session)
    preface: lang === "ar"
      ? "هذه هي النقاط الحاسمة. نبدأ هنا."
      : "These are the decisive points. We start here.",
    
    // Closing statement (optional)
    closing: lang === "ar"
      ? "هل تريد المتابعة؟"
      : "Ready for next action?",
    
    /**
     * Post-process text to enforce executive tone
     * Removes hedging, fillers, unnecessary qualifiers
     * @param {string} text
     * @returns {string} Crisp, decisive text
     */
    postProcess(text) {
      if (!text) return text;
      
      // Remove hedging and fillers
      let processed = text
        .replace(/\b(I think|maybe|perhaps|it seems|we could|possibly|probably|might)\b/gi, "")
        .replace(/\b(kind of|sort of|like|you know|basically|actually|literally)\b/gi, "")
        .replace(/\b(um|uh|hmm|well)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      
      // Ensure decisive phrasing
      processed = processed
        .replace(/\bshould\b/gi, "will")
        .replace(/\bcould\b/gi, "can")
        .replace(/\bwould\b/gi, "will");
      
      return processed;
    },
    
    /**
     * Add natural pauses for clarity
     * @param {string} text
     * @returns {string} Text with pause markers
     */
    addPauses(text) {
      if (!text) return text;
      
      // Add longer pause between sections
      let withPauses = text.replace(/\n\n/g, "|||LONG_PAUSE|||");
      
      // Add medium pause between lines
      withPauses = withPauses.replace(/\n/g, "||PAUSE||");
      
      return withPauses;
    },
    
    /**
     * Process pauses for TTS
     * @param {string} text
     * @returns {string[]} Array of text chunks with pause durations
     */
    processPausesForTTS(text) {
      const chunks = [];
      const parts = text.split(/(\|\|\|LONG_PAUSE\|\|\||\|\|PAUSE\|\|)/);
      
      for (const part of parts) {
        if (part === "|||LONG_PAUSE|||") {
          chunks.push({ type: "pause", duration: 600 });
        } else if (part === "||PAUSE||") {
          chunks.push({ type: "pause", duration: 350 });
        } else if (part.trim()) {
          chunks.push({ type: "text", content: part.trim() });
        }
      }
      
      return chunks;
    }
  };
}

/**
 * Session-level persona state
 */
class ExecutiveSession {
  constructor() {
    this.prefaceSpoken = false;
    this.currentLang = "en";
  }

  /**
   * Check if preface should be spoken
   */
  shouldSpeakPreface() {
    return !this.prefaceSpoken;
  }

  /**
   * Mark preface as spoken
   */
  markPrefaceSpoken() {
    this.prefaceSpoken = true;
  }

  /**
   * Reset session
   */
  reset() {
    this.prefaceSpoken = false;
  }

  /**
   * Set language
   */
  setLang(lang) {
    if (this.currentLang !== lang) {
      // Language changed, reset preface
      this.prefaceSpoken = false;
      this.currentLang = lang;
    }
  }
}

// Singleton instance
export const executiveSession = new ExecutiveSession();

/**
 * Prepare text for executive-style TTS
 * @param {string} text - Raw text
 * @param {"en"|"ar"} lang - Language
 * @param {boolean} includePreface - Include opening statement
 * @returns {string} Processed text ready for TTS
 */
export function prepareExecutiveSpeech(text, lang, includePreface = false) {
  const style = executiveStyle(lang);
  
  // Post-process for executive tone
  let processed = style.postProcess(text);
  
  // Add preface if first message
  if (includePreface && executiveSession.shouldSpeakPreface()) {
    processed = `${style.preface}\n\n${processed}`;
    executiveSession.markPrefaceSpoken();
  }
  
  // Add natural pauses
  processed = style.addPauses(processed);
  
  return processed;
}
