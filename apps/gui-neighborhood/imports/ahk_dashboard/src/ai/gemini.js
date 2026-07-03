// src/ai/gemini.js

/**
 * Ask Gemini AI for strategic analysis using structured context
 * @param {Object} params - Analysis parameters
 * @param {Array} params.projects - Project data
 * @param {Array} params.roadmap - Roadmap tasks
 * @param {string} params.latestReport - Text report from preparePrompt()
 * @param {Object} params.structured - Structured context from preparePrompt()
 * @returns {Promise<Object>} AI response with advice and metadata
 */
export async function askGemini({ projects, roadmap, latestReport, structured }) {
  const payload = {
    model: 'gemini-2.5-pro',
    task: 'dashboard_advisory_v1',
    context: structured || {
      date: new Date().toISOString(),
      org: 'AHKStrategies',
      unit: 'Strategic Mobility Program',
      projects,
      roadmap,
      latestReport
    },
    prompt: `You are an AI strategic advisor for AHK Strategies. Analyze the provided context and generate:

1. **Investor Brief** (2-3 sentences): Executive summary of portfolio health
2. **Next 3 Actions** (prioritized list): Immediate actions for next 48-72 hours
3. **Risk Map**: Categorize risks as HIGH, MEDIUM, or LOW with specific items
4. **Strategic Recommendations**: 2-3 high-impact suggestions

Context:
${latestReport}

Return structured JSON:
{
  "investorBrief": "...",
  "nextActions": ["action1", "action2", "action3"],
  "riskMap": {
    "high": ["risk1"],
    "medium": ["risk2"],
    "low": ["risk3"]
  },
  "recommendations": ["rec1", "rec2"]
}`,
    outputs: [
      'Investor Brief (2-3 sentences)',
      'Next 3 Actions (prioritized)',
      'Risk Map (HIGH/MEDIUM/LOW categories)',
      'Strategic Recommendations'
    ]
  };

  // NOTE: Real Gemini API requires API key configuration
  // Set GEMINI_API_KEY in environment variables or vite.config.js
  // Example: const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  const res = await fetch('/api/ai-hook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    throw new Error(`AI hook failed: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json(); // { advice: "...", metadata: {...} }
  
  // Try to parse structured response
  if (data.advice) {
    try {
      const jsonMatch = data.advice.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { ...data, structured: parsed };
      }
    } catch (e) {
      console.warn('Could not parse structured response:', e);
    }
  }
  
  return data;
}
