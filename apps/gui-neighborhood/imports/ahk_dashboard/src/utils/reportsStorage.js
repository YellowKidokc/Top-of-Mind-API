// src/utils/reportsStorage.js
/**
 * Reports Storage Manager
 * Manages report archive with 30-day auto-cleanup
 */

const STORAGE_KEY = 'ahk-reports-archive';
const MAX_AGE_DAYS = 30;

export class ReportsManager {
  static getAllReports() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const reports = JSON.parse(stored);
      // Auto-cleanup old reports
      const cleaned = this.cleanupOldReports(reports);
      
      if (cleaned.length !== reports.length) {
        this.saveReports(cleaned);
      }
      
      return cleaned.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  }

  static saveReport(report) {
    try {
      const reports = this.getAllReports();
      const newReport = {
        id: `RPT-${Date.now()}`,
        ...report,
        createdAt: new Date().toISOString(),
        isPinned: false,
        views: 0
      };
      
      reports.unshift(newReport);
      this.saveReports(reports);
      
      console.log('📊 Report saved:', newReport.id);
      return newReport;
    } catch (error) {
      console.error('Error saving report:', error);
      return null;
    }
  }

  static deleteReport(reportId) {
    try {
      const reports = this.getAllReports();
      const filtered = reports.filter(r => r.id !== reportId);
      this.saveReports(filtered);
      console.log('🗑️ Report deleted:', reportId);
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  }

  static togglePin(reportId) {
    try {
      const reports = this.getAllReports();
      const report = reports.find(r => r.id === reportId);
      if (report) {
        report.isPinned = !report.isPinned;
        this.saveReports(reports);
        return report.isPinned;
      }
      return false;
    } catch (error) {
      console.error('Error toggling pin:', error);
      return false;
    }
  }

  static incrementViews(reportId) {
    try {
      const reports = this.getAllReports();
      const report = reports.find(r => r.id === reportId);
      if (report) {
        report.views = (report.views || 0) + 1;
        report.lastViewed = new Date().toISOString();
        this.saveReports(reports);
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  static cleanupOldReports(reports) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);
    
    return reports.filter(report => {
      // Keep pinned reports forever
      if (report.isPinned) return true;
      
      // Keep reports newer than 30 days
      const reportDate = new Date(report.createdAt);
      return reportDate > cutoffDate;
    });
  }

  static saveReports(reports) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving reports to storage:', error);
    }
  }

  static getStats() {
    const reports = this.getAllReports();
    return {
      total: reports.length,
      pinned: reports.filter(r => r.isPinned).length,
      thisWeek: reports.filter(r => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(r.createdAt) > weekAgo;
      }).length,
      totalViews: reports.reduce((sum, r) => sum + (r.views || 0), 0)
    };
  }
}

export default ReportsManager;
