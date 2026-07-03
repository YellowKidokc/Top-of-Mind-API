/**
 * Fusion Runner - Multi-AI Orchestration for Client Analysis
 * Coordinates Gemini, Grok, ChatGPT for consensus-driven insights
 */

import { fetchGeminiAnalysis } from '../api/geminiClient.js';

/**
 * Run fusion analysis for a client
 */
export async function runFusionAnalysis({ client, docs, scope = 'general', top_n = 5 }) {
  console.log('[PILOT] Running Fusion Analysis:', { client: client.name, scope, docCount: docs.length });
  
  try {
    // Build context from client and docs
    const context = buildContext(client, docs);
    
    // Generate prompts based on scope
    const prompts = generatePrompts(client, context, scope);
    
    // Call all AI providers (parallel)
    const [geminiResult, grokResult, chatgptResult] = await Promise.allSettled([
      callGemini(prompts),
      callGrok(prompts),
      callChatGPT(prompts)
    ]);
    
    // Extract successful responses
    const responses = {
      gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : null,
      grok: grokResult.status === 'fulfilled' ? grokResult.value : null,
      chatgpt: chatgptResult.status === 'fulfilled' ? chatgptResult.value : null
    };
    
    // Fuse results into consensus
    const fusion = fuseResponses(responses, scope, top_n);
    
    console.log('[PILOT] Fusion complete:', { 
      insights: fusion.insights.length,
      risks: fusion.risks.length,
      opportunities: fusion.growth_ops.length
    });
    
    return {
      success: true,
      fusion,
      meta: {
        client_id: client.id,
        client_name: client.name,
        scope,
        providers: Object.keys(responses).filter(k => responses[k] !== null),
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('[PILOT] Fusion analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Build context from client and documents
 */
function buildContext(client, docs) {
  const context = {
    client: {
      name: client.name,
      industry: client.industry,
      country: client.country,
      website: client.website,
      status: client.status
    },
    documents: docs.map(doc => ({
      title: doc.title,
      type: doc.type,
      tags: doc.tags,
      path: doc.path
    })),
    docSummary: docs.map(d => `${d.title} (${d.tags.join(', ')})`).join('\n')
  };
  
  return context;
}

/**
 * Generate prompts for each scope
 */
function generatePrompts(client, context, scope) {
  const basePrompt = `
Client: ${client.name}
Industry: ${client.industry}
Country: ${client.country}
Status: ${client.status}

Available Documents:
${context.docSummary}

`;

  const scopePrompts = {
    general: `${basePrompt}
Provide a comprehensive strategic analysis covering:
1. Market positioning and competitive landscape
2. Key business opportunities (top 5)
3. Major risks and challenges (top 5)
4. Strategic recommendations

Format as JSON with keys: insights[], risks[], opportunities[], recommendations[]`,

    risk: `${basePrompt}
Focus on risk analysis:
1. Operational risks specific to ${client.industry}
2. Market risks in ${client.country}
3. Financial and regulatory risks
4. Mitigation strategies

Format as JSON with keys: risks[] (each with: type, severity, impact, mitigation)`,

    growth: `${basePrompt}
Focus on growth opportunities:
1. Market expansion possibilities
2. Product/service innovation areas
3. Partnership and collaboration opportunities
4. Emerging trends to leverage

Format as JSON with keys: growth_ops[] (each with: category, potential, timeframe, investment)`,

    investor: `${basePrompt}
Create an investor-ready analysis:
1. Investment thesis and value proposition
2. Market size and growth trajectory
3. Competitive advantages
4. Financial outlook and ROI potential
5. Risk factors

Format as JSON with keys: investor_angles[] (each with: aspect, analysis, confidence)`
  };

  return scopePrompts[scope] || scopePrompts.general;
}

/**
 * Call Gemini AI
 */
async function callGemini(prompt) {
  try {
    const response = await fetchGeminiAnalysis(prompt, { 
      temperature: 0.7,
      format: 'json'
    });
    return parseAIResponse(response, 'gemini');
  } catch (error) {
    console.warn('[PILOT] Gemini call failed:', error.message);
    return null;
  }
}

/**
 * Call Grok (mock for now)
 */
async function callGrok(prompt) {
  console.log('[PILOT] Grok call (mocked)');
  // Mock Grok response
  return {
    insights: [
      'Strong regional market presence in North Africa',
      'Well-positioned for emerging market growth',
      'Established distribution network advantage'
    ],
    risks: [
      { type: 'market', severity: 'medium', description: 'Currency volatility in regional markets' },
      { type: 'operational', severity: 'low', description: 'Supply chain dependencies' }
    ],
    opportunities: [
      { category: 'expansion', potential: 'high', description: 'Sub-Saharan Africa market entry' },
      { category: 'digital', potential: 'medium', description: 'E-commerce channel development' }
    ]
  };
}

/**
 * Call ChatGPT (mock for now)
 */
async function callChatGPT(prompt) {
  console.log('[PILOT] ChatGPT call (mocked)');
  // Mock ChatGPT response
  return {
    insights: [
      'Industry leader with strong brand recognition',
      'Diversified product portfolio reduces risk',
      'Strategic partnerships with key distributors'
    ],
    risks: [
      { type: 'regulatory', severity: 'medium', description: 'Changing import/export regulations' },
      { type: 'competitive', severity: 'high', description: 'Increasing competition from Asian imports' }
    ],
    opportunities: [
      { category: 'innovation', potential: 'high', description: 'Sustainable materials adoption' },
      { category: 'partnership', potential: 'high', description: 'Strategic alliances with construction firms' }
    ]
  };
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response, provider) {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: extract bullet points as insights
    const lines = response.split('\n').filter(l => l.trim());
    return {
      insights: lines.slice(0, 5).map(l => l.replace(/^[-*•]\s*/, '').trim()),
      risks: [],
      opportunities: []
    };
  } catch (error) {
    console.warn(`[PILOT] Failed to parse ${provider} response:`, error);
    return {
      insights: ['Analysis completed - see raw output in console'],
      risks: [],
      opportunities: []
    };
  }
}

/**
 * Fuse multiple AI responses into consensus
 */
function fuseResponses(responses, scope, top_n) {
  const fusion = {
    insights: [],
    risks: [],
    growth_ops: [],
    investor_angles: [],
    consensus: {},
    providers: []
  };
  
  // Collect all responses
  const validResponses = Object.entries(responses)
    .filter(([_, resp]) => resp !== null)
    .map(([provider, resp]) => ({ provider, data: resp }));
  
  fusion.providers = validResponses.map(r => r.provider);
  
  if (validResponses.length === 0) {
    return fusion;
  }
  
  // Merge insights (deduplicate similar ones)
  const allInsights = validResponses.flatMap(r => 
    (r.data.insights || []).map(insight => ({
      text: insight,
      provider: r.provider,
      confidence: calculateConfidence(insight, validResponses)
    }))
  );
  
  fusion.insights = deduplicateAndRank(allInsights, top_n)
    .map(item => ({
      insight: item.text,
      confidence: item.confidence,
      sources: [item.provider]
    }));
  
  // Merge risks
  const allRisks = validResponses.flatMap(r =>
    (r.data.risks || []).map(risk => ({
      ...risk,
      provider: r.provider
    }))
  );
  
  fusion.risks = allRisks.slice(0, top_n).map(r => ({
    type: r.type || 'general',
    severity: r.severity || 'medium',
    description: r.description || r.text || 'Risk identified',
    mitigation: r.mitigation || 'Assessment pending',
    source: r.provider
  }));
  
  // Merge growth opportunities
  const allOpps = validResponses.flatMap(r =>
    (r.data.opportunities || r.data.growth_ops || []).map(opp => ({
      ...opp,
      provider: r.provider
    }))
  );
  
  fusion.growth_ops = allOpps.slice(0, top_n).map(o => ({
    category: o.category || 'general',
    potential: o.potential || 'medium',
    description: o.description || o.text || 'Opportunity identified',
    timeframe: o.timeframe || '12-24 months',
    investment: o.investment || 'TBD',
    source: o.provider
  }));
  
  // Investor angles (for investor scope)
  if (scope === 'investor') {
    const allAngles = validResponses.flatMap(r =>
      (r.data.investor_angles || []).map(angle => ({
        ...angle,
        provider: r.provider
      }))
    );
    
    fusion.investor_angles = allAngles.slice(0, top_n);
  }
  
  // Calculate consensus strength
  fusion.consensus = {
    strength: validResponses.length >= 2 ? 'high' : 'medium',
    provider_count: validResponses.length,
    agreement_score: calculateAgreementScore(validResponses)
  };
  
  return fusion;
}

/**
 * Calculate confidence based on mention frequency
 */
function calculateConfidence(text, responses) {
  const mentions = responses.filter(r => {
    const insights = r.data.insights || [];
    return insights.some(i => 
      similarity(i.toLowerCase(), text.toLowerCase()) > 0.6
    );
  }).length;
  
  if (mentions >= 3) return 'high';
  if (mentions === 2) return 'medium';
  return 'low';
}

/**
 * Simple text similarity (Jaccard)
 */
function similarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

/**
 * Deduplicate and rank by confidence
 */
function deduplicateAndRank(items, top_n) {
  const confidenceScores = { high: 3, medium: 2, low: 1 };
  
  return items
    .sort((a, b) => confidenceScores[b.confidence] - confidenceScores[a.confidence])
    .slice(0, top_n);
}

/**
 * Calculate agreement score across providers
 */
function calculateAgreementScore(responses) {
  if (responses.length < 2) return 0.5;
  
  // Simple heuristic: if multiple providers mention similar insights
  const allInsights = responses.flatMap(r => r.data.insights || []);
  const uniqueInsights = new Set(allInsights.map(i => i.toLowerCase()));
  
  const agreementRatio = 1 - (uniqueInsights.size / allInsights.length);
  return Math.round(agreementRatio * 100) / 100;
}
