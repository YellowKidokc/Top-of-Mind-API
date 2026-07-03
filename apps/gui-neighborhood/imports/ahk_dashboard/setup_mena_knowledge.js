// setup_mena_knowledge.js
// Creates proper Google Drive folder structure and uploads MENA Horizon 2030 master document
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error('❌ Missing Google OAuth credentials in .env.local');
  process.exit(1);
}

// Initialize OAuth2 client
function getOAuth2() {
  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return oAuth2Client;
}

function driveClient() {
  return google.drive({ version: 'v3', auth: getOAuth2() });
}

// Find or create folder
async function findOrCreateFolder(name, parentId = 'root') {
  const drive = driveClient();
  
  // Search for existing folder
  const q = [
    `mimeType = 'application/vnd.google-apps.folder'`,
    `'${parentId}' in parents`,
    `name = '${name.replace(/'/g, "\\'")}'`,
    `trashed = false`,
  ].join(' and ');

  const searchRes = await drive.files.list({
    q,
    fields: 'files(id, name)',
    pageSize: 1,
  });

  if (searchRes.data.files?.length) {
    console.log(`✅ Found existing folder: ${name} (${searchRes.data.files[0].id})`);
    return searchRes.data.files[0].id;
  }

  // Create folder if it doesn't exist
  const createRes = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, name',
  });

  console.log(`📁 Created folder: ${name} (${createRes.data.id})`);
  return createRes.data.id;
}

// Create full folder path
async function createFolderPath() {
  console.log('\n🔨 Creating folder structure...\n');
  
  // Start at My Drive root
  let parentId = 'root';
  
  // /AHK Profile
  const ahkProfileId = await findOrCreateFolder('AHK Profile', parentId);
  
  // /AHK Profile/Emma
  const emmaId = await findOrCreateFolder('Emma', ahkProfileId);
  
  // /AHK Profile/Emma/KnowledgeBase
  const knowledgeBaseId = await findOrCreateFolder('KnowledgeBase', emmaId);
  
  // /AHK Profile/Emma/KnowledgeBase/Research
  const researchId = await findOrCreateFolder('Research', knowledgeBaseId);
  
  // /AHK Profile/Emma/KnowledgeBase/Research/MENA_Horizon_2030
  const menaId = await findOrCreateFolder('MENA_Horizon_2030', researchId);
  
  console.log('\n✅ Folder structure complete!');
  console.log(`📂 Target folder ID: ${menaId}`);
  
  return menaId;
}

// Upload document
async function uploadDocument(targetFolderId) {
  const drive = driveClient();
  
  // Local file path
  const localPath = 'C:\\Users\\ashra\\OneDrive\\Desktop\\AHK Profile\\AHK Researches & Market Studies\\Market researches\\MENA HORIZON 2030\\MENA Horizon 2030.docx';
  
  if (!fs.existsSync(localPath)) {
    console.error(`❌ Source file not found: ${localPath}`);
    process.exit(1);
  }
  
  console.log('\n📤 Uploading master document...');
  console.log(`Source: ${localPath}`);
  
  const targetFileName = 'mena_horizon_2030.docx';
  
  // Check if file already exists
  const q = [
    `'${targetFolderId}' in parents`,
    `name = '${targetFileName}'`,
    `trashed = false`,
  ].join(' and ');
  
  const existingFiles = await drive.files.list({
    q,
    fields: 'files(id, name, webViewLink)',
    pageSize: 1,
  });
  
  if (existingFiles.data.files?.length) {
    const existing = existingFiles.data.files[0];
    console.log(`\n⚠️  File already exists!`);
    console.log(`   Name: ${existing.name}`);
    console.log(`   ID: ${existing.id}`);
    console.log(`   Link: ${existing.webViewLink}`);
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('\nReplace existing file? (y/n): ', async (answer) => {
        rl.close();
        
        if (answer.toLowerCase() !== 'y') {
          console.log('✅ Using existing file');
          resolve(existing);
          return;
        }
        
        // Delete old file
        await drive.files.delete({ fileId: existing.id });
        console.log('🗑️  Deleted old file');
        
        // Upload new file
        const uploaded = await uploadNewFile(drive, targetFolderId, targetFileName, localPath);
        resolve(uploaded);
      });
    });
  }
  
  // Upload new file
  const uploaded = await uploadNewFile(drive, targetFolderId, targetFileName, localPath);
  return uploaded;
}

async function uploadNewFile(drive, folderId, fileName, localPath) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  
  const media = {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    body: fs.createReadStream(localPath),
  };
  
  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink, webContentLink, size',
  });
  
  console.log('\n✅ Upload successful!');
  console.log(`   Name: ${res.data.name}`);
  console.log(`   ID: ${res.data.id}`);
  console.log(`   Size: ${(res.data.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Link: ${res.data.webViewLink}`);
  
  return res.data;
}

// Verify access
async function verifyAccess(fileId) {
  const drive = driveClient();
  
  console.log('\n🔍 Verifying access...');
  
  try {
    const res = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, permissions',
    });
    
    console.log('\n✅ File is accessible');
    console.log(`   Created: ${new Date(res.data.createdTime).toLocaleString()}`);
    console.log(`   Modified: ${new Date(res.data.modifiedTime).toLocaleString()}`);
    
    return true;
  } catch (err) {
    console.error('❌ Access verification failed:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  try {
    console.log('\n🚀 MENA Horizon 2030 Knowledge Base Setup');
    console.log('==========================================\n');
    
    // Step 1: Create folder structure
    const targetFolderId = await createFolderPath();
    
    // Step 2: Upload document
    const uploadedFile = await uploadDocument(targetFolderId);
    
    // Step 3: Verify access
    const accessible = await verifyAccess(uploadedFile.id);
    
    // Final summary
    console.log('\n==========================================');
    console.log('📊 SETUP COMPLETE');
    console.log('==========================================\n');
    console.log('✅ Folder exists: My Drive/AHK Profile/Emma/KnowledgeBase/Research/MENA_Horizon_2030');
    console.log(`✅ File uploaded: ${uploadedFile.name}`);
    console.log(`✅ File ID: ${uploadedFile.id}`);
    console.log(`✅ Access verified: ${accessible ? 'YES' : 'NO'}`);
    console.log('✅ No duplication detected\n');
    
    console.log('🔗 Google Drive Link:');
    console.log(uploadedFile.webViewLink);
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
