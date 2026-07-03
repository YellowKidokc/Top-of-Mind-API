// src/components/ReportsArchive.jsx
import { useState, useEffect } from 'react';
import ReportsManager from '../utils/reportsStorage';
import { ENABLE_BACKEND_FEATURES } from '../config/features';

export default function ReportsArchive() {
  const [reports, setReports] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pinned: 0, thisWeek: 0, totalViews: 0 });
  const [filterView, setFilterView] = useState('all'); // all, pinned, thisWeek, saved
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadReports();
    if (!ENABLE_BACKEND_FEATURES) {
      return undefined;
    }

    loadSavedReports();
    
    // Auto-refresh saved reports every 5 seconds to catch new saves
    const refreshInterval = setInterval(() => {
      loadSavedReports();
    }, 5000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const loadReports = () => {
    const allReports = ReportsManager.getAllReports();
    setReports(allReports);
    setStats(ReportsManager.getStats());
  };

  const loadSavedReports = async () => {
    if (!ENABLE_BACKEND_FEATURES) {
      setSavedReports([]);
      loadReports();
      return;
    }

    try {
      console.log('🔍 Fetching reports from /api/list-reports...');
      const response = await fetch('/api/list-reports');
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error body:', errorText);
        loadReports();
        return;
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        setSavedReports(data.reports);
        console.log('✅ Loaded saved reports:', data.reports.length, data.reports);
        
        // Stats now prioritize backend reports
        setStats({
          total: data.reports.length,
          pinned: 0,
          thisWeek: data.reports.filter(r => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(r.createdAt) > weekAgo;
          }).length,
          totalViews: 0
        });
      } else {
        console.warn('⚠️ Success = false:', data);
        loadReports();
      }
    } catch (error) {
      console.error('❌ Failed to load saved reports:', error);
      loadReports();
    }
  };

  const handleDelete = (reportId) => {
    if (confirm('Are you sure you want to delete this report?')) {
      ReportsManager.deleteReport(reportId);
      loadReports();
    }
  };

  const handleTogglePin = (reportId) => {
    ReportsManager.togglePin(reportId);
    loadReports();
  };

  const handleView = (report) => {
    ReportsManager.incrementViews(report.id);
    loadReports();
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleViewSaved = async (report) => {
    try {
      const response = await fetch(`/api/get-report/${report.filename}`);
      const data = await response.json();
      if (data.success) {
        setSelectedReport({ ...report, content: data.content });
        setShowReportModal(true);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  };

  // Prioritize backend reports - only show localStorage if no backend reports
  const allReportsForDisplay = filterView === 'saved' 
    ? savedReports.map(r => ({ ...r, isSaved: true }))
    : savedReports.length > 0 
      ? savedReports.map(r => ({ ...r, isSaved: true }))
      : reports;

  const filteredReports = allReportsForDisplay
    .filter(report => {
      if (filterView === 'pinned') return report.isPinned;
      if (filterView === 'thisWeek') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(report.createdAt) > weekAgo;
      }
      return true;
    })
    .filter(report => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return report.title?.toLowerCase().includes(query) || 
             report.type?.toLowerCase().includes(query);
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Premium Gold Gradient */}
        <div className="mb-8 relative">
          {/* Background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-ahk-gold-500/10 rounded-full blur-3xl -z-10" />
          
          <h1 className="text-5xl font-black text-gradient-gold mb-2 flex items-center gap-4">
            📊 Reports Archive
            <span className="relative px-4 py-2 text-sm font-semibold">
              <div className="absolute inset-0 bg-gradient-to-br from-ahk-gold-500/20 to-ahk-gold-400/20 rounded-full backdrop-blur-xl border border-ahk-gold-500/30" />
              <span className="relative text-ahk-gold-400">Emma's Collection</span>
            </span>
          </h1>
          <p className="text-ahk-slate-200 text-lg">Your strategic reports, organized and auto-managed</p>
        </div>

        {/* Stats Cards - Premium Glass Morphism */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-ahk-blue-500/20 to-ahk-blue-600/20 backdrop-blur-xl border border-ahk-blue-500/30 shadow-xl hover:shadow-blue-500/30 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-ahk-blue-500/5 via-transparent to-ahk-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-sm text-ahk-blue-300 font-semibold mb-2">Total Reports</div>
            <div className="text-4xl font-black text-white">{stats.total}</div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-ahk-blue-500/20 rounded-full blur-2xl" />
          </div>
          
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-ahk-gold-500/20 to-ahk-gold-400/20 backdrop-blur-xl border border-ahk-gold-500/30 shadow-xl hover:shadow-gold-md transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-ahk-gold-500/5 via-transparent to-ahk-gold-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-sm text-ahk-gold-300 font-semibold mb-2">Saved to Archive</div>
            <div className="text-4xl font-black text-white">{savedReports.length}</div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-ahk-gold-500/20 rounded-full blur-2xl" />
          </div>
          
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-ahk-green-500/20 to-ahk-green-400/20 backdrop-blur-xl border border-ahk-green-500/30 shadow-xl hover:shadow-green-500/30 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-ahk-green-500/5 via-transparent to-ahk-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-sm text-ahk-green-300 font-semibold mb-2">This Week</div>
            <div className="text-4xl font-black text-white">{stats.thisWeek}</div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-ahk-green-500/20 rounded-full blur-2xl" />
          </div>
          
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl border border-orange-500/30 shadow-xl hover:shadow-orange-500/30 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-sm text-orange-300 font-semibold mb-2">Total Views</div>
            <div className="text-4xl font-black text-white">{stats.totalViews}</div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Filters and Search - Premium Glass */}
        <div className="bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/20 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 shadow-xl">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                if (ENABLE_BACKEND_FEATURES) {
                  loadSavedReports();
                } else {
                  loadReports();
                }
              }}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-br from-ahk-green-500 to-ahk-green-400 text-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all shadow-lg font-semibold"
              title="Refresh reports"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setFilterView('all')}
              className={`px-5 py-2.5 rounded-lg transition-all font-semibold ${
                filterView === 'all' 
                  ? 'bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 text-white shadow-gold-md scale-105' 
                  : 'bg-ahk-navy-500/50 text-ahk-slate-200 hover:bg-ahk-navy-500/80 border border-ahk-gold-500/20'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilterView('saved')}
              className={`px-5 py-2.5 rounded-lg transition-all font-semibold ${
                filterView === 'saved' 
                  ? 'bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 text-white shadow-gold-md scale-105' 
                  : 'bg-ahk-navy-500/50 text-ahk-slate-200 hover:bg-ahk-navy-500/80 border border-ahk-gold-500/20'
              }`}
            >
              💾 Saved Archive
            </button>
            <button
              onClick={() => setFilterView('pinned')}
              className={`px-5 py-2.5 rounded-lg transition-all font-semibold ${
                filterView === 'pinned' 
                  ? 'bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 text-white shadow-gold-md scale-105' 
                  : 'bg-ahk-navy-500/50 text-ahk-slate-200 hover:bg-ahk-navy-500/80 border border-ahk-gold-500/20'
              }`}
            >
              📌 Pinned
            </button>
            <button
              onClick={() => setFilterView('thisWeek')}
              className={`px-5 py-2.5 rounded-lg transition-all font-semibold ${
                filterView === 'thisWeek' 
                  ? 'bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 text-white shadow-gold-md scale-105' 
                  : 'bg-ahk-navy-500/50 text-ahk-slate-200 hover:bg-ahk-navy-500/80 border border-ahk-gold-500/20'
              }`}
            >
              📅 This Week
            </button>
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg bg-ahk-navy-500/50 text-white placeholder-ahk-slate-300 border border-ahk-gold-500/20 focus:outline-none focus:ring-2 focus:ring-ahk-gold-500 focus:border-transparent backdrop-blur-xl"
          />
        </div>

        {/* Reports List - Premium Cards */}
        {filteredReports.length === 0 ? (
          <div className="bg-gradient-to-br from-ahk-navy-600/30 to-ahk-navy-700/30 backdrop-blur-xl border border-ahk-gold-500/10 rounded-xl p-12 text-center shadow-xl">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-2xl font-bold text-white mb-2">No reports found</div>
            <div className="text-ahk-slate-300">Generate your first report to see it here</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map(report => (
              <div
                key={report.id}
                className="relative overflow-hidden bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/20 rounded-xl p-6 hover:border-ahk-gold-500/40 hover:shadow-gold-md transition-all duration-300 group"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/5 via-transparent to-ahk-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {report.isPinned && <span className="text-2xl">📌</span>}
                      <h3 className="text-xl font-bold text-white group-hover:text-gradient-gold transition-all">
                        {report.title || 'AHK Performance Report'}
                      </h3>
                      <span className="px-3 py-1 bg-gradient-to-br from-ahk-gold-500/30 to-ahk-gold-400/30 text-ahk-gold-300 rounded-lg text-sm font-semibold border border-ahk-gold-500/30">
                        {report.type || 'Strategic'}
                      </span>
                    </div>
                    <div className="text-ahk-slate-200 mb-4 leading-relaxed">
                      {report.summary || 'Comprehensive strategic analysis and performance metrics'}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-ahk-slate-300">
                      <span className="flex items-center gap-2">
                        <span className="text-ahk-gold-400">🕒</span>
                        {formatDate(report.createdAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-ahk-blue-400">👁️</span>
                        {report.views || 0} views
                      </span>
                      {report.lastViewed && (
                        <span className="flex items-center gap-2">
                          <span className="text-ahk-green-400">📅</span>
                          Last viewed: {formatDate(report.lastViewed)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleTogglePin(report.id)}
                      className={`p-3 rounded-lg transition-all hover:scale-110 ${
                        report.isPinned 
                          ? 'bg-gradient-to-br from-yellow-500 to-yellow-400 text-white shadow-lg' 
                          : 'bg-ahk-navy-500/50 text-ahk-slate-200 hover:bg-ahk-navy-500/80 border border-ahk-gold-500/20'
                      }`}
                      title={report.isPinned ? 'Unpin' : 'Pin'}
                      style={{ display: report.isSaved ? 'none' : 'block' }}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => report.isSaved ? handleViewSaved(report) : handleView(report)}
                      className="px-5 py-2.5 bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 text-white rounded-lg hover:shadow-gold-lg hover:scale-105 active:scale-95 transition-all font-semibold shadow-md"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-3 bg-gradient-to-br from-red-600 to-red-500 text-white rounded-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all"
                      title="Delete"
                      style={{ display: report.isSaved ? 'none' : 'block' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ahk-gold-500 via-ahk-blue-500 to-ahk-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        )}

        {/* Footer Note - Premium Styling */}
        <div className="mt-8 text-center">
          <div className="inline-block px-6 py-3 bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/20 rounded-lg shadow-xl">
            <span className="text-ahk-gold-400 text-2xl mr-2">💡</span>
            <span className="text-ahk-slate-200">Reports are automatically deleted after 30 days unless pinned</span>
          </div>
        </div>

        {/* Report Modal - Premium Glass */}
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-ahk-navy-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-ahk-navy-600/95 to-ahk-navy-700/95 backdrop-blur-xl border border-ahk-gold-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-ahk-gold-500/20 flex items-center justify-between">
                <h2 className="text-3xl font-black text-gradient-gold">{selectedReport.title}</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 bg-ahk-navy-500/50 rounded-lg hover:bg-red-500/50 transition-all text-white hover:scale-110"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-ahk-slate-200 font-sans leading-relaxed">
                    {selectedReport.content}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
