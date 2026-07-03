// server/config/kbRouter.js
// Hybrid KnowledgeBase Router - Phase IV Implementation
// Manages routing between local workspace KB and external Emma KB

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIGURATION ====================

export const KB_MODE = process.env.EMMA_KB_MODE || 'local';
export const KB_LOCAL = process.env.EMMA_KB_LOCAL || './server/Emma_KnowledgeBase';
export const KB_EXTERNAL = process.env.EMMA_KB_EXTERNAL || 'C:\\Users\\ashra\\Emma\\knowledgebase';

// Resolve absolute paths
const PROJECT_ROOT = path.resolve(__dirname, '../..');
export const KB_LOCAL_ABS = path.resolve(PROJECT_ROOT, KB_LOCAL);
export const KB_EXTERNAL_ABS = path.resolve(KB_EXTERNAL);

console.log(`📚 KnowledgeBase Mode: ${KB_MODE}`);
console.log(`   Local KB: ${KB_LOCAL_ABS}`);
if (KB_MODE === 'hybrid' || KB_MODE === 'external') {
  console.log(`   External KB: ${KB_EXTERNAL_ABS}`);
}

// ==================== ROUTING LOGIC ====================

/**
 * Determine which KB to use for a given data type
 * @param {string} dataType - Type of data: 'reports', 'memos', 'research', 'skills', 'prompts', etc.
 * @returns {string} - Absolute path to the appropriate KB
 */
export function getKBPath(dataType) {
  if (KB_MODE === 'local') {
    return KB_LOCAL_ABS;
  }
  
  if (KB_MODE === 'external') {
    return KB_EXTERNAL_ABS;
  }
  
  // Hybrid mode - route based on data type
  if (KB_MODE === 'hybrid') {
    // Local KB: Project-specific data
    const localTypes = ['reports', 'memos', 'research', 'sources', 'logs'];
    
    // External KB: Core Emma capabilities
    const externalTypes = ['skills', 'prompts', 'commands', 'voice', 'dictionary', 'embeddings'];
    
    if (localTypes.includes(dataType)) {
      return KB_LOCAL_ABS;
    }
    
    if (externalTypes.includes(dataType)) {
      return KB_EXTERNAL_ABS;
    }
    
    // Default to local for unknown types
    return KB_LOCAL_ABS;
  }
  
  // Fallback to local
  return KB_LOCAL_ABS;
}

/**
 * Get path to a specific resource in the appropriate KB
 * @param {string} dataType - Type of data
 * @param {string} relativePath - Path relative to KB root
 * @returns {string} - Absolute path to resource
 */
export function getResourcePath(dataType, relativePath) {
  const kbRoot = getKBPath(dataType);
  return path.join(kbRoot, relativePath);
}

/**
 * Check if a resource exists in the appropriate KB
 * @param {string} dataType - Type of data
 * @param {string} relativePath - Path relative to KB root
 * @returns {boolean} - True if resource exists
 */
export function resourceExists(dataType, relativePath) {
  const resourcePath = getResourcePath(dataType, relativePath);
  return fs.existsSync(resourcePath);
}

/**
 * Read a resource from the appropriate KB
 * @param {string} dataType - Type of data
 * @param {string} relativePath - Path relative to KB root
 * @param {string} encoding - File encoding (default: 'utf-8')
 * @returns {string|Buffer} - File contents
 */
export function readResource(dataType, relativePath, encoding = 'utf-8') {
  const resourcePath = getResourcePath(dataType, relativePath);
  
  if (!fs.existsSync(resourcePath)) {
    throw new Error(`Resource not found: ${relativePath} (type: ${dataType})`);
  }
  
  return fs.readFileSync(resourcePath, encoding);
}

/**
 * Write a resource to the appropriate KB
 * @param {string} dataType - Type of data
 * @param {string} relativePath - Path relative to KB root
 * @param {string|Buffer} content - File contents
 * @param {string} encoding - File encoding (default: 'utf-8')
 */
export function writeResource(dataType, relativePath, content, encoding = 'utf-8') {
  const resourcePath = getResourcePath(dataType, relativePath);
  const dir = path.dirname(resourcePath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(resourcePath, content, encoding);
  console.log(`✅ Written: ${relativePath} (${dataType} KB)`);
}

/**
 * List resources in a KB directory
 * @param {string} dataType - Type of data
 * @param {string} relativePath - Path relative to KB root
 * @returns {string[]} - Array of filenames
 */
export function listResources(dataType, relativePath = '') {
  const resourcePath = getResourcePath(dataType, relativePath);
  
  if (!fs.existsSync(resourcePath)) {
    return [];
  }
  
  return fs.readdirSync(resourcePath);
}

// ==================== SYNC OPERATIONS ====================

/**
 * Sync a resource from local to Drive (for future implementation)
 * @param {string} dataType - Type of data
 * @param {string} relativePath - Path relative to KB root
 * @returns {Promise<boolean>} - True if sync successful
 */
export async function syncToDrive(dataType, relativePath) {
  // Placeholder for Google Drive sync implementation
  console.log(`🔄 [TODO] Sync to Drive: ${relativePath} (${dataType})`);
  return true;
}

/**
 * Sync a resource from Drive to local (for future implementation)
 * @param {string} dataType - Type of data
 * @param {string} relativePath - Path relative to KB root
 * @returns {Promise<boolean>} - True if sync successful
 */
export async function syncFromDrive(dataType, relativePath) {
  // Placeholder for Google Drive sync implementation
  console.log(`🔄 [TODO] Sync from Drive: ${relativePath} (${dataType})`);
  return true;
}

// ==================== HEALTH CHECK ====================

/**
 * Verify KB configuration and accessibility
 * @returns {object} - Health status
 */
export function getKBHealth() {
  const health = {
    mode: KB_MODE,
    local: {
      path: KB_LOCAL_ABS,
      accessible: fs.existsSync(KB_LOCAL_ABS),
      writable: false
    },
    external: {
      path: KB_EXTERNAL_ABS,
      accessible: false,
      writable: false
    }
  };
  
  // Test local KB write access
  try {
    const testPath = path.join(KB_LOCAL_ABS, '.kb_health_test');
    fs.writeFileSync(testPath, 'test');
    fs.unlinkSync(testPath);
    health.local.writable = true;
  } catch (err) {
    health.local.writable = false;
  }
  
  // Test external KB access (if hybrid or external mode)
  if (KB_MODE === 'hybrid' || KB_MODE === 'external') {
    health.external.accessible = fs.existsSync(KB_EXTERNAL_ABS);
    
    if (health.external.accessible) {
      try {
        const testPath = path.join(KB_EXTERNAL_ABS, '.kb_health_test');
        fs.writeFileSync(testPath, 'test');
        fs.unlinkSync(testPath);
        health.external.writable = true;
      } catch (err) {
        health.external.writable = false;
      }
    }
  }
  
  return health;
}

export default {
  KB_MODE,
  KB_LOCAL,
  KB_EXTERNAL,
  KB_LOCAL_ABS,
  KB_EXTERNAL_ABS,
  getKBPath,
  getResourcePath,
  resourceExists,
  readResource,
  writeResource,
  listResources,
  syncToDrive,
  syncFromDrive,
  getKBHealth
};
