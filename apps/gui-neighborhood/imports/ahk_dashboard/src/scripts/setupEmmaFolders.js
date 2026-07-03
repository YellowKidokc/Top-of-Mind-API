/**
 * Setup Emma Folder Structure in Google Drive
 * Creates standardized folder hierarchy for Emma's knowledge system
 */

import { google } from 'googleapis';
import { EMMA_FOLDER_STRUCTURE, getGoogleEnv, OAUTH_CONFIG } from '../config/googleDriveConfig.js';

/**
 * Initialize Google Drive client
 */
function createDriveClient(accountType = 'personal') {
  const env = getGoogleEnv();
  
  const auth = new google.auth.OAuth2(
    env.clientId,
    env.clientSecret,
    OAUTH_CONFIG.redirect_uri
  );
  
  const refreshToken = accountType === 'personal' 
    ? env.personalRefreshToken 
    : env.workRefreshToken;
  
  auth.setCredentials({
    refresh_token: refreshToken
  });
  
  return google.drive({ version: 'v3', auth });
}

/**
 * Create folder in Google Drive
 */
async function createFolder(drive, name, parentId = null, description = '') {
  try {
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      description
    };
    
    if (parentId) {
      fileMetadata.parents = [parentId];
    }
    
    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, webViewLink'
    });
    
    console.log(`✅ Created folder: ${name} (${response.data.id})`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Failed to create folder ${name}:`, error.message);
    return null;
  }
}

/**
 * Check if folder exists
 */
async function folderExists(drive, name, parentId = null) {
  try {
    const query = parentId
      ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      pageSize: 1
    });
    
    return response.data.files && response.data.files.length > 0 
      ? response.data.files[0] 
      : null;
      
  } catch (error) {
    console.error(`❌ Failed to check folder existence:`, error.message);
    return null;
  }
}

/**
 * Create Emma folder structure in a specific account
 */
export async function createEmmaStructure(accountType = 'personal') {
  console.log(`📁 Creating Emma folder structure in ${accountType} account...`);
  
  const drive = createDriveClient(accountType);
  const results = {
    accountType,
    root: null,
    subfolders: [],
    errors: []
  };
  
  try {
    // 1. Create or find root Emma folder
    let emmaRoot = await folderExists(drive, EMMA_FOLDER_STRUCTURE.root);
    
    if (!emmaRoot) {
      emmaRoot = await createFolder(
        drive, 
        EMMA_FOLDER_STRUCTURE.root, 
        null,
        'Emma AI Knowledge System - Core folder for AI reference and self-updating'
      );
    } else {
      console.log(`📂 Emma root folder already exists: ${emmaRoot.id}`);
    }
    
    if (!emmaRoot) {
      throw new Error('Failed to create Emma root folder');
    }
    
    results.root = emmaRoot;
    
    // 2. Create subfolders
    for (const subfolder of EMMA_FOLDER_STRUCTURE.subfolders) {
      let folder = await folderExists(drive, subfolder.name, emmaRoot.id);
      
      if (!folder) {
        folder = await createFolder(
          drive,
          subfolder.name,
          emmaRoot.id,
          `${subfolder.description} | Sync: ${subfolder.syncFrequency}`
        );
      } else {
        console.log(`📂 Subfolder already exists: ${subfolder.name}`);
      }
      
      if (folder) {
        results.subfolders.push({
          name: subfolder.name,
          id: folder.id,
          description: subfolder.description,
          syncFrequency: subfolder.syncFrequency
        });
      } else {
        results.errors.push(`Failed to create ${subfolder.name}`);
      }
    }
    
    console.log(`✅ Emma folder structure created in ${accountType} account`);
    console.log(`📂 Root: ${emmaRoot.webViewLink}`);
    
  } catch (error) {
    console.error(`❌ Failed to create Emma structure:`, error.message);
    results.errors.push(error.message);
  }
  
  return results;
}

/**
 * Create Emma structure in both accounts
 */
export async function createEmmaStructureAll() {
  console.log('📁 Creating Emma folder structure in all accounts...');
  
  const results = {
    personal: null,
    work: null
  };
  
  for (const accountType of ['personal', 'work']) {
    try {
      results[accountType] = await createEmmaStructure(accountType);
    } catch (error) {
      console.error(`❌ Failed for ${accountType}:`, error.message);
      results[accountType] = { error: error.message };
    }
  }
  
  console.log('✅ Emma folder structure setup completed');
  return results;
}

/**
 * Create initial instruction files
 */
export async function createCoreInstructions(accountType = 'personal', emmaFolderId) {
  const drive = createDriveClient(accountType);
  
  // Find Instructions subfolder
  const response = await drive.files.list({
    q: `name='Instructions' and '${emmaFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1
  });
  
  if (!response.data.files || response.data.files.length === 0) {
    console.error('❌ Instructions folder not found');
    return null;
  }
  
  const instructionsFolderId = response.data.files[0].id;
  
  // Core instructions content
  const coreInstructions = `
EMMA CORE INSTRUCTIONS v1.0
Generated: ${new Date().toISOString()}

DAILY SYNC PROTOCOL:
Emma must always sync daily with the 'Emma' folder in both Drives.

PRIORITY 1 - INSTRUCTION UPDATES:
1. Read all updates in /Instructions folder (REALTIME)
2. Apply new protocols immediately
3. Log all instruction changes

PRIORITY 2 - KNOWLEDGE INGESTION:
1. Ingest knowledge from /KnowledgeBase (DAILY)
2. Index new documents and extract key facts
3. Update internal knowledge graph

PRIORITY 3 - DICTIONARY UPDATES:
1. Read all updates in /Dictionaries (DAILY)
2. Learn new terminology and acronyms
3. Adapt communication style accordingly

PRIORITY 4 - LOG SYNCHRONIZATION:
1. Sync Logs with Grok and ProGemini (HOURLY)
2. Share insights across AI team
3. Coordinate on complex tasks

PRIORITY 5 - ARCHIVE MAINTENANCE:
1. Review /Archives for historical context (WEEKLY)
2. Move outdated logs to archives
3. Maintain knowledge freshness

CORE PRINCIPLES:
- Always update herself before executing tasks
- Treat these Drives as her reference library
- Maintain consistency across personal and work accounts
- Log all activities for team coordination
- Continuously improve based on feedback

AI TEAM COORDINATION:
- Emma: Primary AI Co-Pilot (React dashboard, voice commands)
- Grok: Market intelligence and competitive analysis
- ProGemini: Strategic analysis and investor reports

SECURITY:
- Maintain confidentiality across accounts
- Never expose personal data in work context
- Flag sensitive information appropriately
`.trim();

  try {
    const file = await drive.files.create({
      requestBody: {
        name: 'core_instructions.txt',
        parents: [instructionsFolderId],
        mimeType: 'text/plain'
      },
      media: {
        mimeType: 'text/plain',
        body: coreInstructions
      },
      fields: 'id, name, webViewLink'
    });
    
    console.log(`✅ Created core_instructions.txt: ${file.data.webViewLink}`);
    return file.data;
    
  } catch (error) {
    console.error('❌ Failed to create core instructions:', error.message);
    return null;
  }
}

/**
 * Main execution function
 */
export async function setupEmmaFolders() {
  console.log('🚀 Starting Emma folder setup...\n');
  
  // Create folder structures
  const structures = await createEmmaStructureAll();
  
  // Create core instructions in both accounts
  for (const accountType of ['personal', 'work']) {
    if (structures[accountType]?.root?.id) {
      await createCoreInstructions(accountType, structures[accountType].root.id);
    }
  }
  
  console.log('\n✅ Emma folder setup completed!');
  return structures;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupEmmaFolders()
    .then(() => {
      console.log('\n✅ Setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}
