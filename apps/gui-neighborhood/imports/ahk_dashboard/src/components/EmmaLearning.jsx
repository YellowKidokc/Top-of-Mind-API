import { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Activity,
  Zap,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  getLearningInsights,
  exportLearningData,
  resetLearning
} from '../ai/EmmaCore.mjs';
import { startSelfLearning, stopSelfLearning, isSelfLearningActive, forceLearningCycle } from '../ai/selfLearner.mjs';
import GoogleDriveSync from './GoogleDriveSync';

export default function EmmaLearning() {
  const [insights, setInsights] = useState(null);
  const [isLearningActive, setIsLearningActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Load initial insights
    refreshInsights();
    
    // Check if self-learning is active
    setIsLearningActive(isSelfLearningActive());
    
    // Listen for learning updates
    const handleLearningUpdate = (event) => {
      setInsights(event.detail);
      setLastUpdate(new Date());
    };
    
    window.addEventListener('emma-learning-update', handleLearningUpdate);
    
    return () => {
      window.removeEventListener('emma-learning-update', handleLearningUpdate);
    };
  }, []);

  const refreshInsights = () => {
    const data = getLearningInsights();
    setInsights(data);
    setLastUpdate(new Date());
  };

  const toggleSelfLearning = () => {
    if (isLearningActive) {
      stopSelfLearning();
      setIsLearningActive(false);
    } else {
      startSelfLearning(30); // 30 minutes
      setIsLearningActive(true);
    }
  };

  const handleForceUpdate = () => {
    forceLearningCycle();
    setTimeout(refreshInsights, 500);
  };

  const handleExport = () => {
    const data = exportLearningData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emma-learning-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('🧠 Reset all of Emma\'s learning data? This cannot be undone.')) {
      resetLearning();
      refreshInsights();
    }
  };

  if (!insights) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-ahk-gold-500/20 rounded-full blur-2xl animate-pulse" />
            <Brain className="relative w-20 h-20 mx-auto mb-4 text-ahk-gold-400 animate-logo-pulse" />
          </div>
          <p className="text-xl text-white font-semibold">Loading Emma's cognitive core...</p>
        </div>
      </div>
    );
  }

  const { summary, styleModel, recommendations } = insights;

  return (
    <div className="min-h-screen p-6">
      {/* Header - Premium Gold Gradient */}
      <div className="mb-8 relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ahk-gold-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-4 mb-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 rounded-full blur-xl opacity-50" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 shadow-gold-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-black text-gradient-gold">Emma's Learning Intelligence</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-ahk-slate-200 text-lg">Self-optimizing AI with adaptive communication & pattern recognition</p>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-ahk-green-500/30 to-ahk-green-400/30 rounded-full border border-ahk-green-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-ahk-green-400 animate-pulse" />
                <span className="text-xs text-ahk-green-300 font-semibold">Last updated: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls - Premium Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={toggleSelfLearning}
          className={`relative overflow-hidden p-6 rounded-xl border-2 transition-all duration-300 group ${
            isLearningActive
              ? 'bg-gradient-to-br from-ahk-green-500/20 to-ahk-green-400/20 border-ahk-green-500 shadow-xl'
              : 'bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border-ahk-gold-500/20 hover:border-ahk-green-500/50 hover:shadow-gold-md'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/5 via-transparent to-ahk-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Zap className={`w-8 h-8 mx-auto mb-3 relative ${isLearningActive ? 'text-ahk-green-400 animate-glow-pulse' : 'text-ahk-gold-400'}`} />
          <span className={`font-bold text-lg relative ${isLearningActive ? 'text-ahk-green-300' : 'text-white'}`}>
            {isLearningActive ? 'Active' : 'Paused'}
          </span>
        </button>

        <button
          onClick={handleForceUpdate}
          className="relative overflow-hidden p-6 rounded-xl border-2 bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border-ahk-gold-500/20 hover:border-ahk-blue-500/50 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/5 via-transparent to-ahk-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <RefreshCw className="w-8 h-8 mx-auto mb-3 text-ahk-blue-400 relative group-hover:rotate-180 transition-transform duration-500" />
          <span className="font-bold text-lg text-white relative">Analyze Now</span>
        </button>

        <button
          onClick={handleExport}
          className="relative overflow-hidden p-6 rounded-xl border-2 bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border-ahk-gold-500/20 hover:border-ahk-gold-500/50 hover:shadow-gold-md transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/5 via-transparent to-ahk-gold-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Download className="w-8 h-8 mx-auto mb-3 text-ahk-gold-400 relative group-hover:translate-y-1 transition-transform duration-300" />
          <span className="font-bold text-lg text-white relative">Export Data</span>
        </button>

        <button
          onClick={handleReset}
          className="relative overflow-hidden p-6 rounded-xl border-2 bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border-ahk-gold-500/20 hover:border-red-500/50 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Trash2 className="w-8 h-8 mx-auto mb-3 text-red-400 relative group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bold text-lg text-white relative">Reset</span>
        </button>
      </div>

      {/* Style Model Card - Premium Glass */}
      <div className="relative overflow-hidden bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/30 rounded-2xl p-8 mb-8 shadow-gold-lg group">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-ahk-gold-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/5 via-transparent to-ahk-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gradient-to-br from-ahk-gold-500/20 to-ahk-gold-400/20 border border-ahk-gold-500/30">
              <Target className="w-8 h-8 text-ahk-gold-400" />
            </div>
            <h2 className="text-3xl font-black text-gradient-gold">Current Communication Style</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <p className="text-7xl font-black text-gradient-gold mb-3">
                {styleModel.current}
              </p>
              <p className="text-ahk-slate-200 text-lg">Adaptive style profile</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-ahk-navy-500/30 rounded-lg border border-ahk-gold-500/10">
                <span className="text-ahk-slate-200 font-semibold">Acceptance Rate:</span>
                <span className="text-white font-black text-xl text-gradient-gold">{styleModel.acceptanceRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-ahk-navy-500/30 rounded-lg border border-ahk-gold-500/10">
                <span className="text-ahk-slate-200 font-semibold">Verbosity:</span>
                <span className="text-white font-bold">{styleModel.adjustments.verbosity}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-ahk-navy-500/30 rounded-lg border border-ahk-gold-500/10">
                <span className="text-ahk-slate-200 font-semibold">Empathy:</span>
                <span className="text-white font-bold">{styleModel.adjustments.empathy}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-ahk-navy-500/30 rounded-lg border border-ahk-gold-500/10">
                <span className="text-ahk-slate-200 font-semibold">Proactivity:</span>
                <span className="text-white font-bold">{styleModel.adjustments.proactivity}</span>
              </div>
            </div>
          </div>

          {/* Acceptance Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-ahk-slate-200 font-semibold text-lg">Response Quality</span>
              <span className="text-white font-black text-xl text-gradient-gold">{styleModel.acceptanceRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-ahk-navy-700/50 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-ahk-gold-500/20">
              <div
                className="h-full bg-gradient-to-r from-ahk-gold-500 via-ahk-blue-500 to-ahk-gold-500 transition-all duration-500 shadow-gold-md"
                style={{ 
                  width: `${Math.min(styleModel.acceptanceRate, 100)}%`,
                  animation: 'gradientShift 8s ease infinite'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ahk-gold-500 via-ahk-blue-500 to-ahk-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Learning Summary - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-blue-500/30 rounded-xl p-6 shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-ahk-blue-500/5 via-transparent to-ahk-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Activity className="w-10 h-10 text-ahk-blue-400 mb-4 relative" />
          <p className="text-4xl font-black text-white mb-2 relative">{summary.total}</p>
          <p className="text-ahk-slate-200 text-sm font-semibold relative">Total Interactions</p>
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-ahk-blue-500/20 rounded-full blur-2xl" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-orange-500/30 rounded-xl p-6 shadow-xl hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Clock className="w-10 h-10 text-orange-400 mb-4 relative" />
          <p className="text-4xl font-black text-white mb-2 relative">{summary.peakHour}:00</p>
          <p className="text-ahk-slate-200 text-sm font-semibold relative">Peak Activity Hour</p>
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-green-500/30 rounded-xl p-6 shadow-xl hover:shadow-green-500/30 hover:scale-105 transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-ahk-green-500/5 via-transparent to-ahk-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CheckCircle className="w-10 h-10 text-ahk-green-400 mb-4 relative" />
          <p className="text-4xl font-black text-white mb-2 relative">{summary.accepted}</p>
          <p className="text-ahk-slate-200 text-sm font-semibold relative">Accepted Responses</p>
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-ahk-green-500/20 rounded-full blur-2xl" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 shadow-xl hover:shadow-red-500/30 hover:scale-105 transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <AlertCircle className="w-10 h-10 text-red-400 mb-4 relative" />
          <p className="text-4xl font-black text-white mb-2 relative">{summary.rejected}</p>
          <p className="text-ahk-slate-200 text-sm font-semibold relative">Rejected Responses</p>
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-red-500/20 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Most Used Command - Premium Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/30 rounded-xl p-8 mb-8 shadow-gold-lg group">
        <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/5 via-transparent to-ahk-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gradient-to-br from-ahk-blue-500/20 to-ahk-blue-400/20 border border-ahk-blue-500/30">
              <TrendingUp className="w-8 h-8 text-ahk-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-white">Top Command</h3>
          </div>
          <p className="text-5xl font-black text-gradient-electric mb-4">{summary.topCommand}</p>
          <p className="text-ahk-slate-200 text-lg">{summary.insight}</p>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ahk-gold-500 via-ahk-blue-500 to-ahk-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Recommendations - Premium Cards */}
      {recommendations.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/30 rounded-xl p-8 shadow-gold-lg group">
          <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/5 via-transparent to-ahk-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-gradient-to-br from-ahk-green-500/20 to-ahk-green-400/20 border border-ahk-green-500/30">
                <Brain className="w-8 h-8 text-ahk-green-400" />
              </div>
              <h3 className="text-2xl font-black text-white">AI Recommendations</h3>
            </div>
            
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`relative overflow-hidden p-6 rounded-lg border-l-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${
                    rec.priority === 'high'
                      ? 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500'
                      : 'bg-gradient-to-br from-ahk-blue-500/10 to-ahk-blue-400/10 border-ahk-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        rec.priority === 'high' ? 'text-orange-400' : 'text-ahk-blue-400'
                      }`}>
                        {rec.type}
                      </span>
                      <p className="text-white mt-2 text-lg">{rec.message}</p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                        rec.priority === 'high'
                          ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                          : 'bg-ahk-blue-500/30 text-ahk-blue-300 border border-ahk-blue-500/50'
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ahk-gold-500 via-ahk-green-500 to-ahk-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      )}

      {/* Google Drive Sync Integration */}
      <div className="mt-8">
        <GoogleDriveSync />
      </div>
    </div>
  );
}
