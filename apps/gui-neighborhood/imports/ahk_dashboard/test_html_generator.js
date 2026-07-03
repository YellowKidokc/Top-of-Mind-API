// Test HTML generator
import { createHTMLReport } from './server/utils/html-report-generator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing HTML Report Generator...\n');

try {
  // Simple test markdown
  const testMarkdown = `# Test Report

## Section 1
This is a test report with **bold text** and *italic text*.

### Subsection
- Item 1
- Item 2
- Item 3

## Section 2
More content here.

\`\`\`javascript
console.log('Code block test');
\`\`\`
`;

  const outputPath = path.join(__dirname, 'server/Emma_KnowledgeBase/Reports/Generated/TEST_REPORT.html');
  
  const metadata = {
    title: 'Test Report',
    subtitle: 'HTML Generator Test',
    author: 'MEGA-ERIC',
    reportType: 'System Test',
    confidentiality: 'Internal Testing',
    version: '1.0'
  };

  console.log('Generating HTML report...');
  const htmlPath = createHTMLReport(testMarkdown, outputPath, metadata);
  
  console.log(`✅ HTML generated successfully!`);
  console.log(`   Path: ${htmlPath}`);
  console.log(`   Size: ${fs.statSync(htmlPath).size} bytes\n`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nStack:', error.stack);
}
