/**
 * 🧠 Emma Context Engine v2.0
 * Persistent Conversational Memory with localStorage
 * 
 * Maintains dialog state across page reloads, enabling:
 * - Topic continuity
 * - Follow-up handling
 * - Entity tracking
 * - Multi-turn conversations
 */

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'emma_session_context';

/**
 * Session Context Object
 * Tracks conversation state and persists across browser sessions
 */
const sessionContext = {
  // Session metadata
  session_id: null,
  session_start: null,
  last_activity: null,
  
  // Conversation state
  current_topic: null,          // e.g., "ANALYSIS", "REPORT_READING", "CLIENT_QUERY"
  last_intent: null,             // Last detected intent
  last_entities: [],             // Extracted entities from last utterance
  dialog_state: 'idle',          // idle | awaiting_follow_up | awaiting_clarification | processing
  
  // Context tracking
  expected_next_intents: [],     // Predicted intents based on current state
  clarification_question: null,  // If Emma needs clarification
  data_pointer: null,            // Current position in report/data being read
  
  // Conversation history (last 5 exchanges)
  history: [],
  
  /**
   * Load context from localStorage
   * If no context exists, initializes new session
   */
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const data = JSON.parse(stored);
        
        // Restore all fields
        Object.assign(this, data);
        
        // Check if session expired (24 hours)
        const now = Date.now();
        const lastActivity = new Date(this.last_activity).getTime();
        const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
        
        if (hoursSinceActivity > 24) {
          console.log('🧠 Session expired, starting fresh');
          this.reset();
        } else {
          console.log('🧠 Emma Context Engine v2.0 loaded from localStorage');
          console.log(`   Session ID: ${this.session_id}`);
          console.log(`   Topic: ${this.current_topic || 'none'}`);
          console.log(`   State: ${this.dialog_state}`);
        }
      } else {
        console.log('🧠 No existing context, initializing new session');
        this.reset();
      }
    } catch (error) {
      console.error('❌ Failed to load context:', error);
      this.reset();
    }
    
    return this;
  },
  
  /**
   * Save context to localStorage
   * Called after every interaction
   */
  save() {
    try {
      this.last_activity = new Date().toISOString();
      
      // Create clean object (exclude methods)
      const dataToStore = {
        session_id: this.session_id,
        session_start: this.session_start,
        last_activity: this.last_activity,
        current_topic: this.current_topic,
        last_intent: this.last_intent,
        last_entities: this.last_entities,
        dialog_state: this.dialog_state,
        expected_next_intents: this.expected_next_intents,
        clarification_question: this.clarification_question,
        data_pointer: this.data_pointer,
        history: this.history
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      console.log('💾 Context saved:', this.dialog_state, '|', this.current_topic);
      
    } catch (error) {
      console.error('❌ Failed to save context:', error);
    }
    
    return this;
  },
  
  /**
   * Reset context and start new session
   * Called on first load or session expiry
   */
  reset() {
    this.session_id = uuidv4();
    this.session_start = new Date().toISOString();
    this.last_activity = new Date().toISOString();
    this.current_topic = null;
    this.last_intent = null;
    this.last_entities = [];
    this.dialog_state = 'idle';
    this.expected_next_intents = [];
    this.clarification_question = null;
    this.data_pointer = null;
    this.history = [];
    
    this.save();
    console.log('🧠 Emma Context Engine v2.0 initialized with persistent memory');
    console.log(`   New Session ID: ${this.session_id}`);
    
    return this;
  },
  
  /**
   * Update context after intent detection
   */
  updateIntent(intent, entities = []) {
    this.last_intent = intent;
    this.last_entities = entities;
    
    // Update topic based on intent
    if (intent === 'START_ANALYSIS' || intent === 'CONTINUE_ANALYSIS') {
      this.current_topic = 'ANALYSIS';
      this.expected_next_intents = ['READ_REPORT', 'STOP', 'CLARIFY'];
    } else if (intent === 'READ_REPORT' || intent === 'NEXT_SECTION') {
      this.current_topic = 'REPORT_READING';
      this.expected_next_intents = ['NEXT_SECTION', 'PREVIOUS_SECTION', 'STOP'];
    } else if (intent === 'STOP' || intent === 'CANCEL') {
      this.current_topic = null;
      this.dialog_state = 'idle';
      this.expected_next_intents = [];
      this.data_pointer = null;
    }
    
    this.save();
    return this;
  },
  
  /**
   * Set dialog state
   */
  setState(state) {
    this.dialog_state = state;
    this.save();
    return this;
  },
  
  /**
   * Add to conversation history
   */
  addToHistory(userInput, emmaResponse, intent) {
    this.history.push({
      timestamp: new Date().toISOString(),
      user: userInput,
      emma: emmaResponse,
      intent: intent
    });
    
    // Keep only last 5 exchanges
    if (this.history.length > 5) {
      this.history = this.history.slice(-5);
    }
    
    this.save();
    return this;
  },
  
  /**
   * Get context summary for NLU
   */
  getContextSummary() {
    return {
      topic: this.current_topic,
      state: this.dialog_state,
      lastIntent: this.last_intent,
      expectedIntents: this.expected_next_intents,
      pointer: this.data_pointer
    };
  },
  
  /**
   * Check if in follow-up mode
   */
  isInFollowUpMode() {
    return this.dialog_state === 'awaiting_follow_up' && this.current_topic !== null;
  },
  
  /**
   * Set follow-up mode
   */
  setFollowUpMode(topic = null) {
    this.dialog_state = 'awaiting_follow_up';
    if (topic) this.current_topic = topic;
    this.save();
    return this;
  },
  
  /**
   * Clear follow-up mode
   */
  clearFollowUpMode() {
    if (this.dialog_state === 'awaiting_follow_up') {
      this.dialog_state = 'idle';
      this.save();
    }
    return this;
  }
};

// Export singleton
export default sessionContext;
