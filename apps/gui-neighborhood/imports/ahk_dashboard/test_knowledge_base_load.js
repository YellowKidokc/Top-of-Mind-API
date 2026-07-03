/**
 * Test Knowledge Base Loading
 * Debug script to verify segment loading works correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Knowledge Base Loading\n');

try {
  const knowledgeBasePath = path.join(__dirname, 'server', 'Emma_KnowledgeBase', 'sources', 'mena_horizon_2030');
  const manifestPath = path.join(knowledgeBasePath, 'manifest.json');
  
  console.log('📁 Knowledge Base Path:', knowledgeBasePath);
  console.log('📄 Manifest Path:', manifestPath);
  console.log('✅ Manifest exists:', fs.existsSync(manifestPath));
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log('\n📚 Manifest loaded:');
    console.log(`   Source: ${manifest.source}`);
    console.log(`   Synced: ${manifest.synced_at}`);
    console.log(`   Segments: ${manifest.total_segments}`);
    console.log(`   Total Size: ${(manifest.total_size / 1024).toFixed(2)} KB`);
    console.log(`   Total Tokens: ~${manifest.total_tokens}`);
    
    console.log('\n🔄 Loading segments...');
    const segmentContents = [];
    for (const segment of manifest.segments) {
      const segmentPath = path.join(knowledgeBasePath, segment.filename);
      if (fs.existsSync(segmentPath)) {
        const content = fs.readFileSync(segmentPath, 'utf-8');
        const withoutMetadata = content.replace(/^---[\s\S]*?---\n\n/, '');
        segmentContents.push(withoutMetadata);
        console.log(`   ✅ Loaded ${segment.filename}: ${withoutMetadata.length} chars`);
      } else {
        console.log(`   ❌ Missing ${segment.filename}`);
      }
    }
    
    const fullContent = segmentContents.join('\n\n');
    console.log(`\n✅ SUCCESS: Total content: ${fullContent.length} characters`);
    console.log(`\nFirst 500 characters:\n${fullContent.substring(0, 500)}...\n`);
    
  } else {
    console.log('❌ Manifest not found!');
  }
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
}
