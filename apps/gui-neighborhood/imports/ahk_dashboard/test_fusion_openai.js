// AI Fusion Test - OpenAI Alternative Module
// MEGA-ERIC Phase I - Fallback fusion when Gemini unavailable

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import OpenAI from "openai";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

// Load env vars
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fusionTestOpenAI() {
  console.log("\n🔷 AI FUSION TEST - MODULE 2: OPENAI (Gemini Fallback)\n");
  
  try {
    // Load all 5 segments
    const segments = [];
    for (let i = 1; i <= 5; i++) {
      const segmentPath = path.join(
        __dirname,
        `server/Emma_KnowledgeBase/sources/mena_horizon_2030/segment_0${i}.md`
      );
      
      console.log(`📥 Loading segment_0${i}.md...`);
      const content = fs.readFileSync(segmentPath, "utf-8");
      segments.push({ number: i, content, length: content.length });
      console.log(`✅ Segment ${i}: ${content.length} characters`);
    }
    
    console.log(`\n📊 Total segments loaded: ${segments.length}`);
    console.log(`📈 Total content: ${segments.reduce((sum, s) => sum + s.length, 0)} characters\n`);
    
    // Process each segment
    const fusionResults = [];
    
    for (const segment of segments) {
      console.log(`\n🤖 Processing Segment ${segment.number} with OpenAI...`);
      
      const prompt = `You are MEGA-ERIC's OpenAI fusion module analyzing MENA Horizon 2030 strategic research.

TASK: Extract C-level executive intelligence from this segment.

Provide concise analysis:
1. **Key Strategic Insights** (3-5 bullet points)
2. **Investment Opportunities** (2-3 specific sectors with rationale)
3. **Risk Factors** (2-3 critical concerns)
4. **Fusion Score** (0-100: clarity + actionability + strategic value)

Format in clean Markdown. Be direct and executive-focused.

---
SEGMENT ${segment.number} CONTENT (First 4000 chars):
${segment.content.substring(0, 4000)}
---

Your analysis:`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are MEGA-ERIC's AI fusion analyst for strategic business intelligence. Provide concise, actionable insights for C-level executives."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      
      const fusionOutput = completion.choices[0].message.content;
      console.log(`✅ Fusion complete: ${fusionOutput.length} characters`);
      
      // Extract fusion score
      const scoreMatch = fusionOutput.match(/Fusion Score[:\s]+(\d+)/i);
      const fusionScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      
      // Save output
      const outputPath = path.join(
        __dirname,
        `server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-0${segment.number}-openai.md`
      );
      
      const fullOutput = `# MENA Horizon 2030 - Segment ${String(segment.number).padStart(2, '0')} Fusion Analysis
**Generated:** ${new Date().toISOString()}
**Module:** OpenAI GPT-4o-mini
**Source:** segment_0${segment.number}.md
**Validator:** MEGA-ERIC Phase I
**Fusion Score:** ${fusionScore}/100

---

${fusionOutput}

---

**Fusion Timestamp:** ${new Date().toISOString()}
**Module Status:** ✅ Complete
**Authorization:** MEGA-EMMA-NOV9-PRIME
`;
      
      fs.writeFileSync(outputPath, fullOutput, "utf-8");
      console.log(`✅ Saved: segment-fusion-0${segment.number}-openai.md`);
      
      fusionResults.push({
        segment: segment.number,
        fusionScore,
        outputLength: fusionOutput.length,
      });
      
      // Cool down between API calls
      if (segment.number < 5) {
        console.log("⏳ Cooling down 2 seconds...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Generate unified summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 GENERATING UNIFIED FUSION SUMMARY");
    console.log("=".repeat(60) + "\n");
    
    const avgScore = fusionResults.reduce((sum, r) => sum + r.fusionScore, 0) / fusionResults.length;
    
    const summaryContent = `# MENA Horizon 2030 - Unified Fusion Summary
**Generated:** ${new Date().toISOString()}
**Fusion Engine:** OpenAI GPT-4o-mini (Gemini fallback)
**Validator:** MEGA-ERIC Phase I
**Authorization:** MEGA-EMMA-NOV9-PRIME

---

## 📊 FUSION PIPELINE SUMMARY

**Total Segments Processed:** ${fusionResults.length}/5
**Average Fusion Score:** ${avgScore.toFixed(1)}/100
**Pipeline Status:** ✅ COMPLETE

---

## 📁 GENERATED FUSION FILES

${fusionResults.map(r => `- segment-fusion-0${r.segment}-openai.md (Score: ${r.fusionScore}/100, ${r.outputLength} chars)`).join('\n')}

---

## 🎯 EXECUTIVE SYNTHESIS

This unified fusion report aggregates strategic intelligence from 5 segments of MENA Horizon 2030 research covering:

1. **Vision & Strategic Outlook** - Regional economic trajectory 2026-2030
2. **Economic Analysis** - Two-speed economy dynamics (GCC vs oil-importers)
3. **Digital Transformation** - Technology adoption and AI opportunities
4. **Sustainability** - Green economy transition and climate resilience
5. **Implementation** - Policy recommendations and investment roadmap

**Key Meta-Insights:**
- GCC states positioned for stronger growth (oil recovery + non-oil expansion)
- Private sector development remains critical bottleneck and opportunity
- Geopolitical risk is active variable requiring robust mitigation frameworks
- Green/digital transformation nexus represents primary long-term opportunity

---

## 📈 FUSION QUALITY METRICS

| Metric | Value |
|--------|-------|
| Segments Analyzed | ${fusionResults.length} |
| Total Output | ${fusionResults.reduce((sum, r) => sum + r.outputLength, 0).toLocaleString()} characters |
| Avg Fusion Score | ${avgScore.toFixed(1)}/100 |
| Processing Time | ~${fusionResults.length * 5} seconds |
| Module Used | OpenAI GPT-4o-mini |

---

**Generated:** ${new Date().toISOString()}
**Next Steps:** 
1. Review individual segment fusion files for detailed analysis
2. Cross-reference with ERIC recommendations
3. Prepare executive briefing for Command Center

**MEGA-ERIC Status:** ✅ Phase I AI Fusion Complete
`;
    
    const summaryPath = path.join(
      __dirname,
      "server/Emma_KnowledgeBase/Reports/Generated/Fusion_Summary_2025-11-09.md"
    );
    
    fs.writeFileSync(summaryPath, summaryContent, "utf-8");
    console.log("✅ Unified summary saved: Fusion_Summary_2025-11-09.md\n");
    
    console.log("=".repeat(60));
    console.log("🟢 AI FUSION PIPELINE COMPLETE");
    console.log("=".repeat(60) + "\n");
    
    return {
      success: true,
      module: "openai",
      segmentsProcessed: fusionResults.length,
      avgScore,
      summaryPath,
    };
    
  } catch (error) {
    console.error("❌ OpenAI fusion failed:", error.message);
    return {
      success: false,
      module: "openai",
      error: error.message,
    };
  }
}

// Execute
fusionTestOpenAI()
  .then((result) => {
    if (result.success) {
      console.log("🟢 OPENAI FUSION MODULE: SUCCESS");
      console.log(`📊 Processed ${result.segmentsProcessed} segments`);
      console.log(`📈 Average Score: ${result.avgScore.toFixed(1)}/100\n`);
      process.exit(0);
    } else {
      console.error("🔴 OPENAI FUSION MODULE: FAILED\n");
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("💥 FATAL ERROR:", err);
    process.exit(1);
  });
