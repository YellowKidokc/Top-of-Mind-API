/**
 * Emma Engine - Intelligence Core & Orchestration Layer
 * Port 7070 | AHK Strategies Dashboard Ecosystem
 * 
 * Handles:
 * - Voice recognition & text-to-speech
 * - Cross-division Emma communication
 * - Memo fusion & report orchestration
 * - Executive reasoning (MEGA-EMMA logic)
 * - Knowledge base synchronization
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import voiceRouter from './routes/voice.js';
import fusionRouter from './routes/fusion.js';
import syncRouter from './routes/sync.js';

// Core imports
import { initializeScheduler } from './core/scheduler.js';
import { orchestrator } from './core/orchestrator.js';

// Configure environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

const app = express();
const PORT = process.env.EMMA_ENGINE_PORT || 7070;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[Emma Engine] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Emma Engine',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🧠 Emma Engine Online',
    status: 'operational',
    capabilities: [
      'Voice Recognition & TTS',
      'Memo Fusion & Reports',
      'Knowledge Base Sync',
      'MEGA-EMMA Orchestration',
      'Cross-Division Communication'
    ],
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      voice: '/api/voice/*',
      fusion: '/api/fusion/*',
      sync: '/api/sync/*'
    }
  });
});

// API Routes
app.use('/api/voice', voiceRouter);
app.use('/api/fusion', fusionRouter);
app.use('/api/sync', syncRouter);

// Chat endpoint (main Emma assistant interface)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[Emma Engine] Processing chat message: "${message.substring(0, 50)}..."`);
    
    // Process through orchestrator
    const response = await orchestrator.processMessage({
      message,
      context: context || {},
      sessionId: sessionId || 'default'
    });

    res.json(response);
  } catch (error) {
    console.error('[Emma Engine] Chat error:', error);
    res.status(500).json({
      error: 'Emma Engine processing error',
      message: error.message
    });
  }
});

// Session management
app.post('/api/session', (req, res) => {
  const sessionId = req.body.sessionId || `session-${Date.now()}`;
  res.json({
    sessionId,
    created: new Date().toISOString(),
    status: 'active'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Emma Engine] Error:', err);
  res.status(500).json({
    error: 'Internal Emma Engine error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🧠 ════════════════════════════════════════════════════════');
  console.log('   EMMA ENGINE - Intelligence Core Online');
  console.log('   ════════════════════════════════════════════════════════');
  console.log(`   🌐 Server:    http://localhost:${PORT}`);
  console.log(`   📡 Health:    http://localhost:${PORT}/health`);
  console.log(`   💬 Chat API:  http://localhost:${PORT}/api/chat`);
  console.log('   ════════════════════════════════════════════════════════');
  console.log(`   ⏰ Started:   ${new Date().toLocaleString()}`);
  console.log('   🔧 Mode:      Development');
  console.log('   ════════════════════════════════════════════════════════\n');
  
  // Initialize scheduler for cron jobs
  initializeScheduler();
  console.log('   ✅ Scheduler initialized');
  console.log('   ✅ Orchestrator ready');
  console.log('   ✅ All systems operational\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Emma Engine] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n[Emma Engine] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
