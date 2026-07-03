// src/ai/ChatGPTClient.js
/**
 * 💬 ChatGPT-5 Client (OpenAI API Integration)
 * 
 * Generates executive-level strategic narratives, synthesizes complex data
 * into investor-ready communications, and provides storytelling intelligence.
 * 
 * Future: Connect to real OpenAI ChatGPT-5 API
 * Current: Mock implementation with realistic executive summaries
 * 
 * @module ChatGPTClient
 */

const CHATGPT_API_ENDPOINT = '/api/chatgpt5'
const REQUEST_TIMEOUT = 8000

/**
 * Fetch strategic narrative from ChatGPT-5
 * 
 * @param {Object} context - Strategic context from preparePrompt()
 * @returns {Promise<Object>} Executive narrative synthesis
 */
export async function fetchChatGPTNarrative(context) {
  console.log('💬 ChatGPT-5: Synthesizing executive narrative...')
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const { structured, text } = context
    
    const response = await fetch(CHATGPT_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: buildNarrativePrompt(context),
        context: {
          projectCount: structured?.data?.projects?.length || 0,
          taskCount: structured?.data?.roadmap?.length || 0,
          hasKPIs: !!structured?.data?.investorKPIs
        }
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`ChatGPT API error ${response.status}`)
    }

    const data = await response.json()
    
    console.log('✅ ChatGPT-5: Narrative received')
    
    return parseChatGPTResponse(data)
  } catch (error) {
    console.error('❌ ChatGPT fetch failed:', error.message)
    
    // Return mock data as fallback
    return generateMockChatGPTNarrative(context)
  }
}

/**
 * Build narrative generation prompt
 */
function buildNarrativePrompt(context) {
  const { structured, text } = context
  const projects = structured?.data?.projects || []
  
  return `You are a strategic advisor for AHK Strategies. Create an executive summary for investors based on this portfolio:

${text}

Focus on:
1. Strategic positioning and market opportunity
2. Execution momentum and competitive advantages
3. Risk mitigation strategies
4. Investment readiness and growth trajectory

Return in JSON format: {executiveSummary, strategicInsights[], recommendations[], investorAppeal}`
}

/**
 * Parse ChatGPT API response
 */
function parseChatGPTResponse(data) {
  // Handle different response formats
  if (data.choices && data.choices[0]?.message?.content) {
    // OpenAI format
    try {
      const content = JSON.parse(data.choices[0].message.content)
      return {
        executiveSummary: content.executiveSummary || content.summary,
        strategicInsights: content.strategicInsights || content.insights || [],
        recommendations: content.recommendations || [],
        investorAppeal: content.investorAppeal || null,
        tone: data.tone || 'professional',
        confidence: data.confidence || 85
      }
    } catch {
      return {
        executiveSummary: data.choices[0].message.content,
        strategicInsights: [],
        recommendations: [],
        investorAppeal: null,
        tone: 'professional',
        confidence: 75
      }
    }
  }
  
  // Direct format
  return {
    executiveSummary: data.executiveSummary || data.summary || 'Analysis unavailable',
    strategicInsights: data.strategicInsights || data.insights || [],
    recommendations: data.recommendations || [],
    investorAppeal: data.investorAppeal || null,
    tone: data.tone || 'professional',
    confidence: data.confidence || 80
  }
}

/**
 * Generate mock ChatGPT-5 narrative (fallback)
 */
function generateMockChatGPTNarrative(context) {
  const { structured } = context
  const projects = structured?.data?.projects || []
  const roadmap = structured?.data?.roadmap || []
  const metrics = structured?.data?.metrics || {}
  
  // Calculate key metrics
  const avgProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0) / (projects.length || 1)
  const completedTasks = roadmap.filter(t => t.status === 'done').length
  const totalTasks = roadmap.length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(0) : 0
  
  // Identify leading project
  const leadingProject = projects.reduce((max, p) => 
    (p.progress || 0) > (max.progress || 0) ? p : max, projects[0] || {}
  )
  
  // Identify lagging project
  const laggingProject = projects.reduce((min, p) => 
    (p.progress || 0) < (min.progress || 0) ? p : min, projects[0] || {}
  )

  // Build narrative
  const executiveSummary = `AHK Strategies demonstrates strong execution momentum across its ${projects.length}-project strategic mobility portfolio targeting the MENA region. With an average completion rate of ${avgProgress.toFixed(0)}% and ${completionRate}% task completion, the organization shows institutional capacity for complex project delivery. The ${leadingProject.name || 'flagship initiative'} leads at ${leadingProject.progress || 0}% completion, validating the technical and market approach. While ${laggingProject.name || 'certain projects'} require accelerated attention, the overall trajectory positions AHK as a credible regional player in sustainable mobility solutions. The portfolio's diversification across localization, logistics, and micro-mobility creates multiple pathways to market capture while mitigating single-point dependency risks.`

  const strategicInsights = [
    'Portfolio diversification across 3-4 mobility sectors reduces concentration risk and creates cross-selling synergies',
    'MENA focus aligns with high-growth demographics and government Vision 2030-type initiatives across GCC',
    `${avgProgress > 50 ? 'Strong' : 'Moderate'} execution velocity demonstrates institutional capability for complex infrastructure projects`,
    'Feasibility study completion positions projects for institutional capital raising in 2025-2026 window',
    'Strategic timing: entering MENA mobility market ahead of expected regulatory harmonization in 2026'
  ]

  const recommendations = [
    `Accelerate ${laggingProject.name || 'lagging initiatives'} through dedicated resource allocation or consider strategic pivot`,
    'Leverage completed feasibility studies to approach infrastructure funds and family offices in Q1 2025',
    'Establish strategic partnerships with OEMs or large logistics players to de-risk market entry',
    'Develop investor deck highlighting alignment with national sustainability goals (ESG angle)',
    'Consider pre-seed capital raise of $3-5M to accelerate 2-3 flagship projects to beta/pilot stage'
  ]

  const investorAppeal = {
    strengths: [
      'Diversified portfolio with multiple revenue streams',
      'High-growth MENA market with limited competition',
      'Strong execution track record (based on progress metrics)',
      'Alignment with government mega-projects and Vision 2030'
    ],
    concerns: [
      'Need capital injection to maintain momentum',
      'Regulatory uncertainty in nascent markets',
      'Competition from well-funded international players',
      'Localization complexity and partnership dependencies'
    ],
    overallRating: 'Attractive (B+/A-)',
    targetInvestors: 'Infrastructure funds, family offices, impact investors, strategic corporates'
  }

  return {
    executiveSummary,
    strategicInsights,
    recommendations,
    investorAppeal,
    tone: 'professional-optimistic',
    confidence: 87,
    wordCount: executiveSummary.split(' ').length,
    lastUpdated: new Date().toISOString(),
    isMultiAIAnalysis: true,
    source: 'ChatGPT-5 (Mock)'
  }
}

/**
 * Test ChatGPT API connection
 */
export async function testChatGPTConnection() {
  try {
    const response = await fetch(CHATGPT_API_ENDPOINT, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      return { success: true, message: '✅ ChatGPT-5 API connected' }
    } else {
      return { success: false, message: `API returned ${response.status}` }
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
}
