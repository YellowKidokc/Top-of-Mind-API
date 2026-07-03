// Browser-compatible version of autoAgent (no imports, data passed as parameters)

/**
 * Analyzes the roadmap and generates insights
 * @param {Array} roadmap - Roadmap tasks array
 * @returns {string} Formatted roadmap analysis report
 */
export function analyzeRoadmap(roadmap = []) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdue = roadmap.filter(t => {
      const dueDate = new Date(t.due)
      return dueDate < today && t.status !== 'done'
    })
    const highPriority = roadmap.filter(t => t.priority === 'high' && t.status !== 'done')
    const completed = roadmap.filter(t => t.status === 'done')
    const inProgress = roadmap.filter(t => t.status === 'in-progress')

    return `
📊 ROADMAP INSIGHT REPORT
-------------------------
Total tasks: ${roadmap.length}
Completed: ${completed.length}
In Progress: ${inProgress.length}
High priority pending: ${highPriority.length}
Overdue: ${overdue.length}

${overdue.length > 0 ? `⚠️ Overdue Tasks:
${overdue.map(t => `- ${t.title} (due ${t.due})`).join('\n')}
` : '✅ No overdue tasks'}

${highPriority.length > 0 ? `🔥 High Priority Pending:
${highPriority.map(t => `- ${t.title} (${t.projectId || 'No project'})`).join('\n')}
` : '✅ All high priority tasks on track'}
`
  } catch (error) {
    console.error('Error analyzing roadmap:', error)
    return `❌ Error analyzing roadmap: ${error.message}`
  }
}

/**
 * Summarizes all projects
 * @param {Array} projects - Projects array
 * @returns {string} Formatted project summary report
 */
export function summarizeProjects(projects = []) {
  try {
    const total = projects.length
    if (total === 0) {
      return '❌ No projects data available'
    }

    const avgProgress = (
      projects.reduce((sum, p) => sum + (p.progress || 0), 0) / total
    ).toFixed(1)

    const lagging = projects.filter(p => p.progress < 30)
    const leading = projects.filter(p => p.progress > 60)
    const midRange = projects.filter(p => p.progress >= 30 && p.progress <= 60)

    return `
📁 PROJECT STATUS SUMMARY
-------------------------
Total Projects: ${total}
Average Progress: ${avgProgress}%

${leading.length > 0 ? `🚀 Leading Projects:
${leading.map(p => `- ${p.name} (${p.progress}%) - Stage: ${p.stage || 'N/A'}`).join('\n')}
` : ''}

${midRange.length > 0 ? `⚡ Mid-Progress Projects:
${midRange.map(p => `- ${p.name} (${p.progress}%) - Next: ${p.next_milestone || 'N/A'}`).join('\n')}
` : ''}

${lagging.length > 0 ? `🐢 Lagging Projects:
${lagging.map(p => `- ${p.name} (${p.progress}%) - Needs attention`).join('\n')}
` : '✅ All projects making good progress'}
`
  } catch (error) {
    console.error('Error summarizing projects:', error)
    return `❌ Error summarizing projects: ${error.message}`
  }
}

/**
 * Generates a comprehensive AI analysis prompt with enhanced context
 * @param {Array} projects - Projects array
 * @param {Array} roadmap - Roadmap tasks array
 * @param {Object} metrics - Optional metrics data
 * @param {Object} htmlKPIs - Optional HTML report KPIs from feasibility studies
 * @returns {Object} Structured context for AI processing
 */
export function preparePrompt(projects = [], roadmap = [], metrics = null, htmlKPIs = null) {
  try {
    const timestamp = new Date().toISOString()
    const summary = summarizeProjects(projects)
    const roadmapAnalysis = analyzeRoadmap(roadmap)
    
    // Build structured context for Gemini
    const structuredContext = {
      timestamp,
      organization: 'AHK Strategies',
      unit: 'Strategic Mobility Program',
      stage: 'Pre-Series A',
      market: 'MENA',
      data: {
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          progress: p.progress,
          stage: p.stage,
          budget: p.budget_eur,
          nextMilestone: p.next_milestone
        })),
        roadmap: roadmap.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due: t.due,
          projectId: t.projectId
        })),
        metrics: metrics || {
          activeProjects: projects.length,
          avgProgress: (projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length).toFixed(1),
          totalTasks: roadmap.length,
          completedTasks: roadmap.filter(t => t.status === 'done').length
        },
        investorKPIs: htmlKPIs
      },
      analysis: {
        projectSummary: summary,
        roadmapInsights: roadmapAnalysis
      }
    }
    
    // Build investor KPI summary if available
    let kpiSummary = ''
    if (htmlKPIs) {
      kpiSummary = '\n\n📊 INVESTOR INTELLIGENCE (From Feasibility Studies):\n'
      Object.entries(htmlKPIs).forEach(([filename, kpis]) => {
        if (kpis.status !== 'not_found') {
          kpiSummary += `\n${kpis.projectName}:\n`
          if (kpis.irr) kpiSummary += `  - IRR: ${kpis.irr}%\n`
          if (kpis.totalInvestment) kpiSummary += `  - Total Investment: $${kpis.totalInvestment}M\n`
          if (kpis.revenue) kpiSummary += `  - Revenue: $${kpis.revenue}M\n`
          if (kpis.ebitda) kpiSummary += `  - EBITDA: $${kpis.ebitda}M\n`
          if (kpis.cagr) kpiSummary += `  - CAGR: ${kpis.cagr}%\n`
          if (kpis.npv) kpiSummary += `  - NPV: $${kpis.npv}M\n`
        }
      })
    }
    
    // Legacy text prompt for display/logging
    const textPrompt = `
==============================================
AHK STRATEGIC DASHBOARD – AI ANALYSIS CONTEXT
==============================================
Generated: ${timestamp}

${summary}

${roadmapAnalysis}${kpiSummary}

📍 STRATEGIC ANALYSIS INSTRUCTIONS:
-----------------------------------
Using the data above, provide:

1. **Investor Brief** (2-3 sentences)
   - Portfolio health snapshot
   - Key momentum indicators
   - Risk/opportunity balance

2. **Next 3 Actions** (Prioritized tasks)
   - Immediate action with highest ROI
   - Critical blocker to remove
   - Strategic opportunity to capture

3. **Risk Map**
   - HIGH: Critical issues requiring immediate attention
   - MEDIUM: Developing concerns to monitor
   - LOW: Minor optimization opportunities

4. **Strategic Recommendations**
   - Resource allocation adjustments
   - Timeline optimization suggestions
   - Quick wins to accelerate momentum

---
💡 Context: Pre-Series A mobility portfolio, MENA focus, localization strategy
🎯 Goal: Actionable insights for founder and investor communications
`

    // Store in window for voice access
    window.__LAST_AI_CONTEXT__ = structuredContext

    return {
      structured: structuredContext,
      text: textPrompt,
      timestamp
    }
  } catch (error) {
    console.error('Error preparing prompt:', error)
    return {
      structured: null,
      text: `❌ Error preparing AI prompt: ${error.message}`,
      timestamp: new Date().toISOString()
    }
  }
}

export default {
  analyzeRoadmap,
  summarizeProjects,
  preparePrompt
}
