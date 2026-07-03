/**
 * Clean OAuth Tokens and Cache
 * Removes all cached Google Drive authentication data
 * 
 * Usage: node clean_oauth_cache.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧹 Cleaning OAuth Tokens and Cache\n');
console.log('═'.repeat(70));

const pathsToClean = [
  // Server-side token storage
  path.join(__dirname, 'server', 'tokens'),
  path.join(__dirname, 'server', 'auth', 'google'),
  path.join(__dirname, 'server', 'integrations', 'google', 'credentials.json'),
  path.join(__dirname, 'server', 'tmp', 'oauth'),
  
  // Root-level credential files
  path.join(__dirname, '.credentials'),
  path.join(__dirname, '.tokens'),
  path.join(__dirname, 'google_token.json'),
  path.join(__dirname, 'credentials.json'),
  path.join(__dirname, 'token.json'),
  path.join(__dirname, 'drive_oauth.json'),
  path.join(__dirname, '.emma_oauth_cache.json'),
  path.join(__dirname, '.google_drive_tokens.json'),
  
  // Node modules cache (optional - commented out)
  // path.join(__dirname, 'node_modules', '.vite'),
  // path.join(__dirname, 'node_modules', '.cache'),
];

let cleanedCount = 0;
let notFoundCount = 0;

console.log('📋 Searching for OAuth tokens and cached credentials...\n');

for (const targetPath of pathsToClean) {
  const relativePath = path.relative(__dirname, targetPath);
  
  try {
    if (!fs.existsSync(targetPath)) {
      console.log(`   ⚪ Not found: ${relativePath}`);
      notFoundCount++;
      continue;
    }
    
    const stats = fs.statSync(targetPath);
    
    if (stats.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`   ✅ Deleted directory: ${relativePath}`);
      cleanedCount++;
    } else {
      fs.unlinkSync(targetPath);
      console.log(`   ✅ Deleted file: ${relativePath}`);
      cleanedCount++;
    }
  } catch (error) {
    console.log(`   ❌ Could not delete ${relativePath}: ${error.message}`);
  }
}

console.log('\n' + '═'.repeat(70));
console.log('📊 Cleanup Summary');
console.log('═'.repeat(70));
console.log(`   ✅ Deleted: ${cleanedCount} item(s)`);
console.log(`   ⚪ Not found: ${notFoundCount} item(s)`);

if (cleanedCount === 0) {
  console.log('\n✨ No cached OAuth data found - clean slate!');
} else {
  console.log(`\n✅ Successfully cleaned ${cleanedCount} OAuth file(s)/folder(s)`);
}

// Clean localStorage simulation file if exists
const storageSimPath = path.join(__dirname, 'localStorage.json');
if (fs.existsSync(storageSimPath)) {
  try {
    const storageData = JSON.parse(fs.readFileSync(storageSimPath, 'utf8'));
    const keysToRemove = Object.keys(storageData).filter(key => 
      key.includes('google') || 
      key.includes('drive') || 
      key.includes('oauth') ||
      key.includes('token')
    );
    
    if (keysToRemove.length > 0) {
      keysToRemove.forEach(key => delete storageData[key]);
      fs.writeFileSync(storageSimPath, JSON.stringify(storageData, null, 2));
      console.log(`\n✅ Cleaned ${keysToRemove.length} keys from localStorage simulation`);
    }
  } catch (error) {
    console.log(`\n⚠️  Could not clean localStorage simulation: ${error.message}`);
  }
}

console.log('\n' + '═'.repeat(70));
console.log('🚀 Next Steps');
console.log('═'.repeat(70));
console.log('\n1. Restart development server:');
console.log('   npm run dev -- --force\n');
console.log('2. When prompted, authorize with:');
console.log('   ✅ ashraf.kahoush@gmail.com\n');
console.log('3. Verify connection in dashboard:');
console.log('   Look for: "Connected to Google Drive as: ashraf.kahoush@gmail.com"\n');

console.log('📖 OAuth tokens have been cleared.');
console.log('   Next authentication will request fresh authorization.\n');
