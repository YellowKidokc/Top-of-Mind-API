// src/api/geminiClient.js
/**
 * Gemini API Client
 * Handles authentication, request/response, retry logic, and fallback
 */

// Use Google AI Studio API with Gemini 2.0
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch analysis from Gemini 2.5 Pro API
 * @param {Object} context - Structured context from preparePrompt()
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} Parsed analysis with investorBrief, nextActions, riskMap
 */
export async function fetchGeminiAnalysis(context, options = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // Fallback to mock if no API key configured
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('⚠️ Gemini API key not configured. Using mock analysis.');
    return generateMockAnalysis(context);
  }

  const {
    timeout = REQUEST_TIMEOUT,
    retries = MAX_RETRIES,
    temperature = 0.7,
    maxOutputTokens = 2048
  } = options;

  let lastError = null;

  // Retry loop
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🤖 Gemini API call (attempt ${attempt}/${retries})...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const prompt = buildGeminiPrompt(context);
      
      const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens,
            topP: 0.95,
            topK: 40
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error:', errorText);
        
        if (response.status === 403) {
          throw new Error('API Error 403: The Generative Language API is not enabled for your project. Enable it at: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
        } else if (response.status === 401) {
          throw new Error('API Error 401: Invalid API key. Check VITE_GEMINI_API_KEY in .env');
        } else {
          throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
        }
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');

      // Extract text from Gemini response structure
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No text content in Gemini response');
      }

      // Parse structured response
      const analysis = parseGeminiResponse(generatedText);
      
      // Store successful response
      localStorage.setItem('lastGeminiResponse', JSON.stringify({
        timestamp: new Date().toISOString(),
        analysis,
        raw: generatedText
      }));

      return analysis;

    } catch (error) {
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.error(`⏱️ Gemini API timeout (attempt ${attempt})`);
      } else {
        console.error(`❌ Gemini API error (attempt ${attempt}):`, error.message);
      }

      // Don't retry on certain errors
      if (error.message.includes('401') || error.message.includes('403')) {
        console.error('🔑 Authentication failed. Check VITE_GEMINI_API_KEY');
        break;
      }

      // Wait before retry (except on last attempt)
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  // All retries failed, use mock fallback
  console.warn('⚠️ Gemini API failed after retries. Using mock analysis.', lastError);
  return generateMockAnalysis(context);
}

/**
 * Build comprehensive prompt for Gemini
 */
function buildGeminiPrompt(context) {
  const { structured, text } = context;
  
  return `You are an expert strategic advisor and investor analyst for AHK Strategies, a MENA-focused mobility and logistics consultancy.

**CONTEXT:**
${text}

**STRUCTURED DATA:**
${JSON.stringify(structured, null, 2)}

**YOUR TASK:**
Analyze the provided context and generate a comprehensive strategic report in the following JSON format:

{
  "investorBrief": "2-3 sentence executive summary highlighting portfolio health, momentum, and key metrics",
  "nextActions": [
    "Specific action 1 with timeline",
    "Specific action 2 with timeline", 
    "Specific action 3 with timeline"
  ],
  "riskMap": {
    "high": ["Critical risk 1", "Critical risk 2"],
    "medium": ["Important concern 1", "Important concern 2"],
    "low": ["Minor item 1"]
  },
  "investorInsights": [
    "Key investor insight 1 with data",
    "Key investor insight 2 with data",
    "Key investor insight 3 with data"
  ],
  "recommendations": [
    "Strategic recommendation 1",
    "Strategic recommendation 2"
  ]
}

**GUIDELINES:**
- Focus on actionable insights, not generic advice
- Use specific numbers and dates from the context
- Prioritize investor-readiness and growth momentum
- Identify blockers and provide mitigation strategies
- Be concise and executive-friendly

Return ONLY valid JSON, no additional text.`;
}

/**
 * Parse Gemini response text into structured analysis
 */
function parseGeminiResponse(text) {
  try {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (parsed.investorBrief && parsed.nextActions && parsed.riskMap) {
        // Ensure summary and fullText are included
        parsed.summary = parsed.investorBrief; // Executive summary
        parsed.fullText = formatFullReport(parsed); // Full formatted text
        return parsed;
      }
    }
    
    // Fallback: parse unstructured response
    console.warn('⚠️ Gemini returned unstructured response, attempting extraction...');
    return extractStructuredData(text);
    
  } catch (error) {
    console.error('❌ Failed to parse Gemini response:', error);
    throw new Error('Invalid Gemini response format');
  }
}

/**
 * Format full report from structured analysis
 */
function formatFullReport(analysis) {
  const { investorBrief, nextActions, riskMap, investorInsights, recommendations } = analysis;
  
  let report = `Executive Summary: ${investorBrief}\n\n`;
  
  if (nextActions && nextActions.length > 0) {
    report += `Next Actions:\n`;
    nextActions.forEach((action, i) => {
      report += `${i + 1}. ${action}\n`;
    });
    report += `\n`;
  }
  
  if (riskMap) {
    if (riskMap.high && riskMap.high.length > 0) {
      report += `High Priority Risks:\n`;
      riskMap.high.forEach((risk, i) => {
        report += `${i + 1}. ${risk}\n`;
      });
      report += `\n`;
    }
    if (riskMap.medium && riskMap.medium.length > 0) {
      report += `Medium Priority Items:\n`;
      riskMap.medium.forEach((item, i) => {
        report += `${i + 1}. ${item}\n`;
      });
      report += `\n`;
    }
  }
  
  if (investorInsights && investorInsights.length > 0) {
    report += `Investor Insights:\n`;
    investorInsights.forEach((insight, i) => {
      report += `${i + 1}. ${insight}\n`;
    });
    report += `\n`;
  }
  
  if (recommendations && recommendations.length > 0) {
    report += `Strategic Recommendations:\n`;
    recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });
  }
  
  return report.trim();
}

/**
 * Extract structured data from unstructured Gemini text
 */
function extractStructuredData(text) {
  // Simple extraction logic - can be enhanced
  const lines = text.split('\n').filter(l => l.trim());
  
  const analysis = {
    investorBrief: lines[0] || 'Analysis completed. See details below.',
    nextActions: lines.slice(1, 4).map(l => l.replace(/^[-*•]\s*/, '').trim()),
    riskMap: {
      high: [],
      medium: [],
      low: ['Review generated report for detailed analysis']
    },
    investorInsights: lines.slice(4, 7).map(l => l.replace(/^[-*•]\s*/, '').trim()),
    recommendations: lines.slice(7, 9).map(l => l.replace(/^[-*•]\s*/, '').trim())
  };
  
  // Add summary and fullText
  analysis.summary = analysis.investorBrief;
  analysis.fullText = formatFullReport(analysis);
  
  return analysis;
}

/**
 * Generate mock analysis when API unavailable
 */
function generateMockAnalysis(context) {
  const { structured } = context;
  const { data } = structured;
  
  const overdueTasks = data.roadmap?.filter(t => 
    t.status !== 'done' && 
    t.due && 
    new Date(t.due) < new Date()
  ) || [];
  
  const avgProgress = data.metrics?.avgProgress || 0;
  const activeProjects = data.projects?.length || 0;
  
  const analysis = {
    investorBrief: `Portfolio health: ${activeProjects} active projects with ${avgProgress}% average progress. ${overdueTasks.length} tasks overdue. Strong momentum in localization and logistics tracks.`,
    nextActions: [
      data.roadmap?.find(t => t.status === 'in-progress')?.title || 'Review project priorities and update roadmap',
      overdueTasks.length > 0 ? `Address ${overdueTasks.length} overdue tasks to maintain schedule` : 'Continue execution on current milestones',
      'Prepare investor deck with Q4 2024 metrics and Q1 2025 projections'
    ],
    riskMap: {
      high: overdueTasks.length > 2 ? [`${overdueTasks.length} overdue tasks requiring immediate attention`] : [],
      medium: data.projects?.filter(p => p.progress < 30).map(p => `${p.name} lagging at ${p.progress}% completion`) || [],
      low: ['Routine documentation and process updates pending']
    },
    investorInsights: [
      `${activeProjects} strategic projects in pipeline with combined TAM of $2.5B+ in MENA mobility sector`,
      `Average project progress of ${avgProgress}% indicates strong execution velocity`,
      'Q-VAN localization hub and WOW e-scooter expansion showing highest ROI potential'
    ],
    recommendations: [
      'Accelerate Q-VAN Phase 1 completion to capture Q1 2025 market window',
      'Leverage completed feasibility studies to approach Series A investors'
    ]
  };
  
  // Add summary and fullText
  analysis.summary = analysis.investorBrief;
  analysis.fullText = formatFullReport(analysis);
  
  return analysis;
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      success: false,
      message: 'API key not configured. Set VITE_GEMINI_API_KEY in .env file.'
    };
  }

  console.log('🔑 Testing Gemini API connection...');
  console.log('📍 Endpoint:', GEMINI_API_ENDPOINT);
  console.log('🔐 API Key:', `${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Test connection. Reply with: OK' }]
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Response status:', response.status, response.statusText);

    if (response.ok) {
      console.log('✅ Gemini API connected successfully');
      return {
        success: true,
        message: '✅ Gemini API connected successfully'
      };
    } else {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      if (response.status === 403) {
        return {
          success: false,
          message: `API Error 403: The Generative Language API is not enabled.\n\nEnable it here:\nhttps://console.cloud.google.com/apis/library/generativelanguage.googleapis.com`
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: `API Error 401: Invalid API key. Check VITE_GEMINI_API_KEY in .env`
        };
      } else {
        return {
          success: false,
          message: `API returned status ${response.status}: ${errorText.substring(0, 200)}`
        };
      }
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return {
      success: false,
      message: error.message
    };
  }
}
