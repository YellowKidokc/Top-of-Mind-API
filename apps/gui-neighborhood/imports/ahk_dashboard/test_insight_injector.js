// Test insight injector module
import { enhanceDocument } from './server/utils/insight-injector.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Insight Injector...\n');

try {
  const originalDoc = path.join(__dirname, '.archive/Emma_KnowledgeBase_OLD_20251106/Research/MENA_Horizon_2030/Extracted_Text/MENA_Horizon_2030_Extracted.md');
  
  const fusionReports = [
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-01.md',
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-02.md',
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-03.md',
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-04.md',
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-05.md'
  ].map(p => path.join(__dirname, p));
  
  const unifiedSummary = path.join(__dirname, 'server/Emma_KnowledgeBase/Reports/Generated/Fusion_Summary_2025-11-09.md');

  console.log('Paths:');
  console.log(`Original: ${originalDoc}`);
  console.log(`Summary: ${unifiedSummary}`);
  console.log(`Fusion reports: ${fusionReports.length} files\n`);

  const enhanced = enhanceDocument(originalDoc, fusionReports, unifiedSummary);
  
  console.log('\n✅ Enhancement successful!');
  console.log(`Enhanced content length: ${enhanced.length} characters`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nStack:', error.stack);
}
