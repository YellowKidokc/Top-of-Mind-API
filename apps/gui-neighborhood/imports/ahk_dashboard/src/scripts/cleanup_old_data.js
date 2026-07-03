// src/scripts/cleanup_old_data.js
// Removes outdated logs, old archives, and optimizes storage

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('🧹 Starting Cleanup Process...\n');

const cleanupStats = {
  filesRemoved: 0,
  bytesFreed: 0,
  archivesKept: 0,
  archivesRemoved: 0
};

// Configuration
const config = {
  maxArchives: 12,  // Keep last 12 archives (3 months if weekly)
  maxLogAge: 30,    // Remove logs older than 30 days
  dryRun: false     // Set to true to preview without deleting
};

// 1. Clean up old archives (keep last N)
console.log('📦 Cleaning up old archives...');

const archiveTypes = ['chat_history', 'emma_memory', 'logs'];

archiveTypes.forEach(type => {
  const dir = path.join(projectRoot, '.archive', type);
  
  if (!fs.existsSync(dir)) {
    console.log(`   ⚠️  Directory not found: ${type}/`);
    return;
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      time: fs.statSync(path.join(dir, f)).mtime.getTime(),
      size: fs.statSync(path.join(dir, f)).size
    }))
    .sort((a, b) => b.time - a.time);  // Newest first

  if (files.length > config.maxArchives) {
    const toRemove = files.slice(config.maxArchives);
    
    toRemove.forEach(file => {
      if (!config.dryRun) {
        fs.unlinkSync(file.path);
      }
      cleanupStats.filesRemoved++;
      cleanupStats.bytesFreed += file.size;
      cleanupStats.archivesRemoved++;
      console.log(`   🗑️  Removed old archive: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    });
    
    cleanupStats.archivesKept += config.maxArchives;
  } else {
    cleanupStats.archivesKept += files.length;
    console.log(`   ✅ ${type}/: ${files.length} archives (within limit)`);
  }
});

// 2. Clean up old summary files
console.log('\n📄 Cleaning up old summaries...');

const archiveRoot = path.join(projectRoot, '.archive');
const summaries = fs.readdirSync(archiveRoot)
  .filter(f => f.startsWith('ARCHIVE_') && f.endsWith('.md'))
  .map(f => ({
    name: f,
    path: path.join(archiveRoot, f),
    time: fs.statSync(path.join(archiveRoot, f)).mtime.getTime(),
    size: fs.statSync(path.join(archiveRoot, f)).size
  }))
  .sort((a, b) => b.time - a.time);

if (summaries.length > config.maxArchives) {
  const toRemove = summaries.slice(config.maxArchives);
  
  toRemove.forEach(file => {
    if (!config.dryRun) {
      fs.unlinkSync(file.path);
    }
    cleanupStats.filesRemoved++;
    cleanupStats.bytesFreed += file.size;
    console.log(`   🗑️  Removed old summary: ${file.name}`);
  });
} else {
  console.log(`   ✅ Summaries: ${summaries.length} files (within limit)`);
}

// 3. Clean up temporary sync files older than 30 days
console.log('\n🔄 Cleaning up old sync logs...');

const syncLogPath = path.join(projectRoot, '.emma_last_sync.json');
if (fs.existsSync(syncLogPath)) {
  const syncStat = fs.statSync(syncLogPath);
  const ageInDays = (Date.now() - syncStat.mtime.getTime()) / (1000 * 60 * 60 * 24);
  
  if (ageInDays > config.maxLogAge) {
    if (!config.dryRun) {
      fs.unlinkSync(syncLogPath);
    }
    cleanupStats.filesRemoved++;
    cleanupStats.bytesFreed += syncStat.size;
    console.log(`   🗑️  Removed old sync log (${ageInDays.toFixed(0)} days old)`);
  } else {
    console.log(`   ✅ Sync log is recent (${ageInDays.toFixed(0)} days old)`);
  }
} else {
  console.log('   ℹ️  No sync log found');
}

// 4. Clean up node_modules cache (optional - commented out for safety)
console.log('\n📦 Checking package cache...');
const nodeModulesPath = path.join(projectRoot, 'node_modules', '.cache');
if (fs.existsSync(nodeModulesPath)) {
  const cacheSize = getFolderSize(nodeModulesPath);
  console.log(`   ℹ️  Cache size: ${(cacheSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   💡 To clear: npm run clean (if configured)`);
} else {
  console.log('   ✅ No cache directory found');
}

// 5. Optimize localStorage instructions (browser-side)
console.log('\n💾 Emma Memory Optimization:');
console.log('   ℹ️  Emma memory is stored in browser localStorage');
console.log('   💡 To optimize from browser console:');
console.log('      1. Open DevTools (F12)');
console.log('      2. Go to Console tab');
console.log('      3. Run: localStorage.clear() // WARNING: Clears all Emma memory');
console.log('      4. Or selectively: localStorage.removeItem("emma-old-key")');

// Helper function to calculate folder size
function getFolderSize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        size += getFolderSize(filePath);
      } else {
        size += stat.size;
      }
    });
  } catch (err) {
    // Ignore permission errors
  }
  return size;
}

// Display cleanup summary
console.log('\n═══════════════════════════════════════');
console.log('📊 Cleanup Summary');
console.log('═══════════════════════════════════════');
console.log(`Files Removed: ${cleanupStats.filesRemoved}`);
console.log(`Space Freed: ${(cleanupStats.bytesFreed / 1024).toFixed(2)} KB`);
console.log(`Archives Kept: ${cleanupStats.archivesKept}`);
console.log(`Archives Removed: ${cleanupStats.archivesRemoved}`);
console.log(`Mode: ${config.dryRun ? 'DRY RUN (preview only)' : 'LIVE'}`);
console.log('═══════════════════════════════════════\n');

if (config.dryRun) {
  console.log('⚠️  Dry run mode - no files were actually deleted');
  console.log('💡 Set config.dryRun = false to perform cleanup\n');
} else {
  console.log('✅ Cleanup complete! Old data has been removed.\n');
}

// Create cleanup log
const cleanupLog = {
  timestamp: new Date().toISOString(),
  stats: cleanupStats,
  config,
  nextCleanup: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()  // 7 days
};

const logPath = path.join(projectRoot, '.archive', 'last_cleanup.json');
fs.writeFileSync(logPath, JSON.stringify(cleanupLog, null, 2));
console.log(`📝 Cleanup log saved: .archive/last_cleanup.json\n`);
