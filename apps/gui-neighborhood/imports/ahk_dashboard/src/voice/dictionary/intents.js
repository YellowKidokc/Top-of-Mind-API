export const INTENTS = {
  START_ANALYSIS: [
    // English
    "emma start analysis",
    "start analysis",
    "begin analysis",
    "run analysis",
    "emma run the analysis",
    "emma review dashboard",
    "review dashboard",
    "give me the status report",
    "summarize dashboard",
    "show today's status",
    "what's the progress",
    "give me progress update",
    "analyze",
    "start analyzing",
    "perform analysis",
    "do analysis",
    // Arabic
    "ابدئي التحليل",
    "شغلي التحليل",
    "ابدأ التحليل",
    "شغل التحليل",
    "إيما ابدئي التحليل",
    "إيما شغلي التحليل"
  ],

  READ_REPORT: [
    // English
    "read the report",
    "emma read the report",
    "read report",
    "explain analysis",
    "walk me through the results",
    "show me insights",
    "give me insights",
    "highlight key points",
    "read it",
    "what's the report",
    "tell me the report",
    "brief me",
    "report summary",
    "summarize report",
    "give me the insights",
    "what are the insights",
    // Arabic
    "اقرئي التقرير",
    "اقرأ التقرير",
    "ملخص التقرير",
    "أعطيني الخلاصة",
    "أعطني الخلاصة",
    "ملخص",
    "الخلاصة",
    "ايه التقرير",
    "قولي التقرير"
  ],

  NEXT_ACTIONS: [
    // English
    "what do I do now",
    "next steps",
    "what's next",
    "next actions",
    "what should I do",
    "give me next actions",
    "what are the next steps",
    "action items",
    // Arabic
    "ما الخطوة التالية",
    "ايه الخطوة الجاية",
    "ما الإجراءات التالية",
    "ايه اللي لازم اعمله",
    "الخطوات التالية",
    "إجراءات"
  ],

  REPEAT: [
    // English
    "repeat",
    "say again",
    "repeat that",
    "say it again",
    "one more time",
    "can you repeat",
    "repeat please",
    // Arabic
    "أعيدي",
    "أعيد",
    "كرري",
    "كرر",
    "قوليها تاني",
    "مرة تانية"
  ],

  DAILY_REPORT: [
    "daily report",
    "today's report",
    "give me daily report",
    "show daily report",
    "what's today's report",
    "daily summary",
    "day summary",
    "today summary",
    "التقرير اليومي",
    "تقرير اليوم"
  ],

  DISPLAY_REPORT: [
    "display",
    "show it",
    "display it",
    "show on screen",
    "display report",
    "put it on screen",
    "show me",
    "display that",
    "on screen",
    "اعرضي",
    "اعرض",
    "اعرضيه",
    "اعرضه على الشاشة"
  ],

  EMAIL_REPORT: [
    "email",
    "send email",
    "email it",
    "send it",
    "email report",
    "send by email",
    "mail it",
    "send the report",
    "email that",
    "ابعتي إيميل",
    "ابعت إيميل",
    "ارسلي",
    "ارسل التقرير"
  ],

  RISK_ANALYSIS: [
    "risk",
    "risk analysis",
    "analyze risk",
    "assess risk",
    "check risk",
    "what are the risks",
    "show risks",
    "risk assessment",
    "evaluate risk",
    "المخاطر",
    "تحليل المخاطر",
    "ايه المخاطر"
  ],

  SHOW_REPORTS: [
    "show reports",
    "view archive",
    "reports archive",
    "open archive",
    "show report archive",
    "see reports",
    "view reports",
    "archive",
    "أظهر التقارير",
    "أرشيف التقارير",
    "افتح الأرشيف"
  ],

  FUSION_GERMEX: [
    "analyze germex",
    "fusion germex",
    "germex analysis",
    "run germex",
    "germex fusion",
    "do germex analysis",
    "start germex"
  ],

  FUSION_SHIFTEV: [
    "analyze shift ev",
    "fusion shift ev",
    "shift ev analysis",
    "run shift ev",
    "shift ev fusion",
    "do shift ev analysis",
    "start shift ev",
    "analyze shift",
    "fusion shift"
  ],

  REPORT_GERMEX_INVESTOR: [
    "investor report germex",
    "germex investor report",
    "investor report for germex",
    "generate germex investor report",
    "germex report",
    "investor germex"
  ],

  RISK_SHIFTEV: [
    "risk analysis shift ev",
    "shift ev risk",
    "analyze shift ev risk",
    "risk shift ev",
    "shift ev risk analysis",
    "shift risk"
  ],

  STOP: [
    // English
    "stop",
    "cancel",
    "emma stop",
    "end session",
    "that's enough",
    "close voice",
    "nevermind",
    "never mind",
    "halt",
    "abort",
    "forget it",
    "enough",
    "quit",
    // Arabic
    "توقفي",
    "توقف",
    "بس",
    "كفاية",
    "خلاص",
    "إلغاء",
    "أوقفي"
  ],
};

/**
 * Match user input to an intent (supports AR/EN)
 * @param {string} text - User's spoken command
 * @returns {string|null} - Matched intent key or null
 */
export function matchIntent(text) {
  if (!text) return null;
  
  const normalized = text.toLowerCase().trim();
  
  for (const [intent, phrases] of Object.entries(INTENTS)) {
    // Check if ANY phrase in the intent array is contained in the user's text
    // Using includes() for flexible matching (handles word order variations)
    if (phrases.some(phrase => {
      const normalizedPhrase = phrase.toLowerCase();
      // Exact match or contains match
      return normalized === normalizedPhrase || 
             normalized.includes(normalizedPhrase) ||
             normalizedPhrase.includes(normalized);
    })) {
      return intent;
    }
  }
  
  return null; // No match found
}
