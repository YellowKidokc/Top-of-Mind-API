/**
 * Live Telemetry Collection Script
 * Tracks production system metrics and generates daily reports
 * Run: node telemetry_collector.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TELEMETRY_DIR = path.join(__dirname, 'server/Emma_KnowledgeBase/Reports/Generated');
const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:4000';
const EMMA_ENGINE_URL = process.env.EMMA_ENGINE_URL || process.env.VITE_EMMA_ENGINE_URL || 'http://localhost:7070';

// ==================== TELEMETRY COLLECTION ====================

/**
 * Collect backend health metrics
 */
async function collectBackendMetrics() {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    return {
      status: response.ok ? 'operational' : 'degraded',
      responseTime,
      statusCode: response.status,
      service: data.service || 'unknown',
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      statusCode: 0,
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Collect Emma Engine metrics
 */
async function collectEmmaEngineMetrics() {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${EMMA_ENGINE_URL}/api/health`, {
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    return {
      status: response.ok ? 'operational' : 'degraded',
      responseTime,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      statusCode: 0,
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Collect Drive Sync metrics
 */
async function collectDriveSyncMetrics() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/google-drive/status`, {
      signal: AbortSignal.timeout(5000)
    });
    
    const data = await response.json();
    
    return {
      status: data.ok ? 'operational' : 'idle',
      lastSync: data.lastSync || null,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      status: 'offline',
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Calculate uptime percentage (mock - requires persistent storage)
 */
function calculateUptime(metrics) {
  // In production, this would query a time-series database
  // For now, return based on current metrics
  
  const services = [
    metrics.backend.status === 'operational',
    metrics.emmaEngine.status === 'operational'
  ];
  
  const operational = services.filter(Boolean).length;
  const total = services.length;
  
  return ((operational / total) * 100).toFixed(2);
}

/**
 * Analyze response times
 */
function analyzeResponseTimes(metrics) {
  const times = [
    metrics.backend.responseTime,
    metrics.emmaEngine.responseTime
  ].filter(t => t > 0);
  
  if (times.length === 0) return { avg: 0, min: 0, max: 0 };
  
  return {
    avg: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
    min: Math.min(...times),
    max: Math.max(...times)
  };
}

/**
 * Count recent errors (mock - requires persistent logging)
 */
function countErrors(metrics) {
  // In production, query error logs from last 24h
  let errorCount = 0;
  
  if (metrics.backend.status === 'offline') errorCount++;
  if (metrics.emmaEngine.status === 'offline') errorCount++;
  if (metrics.driveSync.status === 'offline') errorCount++;
  
  return errorCount;
}

// ==================== REPORT GENERATION ====================

/**
 * Generate daily telemetry report
 */
async function generateTelemetryReport() {
  console.log('📊 [Telemetry] Collecting metrics...');
  
  // Collect all metrics
  const [backend, emmaEngine, driveSync] = await Promise.all([
    collectBackendMetrics(),
    collectEmmaEngineMetrics(),
    collectDriveSyncMetrics()
  ]);
  
  const metrics = { backend, emmaEngine, driveSync };
  
  // Calculate statistics
  const uptime = calculateUptime(metrics);
  const responseTimes = analyzeResponseTimes(metrics);
  const errorCount = countErrors(metrics);
  
  // Generate report
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const reportFileName = `Live_Telemetry_Report_${dateStr}.md`;
  const reportPath = path.join(TELEMETRY_DIR, reportFileName);
  
  const report = `# 📊 Live Telemetry Report
**Date**: ${date.toLocaleDateString()}  
**Generated**: ${date.toLocaleString()}  
**Environment**: ${process.env.NODE_ENV || 'development'}

---

## System Health Summary

### Overall Status
- **System Uptime**: ${uptime}%
- **Services Operational**: ${metrics.backend.status === 'operational' ? 1 : 0}/2 core services
- **Error Count (24h)**: ${errorCount}
- **Avg Response Time**: ${responseTimes.avg} ms

### Service Status

#### Backend API (${BACKEND_URL})
- **Status**: ${metrics.backend.status.toUpperCase()}
- **HTTP Code**: ${metrics.backend.statusCode}
- **Response Time**: ${metrics.backend.responseTime} ms
- **Service**: ${metrics.backend.service || 'N/A'}
- **Last Check**: ${new Date(metrics.backend.timestamp).toLocaleString()}
${metrics.backend.error ? `- **Error**: ${metrics.backend.error}` : ''}

#### Emma Engine (${EMMA_ENGINE_URL})
- **Status**: ${metrics.emmaEngine.status.toUpperCase()}
- **HTTP Code**: ${metrics.emmaEngine.statusCode}
- **Response Time**: ${metrics.emmaEngine.responseTime} ms
- **Last Check**: ${new Date(metrics.emmaEngine.timestamp).toLocaleString()}
${metrics.emmaEngine.error ? `- **Error**: ${metrics.emmaEngine.error}` : ''}

#### Drive Sync
- **Status**: ${metrics.driveSync.status.toUpperCase()}
- **Last Sync**: ${metrics.driveSync.lastSync || 'Never'}
- **Last Check**: ${new Date(metrics.driveSync.timestamp).toLocaleString()}
${metrics.driveSync.error ? `- **Error**: ${metrics.driveSync.error}` : ''}

---

## Performance Metrics

### Response Time Analysis
- **Average**: ${responseTimes.avg} ms
- **Minimum**: ${responseTimes.min} ms
- **Maximum**: ${responseTimes.max} ms

### Service Availability
| Service | Status | Response Time |
|---------|--------|---------------|
| Backend API | ${metrics.backend.status === 'operational' ? '✅' : '❌'} ${metrics.backend.status} | ${metrics.backend.responseTime} ms |
| Emma Engine | ${metrics.emmaEngine.status === 'operational' ? '✅' : '❌'} ${metrics.emmaEngine.status} | ${metrics.emmaEngine.responseTime} ms |
| Drive Sync | ${metrics.driveSync.status === 'operational' ? '✅' : metrics.driveSync.status === 'idle' ? '🟡' : '❌'} ${metrics.driveSync.status} | N/A |

---

## Usage Statistics

*Note: Full usage tracking requires analytics integration (Phase VIII)*

### Placeholder Metrics (Pending Implementation):
- **Fusion Requests (24h)**: N/A
- **Emma Chat Messages**: N/A
- **Drive Sync Cycles**: N/A
- **Unique Users**: N/A
- **API Calls**: N/A

---

## Recommendations

${uptime < 90 ? '⚠️ **Action Required**: System uptime below 90%. Investigate service degradation.' : ''}
${responseTimes.avg > 1000 ? '⚠️ **Performance**: Average response time exceeds 1000ms. Consider optimization.' : ''}
${errorCount > 5 ? '⚠️ **Errors**: High error count detected. Review logs for root cause.' : ''}
${uptime >= 99 && responseTimes.avg < 500 && errorCount === 0 ? '✅ **Excellent**: All systems performing optimally.' : ''}

---

## Next Steps

1. ${metrics.backend.status !== 'operational' ? '🔴 Fix backend connectivity issues' : '✅ Backend operational'}
2. ${metrics.emmaEngine.status !== 'operational' ? '🔴 Fix Emma Engine connectivity' : '✅ Emma Engine operational'}
3. ${metrics.driveSync.status === 'offline' ? '🔴 Fix Drive Sync authentication' : '✅ Drive Sync configured'}
4. Integrate analytics for detailed usage tracking (Phase VIII)
5. Set up alerting for downtime events

---

**Report Generated By**: MEGA-EMMA Telemetry Collector  
**Next Report**: ${new Date(date.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}

---

*Automated Report - For Questions Contact System Administrator*
`;

  // Ensure directory exists
  if (!fs.existsSync(TELEMETRY_DIR)) {
    fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
  }
  
  // Write report
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`✅ [Telemetry] Report generated: ${reportFileName}`);
  console.log(`   Uptime: ${uptime}%`);
  console.log(`   Avg Response: ${responseTimes.avg} ms`);
  console.log(`   Errors: ${errorCount}`);
  
  return {
    success: true,
    reportPath,
    metrics: {
      uptime,
      responseTimes,
      errorCount,
      services: metrics
    }
  };
}

// ==================== SCHEDULED EXECUTION ====================

/**
 * Schedule daily telemetry collection (runs at 8:00 AM daily)
 */
export function scheduleTelemetryCollection() {
  console.log('⏰ [Telemetry] Scheduler starting...');
  console.log('   Collection runs daily at 8:00 AM');
  
  // Import cron dynamically
  import('node-cron').then(({ default: cron }) => {
    // Schedule for 8:00 AM daily
    cron.schedule('0 8 * * *', () => {
      console.log('\n⏰ [Telemetry] Scheduled collection triggered');
      generateTelemetryReport();
    });
    
    console.log('✅ [Telemetry] Scheduler active');
  });
}

// ==================== MAIN ====================

// Check if running as main module
const isMain = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMain || process.argv[1].includes('telemetry_collector')) {
  console.log('🚀 Telemetry Collection - Manual Execution');
  generateTelemetryReport()
    .then(result => {
      console.log('\n📊 Final Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('\n🚨 Fatal Error:', err);
      process.exit(1);
    });
}

export default {
  generateTelemetryReport,
  scheduleTelemetryCollection,
  collectBackendMetrics,
  collectEmmaEngineMetrics,
  collectDriveSyncMetrics
};
