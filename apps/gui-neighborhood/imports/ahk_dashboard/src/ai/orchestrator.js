// src/ai/orchestrator.js
/**
 * 🧠 Multi-AI Orchestration System
 * 
 * Coordinates multiple AI engines (Gemini, Grok, ChatGPT-5) to provide
 * comprehensive intelligence by combining quantitative analysis, market signals,
 * and strategic narratives into one unified report.
 * 
 * Architecture:
 * - Sequential API calls with 8s timeout per client
 * - Consensus scoring algorithm based on agreement patterns
 * - Result synthesis and deduplication
 * - localStorage persistence with history tracking
 * 
 * @module orchestrator
 */

import { fetchGeminiAnalysis } from '../api/geminiClient.js'
import { fetchGrokMarketFeed } from './GrokClient.js'
import { fetchChatGPTNarrative } from './ChatGPTClient.js'

const TIMEOUT_PER_CLIENT = 8000 // 8 seconds per AI
const MAX_HISTORY_ITEMS = 10

/**
 * Run Multi-AI Fusion Analysis
 * 
 * @param {Object} context - Structured context from preparePrompt()
 * @param {Object} context.structured - JSON data (projects, roadmap, metrics, KPIs)
 * @param {string} context.text - Human-readable text summary
 * @returns {Promise<Object>} Fused intelligence report
 */
export async function runMultiAIAnalysis(context) {
  console.log('🧩 Starting Multi-AI Fusion Analysis...')
  console.log('📊 Context:', {
    projects: context.structured?.data?.projects?.length || 0,
    tasks: context.structured?.data?.roadmap?.length || 0,
    hasKPIs: !!context.structured?.data?.investorKPIs
  })

  const startTime = Date.now()
  const results = {
    gemini: null,
    grok: null,
    chatgpt: null,
    errors: []
  }

  // 1️⃣ Call Gemini for quantitative analysis
  try {
    console.log('🤖 Calling Gemini 2.0 Flash...')
    results.gemini = await withTimeout(
      fetchGeminiAnalysis(context),
      TIMEOUT_PER_CLIENT,
      'Gemini timeout'
    )
    console.log('✅ Gemini response received')
  } catch (error) {
    console.error('❌ Gemini failed:', error.message)
    results.errors.push({ source: 'Gemini', error: error.message })
  }

  // 2️⃣ Call Grok for market intelligence
  try {
    console.log('🚀 Calling Grok via X API...')
    results.grok = await withTimeout(
      fetchGrokMarketFeed(context),
      TIMEOUT_PER_CLIENT,
      'Grok timeout'
    )
    console.log('✅ Grok response received')
  } catch (error) {
    console.error('❌ Grok failed:', error.message)
    results.errors.push({ source: 'Grok', error: error.message })
  }

  // 3️⃣ Call ChatGPT-5 for executive narrative
  try {
    console.log('💬 Calling ChatGPT-5...')
    results.chatgpt = await withTimeout(
      fetchChatGPTNarrative(context),
      TIMEOUT_PER_CLIENT,
      'ChatGPT timeout'
    )
    console.log('✅ ChatGPT response received')
  } catch (error) {
    console.error('❌ ChatGPT failed:', error.message)
    results.errors.push({ source: 'ChatGPT', error: error.message })
  }

  // 4️⃣ Synthesize results
  const fusedReport = synthesizeResults(results, context)
  fusedReport.executionTime = Date.now() - startTime
  fusedReport.timestamp = new Date().toISOString()

  // 5️⃣ Save to history
  saveFusionHistory(fusedReport)

  console.log('🎯 Fusion Analysis Complete:', {
    consensusScore: fusedReport.consensus_score,
    sources: fusedReport.sources_used,
    executionTime: `${fusedReport.executionTime}ms`
  })

  return fusedReport
}

/**
 * Synthesize results from multiple AI sources
 */
function synthesizeResults(results, context) {
  const { gemini, grok, chatgpt, errors } = results
  
  // Determine which sources responded
  const sourcesUsed = []
  if (gemini) sourcesUsed.push('Gemini 2.0')
  if (grok) sourcesUsed.push('Grok')
  if (chatgpt) sourcesUsed.push('ChatGPT-5')

  // Build consensus summary
  const summaryParts = []
  if (gemini?.investorBrief) summaryParts.push(gemini.investorBrief)
  if (chatgpt?.executiveSummary) summaryParts.push(chatgpt.executiveSummary)
  
  const mergedSummary = summaryParts.length > 0
    ? summaryParts.join(' ')
    : 'Analysis in progress. Some AI engines are unavailable.'

  // Calculate consensus score (0-100)
  const consensusScore = calculateConsensusScore(results)

  // Merge insights
  const allInsights = [
    ...(gemini?.investorInsights || []),
    ...(grok?.marketSignals || []),
    ...(chatgpt?.strategicInsights || [])
  ]

  // Merge recommendations
  const allRecommendations = [
    ...(gemini?.recommendations || []),
    ...(chatgpt?.recommendations || [])
  ]

  // Build fused report
  return {
    summary: mergedSummary,
    market_insights: grok?.feedSummary || 'Market data unavailable',
    quantitative_analysis: {
      investorBrief: gemini?.investorBrief || null,
      nextActions: gemini?.nextActions || [],
      riskMap: gemini?.riskMap || { high: [], medium: [], low: [] },
      insights: gemini?.investorInsights || []
    },
    narrative: chatgpt?.executiveSummary || 'Narrative synthesis unavailable',
    consensus_score: consensusScore,
    sources_used: sourcesUsed,
    all_insights: allInsights.slice(0, 10), // Top 10
    all_recommendations: allRecommendations.slice(0, 5), // Top 5
    errors: errors,
    raw: {
      gemini: gemini || null,
      grok: grok || null,
      chatgpt: chatgpt || null
    }
  }
}

/**
 * Calculate consensus score based on AI agreement
 * 
 * Algorithm:
 * - Base score: 50 if any AI responded
 * - +20 for each successful AI response (max +60)
 * - -10 for each error
 * - +10 if sentiment alignment detected
 * - Range: 0-100
 */
function calculateConsensusScore(results) {
  const { gemini, grok, chatgpt, errors } = results
  
  let score = 0
  
  // Base score for having any data
  const responsesCount = [gemini, grok, chatgpt].filter(r => r).length
  if (responsesCount === 0) return 0
  
  score = 40 // Base score
  
  // Add points for each successful response
  score += responsesCount * 20 // +20, +40, or +60
  
  // Penalize errors
  score -= errors.length * 10
  
  // Bonus for sentiment alignment (simple heuristic)
  if (gemini && chatgpt) {
    const geminiPositive = gemini.investorBrief?.toLowerCase().includes('strong') || 
                          gemini.investorBrief?.toLowerCase().includes('momentum')
    const chatgptPositive = chatgpt.executiveSummary?.toLowerCase().includes('strong') ||
                           chatgpt.executiveSummary?.toLowerCase().includes('momentum')
    if (geminiPositive === chatgptPositive) score += 10
  }
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Timeout wrapper for promises
 */
function withTimeout(promise, ms, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ])
}

/**
 * Save fusion result to localStorage history
 */
function saveFusionHistory(fusedReport) {
  try {
    const history = JSON.parse(localStorage.getItem('ahk-fusion-history') || '[]')
    
    // Add new report
    history.unshift({
      timestamp: fusedReport.timestamp,
      consensusScore: fusedReport.consensus_score,
      sourcesUsed: fusedReport.sources_used,
      summary: fusedReport.summary.substring(0, 200) + '...',
      executionTime: fusedReport.executionTime
    })
    
    // Keep only last 10
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem('ahk-fusion-history', JSON.stringify(trimmed))
    console.log('💾 Fusion history saved:', trimmed.length, 'items')
  } catch (error) {
    console.error('Failed to save fusion history:', error)
  }
}

/**
 * Get fusion analysis history
 */
export function getFusionHistory() {
  try {
    return JSON.parse(localStorage.getItem('ahk-fusion-history') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear fusion history
 */
export function clearFusionHistory() {
  localStorage.removeItem('ahk-fusion-history')
  console.log('🗑️ Fusion history cleared')
}
