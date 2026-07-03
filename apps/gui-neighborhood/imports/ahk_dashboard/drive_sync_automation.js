/**
 * Drive Sync Automation Script
 * Scheduled hourly sync between local KB and Google Drive
 * Auto-generates DriveSync_Log_YYYY-MM-DD.md
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { uploadReportToDrive } from './server/googleDrive.js';
import kbRouter from './server/config/kbRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, 'server/Emma_KnowledgeBase/Logs');
const SYNC_INTERVAL = '0 * * * *'; // Every hour at minute 0

// ==================== SYNC STATISTICS ====================

const stats = {
  lastSync: null,
  totalSyncs: 0,
  filesUploaded: 0,
  filesDownloaded: 0,
  errors: []
};

// ==================== SYNC OPERATIONS ====================

/**
 * Upload local KB files to Google Drive with timeout
 */
async function syncLocalToDrive() {
  console.log('📤 [Sync] Starting Local → Drive sync...');
  
  const uploaded = [];
  const errors = [];
  
  // Timeout controller (5 seconds per file)
  const createTimeoutController = () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    return controller;
  };
  
  try {
    // Sync Reports
    const reportsPath = path.join(__dirname, 'server/Emma_KnowledgeBase/Reports/Generated');
    if (fs.existsSync(reportsPath)) {
      const reports = fs.readdirSync(reportsPath).filter(f => f.endsWith('.md'));
      
      // Use Promise.all for parallel uploads with timeout
      const uploadPromises = reports.map(async (report) => {
        try {
          const filePath = path.join(reportsPath, report);
          
          // Race between upload and timeout
          const uploadPromise = uploadReportToDrive(filePath);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout (5s)')), 5000)
          );
          
          const result = await Promise.race([uploadPromise, timeoutPromise]);
          
          if (result && result.webViewLink) {
            uploaded.push({ file: report, url: result.webViewLink });
            console.log(`   ✅ Uploaded: ${report}`);
          }
        } catch (err) {
          errors.push({ file: report, error: err.message });
          console.error(`   ❌ Failed: ${report} - ${err.message}`);
        }
      });
      
      await Promise.all(uploadPromises);
    }
    
    // Sync Memos
    const memosPath = path.join(__dirname, 'server/Emma_KnowledgeBase/Memos');
    if (fs.existsSync(memosPath)) {
      const memos = fs.readdirSync(memosPath).filter(f => f.endsWith('.md'));
      
      const memoPromises = memos.map(async (memo) => {
        try {
          const filePath = path.join(memosPath, memo);
          
          const uploadPromise = uploadReportToDrive(filePath);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout (5s)')), 5000)
          );
          
          const result = await Promise.race([uploadPromise, timeoutPromise]);
          
          if (result && result.webViewLink) {
            uploaded.push({ file: memo, url: result.webViewLink });
            console.log(`   ✅ Uploaded: ${memo}`);
          }
        } catch (err) {
          errors.push({ file: memo, error: err.message });
          console.error(`   ❌ Failed: ${memo} - ${err.message}`);
        }
      });
      
      await Promise.all(memoPromises);
    }
    
  } catch (err) {
    console.error('📤 [Sync] Local → Drive error:', err);
    errors.push({ file: 'general', error: err.message });
  }
  
  return { uploaded, errors };
}

/**
 * Download Drive files to local KB (placeholder)
 */
async function syncDriveToLocal() {
  console.log('📥 [Sync] Starting Drive → Local sync...');
  
  // TODO: Implement Drive file listing and download
  // For Phase V, this is a placeholder - full implementation requires:
  // 1. List files in Emma Drive folder
  // 2. Compare with local KB files
  // 3. Download newer versions
  // 4. Update local KB
  
  console.log('   ⏸️ Drive → Local sync not yet implemented');
  return { downloaded: [], errors: [] };
}

/**
 * Generate sync log file
 */
function generateSyncLog(uploadResult, downloadResult) {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const logFileName = `DriveSync_Log_${dateStr}.md`;
  const logPath = path.join(LOG_DIR, logFileName);
  
  // Ensure log directory exists
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  // Append to today's log
  const logEntry = `
## Sync ${date.toLocaleTimeString()} - ${date.toLocaleDateString()}

### Local → Drive (Upload)
- **Files Uploaded**: ${uploadResult.uploaded.length}
- **Errors**: ${uploadResult.errors.length}

${uploadResult.uploaded.length > 0 ? `#### Uploaded Files\n${uploadResult.uploaded.map(f => `- ✅ ${f.file}\n  - URL: ${f.url}`).join('\n')}` : ''}

${uploadResult.errors.length > 0 ? `#### Upload Errors\n${uploadResult.errors.map(e => `- ❌ ${e.file}: ${e.error}`).join('\n')}` : ''}

### Drive → Local (Download)
- **Files Downloaded**: ${downloadResult.downloaded.length}
- **Errors**: ${downloadResult.errors.length}

${downloadResult.downloaded.length > 0 ? `#### Downloaded Files\n${downloadResult.downloaded.map(f => `- ✅ ${f}`).join('\n')}` : ''}

${downloadResult.errors.length > 0 ? `#### Download Errors\n${downloadResult.errors.map(e => `- ❌ ${e}`).join('\n')}` : ''}

---

`;
  
  // Append or create log file
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, logEntry, 'utf-8');
  } else {
    const header = `# Drive Sync Log - ${dateStr}\n\n**Mode**: Hybrid KnowledgeBase (Local + External)\n**Frequency**: Hourly\n**Target**: Google Drive /AHK Profile/Emma/\n\n---\n\n`;
    fs.writeFileSync(logPath, header + logEntry, 'utf-8');
  }
  
  console.log(`📝 [Sync] Log saved: ${logFileName}`);
  return logPath;
}

// ==================== SYNC ORCHESTRATION ====================

/**
 * Execute full sync cycle
 */
export async function executeDriveSync() {
  console.log('\n🔄 [Drive Sync] Starting sync cycle...');
  console.log(`   Time: ${new Date().toLocaleString()}`);
  
  try {
    // Upload: Local → Drive
    const uploadResult = await syncLocalToDrive();
    
    // Download: Drive → Local (placeholder)
    const downloadResult = await syncDriveToLocal();
    
    // Generate log
    const logPath = generateSyncLog(uploadResult, downloadResult);
    
    // Update stats
    stats.lastSync = new Date();
    stats.totalSyncs++;
    stats.filesUploaded += uploadResult.uploaded.length;
    stats.filesDownloaded += downloadResult.downloaded.length;
    stats.errors.push(...uploadResult.errors, ...downloadResult.errors);
    
    // Keep only last 10 errors
    if (stats.errors.length > 10) {
      stats.errors = stats.errors.slice(-10);
    }
    
    console.log('\n✅ [Drive Sync] Cycle complete');
    console.log(`   Uploaded: ${uploadResult.uploaded.length} files`);
    console.log(`   Downloaded: ${downloadResult.downloaded.length} files`);
    console.log(`   Errors: ${uploadResult.errors.length + downloadResult.errors.length}`);
    console.log(`   Log: ${path.basename(logPath)}`);
    
    return {
      success: true,
      uploaded: uploadResult.uploaded.length,
      downloaded: downloadResult.downloaded.length,
      errors: uploadResult.errors.length + downloadResult.errors.length,
      logPath
    };
  } catch (err) {
    console.error('🚨 [Drive Sync] Cycle failed:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Get sync statistics
 */
export function getSyncStats() {
  return {
    ...stats,
    lastSync: stats.lastSync ? stats.lastSync.toISOString() : null
  };
}

// ==================== SCHEDULER ====================

/**
 * Start automated hourly sync
 */
export function startDriveSyncScheduler() {
  console.log('⏰ [Drive Sync] Scheduler starting...');
  console.log(`   Schedule: ${SYNC_INTERVAL} (every hour)`);
  
  // Schedule hourly sync
  cron.schedule(SYNC_INTERVAL, () => {
    console.log('\n⏰ [Drive Sync] Scheduled sync triggered');
    executeDriveSync();
  });
  
  // Execute initial sync
  console.log('   Executing initial sync...');
  executeDriveSync();
  
  console.log('✅ [Drive Sync] Scheduler active');
}

// ==================== MAIN ====================

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Drive Sync Automation - Manual Execution');
  executeDriveSync()
    .then(result => {
      console.log('\n📊 Final Result:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n🚨 Fatal Error:', err);
      process.exit(1);
    });
}

export default {
  executeDriveSync,
  getSyncStats,
  startDriveSyncScheduler
};
