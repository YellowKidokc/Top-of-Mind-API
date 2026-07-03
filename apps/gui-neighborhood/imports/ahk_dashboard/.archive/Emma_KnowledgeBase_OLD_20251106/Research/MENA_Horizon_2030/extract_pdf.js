// PDF Text Extraction Script for MENA Horizon 2030
// ERIC - Emma KnowledgeBase Processor

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
const parsePDF = PDFParse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_PATH = path.join(__dirname, 'MENA Horizon 2030.pdf');
const OUTPUT_PATH = path.join(__dirname, 'Extracted_Text', 'MENA_Horizon_2030_Extracted.md');

console.log('🚀 ERIC PDF Extraction Protocol - INITIATED');
console.log('📄 Target: MENA Horizon 2030.pdf\n');

// Read PDF file
const dataBuffer = fs.readFileSync(PDF_PATH);

parsePDF(dataBuffer).then(function(data) {
  console.log('✅ PDF Parsed Successfully');
  console.log(`📊 Total Pages: ${data.numpages}`);
  console.log(`📝 Raw Text Length: ${data.text.length} characters\n`);

  // Clean the extracted text
  let cleanedText = data.text;

  // Remove common headers/footers patterns
  cleanedText = cleanedText.replace(/Page \d+ of \d+/gi, '');
  cleanedText = cleanedText.replace(/\d+\s*\|\s*Page/gi, '');
  
  // Remove excessive whitespace and blank lines
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  cleanedText = cleanedText.replace(/[ \t]+/g, ' ');
  
  // Remove common watermark patterns
  cleanedText = cleanedText.replace(/CONFIDENTIAL|DRAFT|INTERNAL USE ONLY/gi, '');
  
  // Split into lines and remove duplicates
  const lines = cleanedText.split('\n');
  const uniqueLines = [];
  const seenLines = new Set();
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed && !seenLines.has(trimmed)) {
      uniqueLines.push(trimmed);
      seenLines.add(trimmed);
    }
  }
  
  const finalText = uniqueLines.join('\n\n');
  
  // Add markdown header
  const markdown = `# MENA Horizon 2030 - Extracted Text
**Extracted Date:** ${new Date().toISOString().split('T')[0]}
**Source:** MENA Horizon 2030.pdf
**Processing:** ERIC - Emma KnowledgeBase Processor
**Total Pages:** ${data.numpages}

---

${finalText}

---

**End of Document**
`;

  // Save to markdown file
  fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');
  
  // Calculate statistics
  const wordCount = finalText.split(/\s+/).length;
  const fileSize = fs.statSync(OUTPUT_PATH).size;
  const fileSizeKB = (fileSize / 1024).toFixed(2);
  
  // Get first 10 lines for preview
  const previewLines = markdown.split('\n').slice(0, 10);
  
  console.log('🎯 EXTRACTION COMPLETE!');
  console.log('=' .repeat(50));
  console.log(`📝 Word Count: ${wordCount.toLocaleString()} words`);
  console.log(`💾 File Size: ${fileSizeKB} KB`);
  console.log(`📍 Saved to: ${OUTPUT_PATH}`);
  console.log('\n📋 FIRST 10 LINES PREVIEW:');
  console.log('=' .repeat(50));
  previewLines.forEach((line, idx) => {
    console.log(`${idx + 1}. ${line}`);
  });
  console.log('=' .repeat(50));
  console.log('\n✅ ERIC Protocol Complete - Knowledge Base Updated');
  
}).catch(function(error) {
  console.error('❌ PDF Extraction Failed:', error);
  process.exit(1);
});
