// cleanSummary.js - Emma's HTML-free speech pipeline
// Strips markup, extracts insights, formats executive summaries

/**
 * Strip HTML tags and convert to clean plain text
 * @param {string} text - Raw HTML or markup text
 * @returns {string} Clean plain text
 */
export function stripHtmlToPlain(text) {
  if (!text) return "";
  
  // Fast path for HTML → plain text
  const withoutTags = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  
  return withoutTags;
}

/**
 * Extract key insights from plain text using heuristics
 * @param {string} plain - Clean plain text
 * @returns {{bullets: string[], actions: string[], risks: string[]}}
 */
export function extractKeyInsights(plain) {
  if (!plain) return { bullets: [], actions: [], risks: [] };
  
  // Split into sentences/lines
  const lines = plain
    .split(/[.\n]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s.length > 15); // Filter out too-short fragments

  // Heuristic classifiers
  const isAction = (s) => /^(next|do|fix|ship|deploy|close|finalize|send|schedule|create|confirm|complete|start|begin|launch|execute|implement|deliver)\b/i.test(s);
  const isRisk = (s) => /(risk|delay|blocked|issue|constraint|dependency|exposure|gap|problem|challenge|concern|threat|bottleneck|critical|urgent|warning)/i.test(s);

  // Classify lines
  const actions = lines.filter(isAction).slice(0, 5);
  const risks = lines.filter(isRisk).slice(0, 5);
  const facts = lines.filter(s => !isAction(s) && !isRisk(s)).slice(0, 8);

  // Pick top facts as "insights"
  const bullets = facts.slice(0, 5);

  return { bullets, actions, risks };
}

/**
 * Format executive summary for speech
 * @param {{bullets: string[], actions: string[], risks: string[]}} data
 * @param {"en"|"ar"} lang
 * @returns {string} Formatted summary ready for TTS
 */
export function formatExecutiveSummary(data, lang) {
  if (lang === "ar") {
    const parts = [
      "الخلاصة التنفيذية:",
      ...data.bullets.map(b => `• ${b}`),
    ];

    if (data.actions.length > 0) {
      parts.push("");
      parts.push("الإجراءات التالية:");
      parts.push(...data.actions.map(a => `→ ${a}`));
    }

    if (data.risks.length > 0) {
      parts.push("");
      parts.push("المخاطر:");
      parts.push(...data.risks.map(r => `! ${r}`));
    }

    return parts.filter(Boolean).join("\n");
  }

  // English format
  const parts = [
    "Executive Summary:",
    ...data.bullets.map(b => `• ${b}`),
  ];

  if (data.actions.length > 0) {
    parts.push("");
    parts.push("Next Actions:");
    parts.push(...data.actions.map(a => `→ ${a}`));
  }

  if (data.risks.length > 0) {
    parts.push("");
    parts.push("Risks:");
    parts.push(...data.risks.map(r => `! ${r}`));
  }

  return parts.filter(Boolean).join("\n");
}

/**
 * Full pipeline: HTML → Clean Summary
 * @param {string} rawHtml - Raw HTML content
 * @param {"en"|"ar"} lang - Target language
 * @returns {string} Clean executive summary for TTS
 */
export function generateCleanSummary(rawHtml, lang = "en") {
  const plain = stripHtmlToPlain(rawHtml);
  const insights = extractKeyInsights(plain);
  const summary = formatExecutiveSummary(insights, lang);
  return summary;
}
