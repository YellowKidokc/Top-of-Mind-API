// server/googleDrive.js
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_DRIVE_ROOT_NAME = 'AHK Profile',
  GOOGLE_DRIVE_EMMA_FOLDER = 'Emma',
  GOOGLE_DRIVE_OUTPUTS_FOLDER = 'Outputs',
} = process.env;

function getOAuth2() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google OAuth env vars missing');
  }
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

// Find folder by name within a parent (or root when parentId = 'root')
async function findOrCreateFolder(name, parentId = 'root') {
  const drive = driveClient();
  const q = [
    `mimeType = 'application/vnd.google-apps.folder'`,
    `'${parentId}' in parents`,
    `name = '${name.replace(/'/g, "\\'")}'`,
    `trashed = false`,
  ].join(' and ');

  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
    pageSize: 1,
  });

  if (res.data.files?.length) {
    return res.data.files[0].id;
  }

  const createRes = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, name',
  });

  return createRes.data.id;
}

// Knowledge base now unified under server/Emma_KnowledgeBase
async function resolveOutputsFolderId() {
  // Start at My Drive root
  let parentId = 'root';

  const rootId = await findOrCreateFolder(GOOGLE_DRIVE_ROOT_NAME, parentId);
  const emmaId = await findOrCreateFolder(GOOGLE_DRIVE_EMMA_FOLDER, rootId);
  const outputsId = await findOrCreateFolder(GOOGLE_DRIVE_OUTPUTS_FOLDER, emmaId);

  return outputsId;
}

// Upload a file from local path into Outputs
export async function uploadReportToDrive(localFilePath) {
  const drive = driveClient();
  const outputsId = await resolveOutputsFolderId();

  const fileName = path.basename(localFilePath);

  const fileMetadata = {
    name: fileName,
    parents: [outputsId],
  };

  const media = {
    mimeType: 'text/markdown',
    body: fs.createReadStream(localFilePath),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink, webContentLink',
  });

  return res.data; // { id, name, webViewLink, webContentLink }
}

// Optional: list what's in Outputs (for diagnostics)
export async function listOutputs(limit = 20) {
  const drive = driveClient();
  const outputsId = await resolveOutputsFolderId();
  const res = await drive.files.list({
    q: `'${outputsId}' in parents and trashed = false`,
    orderBy: 'modifiedTime desc',
    fields: 'files(id, name, modifiedTime, webViewLink)',
    pageSize: limit,
  });
  return res.data.files || [];
}

// Default export for drive instance
export default google.drive({ version: 'v3', auth: getOAuth2() });
