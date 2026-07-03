// server/routes/fusion.js
// Fusion Data Collector API - Aggregates metrics for real-time dashboard stream

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ---------- DATA SOURCE PATHS ----------
const MEMO_INDEX_PATH = path.join(__dirname, "../data/memo_index.json");
const REVENUE_SNAPSHOT_PATH = path.join(__dirname, "../data/revenue_snapshot.json");
const ERIC_RECOMMENDATIONS_PATH = path.join(__dirname, "../data/ERIC_recommendations.json");
const DRIVE_SYNC_LOG_PATH = path.join(__dirname, "../Emma_KnowledgeBase/Logs/drive_sync.log");

// ---------- HELPER: Safe JSON Read ----------
function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[Fusion] File not found: ${filePath}, using fallback`);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Fusion] Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

// ---------- HELPER: Check Drive Sync Status ----------
function getDriveSyncStatus() {
  try {
    if (!fs.existsSync(DRIVE_SYNC_LOG_PATH)) {
      return { status: "UNKNOWN", lastSync: null };
    }
    const log = fs.readFileSync(DRIVE_SYNC_LOG_PATH, "utf8");
    const lines = log.trim().split("\n");
    const lastLine = lines[lines.length - 1];
    
    // Parse last sync timestamp from log
    const timestampMatch = lastLine.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    const statusMatch = lastLine.match(/✅|❌|⚠️/);
    
    return {
      status: statusMatch ? (lastLine.includes("✅") ? "OK" : "ERROR") : "UNKNOWN",
      lastSync: timestampMatch ? timestampMatch[1] : null,
    };
  } catch (err) {
    console.error("[Fusion] Error reading Drive sync log:", err.message);
    return { status: "ERROR", lastSync: null };
  }
}

// ---------- MAIN: Aggregate Fusion Data ----------
function aggregateFusionData() {
  const timestamp = new Date().toISOString();
  
  // Load data sources
  const memoIndex = safeReadJson(MEMO_INDEX_PATH, { totalMemos: 0 });
  const revenueSnapshot = safeReadJson(REVENUE_SNAPSHOT_PATH, { mrr: 0 });
  const ericRecs = safeReadJson(ERIC_RECOMMENDATIONS_PATH, { totalRecommendations: 0 });
  const driveSync = getDriveSyncStatus();
  
  // Build fusion payload
  return {
    timestamp,
    memos: memoIndex.totalMemos || 0,
    revenue: revenueSnapshot.mrr || 0,
    driveSync: driveSync.status,
    driveSyncLastSync: driveSync.lastSync,
    recommendations: ericRecs.totalRecommendations || 0,
    health: {
      memoIndexAvailable: fs.existsSync(MEMO_INDEX_PATH),
      revenueAvailable: fs.existsSync(REVENUE_SNAPSHOT_PATH),
      recommendationsAvailable: fs.existsSync(ERIC_RECOMMENDATIONS_PATH),
      driveSyncLogAvailable: fs.existsSync(DRIVE_SYNC_LOG_PATH),
    },
  };
}

// ---------- ROUTES ----------

// GET /api/fusion/stream - Manual fetch of current fusion data
router.get("/stream", (req, res) => {
  try {
    const fusionData = aggregateFusionData();
    console.log(`[Fusion] Stream data requested at ${fusionData.timestamp}`);
    res.json({
      ok: true,
      data: fusionData,
    });
  } catch (err) {
    console.error("[Fusion] Error generating stream data:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to aggregate fusion data",
      message: err.message,
    });
  }
});

// GET /api/fusion/health - Check availability of all data sources
router.get("/health", (req, res) => {
  const health = {
    memoIndex: fs.existsSync(MEMO_INDEX_PATH),
    revenueSnapshot: fs.existsSync(REVENUE_SNAPSHOT_PATH),
    ericRecommendations: fs.existsSync(ERIC_RECOMMENDATIONS_PATH),
    driveSyncLog: fs.existsSync(DRIVE_SYNC_LOG_PATH),
  };
  
  const allHealthy = Object.values(health).every((v) => v === true);
  
  res.json({
    ok: allHealthy,
    status: allHealthy ? "healthy" : "degraded",
    sources: health,
    timestamp: new Date().toISOString(),
  });
});

// Export aggregator function for use by WebSocket emitter
export { aggregateFusionData };
export default router;
