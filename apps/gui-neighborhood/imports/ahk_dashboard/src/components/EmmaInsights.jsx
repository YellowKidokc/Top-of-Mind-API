import { useState, useEffect } from 'react';
import emmaMemory from '../ai/emmaMemory';
import { Brain, TrendingUp, Clock, Command, BarChart3, Target } from 'lucide-react';

export default function EmmaInsights() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Load stats
    const loadStats = () => {
      const memoryStats = emmaMemory.getStats();
      setStats(memoryStats);
    };

    loadStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return null;
  }

  const formatHour = (hour) => {
    if (hour === null) return 'Learning...';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const insightCards = [
    {
      icon: Command,
      label: 'Total Commands',
      value: stats.totalCommands,
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/50',
    },
    {
      icon: BarChart3,
      label: 'Reports Generated',
      value: stats.totalReports,
      color: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/50',
    },
    {
      icon: Clock,
      label: 'Peak Hour',
      value: formatHour(stats.peakHour),
      color: 'from-orange-500 to-amber-500',
      glow: 'shadow-orange-500/50',
    },
    {
      icon: TrendingUp,
      label: 'Reports/Week',
      value: stats.reportsPerWeek,
      color: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/50',
    },
    {
      icon: Target,
      label: 'Favorite Command',
      value: stats.mostUsedCommand || 'None yet',
      color: 'from-indigo-500 to-purple-500',
      glow: 'shadow-indigo-500/50',
      small: true,
    },
    {
      icon: Brain,
      label: 'Suggestion Success',
      value: `${stats.suggestionAcceptance}%`,
      color: 'from-rose-500 to-pink-500',
      glow: 'shadow-rose-500/50',
    },
  ];

  return (
    <div className="p-6">
      {/* Header - Premium Gold Gradient */}
      <div className="mb-8 relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ahk-gold-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 rounded-full blur-xl opacity-50" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 shadow-gold-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-5xl font-black text-gradient-gold">Emma's Insights</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-ahk-gold-500 animate-pulse" />
              <p className="text-ahk-slate-200 text-lg">
                Learning your patterns for {stats.daysSinceFirstUse} {stats.daysSinceFirstUse === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insightCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/20 shadow-xl hover:border-ahk-gold-500/40 hover:shadow-gold-md transform transition-all duration-300 hover:scale-105 group"
            >
              {/* Background glow effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-ahk-gold-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/5 via-transparent to-ahk-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-ahk-gold-500/20 to-ahk-gold-400/20 border border-ahk-gold-500/30">
                    <Icon className="w-6 h-6 text-ahk-gold-400" />
                  </div>
                  <div className="px-3 py-1.5 bg-gradient-to-br from-ahk-green-500/30 to-ahk-green-400/30 rounded-full backdrop-blur-sm border border-ahk-green-500/30">
                    <span className="text-xs font-semibold text-ahk-green-300 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-ahk-green-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                </div>
                
                <div className="text-white">
                  <div className={`font-black mb-2 text-gradient-gold ${card.small ? 'text-2xl' : 'text-4xl'}`}>
                    {card.value}
                  </div>
                  <div className="text-ahk-slate-200 text-sm font-semibold">
                    {card.label}
                  </div>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ahk-gold-500 via-ahk-blue-500 to-ahk-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          );
        })}
      </div>

      {/* Learning Progress Bar - Premium Glass */}
      <div className="mt-8 p-6 bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/20 rounded-xl shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-white">Emma's Learning Progress</span>
          <span className="px-4 py-2 bg-gradient-to-br from-ahk-gold-500/30 to-ahk-gold-400/30 rounded-lg text-ahk-gold-300 font-bold border border-ahk-gold-500/30">
            {Math.min(100, Math.floor((stats.totalCommands / 50) * 100))}% Complete
          </span>
        </div>
        <div className="w-full h-3 bg-ahk-navy-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-ahk-gold-500/20">
          <div
            className="h-full bg-gradient-to-r from-ahk-gold-500 via-ahk-blue-500 to-ahk-gold-500 rounded-full transition-all duration-1000 shadow-gold-md"
            style={{
              width: `${Math.min(100, (stats.totalCommands / 50) * 100)}%`,
              animation: 'gradientShift 8s ease infinite'
            }}
          />
        </div>
        <p className="text-sm text-ahk-slate-200 mt-3 flex items-center gap-2">
          {stats.totalCommands < 50 ? (
            <>
              <span className="text-ahk-gold-400">⚡</span>
              <span>{50 - stats.totalCommands} more commands until Emma knows you perfectly!</span>
            </>
          ) : (
            <>
              <span className="text-ahk-green-400">🎉</span>
              <span className="text-ahk-green-300 font-semibold">Emma has mastered your patterns!</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
