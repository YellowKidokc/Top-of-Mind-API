// server/services/fusionEmitter.js
// Fusion Data Stream Emitter - WebSocket service for real-time dashboard updates

import { Server } from "socket.io";
import { aggregateFusionData } from "../routes/fusion.js";

// ---------- CONFIGURATION ----------
const EMISSION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes (default)
let emissionIntervalId = null;
let io = null;
let isActive = false;

// Performance tracking
const metrics = {
  totalEmissions: 0,
  lastEmissionTime: null,
  failedEmissions: 0,
  connectedClients: 0,
  startTime: null,
};

// ---------- INITIALIZE WEBSOCKET SERVER ----------
export function initializeFusionEmitter(httpServer, intervalMinutes = 5) {
  console.log("\n🔷 Initializing Fusion Data Stream Emitter...");
  
  // Create Socket.IO server
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:4000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });
  
  // Connection handlers
  io.on("connection", (socket) => {
    metrics.connectedClients++;
    console.log(`✅ Fusion client connected [ID: ${socket.id}] - Total clients: ${metrics.connectedClients}`);
    
    // Send immediate update on connection
    try {
      const fusionData = aggregateFusionData();
      socket.emit("fusionUpdate", fusionData);
      console.log(`📤 Sent initial fusion data to ${socket.id}`);
    } catch (err) {
      console.error(`❌ Failed to send initial data to ${socket.id}:`, err.message);
      // Don't crash - send error response instead
      socket.emit("fusionError", { message: err.message });
    }
    
    // Disconnection handler
    socket.on("disconnect", () => {
      metrics.connectedClients--;
      console.log(`❌ Fusion client disconnected [ID: ${socket.id}] - Total clients: ${metrics.connectedClients}`);
    });
    
    // Client-requested refresh
    socket.on("fusionRefresh", () => {
      try {
        const fusionData = aggregateFusionData();
        socket.emit("fusionUpdate", fusionData);
        console.log(`🔄 Manual refresh requested by ${socket.id}`);
      } catch (err) {
        console.error(`❌ Manual refresh failed for ${socket.id}:`, err.message);
      }
    });
  });
  
  // Start emission loop
  const intervalMs = intervalMinutes * 60 * 1000;
  startEmissionLoop(intervalMs);
  
  metrics.startTime = new Date();
  isActive = true;
  
  console.log(`🟢 Fusion Data Stream Active – Interval: ${intervalMinutes} min`);
  console.log(`📡 WebSocket server listening for connections...\n`);
  
  return io;
}

// ---------- EMISSION LOOP ----------
function startEmissionLoop(intervalMs) {
  // Clear existing interval if any
  if (emissionIntervalId) {
    clearInterval(emissionIntervalId);
  }
  
  emissionIntervalId = setInterval(() => {
    emitFusionUpdate();
  }, intervalMs);
  
  console.log(`⏰ Emission loop started with ${intervalMs / 1000 / 60} minute interval`);
}

// ---------- EMIT FUSION UPDATE ----------
function emitFusionUpdate() {
  if (!io || !isActive) {
    console.warn("⚠️ Fusion emitter not active, skipping emission");
    return;
  }
  
  try {
    const fusionData = aggregateFusionData();
    
    // Broadcast to all connected clients
    io.emit("fusionUpdate", fusionData);
    
    metrics.totalEmissions++;
    metrics.lastEmissionTime = new Date();
    
    console.log(`📤 Fusion update emitted [${metrics.totalEmissions}] at ${fusionData.timestamp}`);
    console.log(`   └─ Connected clients: ${metrics.connectedClients}`);
    console.log(`   └─ Data: ${fusionData.memos} memos, $${fusionData.revenue} MRR, Drive: ${fusionData.driveSync}`);
  } catch (err) {
    metrics.failedEmissions++;
    console.error(`❌ Fusion emission failed [${metrics.failedEmissions}]:`, err.message);
    // Don't crash the server - just log and continue
  }
}

// ---------- MANUAL TRIGGER ----------
export function triggerManualEmission() {
  console.log("🔄 Manual fusion emission triggered");
  emitFusionUpdate();
}

// ---------- CHANGE EMISSION INTERVAL ----------
export function setEmissionInterval(minutes) {
  const intervalMs = minutes * 60 * 1000;
  console.log(`⚙️ Changing emission interval to ${minutes} minutes`);
  startEmissionLoop(intervalMs);
  return {
    ok: true,
    newInterval: minutes,
    message: `Emission interval updated to ${minutes} minutes`,
  };
}

// ---------- GET METRICS ----------
export function getEmitterMetrics() {
  const uptime = metrics.startTime 
    ? Math.floor((Date.now() - metrics.startTime.getTime()) / 1000) 
    : 0;
  
  return {
    isActive,
    uptime,
    totalEmissions: metrics.totalEmissions,
    failedEmissions: metrics.failedEmissions,
    connectedClients: metrics.connectedClients,
    lastEmissionTime: metrics.lastEmissionTime ? metrics.lastEmissionTime.toISOString() : null,
    startTime: metrics.startTime ? metrics.startTime.toISOString() : null,
  };
}

// ---------- STOP EMITTER ----------
export function stopFusionEmitter() {
  if (emissionIntervalId) {
    clearInterval(emissionIntervalId);
    emissionIntervalId = null;
  }
  
  if (io) {
    io.close();
    io = null;
  }
  
  isActive = false;
  console.log("🔴 Fusion Data Stream stopped");
  
  return {
    ok: true,
    message: "Fusion emitter stopped",
    finalMetrics: getEmitterMetrics(),
  };
}

// ---------- HEALTH CHECK ----------
export function getFusionEmitterHealth() {
  return {
    ok: isActive,
    status: isActive ? "active" : "stopped",
    metrics: getEmitterMetrics(),
    timestamp: new Date().toISOString(),
  };
}

export default {
  initializeFusionEmitter,
  triggerManualEmission,
  setEmissionInterval,
  getEmitterMetrics,
  stopFusionEmitter,
  getFusionEmitterHealth,
};
