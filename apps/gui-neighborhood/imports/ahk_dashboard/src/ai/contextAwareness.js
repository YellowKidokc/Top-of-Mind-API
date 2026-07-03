/**
 * Emma's Context Awareness System
 * Understands which page user is on and provides smart contextual suggestions
 */

import { useLocation } from 'react-router-dom';

export function usePageContext() {
  const location = useLocation();
  
  const getPageContext = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/dashboard':
        return {
          page: 'dashboard',
          title: 'Dashboard',
          suggestions: [
            'Want me to analyze completion rates?',
            'Should I check for metric trends?',
            'Notice any anomalies in the data?',
          ],
          actions: ['run-analysis', 'display-report', 'risk-analysis'],
        };
        
      case '/strategy':
        return {
          page: 'strategy',
          title: 'Strategy',
          suggestions: [
            'Want me to analyze these goals?',
            'Should I assess milestone progress?',
            'Need a strategic roadmap review?',
          ],
          actions: ['run-analysis', 'display-report'],
        };
        
      case '/marketing':
        return {
          page: 'marketing',
          title: 'Marketing Pulse',
          suggestions: [
            'Want to analyze campaign performance?',
            'Should I check social media metrics?',
            'Need a marketing ROI report?',
          ],
          actions: ['run-analysis', 'display-report'],
        };
        
      case '/assets':
        return {
          page: 'assets',
          title: 'Asset Vault',
          suggestions: [
            'Want me to organize these assets?',
            'Should I analyze asset usage?',
            'Need a resource allocation report?',
          ],
          actions: ['run-analysis'],
        };
        
      case '/partnerships':
        return {
          page: 'partnerships',
          title: 'Partnerships',
          suggestions: [
            'Want to review partnership performance?',
            'Should I assess collaboration metrics?',
            'Need a partnership health check?',
          ],
          actions: ['run-analysis', 'display-report'],
        };
        
      case '/reports':
        return {
          page: 'reports',
          title: 'Reports Archive',
          suggestions: [
            'Want me to generate a new report?',
            'Should I email your latest report?',
            'Need to analyze report trends?',
          ],
          actions: ['display-report', 'email-report'],
        };
        
      case '/emma-insights':
        return {
          page: 'emma-insights',
          title: 'Emma Insights',
          suggestions: [
            'Want to see your command history?',
            'Should I explain my learning process?',
            'Curious about your productivity patterns?',
          ],
          actions: [],
        };
        
      case '/emma-learning':
        return {
          page: 'emma-learning',
          title: 'Emma Learning Intelligence',
          suggestions: [
            'Want to see my self-learning progress?',
            'Should I analyze your interaction patterns?',
            'Curious how I adapt my communication style?',
          ],
          actions: [],
        };
        
      default:
        return {
          page: 'unknown',
          title: 'Page',
          suggestions: ['How can I help you today?'],
          actions: ['display-report'],
        };
    }
  };

  return getPageContext();
}

/**
 * Get contextual greeting based on current page
 */
export function getContextualGreeting(pageContext, userName = 'Ashraf') {
  const greetings = {
    dashboard: [
      `Hey ${userName}, looking at the dashboard? I can analyze these metrics for you.`,
      `Welcome to your command center, ${userName}. Want a quick analysis?`,
      `${userName}, I see you're checking the numbers. Need insights?`,
    ],
    strategy: [
      `${userName}, ready to strategize? I can review your goals.`,
      `Planning ahead, ${userName}? Let me help with that.`,
      `Strategy time! Want me to analyze your roadmap, ${userName}?`,
    ],
    marketing: [
      `Marketing pulse check, ${userName}? I can analyze campaign performance.`,
      `${userName}, ready to optimize your marketing? I'm here to help.`,
      `Checking campaign results, ${userName}? Want detailed insights?`,
    ],
    assets: [
      `Asset management time, ${userName}! Need help organizing?`,
      `${userName}, I can help you analyze asset utilization.`,
      `Looking at resources, ${userName}? Want an optimization report?`,
    ],
    partnerships: [
      `Partnership review, ${userName}? I can assess collaboration health.`,
      `${userName}, want to strengthen your partnerships? Let's analyze.`,
      `Checking partnership status, ${userName}? I'm ready to help.`,
    ],
    reports: [
      `Reports archive, ${userName}. Want me to generate a fresh one?`,
      `${userName}, I see you're browsing reports. Need a new analysis?`,
      `Looking for insights, ${userName}? I can create a custom report.`,
    ],
    'emma-insights': [
      `${userName}, checking my learning progress? I'm getting smarter every day!`,
      `Thanks for visiting my insights page, ${userName}. I'm learning from you!`,
      `${userName}, curious about what I've learned? Happy to share!`,
    ],
  };

  const pageGreetings = greetings[pageContext.page] || [
    `Hello ${userName}, how can I assist you today?`,
  ];

  return pageGreetings[Math.floor(Math.random() * pageGreetings.length)];
}

/**
 * Analyze page data and generate contextual insights
 */
export function analyzePageContext(pageContext, metricsData = null) {
  const insights = [];

  if (pageContext.page === 'dashboard' && metricsData) {
    // Example: Detect drops in metrics
    const revenue = metricsData.revenue;
    if (revenue && revenue.current < revenue.previous * 0.9) {
      insights.push({
        type: 'warning',
        message: 'Revenue dropped 10% from last period. Want me to investigate?',
        action: 'run-analysis',
        priority: 'high',
      });
    }

    const completion = metricsData.completion;
    if (completion && completion.rate < 70) {
      insights.push({
        type: 'alert',
        message: `Completion rate is ${completion.rate}%. Should I analyze blockers?`,
        action: 'run-analysis',
        priority: 'medium',
      });
    }
  }

  return insights;
}
