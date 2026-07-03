import { useState, useEffect } from 'react';
import { Activity, Server, Cloud, Zap, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/emmaConfig';

/**
 * SystemStatusWidget - Real-time system health monitoring
 * Displays Fusion Score, Backend/Emma Engine status, Drive Sync state
 */
export default function SystemStatusWidget() {
  const [status, setStatus] = useState({
    fusionScore: 84,
    backendStatus: 'checking',
    emmaEngineStatus: 'checking',
    driveSyncStatus: 'idle',
    lastSync: null,
    backendPort: 4000,
    emmaEnginePort: 7070
  });

  const [loading, setLoading] = useState(true);

  // Check backend health
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        timeout: 3000
      });
      const data = await response.json();
      return data.status === 'healthy' ? 'operational' : 'degraded';
    } catch (err) {
      console.error('[SystemStatus] Backend check failed:', err);
      return 'offline';
    }
  };

  // Check Emma Engine health
  const checkEmmaEngineHealth = async () => {
    try {
      const response = await fetch('http://localhost:7070/api/health', {
        timeout: 3000
      });
      const data = await response.json();
      return data.status === 'healthy' ? 'operational' : 'degraded';
    } catch (err) {
      console.error('[SystemStatus] Emma Engine check failed:', err);
      return 'offline';
    }
  };

  // Check Drive sync status (from backend endpoint)
  const checkDriveSyncStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google-drive/status`, {
        timeout: 3000
      });
      const data = await response.json();
      return data.ok ? 'operational' : 'idle';
    } catch (err) {
      console.error('[SystemStatus] Drive sync check failed:', err);
      return 'offline';
    }
  };

  // Update all system status
  const updateSystemStatus = async () => {
    setLoading(true);
    
    const [backendStatus, emmaEngineStatus, driveSyncStatus] = await Promise.all([
      checkBackendHealth(),
      checkEmmaEngineHealth(),
      checkDriveSyncStatus()
    ]);

    setStatus(prev => ({
      ...prev,
      backendStatus,
      emmaEngineStatus,
      driveSyncStatus,
      lastSync: new Date().toISOString()
    }));

    setLoading(false);
  };

  // Poll system status every 10 seconds
  useEffect(() => {
    updateSystemStatus();

    const interval = setInterval(() => {
      updateSystemStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Get status color
  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case 'operational':
        return 'text-emerald-400';
      case 'degraded':
      case 'idle':
        return 'text-amber-400';
      case 'offline':
      case 'error':
        return 'text-red-500';
      case 'checking':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  // Get status icon
  const getStatusIcon = (statusValue) => {
    if (statusValue === 'operational') {
      return '●';
    } else if (statusValue === 'offline' || statusValue === 'error') {
      return '✕';
    } else if (statusValue === 'checking') {
      return '◐';
    } else {
      return '◐';
    }
  };

  // Get overall system health
  const getOverallHealth = () => {
    const statuses = [status.backendStatus, status.emmaEngineStatus];
    
    if (statuses.every(s => s === 'operational')) {
      return { label: 'Healthy', color: 'text-emerald-400' };
    } else if (statuses.some(s => s === 'offline' || s === 'error')) {
      return { label: 'Degraded', color: 'text-red-500' };
    } else {
      return { label: 'Partial', color: 'text-amber-400' };
    }
  };

  const overallHealth = getOverallHealth();

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">System Status</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${overallHealth.color}`}>
            {overallHealth.label}
          </span>
          {loading && (
            <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Fusion Score */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h4 className="text-white font-semibold text-sm">Fusion Pipeline</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{status.fusionScore}</span>
            <span className="text-lg text-slate-400">/100</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">AI Processing Score</p>
        </div>

        {/* Backend Status */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h4 className="text-white font-semibold text-sm">Backend API</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${getStatusColor(status.backendStatus)}`}>
              {getStatusIcon(status.backendStatus)}
            </span>
            <span className={`text-sm font-semibold ${getStatusColor(status.backendStatus)}`}>
              {status.backendStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Port {status.backendPort}</p>
        </div>

        {/* Emma Engine Status */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <h4 className="text-white font-semibold text-sm">Emma Engine</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${getStatusColor(status.emmaEngineStatus)}`}>
              {getStatusIcon(status.emmaEngineStatus)}
            </span>
            <span className={`text-sm font-semibold ${getStatusColor(status.emmaEngineStatus)}`}>
              {status.emmaEngineStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Port {status.emmaEnginePort}</p>
        </div>

        {/* Drive Sync Status */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <h4 className="text-white font-semibold text-sm">Drive Sync</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${getStatusColor(status.driveSyncStatus)}`}>
              {getStatusIcon(status.driveSyncStatus)}
            </span>
            <span className={`text-sm font-semibold ${getStatusColor(status.driveSyncStatus)}`}>
              {status.driveSyncStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {status.lastSync ? `Last: ${new Date(status.lastSync).toLocaleTimeString()}` : 'No recent sync'}
          </p>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          Last updated: {status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Loading...'}
        </p>
      </div>

      {/* Alert Banner (if any service is offline) */}
      {(status.backendStatus === 'offline' || status.emmaEngineStatus === 'offline') && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Service Degradation Detected</p>
            <p className="text-red-300 text-xs mt-1">
              One or more critical services are offline. Check terminal logs for details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
