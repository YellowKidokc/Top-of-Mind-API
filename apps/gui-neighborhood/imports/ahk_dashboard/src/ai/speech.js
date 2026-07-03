// src/ai/speech.js - Enhanced TTS with executive persona and multilingual support
import { getVoiceForLanguage } from "../voice/lang/detectLang.js";
import { executiveStyle } from "../voice/persona/executive.js";
import sessionContext from "../engine/sessionContext.js";

let speaking = false;
let currentUtterance = null;
let bargeInDetector = null;

export function stopSpeak(reason = "manual") {
  try {
    console.log('🛑 Stopping speech:', reason);
    window.speechSynthesis?.cancel();
    currentUtterance = null;
    
    // Update session context when speech is interrupted
    if (reason === "barge-in" || reason === "stop-command") {
      sessionContext.setState("idle");
      sessionContext.save();
    }
  } catch {}
  speaking = false;
}

/**
 * Setup barge-in detection for interrupt-safe playback
 * Listens for "stop", "emma stop", "cancel", etc.
 */
export function setupBargeInDetection() {
  if (bargeInDetector) return; // Already setup
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('⚠️ Speech recognition not supported, barge-in disabled');
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  bargeInDetector = new SpeechRecognition();
  bargeInDetector.continuous = false;
  bargeInDetector.interimResults = false;
  bargeInDetector.lang = 'en-US';
  
  bargeInDetector.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('')
      .toLowerCase()
      .trim();
    
    // Check for stop commands
    const stopPhrases = ['stop', 'emma stop', 'cancel', 'be quiet', 'shut up', 'enough'];
    const shouldStop = stopPhrases.some(phrase => transcript.includes(phrase));
    
    if (shouldStop && speaking) {
      console.log('🛑 BARGE-IN DETECTED:', transcript);
      stopSpeak('barge-in');
      sessionContext.setState('idle');
      sessionContext.save();
    }
  };
  
  bargeInDetector.onerror = (e) => {
    // Silently ignore errors - barge-in is optional feature
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      console.log('⚠️ Barge-in detector error:', e.error);
    }
  };
  
  console.log('✅ Barge-in detection initialized');
}

/**
 * Start monitoring for barge-in during speech
 */
function startBargeInMonitoring() {
  if (bargeInDetector && !speaking) {
    try {
      bargeInDetector.start();
    } catch (e) {
      // Already running or error - ignore
    }
  }
}

/**
 * Stop monitoring for barge-in after speech ends
 */
function stopBargeInMonitoring() {
  if (bargeInDetector) {
    try {
      bargeInDetector.stop();
    } catch (e) {
      // Not running - ignore
    }
  }
}

// Ensure voices are loaded before speaking
let voicesLoaded = false;
let voicesLoadPromise = null;

function ensureVoicesLoaded() {
  if (voicesLoaded) return Promise.resolve();
  
  if (voicesLoadPromise) return voicesLoadPromise;
  
  voicesLoadPromise = new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      voicesLoaded = true;
      console.log('✅ Speech voices loaded:', voices.length);
      resolve();
    } else {
      // Wait for voices to load
      console.log('⏳ Waiting for speech voices to load...');
      window.speechSynthesis.onvoiceschanged = () => {
        const newVoices = window.speechSynthesis.getVoices();
        voicesLoaded = true;
        console.log('✅ Speech voices loaded:', newVoices.length);
        resolve();
      };
      
      // Fallback timeout
      setTimeout(() => {
        voicesLoaded = true;
        console.warn('⚠️ Voice loading timeout, proceeding anyway');
        resolve();
      }, 1000);
    }
  });
  
  return voicesLoadPromise;
}

export function speak(text, { 
  lang = "en-US", 
  pitch = 0.95,  // Executive default
  rate = 0.98,   // Executive default
  volume = 1, 
  gender = "female",
  executive = true 
} = {}) {
  // Make it synchronous but still ensure voices
  const doSpeak = async () => {
    try {
      // Ensure voices are loaded first
      await ensureVoicesLoaded();
      
      stopSpeak(); // cancel anything ongoing
      
      if (!text || text.trim().length === 0) {
        console.warn('⚠️ Empty text, skipping speech');
        return;
      }
      
      // Detect language from lang code
      const detectedLang = lang.startsWith("ar") ? "ar" : "en";
      
      // Process text with executive style if enabled
      let processedText = text;
      if (executive) {
        const style = executiveStyle(detectedLang);
        processedText = style.postProcess(text);
      }

      console.log('🔊 Preparing to speak:', processedText.substring(0, 80));
      console.log('🎤 Language:', lang, 'Volume:', volume, 'Rate:', rate);

      const utter = new SpeechSynthesisUtterance(processedText);
      utter.lang = lang;
      utter.pitch = pitch;
      utter.rate = rate;
      utter.volume = volume;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      console.log('🎤 Available voices:', voices.length);
      
      if (voices.length === 0) {
        console.error('❌ No voices available! Browser may not support TTS.');
        return;
      }
      
      // Select appropriate voice for language
      const selectedVoice = getVoiceForLanguage(detectedLang, voices);
      
      if (selectedVoice) {
        utter.voice = selectedVoice;
        console.log('🎤 Selected voice:', selectedVoice.name, `(${detectedLang})`);
      } else {
        console.warn('⚠️ No suitable voice found for language:', detectedLang);
        console.log('🎤 First 3 voices:', voices.slice(0, 3).map(v => `${v.name} (${v.lang})`));
        // Use first voice as fallback
        utter.voice = voices[0];
        console.log('🎤 Using fallback voice:', voices[0].name);
      }

      utter.onstart = () => { 
        speaking = true;
        startBargeInMonitoring(); // Start listening for interrupts
        console.log(`✅✅✅ SPEECH STARTED: "${processedText.substring(0, 50)}..."`);
      };
      utter.onend = () => { 
        speaking = false; 
        currentUtterance = null;
        stopBargeInMonitoring(); // Stop listening for interrupts
        console.log('✅ Speech ended');
      };
      utter.onerror = (e) => { 
        console.error('❌ Speech error:', e.error, 'Event:', e); 
        speaking = false; 
        currentUtterance = null;
        stopBargeInMonitoring(); // Stop listening for interrupts
      };

      currentUtterance = utter;
      
      // Check if speechSynthesis is paused (common issue)
      if (window.speechSynthesis.paused) {
        console.log('⚠️ SpeechSynthesis was paused, resuming...');
        window.speechSynthesis.resume();
      }
      
      // Cancel any pending speech first
      window.speechSynthesis.cancel();
      
      console.log('🔊 Calling speechSynthesis.speak()...');
      window.speechSynthesis.speak(utter);
      
      // Debug: Check if speech queue has utterances
      setTimeout(() => {
        console.log('🔊 Speech pending:', window.speechSynthesis.pending);
        console.log('🔊 Speech speaking:', window.speechSynthesis.speaking);
        console.log('🔊 Speech paused:', window.speechSynthesis.paused);
        
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          console.error('❌ Speech not started! This may be a browser issue.');
          console.log('💡 Try: 1) Check browser permissions, 2) Refresh page, 3) Try different browser');
        }
      }, 200);
      
    } catch (e) {
      console.error("❌ TTS error:", e);
    }
  };
  
  // Execute immediately
  doSpeak();
}

/**
 * Speak text with natural pauses between sections
 */
export async function speakWithPauses(text, options = {}) {
  if (!text) return;

  // Ensure voices are loaded first
  await ensureVoicesLoaded();

  const style = executiveStyle(options.lang?.startsWith("ar") ? "ar" : "en");
  const chunks = style.processPausesForTTS(text);

  for (const chunk of chunks) {
    if (chunk.type === "pause") {
      await new Promise(resolve => setTimeout(resolve, chunk.duration));
    } else if (chunk.type === "text") {
      await speak(chunk.content, options);
      await new Promise(resolve => {
        const checkSpeaking = setInterval(() => {
          if (!speaking) {
            clearInterval(checkSpeaking);
            resolve();
          }
        }, 100);
      });
    }
  }
}

export function pickLang(code) {
  // Normalize app locales to Web Speech tags
  if (!code) return "en-US";
  const c = code.toLowerCase();
  if (c.startsWith("ar")) return "ar-SA"; // Arabic (Saudi Arabia)
  return "en-US";
}

export function isSpeaking() {
  return speaking;
}

/**
 * Initialize speech system (call on page load)
 */
export function initializeSpeech() {
  console.log('🎤 Initializing speech system...');
  
  // Setup barge-in detection
  setupBargeInDetection();
  
  // Pre-load voices
  ensureVoicesLoaded().then(() => {
    const voices = window.speechSynthesis.getVoices();
    console.log('✅ Speech system ready with', voices.length, 'voices');
    
    // Log female English voices for debugging
    const femaleEnVoices = voices.filter(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('zira') ||
       v.name.toLowerCase().includes('susan'))
    );
    console.log('🎤 Female EN voices:', femaleEnVoices.map(v => v.name));
  });
}
