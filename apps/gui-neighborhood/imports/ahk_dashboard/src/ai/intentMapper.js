/**
 * 🧠 Intent Mapper - Natural Command Understanding
 * 
 * Maps natural language voice commands to standardized intents using:
 * - Synonym arrays for flexible matching
 * - Fuzzy matching with Levenshtein distance for typo tolerance
 * - Partial phrase matching for natural speech patterns
 * 
 * @module intentMapper
 */

/**
 * Intent definitions with synonym arrays
 * Add new synonyms here to expand command recognition
 */
const intents = {
  // AI Analysis & Co-Pilot
  runAnalysis: [
    'run copilot', 'start ai', 'begin analysis', 'launch copilot', 
    'analyze data', 'run ai analysis', 'run analysis', 'ai analysis',
    'start analysis', 'analyze', 'run ai', 'copilot start'
  ],
  
  runSync: [
    'run sync', 'start sync', 'sync memory', 'sync drive', 
    'synchronize', 'emma sync', 'sync data', 'run synchronization',
    'sync logs', 'backup memory', 'sync to drive'
  ],
  
  runFusion: [
    'run fusion', 'fusion analysis', 'multi ai', 'start fusion',
    'launch fusion', 'run multi ai', 'fusion report', 'multi ai analysis'
  ],
  
  showFusion: [
    'show fusion', 'fusion report', 'consensus score', 'show fusion report',
    'display fusion', 'what is consensus', 'fusion results'
  ],
  
  // Investor & Portfolio
  investorBrief: [
    'investor brief', 'portfolio summary', 'give me update', 
    "what's the summary", 'brief me', 'portfolio status',
    'investor update', 'investment summary', 'show portfolio'
  ],
  
  // Actions & Tasks
  nextActions: [
    'show next actions', 'what should i do', 'next steps', 
    'recommend actions', 'action items', 'what to do',
    'show tasks', 'upcoming tasks', 'next task'
  ],
  
  overdueReview: [
    'what is overdue', 'overdue tasks', 'late tasks',
    'show overdue', 'missed deadlines', 'behind schedule'
  ],
  
  // Risk & Alerts
  riskReport: [
    'risk report', 'any alerts', 'show risks', 
    "what's risky", 'problems list', 'risk assessment',
    'show warnings', 'what risks', 'risk analysis'
  ],
  
  // Navigation
  openDashboard: [
    'open dashboard', 'go to dashboard', 'show dashboard',
    'dashboard page', 'go dashboard', 'home page'
  ],
  
  openStrategy: [
    'open strategy', 'go to strategy', 'strategy page',
    'show strategy', 'roadmap page', 'go strategy'
  ],
  
  openMarketing: [
    'open marketing', 'marketing pulse', 'go to marketing',
    'show marketing', 'marketing page'
  ],
  
  openAssets: [
    'open assets', 'asset vault', 'go to assets',
    'show assets', 'assets page', 'documents'
  ],
  
  openPartnerships: [
    'open partnerships', 'go to partnerships', 'partnerships page',
    'show partnerships', 'partners'
  ],
  
  // Project Info
  projectSummary: [
    'project summary', 'tell me about projects', 'list projects',
    'what projects', 'show projects', 'project overview'
  ],
  
  // Settings & Controls
  enableAutoSync: [
    'enable auto', 'turn on auto', 'enable autosync',
    'start autosync', 'auto sync on', 'enable auto sync'
  ],
  
  disableAutoSync: [
    'disable auto', 'turn off auto', 'disable autosync',
    'stop autosync', 'auto sync off', 'disable auto sync'
  ],
  
  // Voice Engine v2 - Wake Phrases
  voiceStart: [
    'emma start analysis', 'start analysis', 'run analysis',
    'ابدئي التحليل', 'تشغيل التحليل'
  ],
  
  voiceFusion: [
    'start fusion', 'fusion analysis', 'emma start fusion',
    'التحليل الاندماجي', 'ابدئي الاندماج'
  ],
  
  // Help & Support
  help: [
    'help', 'what can you do', 'commands',
    'show help', 'help me', 'what commands'
  ],
  
  // Control
  stop: [
    'stop', 'cancel', 'pause', 'halt', 
    'enough', 'be quiet', 'silence', 'shut up'
  ],
  
  // 🪄 TASK MANAGEMENT (Mission #11 - AI Task Orchestration)
  createTask: [
    'create task', 'add task', 'new task', 'make task',
    'add milestone', 'create milestone', 'add todo', 'note this down'
  ],
  
  updateTask: [
    'update task', 'change task', 'modify task',
    'edit task', 'update status', 'change status'
  ],
  
  completeTask: [
    'complete task', 'mark done', 'finish task',
    'task done', 'mark complete', 'done with'
  ],
  
  addNote: [
    'add note', 'note to task', 'add comment',
    'append note', 'add reminder', 'make note'
  ],
  
  updateRoadmap: [
    'update roadmap', 'refresh roadmap', 'sync roadmap',
    'reload tasks', 'refresh plan', 'sync tasks'
  ],
  
  dailySummary: [
    'daily summary', 'summarize tasks', 'show summary',
    'what pending', 'active tasks', 'task status'
  ]
};

/**
 * Normalize input text for matching
 * - Convert to lowercase
 * - Remove extra whitespace
 * - Remove punctuation
 * 
 * @param {string} text - Raw input text
 * @returns {string} Normalized text
 */
function normalize(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Collapse whitespace
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to handle typos
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if command matches a synonym with fuzzy tolerance
 * 
 * @param {string} command - Normalized command text
 * @param {string} synonym - Synonym to match against
 * @param {number} tolerance - Maximum Levenshtein distance (default: 2)
 * @returns {boolean} True if match found
 */
function fuzzyMatch(command, synonym, tolerance = 2) {
  // Exact substring match
  if (command.includes(synonym) || synonym.includes(command)) {
    return true;
  }
  
  // Fuzzy match with Levenshtein distance
  const distance = levenshtein(command, synonym);
  return distance <= tolerance;
}

/**
 * Map natural language command to standardized intent
 * 
 * @param {string} commandText - Raw voice command text
 * @returns {string|null} Intent name or null if no match
 * 
 * @example
 * mapIntent('run copilot') // => 'runAnalysis'
 * mapIntent('whats the summary') // => 'investorBrief'
 * mapIntent('shw risks') // => 'riskReport' (fuzzy match)
 */
export function mapIntent(commandText) {
  if (!commandText) return null;
  
  const normalized = normalize(commandText);
  
  // Try exact and fuzzy matching for each intent
  for (const [intentName, synonyms] of Object.entries(intents)) {
    for (const synonym of synonyms) {
      if (fuzzyMatch(normalized, synonym)) {
        return intentName;
      }
    }
  }
  
  return null;
}

/**
 * Get all synonyms for a specific intent
 * Useful for displaying help information
 * 
 * @param {string} intentName - Intent identifier
 * @returns {string[]} Array of synonyms or empty array
 */
export function getSynonyms(intentName) {
  return intents[intentName] || [];
}

/**
 * Get all available intents
 * 
 * @returns {string[]} Array of intent names
 */
export function getAvailableIntents() {
  return Object.keys(intents);
}

/**
 * Add custom synonym to an intent
 * Allows runtime extension of command vocabulary
 * 
 * @param {string} intentName - Intent to extend
 * @param {string} synonym - New synonym to add
 * @returns {boolean} True if added successfully
 */
export function addSynonym(intentName, synonym) {
  if (!intents[intentName]) {
    console.warn(`Intent "${intentName}" does not exist`);
    return false;
  }
  
  const normalized = normalize(synonym);
  if (!intents[intentName].includes(normalized)) {
    intents[intentName].push(normalized);
    return true;
  }
  
  return false;
}

/**
 * Get confidence score for a match (0-100)
 * Higher score = better match
 * 
 * @param {string} commandText - Raw command text
 * @param {string} intentName - Intent to score against
 * @returns {number} Confidence score (0-100)
 */
export function getConfidence(commandText, intentName) {
  if (!commandText || !intents[intentName]) return 0;
  
  const normalized = normalize(commandText);
  const synonyms = intents[intentName];
  
  let bestScore = 0;
  
  for (const synonym of synonyms) {
    // Exact match = 100
    if (normalized === synonym) return 100;
    
    // Substring match = 90
    if (normalized.includes(synonym) || synonym.includes(normalized)) {
      bestScore = Math.max(bestScore, 90);
      continue;
    }
    
    // Fuzzy match based on distance
    const distance = levenshtein(normalized, synonym);
    const maxLen = Math.max(normalized.length, synonym.length);
    const score = Math.max(0, 100 - (distance / maxLen) * 100);
    
    bestScore = Math.max(bestScore, score);
  }
  
  return Math.round(bestScore);
}

export default mapIntent;
