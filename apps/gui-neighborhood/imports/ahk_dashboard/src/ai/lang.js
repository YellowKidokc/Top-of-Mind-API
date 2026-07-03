// src/ai/lang.js
export const LANGS = {
  EN: { code: 'en-US', tts: 'en-US' },
  AR: { code: 'ar-EG', tts: 'ar-SA' } // fallback ok
};

export function detectLangFromToggle(flag) {
  return flag === 'AR' ? LANGS.AR : LANGS.EN;
}

// Basic intent keys -> arrays of phrases in EN & AR
export const PHRASES = {
  OPEN_DASHBOARD: ['open dashboard', 'افتح لوحة التحكم', 'افتح الداشبورد'],
  OPEN_STRATEGY: ['open strategy', 'show roadmap', 'افتح الاستراتيجية', 'اعرض خارطة الطريق'],
  OPEN_MARKETING: ['open marketing', 'افتح التسويق', 'افتح ماركتينج'],
  OPEN_PARTNERSHIPS: ['open partnerships', 'افتح الشراكات'],
  OPEN_ASSETS: ['open assets', 'asset vault', 'افتح الأصول', 'قبو الأصول'],
  RUN_ANALYSIS: ['run analysis', 'ai analysis', 'شغل التحليل', 'تشغيل التحليل'],
  ENABLE_AUTOSYNC: ['enable autosync', 'turn on auto', 'شغل المزامنة التلقائية'],
  DISABLE_AUTOSYNC: ['disable autosync', 'turn off auto', 'وقف المزامنة', 'ايقاف المزامنة'],
  OVERDUE: ['what is overdue', 'overdue tasks', 'ما المتأخر', 'المهام المتأخرة'],
  PROJECT_SUMMARY: ['project summary', 'how are projects', 'ملخص المشاريع', 'كيف المشاريع'],
  ASK_GEMINI: ['ask gemini', 'gemini advice', 'اسأل جيميني', 'نصيحة جيميني'],
  ADD_TASK: ['add task', 'create task', 'أضف مهمة', 'اضافة مهمة', 'انشاء مهمة'],
  HELP: ['help', 'what can you do', 'مساعدة', 'ماذا تستطيع'],
};

export function matches(cmd, keys) {
  const c = cmd.toLowerCase();
  return keys.some(k => c.includes(k));
}
