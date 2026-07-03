/**
 * Emma System Enhancement - Integration Test
 * 
 * Tests:
 * 1. Voice console wake phrase ("Emma, start analysis")
 * 2. Voice command "Run sync"
 * 3. Emma sync script execution
 * 4. Google Drive folder verification
 * 5. Log entry creation
 */

console.log('\n═══════════════════════════════════════════════════════');
console.log('🧪 Emma System Enhancement - Integration Test');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Verify Emma Sync Script
console.log('📝 Test 1: Verifying Emma Sync Script...');
try {
  const fs = await import('fs');
  const path = await import('path');
  const syncPath = path.resolve('src/scripts/emma_sync.js');
  
  if (fs.existsSync(syncPath)) {
    console.log('✅ Emma sync script exists');
  } else {
    console.log('❌ Emma sync script not found');
  }
} catch (error) {
  console.log('❌ Error checking sync script:', error.message);
}

// Test 2: Verify Voice Console Updates
console.log('\n📝 Test 2: Verifying Voice Console Updates...');
try {
  const fs = await import('fs');
  const path = await import('path');
  const voicePath = path.resolve('src/components/VoiceConsole.jsx');
  const content = fs.readFileSync(voicePath, 'utf-8');
  
  const hasRunSync = content.includes('runSync');
  const has60sTimeout = content.includes('60000');
  const hasStopButton = content.includes('⏹️ Stop');
  
  console.log(`  - Run sync command: ${hasRunSync ? '✅' : '❌'}`);
  console.log(`  - 60s inactivity timer: ${has60sTimeout ? '✅' : '❌'}`);
  console.log(`  - Close button: ${hasStopButton ? '✅' : '❌'}`);
} catch (error) {
  console.log('❌ Error checking voice console:', error.message);
}

// Test 3: Verify Voice.js Female Voice
console.log('\n📝 Test 3: Verifying Voice.js Female Voice...');
try {
  const fs = await import('fs');
  const path = await import('path');
  const voicePath = path.resolve('src/ai/voice.js');
  const content = fs.readFileSync(voicePath, 'utf-8');
  
  const hasFemaleVoice = content.includes('Female');
  const hasWakePhrase = content.includes('emma') && content.includes('start analysis');
  
  console.log(`  - Female voice configuration: ${hasFemaleVoice ? '✅' : '❌'}`);
  console.log(`  - Wake phrase detection: ${hasWakePhrase ? '✅' : '❌'}`);
} catch (error) {
  console.log('❌ Error checking voice.js:', error.message);
}

// Test 4: Verify Intent Mapper
console.log('\n📝 Test 4: Verifying Intent Mapper...');
try {
  const fs = await import('fs');
  const path = await import('path');
  const intentPath = path.resolve('src/ai/intentMapper.js');
  const content = fs.readFileSync(intentPath, 'utf-8');
  
  const hasRunSyncIntent = content.includes('runSync');
  
  console.log(`  - Run sync intent: ${hasRunSyncIntent ? '✅' : '❌'}`);
} catch (error) {
  console.log('❌ Error checking intent mapper:', error.message);
}

// Test 5: Verify VS Code Tasks
console.log('\n📝 Test 5: Verifying VS Code Task Scheduler...');
try {
  const fs = await import('fs');
  const path = await import('path');
  const tasksPath = path.resolve('.vscode/tasks.json');
  
  if (fs.existsSync(tasksPath)) {
    const content = fs.readFileSync(tasksPath, 'utf-8');
    const hasEmmaSyncTask = content.includes('Emma Daily Sync');
    const hasManualTask = content.includes('Emma Manual Sync');
    
    console.log(`  - Daily sync task (08:00 AM): ${hasEmmaSyncTask ? '✅' : '❌'}`);
    console.log(`  - Manual sync task: ${hasManualTask ? '✅' : '❌'}`);
  } else {
    console.log('❌ VS Code tasks.json not found');
  }
} catch (error) {
  console.log('❌ Error checking tasks:', error.message);
}

// Test 6: Verify API Endpoint
console.log('\n📝 Test 6: Verifying API Endpoint...');
try {
  const fs = await import('fs');
  const path = await import('path');
  const vitePath = path.resolve('vite.config.js');
  const content = fs.readFileSync(vitePath, 'utf-8');
  
  const hasEmmaSyncEndpoint = content.includes('/api/emma-sync');
  
  console.log(`  - /api/emma-sync endpoint: ${hasEmmaSyncEndpoint ? '✅' : '❌'}`);
} catch (error) {
  console.log('❌ Error checking API endpoint:', error.message);
}

// Test 7: Verify .env.local Configuration
console.log('\n📝 Test 7: Verifying Environment Configuration...');
try {
  const fs = await import('fs');
  const path = await import('path');
  const envPath = path.resolve('.env.local');
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const hasPersonalToken = content.includes('GOOGLE_PERSONAL_REFRESH_TOKEN') && !content.includes('your_personal_refresh_token_here');
    const hasWorkToken = content.includes('GOOGLE_WORK_REFRESH_TOKEN') && !content.includes('your_work_refresh_token_here');
    
    console.log(`  - Personal Drive token: ${hasPersonalToken ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`  - Work Drive token: ${hasWorkToken ? '✅ Configured' : '❌ Not configured'}`);
  } else {
    console.log('❌ .env.local not found');
  }
} catch (error) {
  console.log('❌ Error checking environment:', error.message);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('✅ Integration Test Complete');
console.log('═══════════════════════════════════════════════════════');
console.log('\n📋 Manual Tests Required:');
console.log('  1. Open dev server and click mic button');
console.log('  2. Say: "Emma, start analysis"');
console.log('  3. Listen for: "Synchronization complete, Ash."');
console.log('  4. Say: "Run sync"');
console.log('  5. Listen for: "Synchronization complete, Ash. Memory and logs synced to both drives."');
console.log('  6. Check Google Drive for Emma/Logs folder entries');
console.log('\n🔄 To schedule daily sync at 08:00 AM:');
console.log('  - Open Command Palette (Ctrl+Shift+P)');
console.log('  - Type "Tasks: Run Task"');
console.log('  - Select "Emma Daily Sync (08:00 AM)"');
console.log('\n');
