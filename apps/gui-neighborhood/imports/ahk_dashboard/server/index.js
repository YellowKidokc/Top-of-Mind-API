
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// ...existing code...
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ...existing code...

// Verify critical env vars loaded
console.log('🔍 ENV CHECK:');
console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ MISSING');
console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ MISSING');
console.log('   ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✅ Loaded' : '❌ MISSING');

// Now import modules that depend on environment variables
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// Import voice router AFTER env vars are loaded (dynamic import to avoid hoisting)
let voiceRouter;
try {
  const voiceModule = await import("./voice/router.js");
  voiceRouter = voiceModule.default;
  console.log('✅ Voice Router loaded with API keys');
} catch (err) {
  console.warn('⚠️ Voice Router failed to load:', err.message);
}

// Import Emma AI Chat Engine - RESTORED Phase IV
import emmaModule from "./emma/chat.js";
const { chat: emmaChat } = emmaModule;
console.log('✅ Emma Chat Engine loaded');

// Import Google Drive OAuth methods - TEMPORARILY DISABLED FOR DEBUGGING
// import { getAuthURL, handleCallback, syncDrives, getDriveStatus } from "../src/integrations/googleDriveLinker.js";
// Import Google Drive backup for reports - TEMPORARILY DISABLED FOR DEBUGGING
// import { uploadReportToDrive, listOutputs } from "./googleDrive.js";


// Import dashboardData router
import dashboardDataRouter from "./routes/dashboardData.js";

// Import fusion router
import fusionRouter from "./routes/fusion.js";

// Import fusion emitter service
import { initializeFusionEmitter, getFusionEmitterHealth } from "./services/fusionEmitter.js";

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ahk-dashboard.vercel.app',
    'https://ahk-dashboard-backend.onrender.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "15mb" }));

// Mount dashboardData router at /api
app.use("/api", dashboardDataRouter);

// Mount fusion router at /api/fusion
app.use("/api/fusion", fusionRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ========================================================
// EMMA AI ENDPOINTS - Conversational AI with memory
// ========================================================

// POST /api/chat - Main chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId, userId = 'ashraf' } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: "Message is required and must be a string" 
      });
    }
    
    console.log(`💬 /api/chat: "${message.substring(0, 60)}..."`);
    
    // Call Emma's chat engine
    const result = await emmaChat({ message, sessionId, userId });
    
    res.json({
      success: true,
      reply: result.reply,
      sessionId: result.sessionId,
      actions: result.actions || [],
      messageId: result.messageId,
      tokens: result.tokens,
      resumedSession: result.resumedSession || null
    });
    
  } catch (error) {
    console.error("❌ /api/chat error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Chat failed" 
    });
  }
});

// POST /api/session - Create new session
app.post("/api/session", async (req, res) => {
  try {
    const { userId = 'ashraf', topicTags = [] } = req.body;
    
    const sessionId = createSession(userId, topicTags);
    const session = getSession(sessionId);
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error("❌ /api/session error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/session/:id - Get session details
app.get("/api/session/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = getSession(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found"
      });
    }
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error("❌ /api/session/:id error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/session/:id/messages - Get session messages
app.get("/api/session/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = getMessages(id, { 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    res.json({
      success: true,
      messages,
      count: messages.length
    });
    
  } catch (error) {
    console.error("❌ /api/session/:id/messages error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/sessions - List user's sessions
app.get("/api/sessions", async (req, res) => {
  try {
    const { userId = 'ashraf', limit = 10 } = req.query;
    
    const sessions = listSessions(userId, parseInt(limit));
    
    res.json({
      success: true,
      sessions,
      count: sessions.length
    });
    
  } catch (error) {
    console.error("❌ /api/sessions error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Mount voice API (only if loaded successfully)
if (voiceRouter) {
  app.use("/api/voice", voiceRouter);
} else {
  console.warn('⚠️ Voice API not available (router failed to load)');
}

// Parse HTML reports endpoint - extracts KPIs from HTML reports
app.get("/api/parse-html-reports", async (req, res) => {
  try {
    // Mock KPI data - in production, this would parse actual HTML reports
    const reports = [
      {
        title: "Q4 2025 Performance Report",
        kpis: {
          revenue: "$580K",
          projects: 3,
          completion: "12/100",
          roi: "380%"
        },
        timestamp: new Date().toISOString()
      }
    ];
    res.json({ success: true, reports });
  } catch (error) {
    console.error("Parse HTML Reports Error:", error);
    res.status(500).json({ error: "Failed to parse HTML reports" });
  }
});

// Generate report endpoint - creates strategic reports
app.post("/api/generate-report", async (req, res) => {
  try {
    const { format = 'pdf', includeCharts = true, sections = [] } = req.body;
    
    // Load MENA Horizon 2030 intelligence from segmented knowledge base
    let menaInsights = '';
    try {
  const knowledgeBasePath = path.join(__dirname, 'Emma_KnowledgeBase/sources/mena_horizon_2030');
      const manifestPath = path.join(knowledgeBasePath, 'manifest.json');
      
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        console.log(`📚 Loading MENA 2030 knowledge base (${manifest.segments.length} segments, synced: ${manifest.synced_at})`);
        
        // Aggregate all segments
        const segmentContents = [];
        for (const segment of manifest.segments) {
          const segmentPath = path.join(knowledgeBasePath, segment.filename);
          if (fs.existsSync(segmentPath)) {
            const content = fs.readFileSync(segmentPath, 'utf-8');
            // Remove metadata header (lines between --- markers)
            const withoutMetadata = content.replace(/^---[\s\S]*?---\n\n/, '');
            segmentContents.push(withoutMetadata);
          }
        }
        
        menaInsights = segmentContents.join('\n\n');
        console.log(`✅ Loaded ${menaInsights.length} characters from segmented knowledge base`);
      } else {
        console.warn('⚠️ MENA 2030 knowledge base not found - run: node sync_knowledge_base.js');
      }
    } catch (err) {
      console.warn('⚠️ Could not load MENA 2030 knowledge base:', err.message);
    }
    
    // Build sections array
    const reportSections = sections.length > 0 ? sections : [
      'Executive Summary',
      'Portfolio Overview',
      'Financial Metrics',
      'Project Progress',
      'AI Insights',
      'Strategic Recommendations'
    ];
    
    // Add MENA 2030 if AI Insights is included and source is available
    if (reportSections.includes('AI Insights') && menaInsights) {
      reportSections.push('MENA Horizon 2030 Strategic Insights');
    }
    
    // Generate mock report - in production, this would create actual reports
    const report = {
      title: "AHK Strategic Performance Report",
      format: format.toUpperCase(),
      generatedAt: new Date().toISOString(),
      sections: reportSections,
      menaHorizon2030: menaInsights ? {
        included: true,
        wordCount: menaInsights.split(/\s+/).length,
        preview: menaInsights.substring(0, 200) + '...'
      } : { included: false },
      summary: {
        totalProjects: 3,
        activeProjects: 3,
        completionRate: "12%",
        totalBudget: "$580K",
        projectedROI: "380%"
      },
      charts: includeCharts,
      metadata: {
        generated: new Date().toISOString(),
        version: "1.0",
        confidentiality: "Internal Use Only"
      }
    };
    
    console.log('📊 Report generated:', report.title);
    res.json({ success: true, report });
  } catch (error) {
    console.error("Generate Report Error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Save report endpoint - saves generated reports to Emma KnowledgeBase
app.post("/api/save-report", async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    
    // Sanitize filename
    const sanitizedTitle = title
      .replace(/[^a-z0-9\s-]/gi, '_')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}_${sanitizedTitle}.md`;
    
  const reportsDir = path.join(__dirname, 'Emma_KnowledgeBase/Reports/Generated');
    const filePath = path.join(reportsDir, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // 1) Local save first (primary operation)
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log('💾 Report saved:', filename);
    
    // 2) Fire-and-forget Drive upload (non-blocking) - TEMPORARILY DISABLED FOR DEBUGGING
    // (async () => {
    //   try {
    //     const meta = await uploadReportToDrive(filePath);
    //     console.log(`☁️  Uploaded to Drive: ${meta.name} (${meta.id})`);
    //   } catch (e) {
    //     console.warn('⚠️ Drive upload failed (report saved locally):', e.message);
    //   }
    // })();
    
    res.json({ 
      success: true, 
      filePath: filePath,
      filename: filename
    });
  } catch (error) {
    console.error("Save Report Error:", error);
    res.status(500).json({ error: "Failed to save report" });
  }
});

// List reports endpoint - retrieves all saved reports
app.get("/api/list-reports", async (req, res) => {
  try {
    console.log('📋 /api/list-reports called');
    const reportsDir = path.join(__dirname, 'Emma_KnowledgeBase/Reports/Generated');
    console.log('📂 Reports directory:', reportsDir);
    
    // Ensure directory exists
    if (!fs.existsSync(reportsDir)) {
      console.log('⚠️ Directory does not exist, creating...');
      fs.mkdirSync(reportsDir, { recursive: true });
      return res.json({ success: true, reports: [] });
    }
    
    // Read all .md files
    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const filePath = path.join(reportsDir, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract title from content (first # heading) or use filename
        let title = file.replace('.md', '');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          title = titleMatch[1];
        }
        
        return {
          filename: file,
          title: title,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt); // Sort by newest first
    
    console.log(`✅ Found ${files.length} reports:`, files.map(f => f.filename));
    res.json({ success: true, reports: files });
  } catch (error) {
    console.error("❌ List Reports Error:", error);
    res.status(500).json({ error: "Failed to list reports" });
  }
});

// Get report content endpoint - retrieves specific report
app.get("/api/get-report/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Sanitize filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    
    const reportsDir = path.join(__dirname, 'Emma_KnowledgeBase/Reports/Generated');
    const filePath = path.join(reportsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ success: true, content });
  } catch (error) {
    console.error("Get Report Error:", error);
    res.status(500).json({ error: "Failed to get report" });
  }
});

// Mount new Google Drive routes
import googleDriveRoutes from "./routes/google-drive-routes.js";
app.use("/api/google-drive", googleDriveRoutes);
const PORT = process.env.PORT || 4000;

// Add global error handlers with logging instead of crashes
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  // Log but don't exit immediately - let server continue if possible
  if (error.code !== 'EADDRINUSE') {
    console.log('⚠️ Server continuing despite error...');
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Log but don't exit - unhandled rejections shouldn't crash server
  console.log('⚠️ Server continuing despite unhandled rejection...');
});

// Start HTTP server with Socket.IO support
import http from "http";
const httpServer = http.createServer(app);

// Initialize Fusion Data Stream Emitter (5 min interval) - TEMPORARILY DISABLED FOR PHASE III
// initializeFusionEmitter(httpServer, 5);
console.log("⚠️ Fusion emitter temporarily disabled for Phase III diagnostics");

// Add fusion emitter health endpoint
app.get("/api/fusion/emitter/health", (_req, res) => {
  res.json({ status: "disabled", message: "Fusion emitter disabled for Phase III diagnostics" });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Emma Backend Server running on http://localhost:${PORT}`);
  console.log(`🔷 Fusion WebSocket available on ws://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
