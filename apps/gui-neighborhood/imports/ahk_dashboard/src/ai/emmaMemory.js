/**
 * Emma's Learning & Memory System
 * Tracks user preferences, patterns, and behaviors to provide proactive suggestions
 */

const STORAGE_KEY = 'emma-learning-data';

class EmmaMemory {
  constructor() {
    this.data = this.loadData();
  }

  // Load learning data from localStorage
  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Emma Memory: Failed to load data', error);
    }
    
    // Default structure
    return {
      preferences: {
        favoriteCommands: {}, // { command: count }
        preferredReportFormat: null, // pdf, excel, etc.
        preferredLanguage: 'en',
        reportDelivery: 'display', // display or email
      },
      patterns: {
        activeHours: {}, // { hour: activityCount }
        dailyCheckIns: [], // timestamps
        commonTasks: {}, // { task: timestamps[] }
        reportGenerationTimes: [], // timestamps
      },
      history: {
        totalCommands: 0,
        totalReports: 0,
        lastActive: null,
        firstUsed: Date.now(),
        commandHistory: [], // last 50 commands
      },
      insights: {
        peakProductivityHour: null,
        averageReportsPerWeek: 0,
        mostUsedCommand: null,
        suggestionsGiven: 0,
        suggestionsTaken: 0,
      },
    };
  }

  // Save data to localStorage
  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Emma Memory: Failed to save data', error);
    }
  }

  // Record a command execution
  recordCommand(command) {
    const now = Date.now();
    const hour = new Date().getHours();

    // Update preferences
    if (!this.data.preferences.favoriteCommands[command]) {
      this.data.preferences.favoriteCommands[command] = 0;
    }
    this.data.preferences.favoriteCommands[command]++;

    // Update patterns
    if (!this.data.patterns.activeHours[hour]) {
      this.data.patterns.activeHours[hour] = 0;
    }
    this.data.patterns.activeHours[hour]++;

    if (!this.data.patterns.commonTasks[command]) {
      this.data.patterns.commonTasks[command] = [];
    }
    this.data.patterns.commonTasks[command].push(now);
    // Keep only last 30 entries per task
    if (this.data.patterns.commonTasks[command].length > 30) {
      this.data.patterns.commonTasks[command].shift();
    }

    // Update history
    this.data.history.totalCommands++;
    this.data.history.lastActive = now;
    this.data.history.commandHistory.push({ command, timestamp: now });
    
    // Keep only last 50 commands
    if (this.data.history.commandHistory.length > 50) {
      this.data.history.commandHistory.shift();
    }

    // Update insights
    this.updateInsights();
    
    this.saveData();
  }

  // Record a report generation
  recordReportGeneration() {
    const now = Date.now();
    this.data.patterns.reportGenerationTimes.push(now);
    this.data.history.totalReports++;
    
    // Keep only last 100 report times
    if (this.data.patterns.reportGenerationTimes.length > 100) {
      this.data.patterns.reportGenerationTimes.shift();
    }

    this.updateInsights();
    this.saveData();
  }

  // Record daily check-in
  recordCheckIn() {
    const now = Date.now();
    const today = new Date().toDateString();
    
    // Only record once per day
    const lastCheckIn = this.data.patterns.dailyCheckIns[this.data.patterns.dailyCheckIns.length - 1];
    if (!lastCheckIn || new Date(lastCheckIn).toDateString() !== today) {
      this.data.patterns.dailyCheckIns.push(now);
      
      // Keep only last 90 days
      if (this.data.patterns.dailyCheckIns.length > 90) {
        this.data.patterns.dailyCheckIns.shift();
      }
    }

    this.saveData();
  }

  // Set user preference
  setPreference(key, value) {
    if (this.data.preferences.hasOwnProperty(key)) {
      this.data.preferences[key] = value;
      this.saveData();
    }
  }

  // Update insights based on accumulated data
  updateInsights() {
    // Find peak productivity hour
    let maxActivity = 0;
    let peakHour = null;
    for (const [hour, count] of Object.entries(this.data.patterns.activeHours)) {
      if (count > maxActivity) {
        maxActivity = count;
        peakHour = parseInt(hour);
      }
    }
    this.data.insights.peakProductivityHour = peakHour;

    // Find most used command
    let maxUsage = 0;
    let topCommand = null;
    for (const [command, count] of Object.entries(this.data.preferences.favoriteCommands)) {
      if (count > maxUsage) {
        maxUsage = count;
        topCommand = command;
      }
    }
    this.data.insights.mostUsedCommand = topCommand;

    // Calculate average reports per week
    const reportsLast30Days = this.data.patterns.reportGenerationTimes.filter(
      t => Date.now() - t < 30 * 24 * 60 * 60 * 1000
    ).length;
    this.data.insights.averageReportsPerWeek = Math.round((reportsLast30Days / 30) * 7);
  }

  // Record suggestion interaction
  recordSuggestion(wasTaken) {
    this.data.insights.suggestionsGiven++;
    if (wasTaken) {
      this.data.insights.suggestionsTaken++;
    }
    this.saveData();
  }

  // Get proactive suggestions based on patterns
  getProactiveSuggestions() {
    const suggestions = [];
    const now = new Date();
    const currentHour = now.getHours();
    const daysSinceFirstUse = Math.floor((Date.now() - this.data.history.firstUsed) / (1000 * 60 * 60 * 24));

    // Only give suggestions if user has used Emma for at least 2 days
    if (daysSinceFirstUse < 2) {
      return suggestions;
    }

    // Peak hour suggestion
    if (this.data.insights.peakProductivityHour === currentHour) {
      suggestions.push({
        type: 'peak-hour',
        message: `Boss, you're usually most productive now! Want me to prepare your usual report?`,
        action: 'generate-report',
      });
    }

    // Morning report routine (if user usually checks reports in the morning)
    const morningReports = this.data.patterns.reportGenerationTimes.filter(t => {
      const hour = new Date(t).getHours();
      return hour >= 8 && hour <= 10;
    });
    if (morningReports.length >= 5 && currentHour >= 8 && currentHour <= 10) {
      const lastReport = this.data.patterns.reportGenerationTimes[this.data.patterns.reportGenerationTimes.length - 1];
      const hoursSinceLastReport = (Date.now() - lastReport) / (1000 * 60 * 60);
      
      if (hoursSinceLastReport > 20) {
        suggestions.push({
          type: 'morning-routine',
          message: `Good morning, Ashraf! Ready for your daily report?`,
          action: 'generate-report',
        });
      }
    }

    // Remind about favorite command if not used in a while
    if (this.data.insights.mostUsedCommand) {
      const lastUsed = this.data.patterns.commonTasks[this.data.insights.mostUsedCommand];
      if (lastUsed && lastUsed.length > 0) {
        const lastTime = lastUsed[lastUsed.length - 1];
        const daysSinceUsed = (Date.now() - lastTime) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUsed > 3) {
          suggestions.push({
            type: 'favorite-reminder',
            message: `Haven't run ${this.data.insights.mostUsedCommand} in a while. Need it?`,
            action: this.data.insights.mostUsedCommand,
          });
        }
      }
    }

    return suggestions;
  }

  // Get user statistics for display
  getStats() {
    return {
      totalCommands: this.data.history.totalCommands,
      totalReports: this.data.history.totalReports,
      daysSinceFirstUse: Math.floor((Date.now() - this.data.history.firstUsed) / (1000 * 60 * 60 * 24)),
      peakHour: this.data.insights.peakProductivityHour,
      mostUsedCommand: this.data.insights.mostUsedCommand,
      reportsPerWeek: this.data.insights.averageReportsPerWeek,
      suggestionAcceptance: this.data.insights.suggestionsGiven > 0 
        ? Math.round((this.data.insights.suggestionsTaken / this.data.insights.suggestionsGiven) * 100)
        : 0,
    };
  }

  // Reset learning data (for testing or user request)
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadData();
  }
}

// Singleton instance
const emmaMemory = new EmmaMemory();

export default emmaMemory;
