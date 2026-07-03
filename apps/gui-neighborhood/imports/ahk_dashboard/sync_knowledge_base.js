/**
 * Knowledge Base Sync System
 * Syncs research documents from Google Drive to local segmented knowledge base
 * 
 * Purpose: Ensures Emma analyzes current data by:
 * 1. Fetching .docx from Drive
 * 2. Converting to semantic markdown
 * 3. Segmenting into manageable chunks (~1800 tokens)
 * 4. Saving to server/Emma_KnowledgeBase/sources/
 */

import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

// Configuration
const DRIVE_PATH = '/AHK Profile/Emma/KnowledgeBase/Research/MENA_Horizon_2030';
const DOCX_FILENAME = 'mena_horizon_2030.docx';
const OUTPUT_BASE = path.join(__dirname, 'server', 'Emma_KnowledgeBase', 'sources', 'mena_horizon_2030');
const MAX_TOKENS_PER_SEGMENT = 1800; // ~7200 characters (4 chars per token estimate)
const MAX_CHARS_PER_SEGMENT = MAX_TOKENS_PER_SEGMENT * 4;

// Initialize Google Drive API
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Find folder by path traversal
 */
async function findFolderByPath(pathSegments) {
  let parentId = 'root';
  
  for (const segment of pathSegments) {
    const response = await drive.files.list({
      q: `name='${segment}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    if (response.data.files.length === 0) {
      throw new Error(`Folder not found: ${segment}`);
    }
    
    parentId = response.data.files[0].id;
  }
  
  return parentId;
}

/**
 * Download file from Google Drive
 */
async function downloadFileFromDrive(filename, folderId) {
  console.log(`📥 Searching for ${filename} in Drive...`);
  
  const response = await drive.files.list({
    q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, size)',
    spaces: 'drive'
  });
  
  if (response.data.files.length === 0) {
    throw new Error(`File not found: ${filename}`);
  }
  
  const file = response.data.files[0];
  console.log(`✅ Found: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  
  const dest = path.join(__dirname, 'temp_download.docx');
  const destStream = fs.createWriteStream(dest);
  
  const driveResponse = await drive.files.get(
    { fileId: file.id, alt: 'media' },
    { responseType: 'stream' }
  );
  
  return new Promise((resolve, reject) => {
    driveResponse.data
      .on('end', () => {
        console.log(`✅ Downloaded to: ${dest}`);
        resolve(dest);
      })
      .on('error', reject)
      .pipe(destStream);
  });
}

/**
 * Convert DOCX to semantic markdown
 */
async function convertDocxToMarkdown(docxPath) {
  console.log(`🔄 Converting DOCX to markdown...`);
  
  const result = await mammoth.extractRawText({ path: docxPath });
  
  if (result.messages.length > 0) {
    console.log(`⚠️  Conversion warnings:`, result.messages.slice(0, 5));
  }
  
  const textLength = result.value.length;
  console.log(`✅ Extracted ${textLength} characters of raw text`);
  
  // Convert to basic markdown structure
  const lines = result.value.split('\n');
  let markdown = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      markdown += '\n';
      continue;
    }
    
    // Detect headings (ALL CAPS or short lines)
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 100 && trimmed.length > 3) {
      markdown += `\n## ${trimmed}\n\n`;
    } else {
      markdown += trimmed + '\n';
    }
  }
  
  return markdown;
}

/**
 * Clean and normalize markdown
 */
function cleanMarkdown(markdown) {
  return markdown
    // Remove excessive blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    // Normalize list markers
    .replace(/^\* /gm, '- ')
    // Remove trailing whitespace
    .replace(/[ \t]+$/gm, '')
    // Ensure proper heading spacing
    .replace(/^(#{1,6} .+)$/gm, '\n$1\n')
    .trim();
}

/**
 * Segment markdown by semantic boundaries
 */
function segmentMarkdown(markdown) {
  console.log(`✂️  Segmenting markdown (max ${MAX_CHARS_PER_SEGMENT} chars per segment)...`);
  
  const segments = [];
  let currentChunk = '';
  let segmentIndex = 1;
  
  // Split by paragraphs (double newline)
  const paragraphs = markdown.split(/\n\n+/);
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    // If adding this paragraph exceeds limit, save current chunk
    if (currentChunk.length + trimmedParagraph.length + 2 > MAX_CHARS_PER_SEGMENT && currentChunk.length > 0) {
      segments.push({
        index: segmentIndex++,
        content: currentChunk.trim(),
        size: currentChunk.trim().length,
        tokens: Math.ceil(currentChunk.trim().length / 4)
      });
      currentChunk = '';
    }
    
    // If paragraph itself is larger than limit, split it by sentences
    if (trimmedParagraph.length > MAX_CHARS_PER_SEGMENT) {
      const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        
        if (currentChunk.length + trimmedSentence.length + 2 > MAX_CHARS_PER_SEGMENT && currentChunk.length > 0) {
          segments.push({
            index: segmentIndex++,
            content: currentChunk.trim(),
            size: currentChunk.trim().length,
            tokens: Math.ceil(currentChunk.trim().length / 4)
          });
          currentChunk = '';
        }
        
        currentChunk += trimmedSentence + ' ';
      }
    } else {
      currentChunk += trimmedParagraph + '\n\n';
    }
  }
  
  // Save final segment
  if (currentChunk.trim().length > 0) {
    segments.push({
      index: segmentIndex,
      content: currentChunk.trim(),
      size: currentChunk.trim().length,
      tokens: Math.ceil(currentChunk.trim().length / 4)
    });
  }
  
  console.log(`✅ Created ${segments.length} segments`);
  const sampleSize = Math.min(10, segments.length);
  console.log(`   Showing first ${sampleSize} segments:`);
  segments.slice(0, sampleSize).forEach(seg => {
    console.log(`   Segment ${seg.index}: ${seg.size} chars (~${seg.tokens} tokens)`);
  });
  if (segments.length > sampleSize) {
    console.log(`   ... and ${segments.length - sampleSize} more segments`);
  }
  
  return segments;
}

/**
 * Save segments to knowledge base
 */
function saveSegments(segments, outputDir) {
  console.log(`💾 Saving segments to: ${outputDir}`);
  
  // Clear existing directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
    console.log(`🗑️  Cleared old segments`);
  }
  
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Save manifest
  const manifest = {
    source: 'Google Drive: /AHK Profile/Emma/KnowledgeBase/Research/MENA_Horizon_2030/mena_horizon_2030.docx',
    synced_at: new Date().toISOString(),
    segments: segments.map(seg => ({
      index: seg.index,
      filename: `segment_${String(seg.index).padStart(2, '0')}.md`,
      size: seg.size,
      tokens: seg.tokens
    })),
    total_segments: segments.length,
    total_size: segments.reduce((sum, seg) => sum + seg.size, 0),
    total_tokens: segments.reduce((sum, seg) => sum + seg.tokens, 0)
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`✅ Saved manifest.json`);
  
  // Save segments
  segments.forEach(seg => {
    const filename = `segment_${String(seg.index).padStart(2, '0')}.md`;
    const filepath = path.join(outputDir, filename);
    
    // Add metadata header
    const header = `---
segment: ${seg.index}
source: MENA Horizon 2030 Research Document
synced: ${new Date().toISOString()}
tokens: ~${seg.tokens}
---

`;
    
    fs.writeFileSync(filepath, header + seg.content);
    console.log(`✅ Saved ${filename}`);
  });
  
  return manifest;
}

/**
 * Main sync process
 */
async function syncKnowledgeBase() {
  console.log('\n🚀 Knowledge Base Sync Started\n');
  
  try {
    // 1. Find Drive folder
    console.log(`📁 Locating Drive folder: ${DRIVE_PATH}`);
    const pathSegments = DRIVE_PATH.split('/').filter(s => s);
    const folderId = await findFolderByPath(pathSegments);
    console.log(`✅ Folder ID: ${folderId}\n`);
    
    // 2. Download docx
    const docxPath = await downloadFileFromDrive(DOCX_FILENAME, folderId);
    console.log();
    
    // 3. Convert to markdown
    const markdown = await convertDocxToMarkdown(docxPath);
    const cleanedMarkdown = cleanMarkdown(markdown);
    console.log();
    
    // 4. Segment content
    const segments = segmentMarkdown(cleanedMarkdown);
    console.log();
    
    // 5. Save to knowledge base
    const manifest = saveSegments(segments, OUTPUT_BASE);
    console.log();
    
    // 6. Cleanup temp file
    fs.unlinkSync(docxPath);
    console.log(`🗑️  Removed temp file: ${docxPath}\n`);
    
    // 7. Summary
    console.log('✅ SYNC COMPLETE\n');
    console.log('📊 Summary:');
    console.log(`   Source: Google Drive`);
    console.log(`   Segments: ${manifest.total_segments}`);
    console.log(`   Total Size: ${(manifest.total_size / 1024).toFixed(2)} KB`);
    console.log(`   Total Tokens: ~${manifest.total_tokens}`);
    console.log(`   Output: ${OUTPUT_BASE}`);
    console.log(`   Synced: ${manifest.synced_at}\n`);
    
  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error.message);
    throw error;
  }
}

// Execute
syncKnowledgeBase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
