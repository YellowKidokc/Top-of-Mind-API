/**
 * Emma Google Drive Reconfiguration Script
 * 
 * Reconfigures Emma to use ONLY ashraf.kahoush@gmail.com
 * with dedicated /AHK Profile/Emma/ folder structure
 * 
 * Usage: node reconfigure_emma_drive.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔄 Emma Google Drive Reconfiguration\n');
console.log('═'.repeat(70));
console.log('Profile: ashraf.kahoush@gmail.com');
console.log('Root Folder: /GoogleDrive/MyDrive/AHK Profile/Emma/');
console.log('═'.repeat(70) + '\n');

// Step 1: Clear cached credentials
console.log('📋 Step 1: Clearing cached credentials...');

const credentialPaths = [
  path.join(__dirname, 'server', 'integrations', 'google', 'credentials.json'),
  path.join(__dirname, 'server', 'tmp', 'oauth'),
  path.join(__dirname, '.emma_oauth_cache.json'),
  path.join(__dirname, '.google_drive_tokens.json')
];

let clearedFiles = 0;
for (const credPath of credentialPaths) {
  try {
    if (fs.existsSync(credPath)) {
      const stats = fs.statSync(credPath);
      if (stats.isDirectory()) {
        fs.rmSync(credPath, { recursive: true, force: true });
        console.log(`   ✅ Deleted directory: ${path.basename(credPath)}`);
      } else {
        fs.unlinkSync(credPath);
        console.log(`   ✅ Deleted file: ${path.basename(credPath)}`);
      }
      clearedFiles++;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not delete ${path.basename(credPath)}: ${error.message}`);
  }
}

if (clearedFiles === 0) {
  console.log('   ℹ️  No cached credentials found (clean slate)');
} else {
  console.log(`   ✅ Cleared ${clearedFiles} credential file(s)/folder(s)`);
}

// Step 2: Update Google Drive configuration
console.log('\n📋 Step 2: Updating Google Drive configuration...');

const configPath = path.join(__dirname, 'src', 'config', 'googleDriveConfig.js');
const newConfig = `/**
 * Google Drive Configuration for Emma Ecosystem
 * UPDATED: Single profile configuration (ashraf.kahoush@gmail.com)
 * Root: /GoogleDrive/MyDrive/AHK Profile/Emma/
 */

export const GOOGLE_CREDENTIALS = {
  personal: {
    client_email: "ashraf.kahoush@gmail.com",
    driveFolder: "AHK Profile",
    rootPath: "/GoogleDrive/MyDrive/AHK Profile/Emma/",
    permission: "owner",
    description: "Personal Google Drive - Primary Emma workspace"
  }
};

/**
 * Emma folder structure in /AHK Profile/Emma/
 */
export const EMMA_FOLDER_STRUCTURE = {
  root: "AHK Profile/Emma",
  subfolders: [
    {
      name: "KnowledgeBase",
      description: "Core knowledge, facts, and reference materials",
      syncFrequency: "daily",
      readWrite: true
    },
    {
      name: "Logs",
      description: "Activity logs, analysis history, and interaction records",
      syncFrequency: "hourly",
      readWrite: true
    },
    {
      name: "Dictionaries",
      description: "Terminology, acronyms, and domain-specific language",
      syncFrequency: "realtime",
      readWrite: true
    },
    {
      name: "Archives",
      description: "Historical data and deprecated materials",
      syncFrequency: "weekly",
      readWrite: true
    },
    {
      name: "Outputs",
      description: "PRIMARY OUTPUT FOLDER - Generated reports, analysis results",
      syncFrequency: "realtime",
      readWrite: true,
      primary: true
    }
  ]
};

/**
 * OAuth2 configuration for Google Drive API
 */
export const OAUTH_CONFIG = {
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ],
  redirect_uri: 'http://localhost:3333/oauth2callback'
};

/**
 * Sync settings for Emma
 */
export const SYNC_SETTINGS = {
  autoSync: true,
  syncInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'text/plain',
    'text/markdown',
    'application/json'
  ],
  excludePatterns: [
    /^~\\$/,  // Temp files
    /\\.tmp$/,
    /^\\./    // Hidden files
  ]
};

/**
 * Get environment variables for Google Drive authentication
 */
export function getGoogleEnv() {
  return {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY,
    personalRefreshToken: import.meta.env.VITE_GOOGLE_PERSONAL_REFRESH_TOKEN || process.env.GOOGLE_PERSONAL_REFRESH_TOKEN,
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  };
}
`;

try {
  fs.writeFileSync(configPath, newConfig, 'utf8');
  console.log('   ✅ Updated googleDriveConfig.js');
} catch (error) {
  console.log(`   ❌ Failed to update config: ${error.message}`);
}

// Step 3: Update .env.local comments
console.log('\n📋 Step 3: Updating .env.local configuration...');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Comment out work account lines
  envContent = envContent.replace(
    /^(# Work account.*\n.*ashraf@ahkstrategies\.net.*\n.*GOOGLE_WORK_REFRESH_TOKEN=.*)/gm,
    '# [DISABLED] Work account - Not in use\n# GOOGLE_WORK_REFRESH_TOKEN=(removed)'
  );
  
  // Add note about single profile
  if (!envContent.includes('SINGLE PROFILE MODE')) {
    envContent = `# SINGLE PROFILE MODE: ashraf.kahoosh@gmail.com ONLY\n# Root: /GoogleDrive/MyDrive/AHK Profile/Emma/\n\n` + envContent;
  }
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('   ✅ Updated .env.local (work account disabled)');
} else {
  console.log('   ⚠️  .env.local not found - manual update needed');
}

// Step 4: Create local Emma folder structure documentation
console.log('\n📋 Step 4: Documenting folder structure...');

const structureDoc = `# Emma Google Drive Folder Structure

## Configuration
- **Profile**: ashraf.kahoush@gmail.com
- **Root Path**: /GoogleDrive/MyDrive/AHK Profile/Emma/
- **Last Updated**: ${new Date().toISOString()}

## Folder Hierarchy

\`\`\`
/GoogleDrive/MyDrive/AHK Profile/
└── Emma/
    ├── KnowledgeBase/     (Core knowledge, reference materials)
    ├── Logs/              (Activity logs, interaction history)
    ├── Dictionaries/      (Terminology, acronyms, language data)
    ├── Archives/          (Historical data, deprecated materials)
    └── Outputs/           ⭐ PRIMARY OUTPUT FOLDER
        └── (Generated reports, analysis results, Emma's work products)
\`\`\`

## Folder Details

### 📚 KnowledgeBase
- **Purpose**: Core knowledge, facts, reference materials
- **Sync**: Daily
- **Permissions**: Read + Write
- **Content**: Research documents, SOPs, client data

### 📝 Logs
- **Purpose**: Activity tracking and history
- **Sync**: Hourly
- **Permissions**: Read + Write
- **Content**: Emma interaction logs, analysis history, session data

### 📖 Dictionaries
- **Purpose**: Language and terminology resources
- **Sync**: Realtime
- **Permissions**: Read + Write
- **Content**: Intent mappings, synonyms, multilingual dictionaries

### 📦 Archives
- **Purpose**: Historical data storage
- **Sync**: Weekly
- **Permissions**: Read + Write
- **Content**: Deprecated materials, old versions, backups

### ⭐ Outputs (PRIMARY)
- **Purpose**: **Main folder for Emma's generated content**
- **Sync**: Realtime
- **Permissions**: Read + Write
- **Content**: 
  - Analysis reports
  - Strategic recommendations
  - Generated summaries
  - Export files
  - All Emma work products

## Permissions
All folders have **READ + WRITE** permissions for automated sync and updates.

## Authentication
- OAuth2 via Google Cloud Console
- Refresh token stored in .env.local
- Scopes: drive, drive.file, drive.metadata.readonly

## Next Steps
1. Verify folder structure exists in Google Drive
2. Test upload to Outputs/ folder
3. Verify sync functionality
4. Monitor logs for errors
`;

const structureDocPath = path.join(__dirname, 'EMMA_DRIVE_STRUCTURE.md');
fs.writeFileSync(structureDocPath, structureDoc, 'utf8');
console.log('   ✅ Created EMMA_DRIVE_STRUCTURE.md');

// Step 5: Summary and next steps
console.log('\n' + '═'.repeat(70));
console.log('✅ Reconfiguration Complete!');
console.log('═'.repeat(70));

console.log('\n📋 What was changed:');
console.log('   ✅ Cleared cached credentials and tokens');
console.log('   ✅ Updated googleDriveConfig.js (single profile mode)');
console.log('   ✅ Disabled work account in .env.local');
console.log('   ✅ Documented new folder structure');

console.log('\n🚀 Next Steps:');
console.log('\n1️⃣  Verify Google Drive folder structure exists:');
console.log('   → Open: https://drive.google.com/drive/u/0/my-drive');
console.log('   → Navigate to: AHK Profile/Emma/');
console.log('   → Verify subfolders: KnowledgeBase, Logs, Dictionaries, Archives, Outputs');

console.log('\n2️⃣  If folders are missing, create them manually:');
console.log('   → Go to: https://drive.google.com/drive/u/0/my-drive');
console.log('   → Create: AHK Profile/ (if not exists)');
console.log('   → Inside AHK Profile/, create: Emma/');
console.log('   → Inside Emma/, create all 5 subfolders');

console.log('\n3️⃣  Test OAuth connection:');
console.log('   → Run: node setup_emma_oauth.js');
console.log('   → Follow prompts to authorize ashraf.kahoush@gmail.com');

console.log('\n4️⃣  Test file upload:');
console.log('   → Create test file: echo "Test" > test.txt');
console.log('   → Upload to Outputs/ folder');
console.log('   → Verify in Google Drive web interface');

console.log('\n5️⃣  Restart development server:');
console.log('   → Stop current dev server (Ctrl+C)');
console.log('   → Clear cache: npm run dev -- --force');
console.log('   → Monitor console for Emma Drive sync logs');

console.log('\n📖 Documentation: See EMMA_DRIVE_STRUCTURE.md for details\n');
