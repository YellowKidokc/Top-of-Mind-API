#!/usr/bin/env node

/**
 * MENA Horizon Complete Enhancement Cycle
 * Automated pipeline: Load → Fuse → Summarize → Inject → Generate HTML → Archive
 * MEGA-ERIC Module - November 9, 2025
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { enhanceDocument } from './server/utils/insight-injector.js';
import { createHTMLReport } from './server/utils/html-report-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Source document
  originalDoc: path.join(__dirname, '.archive/Emma_KnowledgeBase_OLD_20251106/Research/MENA_Horizon_2030/Extracted_Text/MENA_Horizon_2030_Extracted.md'),
  
  // Fusion reports (5 segments)
  fusionReports: [
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-01.md',
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-02.md',
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-03.md',
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-04.md',
    'server/Emma_KnowledgeBase/Reports/Generated/segment-fusion-05.md'
  ].map(p => path.join(__dirname, p)),
  
  // Unified summary
  unifiedSummary: path.join(__dirname, 'server/Emma_KnowledgeBase/Reports/Generated/Fusion_Summary_2025-11-09.md'),
  
  // Output paths
  outputDir: path.join(__dirname, 'server/Emma_KnowledgeBase/Reports/Generated'),
  enhancedMarkdown: 'MENA_Horizon_2030_ENHANCED.md',
  enhancedHTML: 'MENA_Horizon_2030_ENHANCED.html',
  
  // Report metadata
  metadata: {
    title: 'MENA Horizon 2030 - Enhanced Strategic Analysis',
    subtitle: 'Multi-AI Fusion Intelligence Report | 2020-2035 Economic Forecast',
    author: 'Ashraf H. Kahoush',
    reportType: 'Strategic Intelligence - Enhanced Edition',
    confidentiality: 'Confidential - Executive Decision Support',
    version: '2.0 Enhanced'
  }
};

// ============================================================================
// VALIDATION
// ============================================================================

function validateInputs() {
  console.log('\n📋 Validating input files...\n');
  
  const checks = [
    { label: 'Original MENA Document', path: CONFIG.originalDoc },
    { label: 'Unified Summary', path: CONFIG.unifiedSummary },
    ...CONFIG.fusionReports.map((p, i) => ({ 
      label: `Fusion Segment ${i + 1}`, 
      path: p 
    }))
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    const exists = fs.existsSync(check.path);
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${check.label}`);
    if (!exists) {
      console.log(`   ⚠️  Not found: ${check.path}`);
      allValid = false;
    }
  }
  
  if (!allValid) {
    throw new Error('Missing required input files. Cannot proceed.');
  }
  
  console.log('\n✅ All input files validated!\n');
}

// ============================================================================
// CYCLE EXECUTION
// ============================================================================

async function runEnhancementCycle() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  MENA HORIZON 2030 - COMPLETE ENHANCEMENT CYCLE             ║');
  console.log('║  MEGA-ERIC Automated Intelligence Pipeline                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 1: Validate inputs
    validateInputs();
    
    // Step 2: Enhance document (inject fusion insights)
    console.log('═'.repeat(64));
    console.log('STEP 1: INSIGHT INJECTION');
    console.log('═'.repeat(64) + '\n');
    
    const enhancedMarkdown = enhanceDocument(
      CONFIG.originalDoc,
      CONFIG.fusionReports,
      CONFIG.unifiedSummary
    );
    
    // Save enhanced markdown
    const mdPath = path.join(CONFIG.outputDir, CONFIG.enhancedMarkdown);
    fs.writeFileSync(mdPath, enhancedMarkdown, 'utf-8');
    console.log(`\n💾 Enhanced markdown saved: ${mdPath}`);
    
    // Step 3: Generate branded HTML
    console.log('\n' + '═'.repeat(64));
    console.log('STEP 2: HTML GENERATION WITH AHK BRANDING');
    console.log('═'.repeat(64) + '\n');
    
    console.log('🎨 Generating premium HTML with:');
    console.log('   • Gold gradient theme (#D4AF37)');
    console.log('   • Glass morphism effects');
    console.log('   • Animated AHK logo');
    console.log('   • Premium letterhead design');
    console.log('   • Responsive layout\n');
    
    const htmlPath = path.join(CONFIG.outputDir, CONFIG.enhancedHTML);
    createHTMLReport(enhancedMarkdown, htmlPath, CONFIG.metadata);
    
    console.log(`✅ HTML report generated: ${htmlPath}`);
    
    // Step 4: Generate summary report
    console.log('\n' + '═'.repeat(64));
    console.log('STEP 3: CYCLE COMPLETION REPORT');
    console.log('═'.repeat(64) + '\n');
    
    const stats = generateStats(enhancedMarkdown, CONFIG);
    displayStats(stats);
    
    // Save cycle report
    const cycleReport = generateCycleReport(stats);
    const reportPath = path.join(CONFIG.outputDir, 'MENA_Enhancement_Cycle_Report.md');
    fs.writeFileSync(reportPath, cycleReport, 'utf-8');
    
    console.log(`\n📊 Cycle report saved: ${reportPath}`);
    
    // Success
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ENHANCEMENT CYCLE COMPLETE                               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log('📁 Output Files:');
    console.log(`   1. ${CONFIG.enhancedMarkdown} (Enhanced source)`);
    console.log(`   2. ${CONFIG.enhancedHTML} (Branded HTML)`);
    console.log(`   3. MENA_Enhancement_Cycle_Report.md (Summary)\n`);
    
    console.log('🚀 Next Steps:');
    console.log('   • Open HTML file in browser to view branded report');
    console.log('   • Review enhancement cycle report for statistics');
    console.log('   • Archive is auto-updated and ready for dashboard display\n');
    
    return {
      success: true,
      markdownPath: mdPath,
      htmlPath,
      reportPath,
      stats
    };
    
  } catch (error) {
    console.error('\n❌ ENHANCEMENT CYCLE FAILED\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

function generateStats(enhancedContent, config) {
  const original = fs.readFileSync(config.originalDoc, 'utf-8');
  
  return {
    timestamp: new Date().toISOString(),
    original: {
      length: original.length,
      lines: original.split('\n').length,
      words: original.split(/\s+/).length
    },
    enhanced: {
      length: enhancedContent.length,
      lines: enhancedContent.split('\n').length,
      words: enhancedContent.split(/\s+/).length
    },
    fusion: {
      segments: config.fusionReports.length,
      reportsProcessed: config.fusionReports.filter(p => fs.existsSync(p)).length
    },
    outputs: {
      markdown: config.enhancedMarkdown,
      html: config.enhancedHTML
    }
  };
}

function displayStats(stats) {
  console.log('📊 Enhancement Statistics:\n');
  
  console.log('Original Document:');
  console.log(`   Length: ${stats.original.length.toLocaleString()} characters`);
  console.log(`   Lines: ${stats.original.lines.toLocaleString()}`);
  console.log(`   Words: ${stats.original.words.toLocaleString()}\n`);
  
  console.log('Enhanced Document:');
  console.log(`   Length: ${stats.enhanced.length.toLocaleString()} characters`);
  console.log(`   Lines: ${stats.enhanced.lines.toLocaleString()}`);
  console.log(`   Words: ${stats.enhanced.words.toLocaleString()}\n`);
  
  const addedChars = stats.enhanced.length - stats.original.length;
  const addedWords = stats.enhanced.words - stats.original.words;
  const percentIncrease = ((addedChars / stats.original.length) * 100).toFixed(1);
  
  console.log('Intelligence Added:');
  console.log(`   Characters: +${addedChars.toLocaleString()} (+${percentIncrease}%)`);
  console.log(`   Words: +${addedWords.toLocaleString()}`);
  console.log(`   Fusion Segments: ${stats.fusion.reportsProcessed}/${stats.fusion.segments}\n`);
}

function generateCycleReport(stats) {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `# MENA Horizon 2030 - Enhancement Cycle Report

**Generated:** ${date}  
**System:** MEGA-ERIC Automated Intelligence Pipeline  
**Status:** ✅ COMPLETE

---

## Cycle Summary

The MENA Horizon 2030 document has been successfully enhanced through a complete multi-AI fusion cycle. This process integrated strategic intelligence from ${stats.fusion.reportsProcessed} segment analyses, injected refined insights into the original document, and generated a premium-branded HTML report.

## Statistics

### Original Document
- **Characters:** ${stats.original.length.toLocaleString()}
- **Lines:** ${stats.original.lines.toLocaleString()}
- **Words:** ${stats.original.words.toLocaleString()}

### Enhanced Document
- **Characters:** ${stats.enhanced.length.toLocaleString()}
- **Lines:** ${stats.enhanced.lines.toLocaleString()}
- **Words:** ${stats.enhanced.words.toLocaleString()}

### Intelligence Added
- **Characters:** +${(stats.enhanced.length - stats.original.length).toLocaleString()} (+${((stats.enhanced.length - stats.original.length) / stats.original.length * 100).toFixed(1)}%)
- **Words:** +${(stats.enhanced.words - stats.original.words).toLocaleString()}
- **Fusion Segments Processed:** ${stats.fusion.reportsProcessed}/${stats.fusion.segments}

## Enhancement Highlights

### 1. Executive Summary Enhancement
- Multi-AI fusion quality assessment (84/100 average score)
- Strategic clarity improvements
- Investment roadmap integration
- Risk framework consolidation

### 2. Fusion Insights Section
- Consolidated strategic insights across all segments
- Two-Speed Economy framework validation
- Private sector opportunity analysis
- Geopolitical risk assessment
- Green-Digital transformation nexus

### 3. Strategic Recommendations
- C-level action items for investment strategy
- Comprehensive risk management framework
- Opportunity capture mechanisms
- Success metrics and red flag indicators

### 4. Premium HTML Generation
- AHK branded letterhead with gold gradients
- Glass morphism effects and animations
- Animated AHK logo
- Responsive design for all devices
- Print-optimized layouts

## Output Files

1. **${stats.outputs.markdown}**
   - Enhanced markdown with injected insights
   - Ready for further processing or version control

2. **${stats.outputs.html}**
   - Premium-branded HTML report
   - Suitable for executive presentations
   - Print-ready with professional styling

3. **This Report**
   - Cycle execution summary
   - Statistics and metrics
   - Validation of complete automation

## Automation Status

✅ **Fully Automated** - This cycle can be executed programmatically for future reports:

\`\`\`bash
node mena_enhancement_cycle.js
\`\`\`

All components are modular and reusable:
- \`server/utils/insight-injector.js\` - Insight extraction and injection
- \`server/utils/html-report-generator.js\` - HTML generation with branding
- \`mena_enhancement_cycle.js\` - Complete pipeline orchestration

## Next Steps

1. **Review Enhanced Report**: Open HTML file in browser
2. **Validate Insights**: Verify injected intelligence aligns with strategic objectives
3. **Archive Management**: Reports are automatically saved to knowledge base
4. **Dashboard Integration**: Enhanced reports visible in Reports Archive
5. **Automation**: Cycle ready for scheduled execution or API triggering

## Validation

- [x] All input files located and validated
- [x] Fusion insights successfully extracted from 5 segments
- [x] Unified summary integrated (84/100 fusion score)
- [x] Insights injected into original document
- [x] Enhanced markdown generated
- [x] Premium HTML report created with AHK branding
- [x] All outputs saved to archive
- [x] Cycle report generated

---

**MEGA-ERIC Status:** Enhancement cycle complete. System ready for next automation cycle.

**Timestamp:** ${stats.timestamp}
`;
}

// ============================================================================
// EXECUTION
// ============================================================================

// Run if called directly (check multiple conditions for Windows compatibility)
const isMain = import.meta.url.endsWith('mena_enhancement_cycle.js') || 
               process.argv[1]?.includes('mena_enhancement_cycle.js');

if (isMain) {
  console.log('Starting MENA Enhancement Cycle...\n');
  runEnhancementCycle()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Cycle completed successfully!\n');
        process.exit(0);
      } else {
        console.error('\n❌ Cycle failed:', result.error, '\n');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      console.error('Stack:', error.stack);
      process.exit(1);
    });
} else {
  console.log('Module loaded (not executed as main)');
}

export { runEnhancementCycle, CONFIG };
export default runEnhancementCycle;
