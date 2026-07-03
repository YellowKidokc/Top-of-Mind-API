// server/emma/database.js
// Emma AI Memory Database - Persistent conversation storage
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file location
const DB_PATH = path.join(__dirname, 'emma_memory.db');

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better performance

// Create tables if they don't exist
db.exec(`
  -- Sessions table: tracks conversation sessions
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'ashraf',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    topic_tags TEXT, -- JSON array of tags
    is_active INTEGER DEFAULT 1,
    title TEXT,
    summary TEXT
  );

  -- Messages table: stores conversation messages
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    topic_tags TEXT, -- JSON array of tags
    is_important INTEGER DEFAULT 0, -- For 'save this point' functionality
    metadata TEXT, -- JSON for additional data (actions, etc)
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  -- Create indices for faster queries
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp ASC);
  CREATE INDEX IF NOT EXISTS idx_messages_important ON messages(is_important, timestamp DESC);
`);

console.log('✅ Emma Memory Database initialized:', DB_PATH);

// =====================
// Session Management
// =====================

/**
 * Create a new conversation session
 * @param {string} userId - User identifier
 * @param {string[]} topicTags - Initial topic tags
 * @returns {string} - New session ID
 */
export function createSession(userId = 'ashraf', topicTags = []) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, created_at, updated_at, topic_tags)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(sessionId, userId, now, now, JSON.stringify(topicTags));
  
  console.log(`📝 New session created: ${sessionId}`);
  return sessionId;
}

/**
 * Get session by ID
 * @param {string} sessionId
 * @returns {object|null}
 */
export function getSession(sessionId) {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  const session = stmt.get(sessionId);
  
  if (session && session.topic_tags) {
    session.topic_tags = JSON.parse(session.topic_tags);
  }
  
  return session || null;
}

/**
 * Get user's latest active session
 * @param {string} userId
 * @returns {object|null}
 */
export function getLatestSession(userId = 'ashraf') {
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    WHERE user_id = ? AND is_active = 1 
    ORDER BY updated_at DESC 
    LIMIT 1
  `);
  
  const session = stmt.get(userId);
  
  if (session && session.topic_tags) {
    session.topic_tags = JSON.parse(session.topic_tags);
  }
  
  return session || null;
}

/**
 * List user's sessions
 * @param {string} userId
 * @param {number} limit
 * @returns {array}
 */
export function listSessions(userId = 'ashraf', limit = 10) {
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    WHERE user_id = ? 
    ORDER BY updated_at DESC 
    LIMIT ?
  `);
  
  const sessions = stmt.all(userId, limit);
  
  return sessions.map(session => ({
    ...session,
    topic_tags: session.topic_tags ? JSON.parse(session.topic_tags) : []
  }));
}

/**
 * Update session metadata
 * @param {string} sessionId
 * @param {object} updates - { title, summary, topic_tags, is_active }
 */
export function updateSession(sessionId, updates) {
  const fields = [];
  const values = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  
  if (updates.summary !== undefined) {
    fields.push('summary = ?');
    values.push(updates.summary);
  }
  
  if (updates.topic_tags !== undefined) {
    fields.push('topic_tags = ?');
    values.push(JSON.stringify(updates.topic_tags));
  }
  
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }
  
  fields.push('updated_at = ?');
  values.push(Date.now());
  
  values.push(sessionId);
  
  const stmt = db.prepare(`
    UPDATE sessions 
    SET ${fields.join(', ')} 
    WHERE id = ?
  `);
  
  stmt.run(...values);
  console.log(`📝 Session updated: ${sessionId}`);
}

// =====================
// Message Management
// =====================

/**
 * Add message to session
 * @param {string} sessionId
 * @param {string} role - 'user' | 'assistant' | 'system'
 * @param {string} content
 * @param {object} options - { topicTags, isImportant, metadata }
 * @returns {number} - Message ID
 */
export function addMessage(sessionId, role, content, options = {}) {
  const {
    topicTags = [],
    isImportant = false,
    metadata = {}
  } = options;
  
  const stmt = db.prepare(`
    INSERT INTO messages (session_id, role, content, timestamp, topic_tags, is_important, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    sessionId,
    role,
    content,
    Date.now(),
    JSON.stringify(topicTags),
    isImportant ? 1 : 0,
    JSON.stringify(metadata)
  );
  
  // Update session timestamp
  db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?')
    .run(Date.now(), sessionId);
  
  return result.lastInsertRowid;
}

/**
 * Get messages from session
 * @param {string} sessionId
 * @param {object} options - { limit, offset, includeSystem }
 * @returns {array}
 */
export function getMessages(sessionId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    includeSystem = false
  } = options;
  
  let query = `
    SELECT * FROM messages 
    WHERE session_id = ?
  `;
  
  if (!includeSystem) {
    query += ` AND role != 'system'`;
  }
  
  query += ` ORDER BY timestamp ASC LIMIT ? OFFSET ?`;
  
  const stmt = db.prepare(query);
  const messages = stmt.all(sessionId, limit, offset);
  
  return messages.map(msg => ({
    ...msg,
    topic_tags: msg.topic_tags ? JSON.parse(msg.topic_tags) : [],
    metadata: msg.metadata ? JSON.parse(msg.metadata) : {},
    is_important: Boolean(msg.is_important)
  }));
}

/**
 * Get recent messages (for context window)
 * @param {string} sessionId
 * @param {number} count - Number of recent messages
 * @returns {array}
 */
export function getRecentMessages(sessionId, count = 10) {
  const stmt = db.prepare(`
    SELECT * FROM messages 
    WHERE session_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  
  const messages = stmt.all(sessionId, count);
  
  // Reverse to get chronological order
  return messages.reverse().map(msg => ({
    ...msg,
    topic_tags: msg.topic_tags ? JSON.parse(msg.topic_tags) : [],
    metadata: msg.metadata ? JSON.parse(msg.metadata) : {},
    is_important: Boolean(msg.is_important)
  }));
}

/**
 * Get important messages (saved points)
 * @param {string} sessionId
 * @returns {array}
 */
export function getImportantMessages(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM messages 
    WHERE session_id = ? AND is_important = 1 
    ORDER BY timestamp ASC
  `);
  
  const messages = stmt.all(sessionId);
  
  return messages.map(msg => ({
    ...msg,
    topic_tags: msg.topic_tags ? JSON.parse(msg.topic_tags) : [],
    metadata: msg.metadata ? JSON.parse(msg.metadata) : {}
  }));
}

/**
 * Mark message as important ('save this point')
 * @param {number} messageId
 */
export function markMessageImportant(messageId) {
  const stmt = db.prepare('UPDATE messages SET is_important = 1 WHERE id = ?');
  stmt.run(messageId);
  console.log(`⭐ Message ${messageId} marked as important`);
}

/**
 * Get last message ID in session
 * @param {string} sessionId
 * @returns {number|null}
 */
export function getLastMessageId(sessionId) {
  const stmt = db.prepare(`
    SELECT id FROM messages 
    WHERE session_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `);
  
  const result = stmt.get(sessionId);
  return result ? result.id : null;
}

// =====================
// Utility Functions
// =====================

/**
 * Get database statistics
 * @returns {object}
 */
export function getStats() {
  const stats = {
    totalSessions: db.prepare('SELECT COUNT(*) as count FROM sessions').get().count,
    activeSessions: db.prepare('SELECT COUNT(*) as count FROM sessions WHERE is_active = 1').get().count,
    totalMessages: db.prepare('SELECT COUNT(*) as count FROM messages').get().count,
    importantMessages: db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_important = 1').get().count,
    dbSize: fs.statSync(DB_PATH).size
  };
  
  return stats;
}

/**
 * Close database connection (cleanup)
 */
export function closeDatabase() {
  db.close();
  console.log('🔒 Emma Memory Database closed');
}

export default {
  createSession,
  getSession,
  getLatestSession,
  listSessions,
  updateSession,
  addMessage,
  getMessages,
  getRecentMessages,
  getImportantMessages,
  markMessageImportant,
  getLastMessageId,
  getStats,
  closeDatabase
};
