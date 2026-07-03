/**
 * Google Drive Linker for Emma Ecosystem
 * Links both personal and business Google Drives to Emma's knowledge system
 */

import { google } from 'googleapis';
import { GOOGLE_CREDENTIALS, OAUTH_CONFIG, getGoogleEnv } from '../config/googleDriveConfig.js';

/**
 * Initialize Google Drive API client
 */
function createDriveClient(accountType = 'personal') {
  const env = getGoogleEnv();
  
  // For Node.js environment (server-side)
  if (typeof window === 'undefined') {
    const auth = new google.auth.OAuth2(
      env.clientId,
      env.clientSecret,
      OAUTH_CONFIG.redirectUri
    );
    
    // Set refresh token based on account type
    const refreshToken = accountType === 'personal' 
      ? env.personalRefreshToken 
      : env.workRefreshToken;
    
    auth.setCredentials({
      refresh_token: refreshToken
    });
    
    return google.drive({ version: 'v3', auth });
  }
  
  // For browser environment (client-side)
  console.warn('Google Drive API requires server-side execution');
  return null;
}

/**
 * Link personal drive (ashraf.kahoush@gmail.com)
 */
export async function linkDrives() {
  console.log('🔗 Starting Google Drive linking process...');
  console.log('📧 Profile: ashraf.kahoush@gmail.com');
  
  const results = [];
  const config = GOOGLE_CREDENTIALS.personal;
  
  try {
    console.log(`🔗 Linking Personal Drive (${config.client_email})...`);
    
    const drive = createDriveClient('personal');
    
    if (!drive) {
      console.warn('⚠️ Skipping - requires server environment');
      return results;
    }
    
    // Test connection by listing root files
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)',
      q: "name='Emma' and mimeType='application/vnd.google-apps.folder'"
    });
    
    const result = {
      label: 'Personal',
      email: config.client_email,
      connected: true,
      emmaFolderExists: response.data.files && response.data.files.length > 0,
      emmaFolderId: response.data.files?.[0]?.id || null
    };
    
    results.push(result);
    console.log(`✅ Personal Drive linked successfully`);
    console.log(`✅ Connected as: ${config.client_email}`);
    
  } catch (error) {
    console.error(`❌ Failed to link Personal Drive:`, error.message);
    results.push({
      label: 'Personal',
      email: config.client_email,
      connected: false,
      error: error.message
    });
  }
  
  console.log('✅ Drive linking process completed');
  return results;
}

/**
 * Grant permissions to Emma folder
 */
export async function grantEmmaAccess(folderId, accountType = 'personal') {
  const drive = createDriveClient(accountType);
  const config = GOOGLE_CREDENTIALS[accountType];
  
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: config.permission,
        type: 'user',
        emailAddress: config.client_email
      }
    });
    
    console.log(`✅ Granted ${config.permission} access to ${config.client_email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to grant access:', error.message);
    return false;
  }
}

/**
 * Search for Emma folder across drives
 */
export async function findEmmaFolder(accountType = 'personal') {
  const drive = createDriveClient(accountType);
  
  try {
    const response = await drive.files.list({
      q: "name='Emma' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name, parents, createdTime, modifiedTime)',
      pageSize: 10
    });
    
    return response.data.files || [];
  } catch (error) {
    console.error('❌ Failed to search for Emma folder:', error.message);
    return [];
  }
}

/**
 * List files in Emma folder
 */
export async function listEmmaFiles(folderId, accountType = 'personal') {
  const drive = createDriveClient(accountType);
  
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 100
    });
    
    return response.data.files || [];
  } catch (error) {
    console.error('❌ Failed to list Emma files:', error.message);
    return [];
  }
}

/**
 * Download file content from Drive
 */
export async function downloadFile(fileId, accountType = 'personal') {
  const drive = createDriveClient(accountType);
  
  try {
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to download file:', error.message);
    return null;
  }
}

/**
 * Upload file to Emma folder
 */
export async function uploadToEmma(fileName, content, folderId, accountType = 'personal') {
  const drive = createDriveClient(accountType);
  
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType: 'text/plain',
        body: content
      },
      fields: 'id, name, webViewLink'
    });
    
    console.log(`✅ Uploaded ${fileName} to Emma folder`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to upload file:', error.message);
    return null;
  }
}

/**
 * Sync Emma's knowledge base from Drive
 */
export async function syncEmmaKnowledge() {
  console.log('🔄 Starting Emma knowledge sync...');
  console.log('📧 Profile: ashraf.kahoush@gmail.com');
  
  const syncResults = {
    personal: { files: 0, folders: 0, errors: [] }
  };
  
  try {
    const emmaFolders = await findEmmaFolder('personal');
    
    if (emmaFolders.length === 0) {
      console.warn('⚠️ No Emma folder found in personal account');
      return syncResults;
    }
    
    const emmaFolder = emmaFolders[0];
    const files = await listEmmaFiles(emmaFolder.id, 'personal');
    
    syncResults.personal.files = files.length;
    syncResults.personal.folders = emmaFolders.length;
    
    console.log(`📂 Found ${files.length} files in Emma folder`);
    
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    syncResults.personal.errors.push(error.message);
  }
  
  console.log('✅ Emma knowledge sync completed');
  return syncResults;
}

/**
 * Get drive connection status
 */
export async function getDriveStatus() {
  const status = {
    personal: { connected: false, emmaFolder: null, email: 'ashraf.kahoush@gmail.com' }
  };
  
  try {
    const folders = await findEmmaFolder('personal');
    status.personal.connected = true;
    status.personal.emmaFolder = folders.length > 0 ? folders[0] : null;
    console.log('✅ Connected to Google Drive as: ashraf.kahoush@gmail.com');
  } catch (error) {
    status.personal.error = error.message;
    console.error('❌ Drive connection error:', error.message);
  }
  
  return status;
}

/**
 * Generate OAuth2 authorization URL
 * Used by backend server to redirect user to Google consent screen
 */
export async function getAuthURL() {
  const env = getGoogleEnv();
  const oauth2Client = new google.auth.OAuth2(
    env.clientId,
    env.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_CONFIG.scopes,
    prompt: 'consent' // Force consent screen to ensure refresh token
  });
  
  console.log('🔗 Generated OAuth URL');
  return authUrl;
}

/**
 * Handle OAuth2 callback and exchange code for tokens
 * Used by backend server to process redirect from Google
 */
export async function handleCallback(code) {
  const env = getGoogleEnv();
  const oauth2Client = new google.auth.OAuth2(
    env.clientId,
    env.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
  
  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info to verify profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    console.log(`✅ OAuth successful for: ${userInfo.data.email}`);
    
    return {
      success: true,
      email: userInfo.data.email,
      tokens: tokens,
      message: `Connected to Google Drive as ${userInfo.data.email}`
    };
  } catch (error) {
    console.error('❌ OAuth callback error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Trigger Google Drive sync operation
 * Wrapper around syncEmmaKnowledge for backend server
 */
export async function syncDrives() {
  console.log('🔄 Backend triggered Drive sync');
  const results = await syncEmmaKnowledge();
  return {
    success: true,
    results: results,
    timestamp: new Date().toISOString()
  };
}
