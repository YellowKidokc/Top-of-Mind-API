import { TrendingUp, Users, Mail, MousePointer, BarChart3, Calendar } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import MetricsChart from '../components/MetricsChart'
import MetricsTable from '../components/MetricsTable'
import analyticsData from '../data/marketing-analytics.json'
import metricsData from '../data/metrics.json'
import dailyMetrics from '../data/daily-metrics.json'

export default function MarketingPulse() {
  const { weeklyMetrics } = metricsData
  const latestData = analyticsData[analyticsData.length - 1]

  // Calculate trends
  const previousData = analyticsData[analyticsData.length - 2]
  const visitTrend = ((latestData.websiteVisits - previousData.websiteVisits) / previousData.websiteVisits * 100).toFixed(1)
  const impressionTrend = ((latestData.linkedInImpressions - previousData.linkedInImpressions) / previousData.linkedInImpressions * 100).toFixed(1)
  const submissionTrend = ((latestData.formSubmissions - previousData.formSubmissions) / previousData.formSubmissions * 100).toFixed(1)

  // Chart configurations
  const chartDataKeys = [
    { key: 'websiteVisits', name: 'Website Visits', color: '#0A192F' },
    { key: 'linkedInImpressions', name: 'LinkedIn Impressions', color: '#D4AF37' },
    { key: 'formSubmissions', name: 'Form Submissions', color: '#8892B0' }
  ]

  return (
    <div className="space-y-8 page-transition">
      {/* Premium Page Header */}
      <div className="relative">
        {/* Background Glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-ahk-green-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-display font-black text-gradient-gold mb-2 animate-fade-in-down">
              Marketing Pulse
            </h1>
            <p className="text-lg text-ahk-slate-200 font-sans tracking-wide flex items-center gap-2 animate-fade-in-up">
              <span className="inline-block w-2 h-2 bg-ahk-green-500 rounded-full animate-glow-pulse"></span>
              Real-time marketing metrics and campaign performance
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary px-6 py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <span className="font-display font-bold">Run Grok Campaign</span>
            </button>
            <button className="btn-primary px-6 py-3 text-base shadow-gold-lg hover:shadow-gold-xl transition-all duration-300 hover:scale-105">
              <span className="font-display font-bold">Export Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Marketing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Website Visits"
          value={latestData.websiteVisits.toLocaleString()}
          change={`${visitTrend}%`}
          trend={visitTrend > 0 ? 'up' : 'down'}
          icon={MousePointer}
          color="navy"
        />
        <MetricCard
          title="LinkedIn Impressions"
          value={latestData.linkedInImpressions.toLocaleString()}
          change={`${impressionTrend}%`}
          trend={impressionTrend > 0 ? 'up' : 'down'}
          icon={TrendingUp}
          color="gold"
        />
        <MetricCard
          title="Form Submissions"
          value={latestData.formSubmissions}
          change={`${submissionTrend}%`}
          trend={submissionTrend > 0 ? 'up' : 'down'}
          icon={Users}
          color="slate"
        />
        <MetricCard
          title="Email Engagement"
          value={weeklyMetrics.emailEngagement}
          change="High quality"
          trend="up"
          icon={Mail}
          color="navy"
        />
      </div>

      {/* Weekly Trend Chart */}
      <MetricsChart 
        data={analyticsData.slice(-7)}
        type="line"
        dataKeys={chartDataKeys}
        title="7-Day Performance Trend"
      />

      {/* Bar Chart for Comparison */}
      <MetricsChart 
        data={analyticsData.slice(-7)}
        type="bar"
        dataKeys={[
          { key: 'websiteVisits', name: 'Website Visits', color: '#0A192F' },
          { key: 'formSubmissions', name: 'Leads Generated', color: '#D4AF37' }
        ]}
        title="Visits vs Leads Comparison"
      />

      {/* Daily Metrics Table */}
      <MetricsTable 
        data={dailyMetrics}
        title="Daily Performance Metrics"
      />

      {/* Campaign Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <div className="card">
          <h3 className="text-xl font-display font-bold text-ahk-navy-900 mb-4">
            Active Campaigns
          </h3>
          <div className="space-y-4">
            {[
              { name: 'LinkedIn Thought Leadership', status: 'Running', posts: 12, engagement: '8.5%' },
              { name: 'X Thread Series - Mobility', status: 'Running', posts: 8, engagement: '6.2%' },
              { name: 'Email Investor Outreach', status: 'Scheduled', posts: 5, engagement: '34%' }
            ].map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-ahk-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-ahk-navy-900">{campaign.name}</p>
                  <p className="text-sm text-ahk-slate-600">{campaign.posts} posts • {campaign.engagement} engagement</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  campaign.status === 'Running' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Quality Breakdown */}
        <div className="card">
          <h3 className="text-xl font-display font-bold text-ahk-navy-900 mb-4">
            Lead Quality Breakdown
          </h3>
          <div className="space-y-4">
            {[
              { quality: 'High Priority', count: 8, percentage: 35, color: 'bg-green-500' },
              { quality: 'Medium Priority', count: 10, percentage: 43, color: 'bg-yellow-500' },
              { quality: 'Low Priority', count: 5, percentage: 22, color: 'bg-gray-400' }
            ].map((lead, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-ahk-slate-700">{lead.quality}</span>
                  <span className="text-sm font-bold text-ahk-navy-900">{lead.count} leads ({lead.percentage}%)</span>
                </div>
                <div className="w-full bg-ahk-slate-100 rounded-full h-2">
                  <div 
                    className={`${lead.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${lead.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Automation Status */}
      <div className="card bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold mb-2">AI Automation Status</h3>
            <div className="space-y-2 text-white text-opacity-90">
              <p>✅ Grok: 3 X threads scheduled for this week</p>
              <p>✅ ChatGPT: Content generation active</p>
              <p>✅ Gemini: Validation system running</p>
            </div>
          </div>
          <BarChart3 className="w-16 h-16 text-white opacity-50" />
        </div>
      </div>
    </div>
  )
}
