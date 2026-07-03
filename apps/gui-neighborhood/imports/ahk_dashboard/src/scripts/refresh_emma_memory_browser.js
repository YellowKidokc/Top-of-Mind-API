
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
  a.download = `emma_memory_backup_${Date.now()}.json`;
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
          console.log(`  ✂️  Trimmed to last 100 entries (was ${data.length})`);
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
    console.log(`📊 ${key}: ${(size / 1024).toFixed(2)} KB`);
  });
  console.log(`📊 Total Emma memory: ${(totalSize / 1024).toFixed(2)} KB`);
  return totalSize;
}

// Auto-run on load
console.log('\n🎯 Available Commands:');
console.log('  showEmmaMemorySize()        - View current memory usage');
console.log('  refreshEmmaMemory()         - Smart refresh (keeps core)');
console.log('  archiveAndClearEmmaMemory() - Backup then clear (SAFE)');
console.log('  clearAllEmmaMemory()        - Clear everything (DESTRUCTIVE)');
console.log('\n💡 Run: showEmmaMemorySize()');

showEmmaMemorySize();
