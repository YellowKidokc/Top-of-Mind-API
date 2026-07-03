// AI Fusion Test - Using Emma Engine as Gemini Proxy
// MEGA-ERIC Phase I - AI Fusion Pipeline (Emma Engine Method)

import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMMA_ENGINE_URL = "http://localhost:7070/api/chat";

async function fusionViaEmma(segmentNumber) {
  console.log(`\n🔷 AI FUSION TEST - Segment ${segmentNumber} (via Emma Engine)\n`);
  
  try {
    // Load segment
    const segmentPath = path.join(
      __dirname,
      `server/Emma_KnowledgeBase/sources/mena_horizon_2030/segment_0${segmentNumber}.md`
    );
    
    console.log(`📥 Loading segment_0${segmentNumber}.md...`);
    const segmentContent = fs.readFileSync(segmentPath, "utf-8");
    console.log(`✅ Loaded: ${segmentContent.length} characters\n`);
    
    // Create fusion prompt
    const fusionPrompt = `You are MEGA-ERIC's AI fusion module analyzing MENA Horizon 2030 strategic research.

TASK: Extract actionable intelligence from this segment for C-level executives.

Provide:
1. **Key Strategic Insights** (3-5 concise bullet points)
2. **Investment Opportunities** (2-3 specific sectors with brief rationale)
3. **Risk Factors** (2-3 critical concerns)
4. **Fusion Score** (0-100: clarity + actionability + strategic value)

Format in clean Markdown. Be direct and executive-focused.

---
SEGMENT CONTENT (First 4500 chars):
${segmentContent.substring(0, 4500)}
---

Your analysis:`;

    console.log("🤖 Calling Emma Engine (Gemini proxy)...");
    
    const response = await axios.post(EMMA_ENGINE_URL, {
      message: fusionPrompt,
      sessionId: `fusion-seg-${segmentNumber}-${Date.now()}`,
    });
    
    const fusionOutput = response.data.message || response.data.reply;
    console.log(`✅ Fusion complete: ${fusionOutput.length} characters\n`);
    
    // Preview
    console.log("📄 FUSION OUTPUT PREVIEW:");
    console.log("─".repeat(60));
    console.log(fusionOutput.substring(0, 400) + "...\n");
    console.log("─".repeat(60));
    
    // Save output
    const outputPath = path.join(
      __dirname,
      `server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-0${segmentNumber}-gemini.md`
    );
    
    const fullOutput = `# MENA Horizon 2030 - Segment ${String(segmentNumber).padStart(2, '0')} Fusion Analysis
**Generated:** ${new Date().toISOString()}
**Module:** Gemini AI (via Emma Engine)
**Source:** segment_0${segmentNumber}.md
**Validator:** MEGA-ERIC Phase I

---

${fusionOutput}

---

**Fusion Timestamp:** ${new Date().toISOString()}
**Module Status:** ✅ Complete
**Authorization:** MEGA-EMMA-NOV9-PRIME
`;
    
    fs.writeFileSync(outputPath, fullOutput, "utf-8");
    console.log(`\n✅ Saved: segment-fusion-0${segmentNumber}-gemini.md\n`);
    
    return {
      success: true,
      segment: segmentNumber,
      outputPath,
      outputLength: fusionOutput.length,
      fusionScore: extractFusionScore(fusionOutput),
    };
    
  } catch (error) {
    console.error(`❌ Fusion failed for segment ${segmentNumber}:`, error.message);
    return {
      success: false,
      segment: segmentNumber,
      error: error.message,
    };
  }
}

function extractFusionScore(output) {
  const match = output.match(/Fusion Score[:\s]+(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

async function runFullFusion() {
  console.log("\n" + "=".repeat(60));
  console.log("🟣 MEGA-ERIC PHASE I: AI FUSION PIPELINE");
  console.log("=".repeat(60));
  
  const results = [];
  
  // Process segments 1-5 sequentially
  for (let i = 1; i <= 5; i++) {
    const result = await fusionViaEmma(i);
    results.push(result);
    
    if (!result.success) {
      console.error(`\n⚠️ Stopping fusion - segment ${i} failed\n`);
      break;
    }
    
    // Brief pause between segments
    if (i < 5) {
      console.log("⏳ Cooling down 3 seconds...\n");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 FUSION PIPELINE SUMMARY");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const avgScore = results
    .filter(r => r.success && r.fusionScore)
    .reduce((sum, r) => sum + r.fusionScore, 0) / successful || 0;
  
  console.log(`\n✅ Successful Segments: ${successful}/5`);
  console.log(`📈 Average Fusion Score: ${avgScore.toFixed(1)}/100`);
  console.log(`\n🟢 Phase I AI Fusion: ${successful === 5 ? 'COMPLETE' : 'PARTIAL'}\n`);
  
  return {
    totalSegments: 5,
    successful,
    avgScore: avgScore.toFixed(1),
    results,
  };
}

// Execute
runFullFusion()
  .then((summary) => {
    console.log("=".repeat(60));
    if (summary.successful === 5) {
      console.log("🟢 ALL SEGMENTS FUSED - READY FOR AGGREGATION\n");
      process.exit(0);
    } else {
      console.log("🟡 PARTIAL FUSION COMPLETED\n");
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("💥 FATAL ERROR:", err);
    process.exit(1);
  });
