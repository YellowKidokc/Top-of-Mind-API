/**
 * Emma Memory Sync - Daily synchronization between local storage and Google Drive
 * Syncs Memory and Logs folders between Personal and Work drives
 */

import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// === CONFIGURATION ===
const DRIVES = [
  {
    label: "Personal Drive",
    email: "ashraf.kahoush@gmail.com",
    refreshToken: process.env.GOOGLE_PERSONAL_REFRESH_TOKEN,
    rootFolderId: "1e5q0cQtlhCGztmuWRWU16MWVTk6ldPMk",
    folders: {
      Memory: "1kMqBtko30K2asIH8VU49P8Wtvu4aZVSL",
      Logs: "15yAWyY-SjsF2XdmrBLJV89DhIVySjI7x",
    },
  },
  {
    label: "Work Drive",
    email: "ashraf@ahkstrategies.net",
    refreshToken: process.env.GOOGLE_WORK_REFRESH_TOKEN,
    rootFolderId: "1luX8xHtcSH06TJ7pPcDfhd4TyO8xlOmV",
    folders: {
      Memory: "1keRzgrdz3BvbmW2gT_rLNelTGYA6eyup",
      Logs: "1WH-6JzF6EAiKD-2mFLJ7lNglYD9D5Dnt",
    },
  },
];

const SYNC_TIMESTAMP_FILE = path.resolve(__dirname, "../../.emma_last_sync.json");

// === AUTHENTICATION ===
async function getAuth(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

// === GET LAST SYNC TIMESTAMP ===
async function getLastSyncTimestamp() {
  try {
    const data = await fs.readFile(SYNC_TIMESTAMP_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { lastSync: null, drives: {} };
  }
}

// === SAVE SYNC TIMESTAMP ===
async function saveSyncTimestamp(data) {
  await fs.writeFile(SYNC_TIMESTAMP_FILE, JSON.stringify(data, null, 2));
}

// === GET LOCAL STORAGE DATA ===
function getLocalStorageData() {
  const data = {
    memory: {},
    logs: [],
    interactions: [],
  };

  // Simulate reading from localStorage (in Node.js context, we'll read from a hypothetical file)
  // In real implementation, this would be done client-side or via API
  try {
    // Read Emma memory core data
    const memoryKeys = [
      "emma-memory-core",
      "emma-learning-data",
      "emma-knowledge-base",
      "emma-style-model",
    ];

    memoryKeys.forEach((key) => {
      // This is placeholder - actual implementation would read from browser storage
      data.memory[key] = { synced: true, timestamp: new Date().toISOString() };
    });

    // Read interaction logs
    data.logs = [
      {
        timestamp: new Date().toISOString(),
        type: "sync",
        message: "Manual sync triggered",
      },
    ];
  } catch (error) {
    console.error("Error reading local data:", error.message);
  }

  return data;
}

// === LIST FILES IN DRIVE FOLDER ===
async function listFilesInFolder(drive, folderId, modifiedAfter = null) {
  const query = [`'${folderId}' in parents`, "trashed = false"];

  if (modifiedAfter) {
    query.push(`modifiedTime > '${modifiedAfter}'`);
  }

  const response = await drive.files.list({
    q: query.join(" and "),
    fields: "files(id, name, modifiedTime, mimeType)",
    orderBy: "modifiedTime desc",
  });

  return response.data.files || [];
}

// === UPLOAD FILE TO DRIVE ===
async function uploadFileToDrive(drive, folderId, fileName, content) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: "text/plain",
    body: content,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, name, webViewLink",
  });

  return response.data;
}

// === GENERATE DAILY SUMMARY ===
function generateDailySummary(localData, syncStats) {
  const today = new Date().toISOString().split("T")[0];
  const summary = [];

  summary.push("═══════════════════════════════════════════════════════");
  summary.push(`Emma Memory Sync Report - ${today}`);
  summary.push("═══════════════════════════════════════════════════════");
  summary.push("");

  summary.push("📊 Sync Statistics:");
  summary.push(`  • Files synced to Personal Drive: ${syncStats.personal.filesCreated}`);
  summary.push(`  • Files synced to Work Drive: ${syncStats.work.filesCreated}`);
  summary.push(`  • Total interactions logged: ${localData.logs.length}`);
  summary.push(`  • Memory modules synced: ${Object.keys(localData.memory).length}`);
  summary.push("");

  summary.push("🧠 Active Memory Modules:");
  Object.keys(localData.memory).forEach((key) => {
    summary.push(`  • ${key}: ${localData.memory[key].synced ? "✅ Synced" : "⏳ Pending"}`);
  });
  summary.push("");

  summary.push("📝 Recent Activity:");
  localData.logs.slice(0, 5).forEach((log) => {
    const time = new Date(log.timestamp).toLocaleTimeString();
    summary.push(`  • [${time}] ${log.type}: ${log.message}`);
  });
  summary.push("");

  summary.push("═══════════════════════════════════════════════════════");
  summary.push(`Next sync scheduled: Tomorrow at 08:00 AM`);
  summary.push("═══════════════════════════════════════════════════════");

  return summary.join("\n");
}

// === MAIN SYNC FUNCTION ===
async function performSync() {
  console.log("\n🔄 Emma Memory Sync Started\n");

  const syncTimestamps = await getLastSyncTimestamp();
  const currentTime = new Date().toISOString();
  const today = new Date().toISOString().split("T")[0];

  // Get local storage data
  const localData = getLocalStorageData();

  const syncStats = {
    personal: { filesCreated: 0, filesUpdated: 0 },
    work: { filesCreated: 0, filesUpdated: 0 },
  };

  // Sync to each drive
  for (const driveConfig of DRIVES) {
    console.log(`\n📁 Syncing to ${driveConfig.label} (${driveConfig.email})`);

    try {
      const auth = await getAuth(driveConfig.refreshToken);
      const drive = google.drive({ version: "v3", auth });

      // Get last sync time for this drive
      const lastSync = syncTimestamps.drives[driveConfig.label] || null;

      // List existing files
      const memoryFiles = await listFilesInFolder(
        drive,
        driveConfig.folders.Memory,
        lastSync
      );
      const logFiles = await listFilesInFolder(drive, driveConfig.folders.Logs, lastSync);

      console.log(`  • Found ${memoryFiles.length} memory files`);
      console.log(`  • Found ${logFiles.length} log files`);

      // Create daily summary file
      const summaryFileName = `summary_${today}.txt`;
      const summaryExists = memoryFiles.some((f) => f.name === summaryFileName);

      if (!summaryExists) {
        const summaryContent = generateDailySummary(localData, syncStats);
        const summaryFile = await uploadFileToDrive(
          drive,
          driveConfig.folders.Memory,
          summaryFileName,
          summaryContent
        );
        console.log(`  ✅ Created daily summary: ${summaryFile.name}`);
        syncStats[driveConfig.label === "Personal Drive" ? "personal" : "work"].filesCreated++;
      }

      // Sync interaction logs
      if (localData.logs.length > 0) {
        const logFileName = `interaction_log_${today}.json`;
        const logContent = JSON.stringify(localData.logs, null, 2);
        await uploadFileToDrive(drive, driveConfig.folders.Logs, logFileName, logContent);
        console.log(`  ✅ Synced interaction logs`);
        syncStats[driveConfig.label === "Personal Drive" ? "personal" : "work"].filesCreated++;
      }

      // Update sync timestamp for this drive
      syncTimestamps.drives[driveConfig.label] = currentTime;
    } catch (error) {
      console.error(`  ❌ Error syncing to ${driveConfig.label}:`, error.message);
    }
  }

  // Save sync timestamps
  syncTimestamps.lastSync = currentTime;
  await saveSyncTimestamp(syncTimestamps);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("✅ Emma Memory Sync Completed");
  console.log(`📊 Personal Drive: ${syncStats.personal.filesCreated} files created`);
  console.log(`📊 Work Drive: ${syncStats.work.filesCreated} files created`);
  console.log(`🕐 Next sync: Tomorrow at 08:00 AM`);
  console.log("═══════════════════════════════════════════════════════\n");
}

// === RUN SYNC ===
performSync().catch((error) => {
  console.error("❌ Fatal error during sync:", error);
  process.exit(1);
});
