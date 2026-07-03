/**
 * ============================================================
 *  AHKStrategies | EMMA Command Center
 *  AUTO MEMO ORCHESTRATOR v1.0
 *  Created: 2025-11-08
 *  Author: Emma (Executive Meta-Mind Advisor)
 *  Purpose: Automate daily memo creation + weekly fusion
 * ============================================================
 */

import fs from "fs";
import path from "path";
import cron from "node-cron";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";
dayjs.extend(isoWeek);

// === CONFIGURATION =========================================================
const ROOT = "GoogleDrive/MyDrive/AHK Profile";
const DIVISIONS = [
  "Website",
  "Dashboard",
  "Italian Projects",
  "AI Boutique",
  "LaunchPad",
  "Consulting Hub",
  "Academy",
  "Studio"
];

// Utility to ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

// === DAILY MEMO CREATION ====================================================
function createDailyMemo(division) {
  const date = dayjs().format("YYYY-MM-DD");
  const memoDir = path.join(ROOT, division, "Memos", "Daily");
  const filePath = path.join(memoDir, `Memo_${date}.html`);

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8">
  <title>AHKStrategies — Emma–${division} Memo ${date}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;margin:40px;color:#222;}
    h1{color:#007bff;} h3{color:#0056b3;}
    hr{border:0;border-top:1px solid #ccc;margin:20px 0;}
  </style></head>
  <body>
  <h1>AHKStrategies — Emma–${division}</h1>
  <p><strong>Date:</strong> ${date}</p>
  <h3>Operational Summary</h3>
  <p>[Auto-generated summary pending manual/AI update]</p>
  <h3>Achievements</h3><ul><li>...</li></ul>
  <h3>Obstacles</h3><ul><li>...</li></ul>
  <h3>Next Steps</h3><ul><li>...</li></ul>
  <hr>
  <p><em>Emma Insight:</em> “Today’s rhythm was stable and adaptive — the system learned and so did we.”</p>
  </body></html>`;

  ensureDir(memoDir);
  fs.writeFileSync(filePath, html.trim());
  return filePath;
}

// === COPY TO KNOWLEDGE BASE ===============================================
function copyToKnowledgeBase(filePath) {
  const kbDir = path.join(ROOT, "Emma_KnowledgeBase", "Memos");
  ensureDir(kbDir);
  const dest = path.join(kbDir, path.basename(filePath));
  fs.copyFileSync(filePath, dest);
}

// === DAILY ROUTINE =========================================================
function runDailyMemos() {
  console.log(`\n🕙 [${dayjs().format("YYYY-MM-DD HH:mm")}] Starting Daily Memo Cycle...`);
  DIVISIONS.forEach(div => {
    try {
      const memo = createDailyMemo(div);
      copyToKnowledgeBase(memo);
      console.log(`✅ ${div} memo created & copied.`);
    } catch (err) {
      console.error(`❌ Error creating memo for ${div}:`, err.message);
    }
  });
  console.log("🌙 Daily checkpoint complete.\n");
}

// === WEEKLY FUSION =========================================================
function runWeeklyFusion() {
  console.log(`\n🌐 [${dayjs().format("YYYY-MM-DD HH:mm")}] Starting Weekly Fusion...`);
  const weekNum = dayjs().isoWeek();
  const year = dayjs().year();
  const destDir = path.join(ROOT, "CommandCenter", "Reports", "Weekly");
  ensureDir(destDir);
  const fusionFile = path.join(destDir, `Weekly-Fusion-Report_${year}-Week${weekNum}.html`);

  let merged = `
  <!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8"><title>Weekly Fusion Report - Week ${weekNum}</title>
  <style>body{font-family:'Segoe UI',sans-serif;margin:40px;color:#222;}
  h1{color:#007bff;} h2{color:#0056b3;} section{margin-bottom:30px;}</style>
  </head><body><h1>Weekly Fusion Report — Week ${weekNum}, ${year}</h1>`;

  DIVISIONS.forEach(div => {
    const dailyDir = path.join(ROOT, div, "Memos", "Daily");
    if (!fs.existsSync(dailyDir)) return;
    const files = fs.readdirSync(dailyDir).filter(f => f.endsWith(".html"));
    if (!files.length) return;
    merged += `<section><h2>${div}</h2>`;
    files.forEach(f => {
      const content = fs.readFileSync(path.join(dailyDir, f), "utf-8");
      merged += content + "<hr>";
    });
    merged += "</section>";
  });

  merged += `</body></html>`;
  fs.writeFileSync(fusionFile, merged.trim());
  console.log(`🧩 Weekly Fusion complete: ${fusionFile}\n`);
}

// === SCHEDULING ============================================================
cron.schedule("0 22 * * *", runDailyMemos);    // 22:00 Cairo – Daily memos
cron.schedule("0 21 * * FRI", runWeeklyFusion); // 21:00 Cairo – Friday fusion

console.log("🚀 EMMA MEMO ORCHESTRATOR ACTIVE");
console.log("• Daily memos: 22:00 Cairo\n• Weekly fusion: Friday 21:00 Cairo");
