import fs from 'fs'
import path from 'path'

const dataDir = path.resolve('src/data')

/**
 * Analyzes the roadmap.json file and generates insights
 * @returns {string} Formatted roadmap analysis report
 */
export function analyzeRoadmap() {
  try {
    const roadmapPath = path.join(dataDir, 'roadmap.json')
    const roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf-8'))
    const today = new Date()

    const overdue = roadmap.filter(t => new Date(t.due) < today && t.status !== 'completed')
    const highPriority = roadmap.filter(t => t.priority === 'high' && t.status !== 'completed')
    const completed = roadmap.filter(t => t.status === 'completed')
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
 * Summarizes all projects from projects.json
 * @returns {string} Formatted project summary report
 */
export function summarizeProjects() {
  try {
    const projectsPath = path.join(dataDir, 'projects.json')
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'))

    const total = projects.length
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
 * Generates a comprehensive AI analysis prompt and saves it to reports folder
 * @returns {string} Combined analysis prompt for AI processing
 */
export function preparePrompt() {
  try {
    const summary = summarizeProjects()
    const roadmap = analyzeRoadmap()
    const timestamp = new Date().toISOString()
    
    const combined = `
AHK STRATEGIC DASHBOARD – AI ANALYSIS CONTEXT
==============================================
Generated: ${timestamp}

${summary}

${roadmap}

📍 STRATEGIC ANALYSIS INSTRUCTIONS:
-----------------------------------
Using the data above, provide:

1. **Strategic Risk & Opportunity Summary** (3-5 sentences)
   - Identify critical risks based on overdue tasks and lagging projects
   - Highlight opportunities from leading projects
   - Assess overall portfolio health

2. **Next Three Priorities** (Action items)
   - What should be tackled immediately?
   - Which tasks would have the highest impact?
   - Resource allocation recommendations

3. **Milestone Confidence Assessment**
   - Likelihood of achieving next milestones (1-100%)
   - Key blockers and dependencies
   - Timeline risk factors

4. **Strategic Recommendations**
   - Resource reallocation suggestions
   - Risk mitigation strategies
   - Quick wins to boost momentum

---
💡 NOTE: This analysis is for AHK Strategies' strategic mobility portfolio (Q-VAN, WOW, DVM projects)
Context: Pre-Series A funding stage, MENA market focus, localization strategy
`

    // Create reports directory if it doesn't exist
    const reportsDir = path.resolve('reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    // Save report with timestamp
    const dateStr = new Date().toISOString().slice(0, 10)
    const outputPath = path.join(reportsDir, `AI_Analysis_Report_${dateStr}.txt`)
    fs.writeFileSync(outputPath, combined, 'utf-8')
    
    console.log(`✅ AI Analysis Report saved to: ${outputPath}`)
    return combined
  } catch (error) {
    console.error('Error preparing prompt:', error)
    return `❌ Error preparing AI prompt: ${error.message}`
  }
}

export default {
  analyzeRoadmap,
  summarizeProjects,
  preparePrompt
}
