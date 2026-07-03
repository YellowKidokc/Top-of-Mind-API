// src/components/FusionFeed.jsx
// Real-time Fusion Data Stream Component - Displays live dashboard metrics

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Activity, TrendingUp, Database, Cloud, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from '../config/emmaConfig';

const FusionFeed = () => {
  const [fusionData, setFusionData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [feedHistory, setFeedHistory] = useState([]);
  const [pulseAnimation, setPulseAnimation] = useState({});
  
  const socketRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // WebSocket connection
  useEffect(() => {
    console.log("🔷 FusionFeed: Initializing WebSocket connection...");
    
    // Connect to backend WebSocket
    const socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    socketRef.current = socket;
    
    // Connection handlers
    socket.on("connect", () => {
      console.log("✅ FusionFeed: WebSocket connected");
      setConnectionStatus("connected");
    });
    
    socket.on("disconnect", () => {
      console.log("❌ FusionFeed: WebSocket disconnected");
      setConnectionStatus("disconnected");
    });
    
    socket.on("connect_error", (err) => {
      console.error("❌ FusionFeed: Connection error:", err.message);
      setConnectionStatus("error");
    });
    
    // Fusion data handler
    socket.on("fusionUpdate", (data) => {
      console.log("📥 FusionFeed: Received update", data);
      
      // Detect changes and trigger pulse animations
      if (fusionData) {
        const changes = {};
        if (data.memos !== fusionData.memos) changes.memos = true;
        if (data.revenue !== fusionData.revenue) changes.revenue = true;
        if (data.driveSync !== fusionData.driveSync) changes.driveSync = true;
        if (data.recommendations !== fusionData.recommendations) changes.recommendations = true;
        
        if (Object.keys(changes).length > 0) {
          setPulseAnimation(changes);
          setTimeout(() => setPulseAnimation({}), 2000); // Clear after 2s
        }
      }
      
      setFusionData(data);
      setLastUpdate(new Date());
      
      // Add to history (keep last 3)
      setFeedHistory((prev) => {
        const newHistory = [
          {
            timestamp: data.timestamp,
            memos: data.memos,
            revenue: data.revenue,
            driveSync: data.driveSync,
            recommendations: data.recommendations,
          },
          ...prev,
        ].slice(0, 3);
        return newHistory;
      });
      
      // Reset timeout warning
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        console.warn("⚠️ FusionFeed: No data received for 10 minutes");
        setConnectionStatus("stale");
      }, 10 * 60 * 1000); // 10 minutes
    });
    
    // Cleanup
    return () => {
      console.log("🔴 FusionFeed: Disconnecting WebSocket");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket.disconnect();
    };
  }, []);
  
  // Manual refresh handler
  const handleRefresh = () => {
    if (socketRef.current && socketRef.current.connected) {
      console.log("🔄 FusionFeed: Requesting manual refresh");
      socketRef.current.emit("fusionRefresh");
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  
  // Connection status badge
  const getStatusBadge = () => {
    const statusConfig = {
      connecting: { color: "bg-yellow-500", text: "Connecting...", icon: "⏳" },
      connected: { color: "bg-green-500", text: "Live", icon: "🟢" },
      disconnected: { color: "bg-red-500", text: "Disconnected", icon: "🔴" },
      error: { color: "bg-red-600", text: "Error", icon: "❌" },
      stale: { color: "bg-orange-500", text: "Stale Data", icon: "⚠️" },
    };
    
    const config = statusConfig[connectionStatus] || statusConfig.connecting;
    
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}></span>
        <span className="text-xs text-gray-400">{config.text}</span>
      </div>
    );
  };
  
  // Gold pulse animation class
  const getPulseClass = (field) => {
    return pulseAnimation[field]
      ? "animate-pulse bg-[#D4AF37] bg-opacity-20 transition-all duration-500"
      : "";
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-[#D4AF37]" />
          <h3 className="text-xl font-bold text-white">Fusion Data Stream</h3>
        </div>
        
        <div className="flex items-center gap-4">
          {getStatusBadge()}
          <button
            onClick={handleRefresh}
            disabled={connectionStatus !== "connected"}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* No Data Warning */}
      {connectionStatus === "stale" && (
        <div className="mb-4 p-3 bg-orange-500 bg-opacity-10 border border-orange-500 rounded flex items-center gap-2 text-orange-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">⚠️ No data pulse – check backend</span>
        </div>
      )}
      
      {/* Live Metrics */}
      {fusionData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Memos */}
          <div className={`p-4 bg-gray-700 rounded-lg ${getPulseClass("memos")}`}>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Memos</span>
            </div>
            <div className="text-2xl font-bold text-white">{fusionData.memos}</div>
          </div>
          
          {/* Revenue */}
          <div className={`p-4 bg-gray-700 rounded-lg ${getPulseClass("revenue")}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">MRR</span>
            </div>
            <div className="text-2xl font-bold text-white">${fusionData.revenue.toLocaleString()}</div>
          </div>
          
          {/* Drive Sync */}
          <div className={`p-4 bg-gray-700 rounded-lg ${getPulseClass("driveSync")}`}>
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Drive</span>
            </div>
            <div className={`text-lg font-bold ${
              fusionData.driveSync === "OK" ? "text-green-400" : "text-red-400"
            }`}>
              {fusionData.driveSync}
            </div>
          </div>
          
          {/* Recommendations */}
          <div className={`p-4 bg-gray-700 rounded-lg ${getPulseClass("recommendations")}`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs text-gray-400">ERIC Recs</span>
            </div>
            <div className="text-2xl font-bold text-white">{fusionData.recommendations}</div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-8 bg-gray-700 rounded-lg text-center">
          <Activity className="w-12 h-12 text-gray-500 mx-auto mb-2 animate-spin" />
          <p className="text-gray-400">Waiting for fusion data...</p>
        </div>
      )}
      
      {/* Update Timestamp */}
      {lastUpdate && (
        <div className="mb-4 text-xs text-gray-500 text-center">
          Last update: {formatTime(lastUpdate)}
        </div>
      )}
      
      {/* Feed History - Auto-scroll log */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Updates</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {feedHistory.length > 0 ? (
            feedHistory.map((entry, idx) => (
              <div
                key={idx}
                className="p-2 bg-gray-700 rounded text-xs text-gray-300 flex justify-between items-center"
              >
                <span className="font-mono">{formatTime(entry.timestamp)}</span>
                <span>
                  {entry.memos}M · ${entry.revenue}R · {entry.driveSync} · {entry.recommendations}E
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 text-center py-4">No updates yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FusionFeed;
