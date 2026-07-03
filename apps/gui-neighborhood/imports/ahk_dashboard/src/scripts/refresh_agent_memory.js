// src/scripts/refresh_agent_memory.js
// Refreshes Emma's memory system and clears residual data

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('🔄 Starting Emma Memory Refresh...\n');

const refreshStats = {
  memoriesCleared: 0,
  cacheCleared: 0,
  logsRotated: 0,
  timestamp: new Date().toISOString()
};

// 1. Generate browser-side memory refresh script
console.log('💾 Creating browser memory refresh script...');

const browserScript = `
// Emma Memory Refresh Script
// Run this in browser console (F12) to refresh Emma's memory

console.log('🔄 Emma Memory Refresh Starting...');

// List all Emma-related localStorage keys
const emmaKeys = Object.keys(localStorage).filter(k => k.startsWith('emma-'));
console.log('📊 Found Emma keys:', emmaKeys);

// Option 1: Clear all Emma memory (DESTRUCTIVE)
function clearAllEmmaMemory() {
  emmaKeys.forEach(key => {
    console.log('🗑️  Clearing:', key);
    localStorage.removeItem(key);
  });
  console.log('✅ All Emma memory cleared');
  console.log('💡 Refresh the page to reinitialize');
}

// Option 2: Archive then clear (SAFE)
function archiveAndClearEmmaMemory() {
  const backup = {};
  emmaKeys.forEach(key => {
    backup[key] = localStorage.getItem(key);
  });
  
  // Save backup to download
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = \`emma_memory_backup_\${Date.now()}.json\`;
  a.click();
  
  console.log('📥 Memory backup downloaded');
  
  // Now clear
  emmaKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ Memory cleared after backup');
  console.log('💡 Refresh the page to reinitialize');
}

// Option 3: Refresh specific memory (SELECTIVE)
function refreshEmmaMemory(keepCore = true) {
  const toKeep = keepCore ? ['emma-memory-core'] : [];
  
  emmaKeys.forEach(key => {
    if (!toKeep.includes(key)) {
      console.log('🔄 Refreshing:', key);
      
      // For interaction logs, keep only last 100 entries
      if (key === 'emma-interaction-log') {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          const trimmed = data.slice(-100);
          localStorage.setItem(key, JSON.stringify(trimmed));
          console.log(\`  ✂️  Trimmed to last 100 entries (was \${data.length})\`);
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
      
      // For learning data, reset if too large
      if (key === 'emma-learning-data') {
        try {
          const data = localStorage.getItem(key);
          if (data && data.length > 100000) {  // 100KB
            localStorage.setItem(key, JSON.stringify({ initialized: Date.now(), data: [] }));
            console.log('  🗜️  Reset large learning data');
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
  });
  
  console.log('✅ Memory refreshed');
}

// Display current memory size
function showEmmaMemorySize() {
  let totalSize = 0;
  emmaKeys.forEach(key => {
    const data = localStorage.getItem(key) || '';
    const size = new Blob([data]).size;
    totalSize += size;
    console.log(\`📊 \${key}: \${(size / 1024).toFixed(2)} KB\`);
  });
  console.log(\`📊 Total Emma memory: \${(totalSize / 1024).toFixed(2)} KB\`);
  return totalSize;
}

// Auto-run on load
console.log('\\n🎯 Available Commands:');
console.log('  showEmmaMemorySize()        - View current memory usage');
console.log('  refreshEmmaMemory()         - Smart refresh (keeps core)');
console.log('  archiveAndClearEmmaMemory() - Backup then clear (SAFE)');
console.log('  clearAllEmmaMemory()        - Clear everything (DESTRUCTIVE)');
console.log('\\n💡 Run: showEmmaMemorySize()');

showEmmaMemorySize();
`;

const browserScriptPath = path.join(projectRoot, 'src', 'scripts', 'refresh_emma_memory_browser.js');
fs.writeFileSync(browserScriptPath, browserScript);
console.log(`✅ Browser script created: src/scripts/refresh_emma_memory_browser.js\n`);

// 2. Clear server-side sync cache
console.log('🗑️  Clearing server-side sync cache...');

const syncFilePath = path.join(projectRoot, '.emma_last_sync.json');
if (fs.existsSync(syncFilePath)) {
  const syncData = JSON.parse(fs.readFileSync(syncFilePath, 'utf-8'));
  
  // Archive current sync data
  const archiveDir = path.join(projectRoot, '.archive', 'logs');
  const archivePath = path.join(archiveDir, `sync_backup_${Date.now()}.json`);
  fs.writeFileSync(archivePath, JSON.stringify(syncData, null, 2));
  console.log(`   📦 Backed up sync data to: ${path.relative(projectRoot, archivePath)}`);
  
  // Create fresh sync file
  const freshSync = {
    timestamp: new Date().toISOString(),
    lastSync: 'Never',
    nextSync: 'Pending',
    status: 'Ready',
    refreshed: true
  };
  
  fs.writeFileSync(syncFilePath, JSON.stringify(freshSync, null, 2));
  console.log('   ✅ Sync cache refreshed');
  refreshStats.cacheCleared++;
} else {
  console.log('   ℹ️  No sync cache found');
}

// 3. Rotate log files (if any exist)
console.log('\n📋 Rotating log files...');

const logsDir = path.join(projectRoot, 'logs');
if (fs.existsSync(logsDir)) {
  const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
  
  logFiles.forEach(logFile => {
    const logPath = path.join(logsDir, logFile);
    const stat = fs.statSync(logPath);
    
    // If log is over 1MB, rotate it
    if (stat.size > 1024 * 1024) {
      const archivePath = path.join(projectRoot, '.archive', 'logs', `${logFile}.${Date.now()}.old`);
      fs.renameSync(logPath, archivePath);
      console.log(`   🔄 Rotated: ${logFile} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      refreshStats.logsRotated++;
    }
  });
  
  if (refreshStats.logsRotated === 0) {
    console.log('   ✅ No logs need rotation');
  }
} else {
  console.log('   ℹ️  No logs directory found');
}

// 4. Clean up temp files
console.log('\n🧹 Cleaning temporary files...');

const tempPatterns = [
  '*.tmp',
  '*.temp',
  '.DS_Store',
  'Thumbs.db'
];

let tempFilesRemoved = 0;

function cleanTempFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        cleanTempFiles(filePath);
      } else {
        const shouldRemove = tempPatterns.some(pattern => {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(file);
        });
        
        if (shouldRemove) {
          fs.unlinkSync(filePath);
          tempFilesRemoved++;
        }
      }
    });
  } catch (err) {
    // Ignore permission errors
  }
}

cleanTempFiles(projectRoot);
if (tempFilesRemoved > 0) {
  console.log(`   🗑️  Removed ${tempFilesRemoved} temporary files`);
} else {
  console.log('   ✅ No temporary files found');
}

// 5. Create memory refresh log
const refreshLog = {
  timestamp: refreshStats.timestamp,
  stats: refreshStats,
  browserScriptCreated: true,
  nextRefresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  instructions: {
    browserRefresh: 'Open browser console and run: refresh_emma_memory_browser.js',
    serverRefresh: 'Completed automatically',
    fullReset: 'Run both archive_project.js and cleanup_old_data.js before this script'
  }
};

const refreshLogPath = path.join(projectRoot, '.archive', 'last_refresh.json');
fs.writeFileSync(refreshLogPath, JSON.stringify(refreshLog, null, 2));

// Display summary
console.log('\n═══════════════════════════════════════');
console.log('📊 Memory Refresh Summary');
console.log('═══════════════════════════════════════');
console.log(`Cache Cleared: ${refreshStats.cacheCleared}`);
console.log(`Logs Rotated: ${refreshStats.logsRotated}`);
console.log(`Temp Files Removed: ${tempFilesRemoved}`);
console.log(`Browser Script: ✅ Created`);
console.log('═══════════════════════════════════════\n');

console.log('✅ Server-side refresh complete!\n');
console.log('🌐 Browser-side refresh:');
console.log('   1. Open dashboard: http://localhost:3000');
console.log('   2. Press F12 to open DevTools');
console.log('   3. Go to Console tab');
console.log('   4. Copy and paste the script from:');
console.log('      src/scripts/refresh_emma_memory_browser.js');
console.log('   5. Run: showEmmaMemorySize() to check memory');
console.log('   6. Run: refreshEmmaMemory() to optimize\n');

console.log('📝 Refresh log saved: .archive/last_refresh.json\n');
