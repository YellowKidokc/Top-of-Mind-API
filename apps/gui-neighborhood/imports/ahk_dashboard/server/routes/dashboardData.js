// server/routes/dashboardData.js
// Dashboard data snapshot API for AHK Command Center (ESM version)

import express from "express";
import fs from "fs";
import path from "path";
import cron from "node-cron";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ---------- CONFIG ----------
const MEMO_INDEX_PATH = path.join(__dirname, "../data/memo_index.json");
const REVENUE_SNAPSHOT_PATH = path.join(
  __dirname,
  "../data/revenue_snapshot.json"
);
const FUSION_REPORT_DIR = path.join(__dirname, "../data/fusion_reports");
const SNAPSHOT_TTL_MS = 10 * 60 * 1000;

// ---------- IN-MEMORY CACHE ----------
const cache = {
  status: { data: null, updatedAt: null },
  revenue: { data: null, updatedAt: null },
  fusion: { data: null, updatedAt: null },
};

function isFresh(entry) {
  return entry?.updatedAt && Date.now() - entry.updatedAt.getTime() < SNAPSHOT_TTL_MS;
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getLatestFusionReportMeta() {
  if (!fs.existsSync(FUSION_REPORT_DIR)) return null;
  const files = fs.readdirSync(FUSION_REPORT_DIR).filter(f => f.endsWith(".html"));
  if (!files.length) return null;
  const latest = files.sort(
    (a, b) =>
      fs.statSync(path.join(FUSION_REPORT_DIR, b)).mtimeMs -
      fs.statSync(path.join(FUSION_REPORT_DIR, a)).mtimeMs
  )[0];
  const fullPath = path.join(FUSION_REPORT_DIR, latest);
  return {
    filename: latest,
    url: `/api/fusion/html/${encodeURIComponent(latest)}`,
    updatedAt: fs.statSync(fullPath).mtime,
  };
}

async function refreshStatusSnapshot(source = "manual") {
  const memoIndex = safeReadJson(MEMO_INDEX_PATH, { divisions: [] });
  const now = new Date();
  cache.status = {
    data: {
      divisions: memoIndex.divisions || [],
      systemHealth: {
        pm2: "unknown",
        schedulerLastRun: memoIndex.schedulerLastRun || null,
        diskSyncStatus: memoIndex.diskSyncStatus || "unknown",
        source,
      },
      updatedAt: now.toISOString(),
    },
    updatedAt: now,
  };
}

async function refreshRevenueSnapshot(source = "manual") {
  const revenue = safeReadJson(REVENUE_SNAPSHOT_PATH, {
    mrr: 0,
    totalReportSales: 0,
    yoyGrowth: 0,
    sparkline: [],
  });
  const now = new Date();
  cache.revenue = {
    data: { ...revenue, source, updatedAt: now.toISOString() },
    updatedAt: now,
  };
}

async function refreshFusionSnapshot(source = "manual") {
  const meta = getLatestFusionReportMeta();
  const now = new Date();
  cache.fusion = {
    data: { hasReport: !!meta, latest: meta, source, updatedAt: now.toISOString() },
    updatedAt: now,
  };
}

async function refreshAllSnapshots(source = "manual") {
  await Promise.all([
    refreshStatusSnapshot(source),
    refreshRevenueSnapshot(source),
    refreshFusionSnapshot(source),
  ]);
}

// Initial + cron refresh
refreshAllSnapshots("startup");
cron.schedule("*/10 * * * *", () => refreshAllSnapshots("cron"));

// ---------- ROUTES ----------
router.get("/status", async (req, res) => {
  if (!isFresh(cache.status)) await refreshStatusSnapshot("on-demand");
  res.json(cache.status.data);
});
router.get("/revenue", async (req, res) => {
  if (!isFresh(cache.revenue)) await refreshRevenueSnapshot("on-demand");
  res.json(cache.revenue.data);
});
router.get("/fusion", async (req, res) => {
  if (!isFresh(cache.fusion)) await refreshFusionSnapshot("on-demand");
  res.json(cache.fusion.data);
});
router.get("/fusion/html/:file", (req, res) => {
  const file = req.params.file;
  const full = path.join(FUSION_REPORT_DIR, file);
  if (!fs.existsSync(full)) return res.status(404).send("Not found");
  res.sendFile(full);
});

export default router;
