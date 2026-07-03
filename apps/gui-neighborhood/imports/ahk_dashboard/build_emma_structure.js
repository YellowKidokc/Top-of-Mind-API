// build_emma_structure.js
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// === CONFIGURATION ===
const DRIVES = [
  {
    label: "Personal Drive",
    email: "ashraf.kahoush@gmail.com",
    refreshToken: process.env.GOOGLE_PERSONAL_REFRESH_TOKEN,
  },
  {
    label: "Work Drive",
    email: "ashraf@ahkstrategies.net",
    refreshToken: process.env.GOOGLE_WORK_REFRESH_TOKEN,
  },
];

const EMMA_FOLDERS = [
  "KnowledgeBase",
  "Instructions",
  "Dictionaries",
  "Memory",
  "Logs",
  "Archives",
  "Integrations",
];

// === AUTHENTICATION FUNCTION ===
async function getAuth(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

// === CREATE EMMA ROOT AND SUBFOLDERS ===
async function createEmmaTree(drive, driveLabel) {
  console.log(`\n⚙️  Setting up Emma structure for ${driveLabel}`);

  // Create root folder
  const root = await drive.files.create({
    requestBody: { name: "Emma", mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  const rootId = root.data.id;
  console.log(`📁 Created root folder 'Emma' (${rootId})`);

  // Create subfolders
  for (const name of EMMA_FOLDERS) {
    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootId],
      },
      fields: "id",
    });
    console.log(`  └─ 📄 ${name} (${res.data.id})`);
  }
}

// === MAIN SCRIPT ===
(async () => {
  try {
    for (const drv of DRIVES) {
      console.log(`\n🔗 Linking ${drv.label} (${drv.email})`);
      const auth = await getAuth(drv.refreshToken);
      const drive = google.drive({ version: "v3", auth });
      await createEmmaTree(drive, drv.label);
    }
    console.log("\n✅ Emma directory structure created successfully in both Drives!");
  } catch (err) {
    console.error("❌ Error building Emma structure:", err.message);
  }
})();
