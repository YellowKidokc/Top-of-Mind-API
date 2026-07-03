// Emma Drive Sync Script
// Syncs local Emma/ directory to Google Drive, removes duplicates
// Usage: node src/scripts/emma_drive_sync.js

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const LOCAL_EMMA_PATH = path.resolve('Emma');
const DRIVE_EMMA_FOLDER_NAME = 'Emma';

// Google Drive setup
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_PERSONAL_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth });

// Helper: List all files/folders in Drive Emma folder
async function listDriveEmmaContents() {
  const res = await drive.files.list({
    q: `name='${DRIVE_EMMA_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  if (!res.data.files.length) throw new Error('Emma folder not found in Drive');
  const emmaFolderId = res.data.files[0].id;
  const contents = await drive.files.list({
    q: `'${emmaFolderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType)',
    spaces: 'drive',
  });
  return { emmaFolderId, files: contents.data.files };
}

// Helper: Upload missing files/folders
async function uploadMissing(localPath, emmaFolderId, driveFiles) {
  const localItems = fs.readdirSync(localPath);
  for (const item of localItems) {
    const itemPath = path.join(localPath, item);
    const exists = driveFiles.some(f => f.name === item);
    if (!exists) {
      if (fs.lstatSync(itemPath).isDirectory()) {
        // Create folder in Drive
        const folderRes = await drive.files.create({
          resource: {
            name: item,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [emmaFolderId],
          },
        });
        console.log(`✅ Created folder: ${item}`);
        // Recursively upload contents
        await uploadMissing(itemPath, folderRes.data.id, []);
      } else {
        // Upload file
        await drive.files.create({
          resource: {
            name: item,
            parents: [emmaFolderId],
          },
          media: {
            body: fs.createReadStream(itemPath),
          },
        });
        console.log(`✅ Uploaded file: ${item}`);
      }
    }
  }
}

// Helper: Delete duplicate Emma folders in Drive
async function deleteDuplicateEmmaFolders() {
  const res = await drive.files.list({
    q: `name='${DRIVE_EMMA_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  if (res.data.files.length > 1) {
    // Keep the first, delete the rest
    for (let i = 1; i < res.data.files.length; i++) {
      await drive.files.delete({ fileId: res.data.files[i].id });
      console.log(`🗑️ Deleted duplicate Emma folder: ${res.data.files[i].id}`);
    }
  }
}

// Main sync function
async function syncEmmaDrive() {
  try {
    console.log('🔍 Scanning Google Drive Emma folder...');
    await deleteDuplicateEmmaFolders();
    const { emmaFolderId, files: driveFiles } = await listDriveEmmaContents();
    console.log('🔍 Scanning local Emma directory...');
    await uploadMissing(LOCAL_EMMA_PATH, emmaFolderId, driveFiles);
    console.log('✅ Emma Drive sync complete!');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  }
}

syncEmmaDrive();
