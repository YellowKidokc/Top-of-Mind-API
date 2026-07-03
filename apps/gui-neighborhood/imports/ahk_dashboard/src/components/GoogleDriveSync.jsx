import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, FolderOpen, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/emmaConfig';

export default function GoogleDriveSync() {
  const [driveStatus, setDriveStatus] = useState({
    personal: { connected: false, syncing: false },
    work: { connected: false, syncing: false }
  });
  const [lastSync, setLastSync] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkDriveStatus();
    
    // Auto-sync every 24 hours
    const interval = setInterval(() => {
      if (!syncInProgress) {
        syncEmmaKnowledge();
      }
    }, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkDriveStatus = async () => {
    try {
      console.log('[GoogleDriveSync] Fetching status from:', `${API_BASE_URL}/api/google-drive/status`);
      const response = await fetch(`${API_BASE_URL}/api/google-drive/status`);
      
      console.log('[GoogleDriveSync] Response status:', response.status);
      console.log('[GoogleDriveSync] Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('[GoogleDriveSync] Raw response:', text.substring(0, 200));
      
      const data = JSON.parse(text);
      console.log('[GoogleDriveSync] Parsed data:', data);
      
      setDriveStatus({
        personal: { connected: data.ok || false, syncing: false },
        work: { connected: false, syncing: false }
      });
      
      if (data.ok) {
        setError(null);
      }
    } catch (err) {
      console.error('[GoogleDriveSync] Failed to check drive status:', err);
      console.error('[GoogleDriveSync] Error stack:', err.stack);
      setError(`Sync Error: ${err.message}`);
    }
  };

  const syncEmmaKnowledge = async () => {
    setSyncInProgress(true);
    setError(null);
    
    try {
      console.log('[GoogleDriveSync] Starting sync to:', `${API_BASE_URL}/api/google-drive/sync`);
      const response = await fetch(`${API_BASE_URL}/api/google-drive/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[GoogleDriveSync] Sync response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('[GoogleDriveSync] Raw sync response:', text.substring(0, 200));
      
      const data = JSON.parse(text);
      console.log('[GoogleDriveSync] Parsed sync data:', data);
      
      if (data.ok || data.success) {
        setLastSync(new Date());
        setError(null);
        console.log('✅ Emma knowledge synced:', data);
        
        // Refresh status after successful sync
        await checkDriveStatus();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('[GoogleDriveSync] Sync error:', err);
      console.error('[GoogleDriveSync] Error stack:', err.stack);
      setError(err.message);
    } finally {
      setSyncInProgress(false);
    }
  };

  const openEmmaFolder = (accountType) => {
    // Open Emma folder in new tab
    window.open(`https://drive.google.com/drive/u/${accountType === 'personal' ? '0' : '1'}/search?q=name:Emma`, '_blank');
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Cloud className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Google Drive Integration</h3>
        </div>
        
        <button
          onClick={syncEmmaKnowledge}
          disabled={syncInProgress}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg transition-all"
        >
          {syncInProgress ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">Sync Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {lastSync && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-300 text-sm">
            Last synced: {lastSync.toLocaleString()}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Drive */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            {driveStatus.personal.connected ? (
              <Cloud className="w-5 h-5 text-green-400" />
            ) : (
              <CloudOff className="w-5 h-5 text-slate-500" />
            )}
            <h4 className="text-white font-semibold">Personal Drive</h4>
          </div>
          
          <p className="text-slate-400 text-sm mb-3">
            ashraf.kahoush@gmail.com
          </p>
          
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${driveStatus.personal.connected ? 'bg-green-400' : 'bg-slate-500'}`} />
            <span className="text-sm text-slate-300">
              {driveStatus.personal.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {driveStatus.personal.connected && (
            <button
              onClick={() => openEmmaFolder('personal')}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm"
            >
              <FolderOpen className="w-4 h-4" />
              Open Emma Folder
            </button>
          )}
        </div>

        {/* Work Drive */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            {driveStatus.work.connected ? (
              <Cloud className="w-5 h-5 text-blue-400" />
            ) : (
              <CloudOff className="w-5 h-5 text-slate-500" />
            )}
            <h4 className="text-white font-semibold">Work Drive</h4>
          </div>
          
          <p className="text-slate-400 text-sm mb-3">
            ashraf@ahkstrategies.net
          </p>
          
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${driveStatus.work.connected ? 'bg-blue-400' : 'bg-slate-500'}`} />
            <span className="text-sm text-slate-300">
              {driveStatus.work.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {driveStatus.work.connected && (
            <button
              onClick={() => openEmmaFolder('work')}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm"
            >
              <FolderOpen className="w-4 h-4" />
              Open Emma Folder
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-sm">
          <strong>Emma Folder Structure:</strong> KnowledgeBase, Instructions, Dictionaries, Logs, Archives
        </p>
        <p className="text-blue-300 text-sm mt-1">
          Auto-syncs every 24 hours. Emma reads from both drives to update her knowledge.
        </p>
      </div>
    </div>
  );
}
