/**
 * HTML Report Generator with AHK Branding
 * Converts markdown reports to premium-styled HTML with animations
 * MEGA-ERIC Module - November 9, 2025
 */

import { marked } from 'marked';
import fs from 'fs';
import path from 'path';

/**
 * Generate HTML from markdown with AHK premium branding
 * @param {string} markdownContent - Raw markdown content
 * @param {Object} options - Report metadata
 * @returns {string} Complete HTML document
 */
export function generateBrandedHTML(markdownContent, options = {}) {
  const {
    title = 'AHK Strategic Report',
    subtitle = 'Executive Analysis & Strategic Insights',
    author = 'Ashraf H. Kahoush',
    date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    reportType = 'Strategic Analysis',
    confidentiality = 'Confidential - Internal Use Only',
    version = '1.0'
  } = options;

  // Convert markdown to HTML
  const bodyHTML = marked.parse(markdownContent);

  // Generate complete HTML document with AHK branding
  const cacheBreaker = Date.now(); // Force browser refresh
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="${author}">
    <meta name="description" content="${subtitle}">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>${title} - AHK Strategies v${cacheBreaker}</title>
    <style>
        /* ===================================================================
           AHK STRATEGIES - PREMIUM REPORT STYLING
           Gold Gradient Theme with Glass Morphism
           =================================================================== */
        
        :root {
            --gold-primary: #D4AF37;
            --gold-light: #F4E4B0;
            --gold-dark: #B8941E;
            --navy-primary: #0A1929;
            --navy-light: #1A2332;
            --navy-lighter: #2A3342;
            --text-primary: #FFFFFF;
            --text-secondary: #B0B8C0;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(212, 175, 55, 0.2);
            --shadow-gold: 0 8px 32px rgba(212, 175, 55, 0.15);
            --shadow-dark: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
            background: linear-gradient(135deg, var(--navy-primary) 0%, var(--navy-light) 50%, var(--navy-lighter) 100%);
            color: var(--text-primary);
            line-height: 1.7;
            min-height: 100vh;
            padding: 0;
            position: relative;
            overflow-x: hidden;
        }

        /* Animated background overlay */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.06) 0%, transparent 50%);
            animation: pulse 15s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            position: relative;
            z-index: 1;
        }

        /* ===================================================================
           PREMIUM LETTERHEAD HEADER
           =================================================================== */
        .letterhead {
            background: linear-gradient(135deg, 
                rgba(212, 175, 55, 0.15) 0%, 
                rgba(212, 175, 55, 0.05) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 50px 60px;
            margin-bottom: 40px;
            box-shadow: var(--shadow-gold), var(--shadow-dark);
            position: relative;
            overflow: hidden;
            animation: fadeInUp 0.8s ease-out;
        }

        .letterhead::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                45deg,
                transparent 30%,
                rgba(212, 175, 55, 0.1) 50%,
                transparent 70%
            );
            animation: shimmer 3s infinite;
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }

        .logo {
            width: 80px;
            height: 80px;
            position: relative;
        }

        .logo::before {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--gold-primary);
            border-radius: 16px;
            filter: blur(20px);
            opacity: 0.5;
            animation: glow-pulse 2s ease-in-out infinite;
        }

        .logo-inner {
            position: relative;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
            animation: logo-pulse 3s ease-in-out infinite;
        }

        .logo-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
            font-size: 36px;
            font-weight: 900;
            color: var(--navy-primary);
        }

        @keyframes glow-pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
        }

        @keyframes logo-pulse {
            0%, 100% { transform: scale(1) translateY(0px); }
            50% { transform: scale(1.05) translateY(-5px); }
        }

        .brand-text {
            flex: 1;
        }

        .brand-name {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 5px;
        }

        .brand-tagline {
            font-size: 14px;
            color: var(--text-secondary);
            font-style: italic;
        }

        .report-title {
            font-size: 42px;
            font-weight: 800;
            background: linear-gradient(135deg, #FFFFFF, var(--gold-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 20px 0;
            line-height: 1.2;
            position: relative;
            z-index: 2;
        }

        .report-subtitle {
            font-size: 20px;
            color: var(--text-secondary);
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }

        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
            position: relative;
            z-index: 2;
        }

        .metadata-item {
            background: rgba(255, 255, 255, 0.03);
            padding: 15px 20px;
            border-radius: 10px;
            border: 1px solid rgba(212, 175, 55, 0.15);
        }

        .metadata-label {
            font-size: 12px;
            color: var(--gold-primary);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: 600;
        }

        .metadata-value {
            font-size: 16px;
            color: var(--text-primary);
            font-weight: 500;
        }

        /* ===================================================================
           CONTENT SECTIONS
           =================================================================== */
        .content-section {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 40px 50px;
            margin-bottom: 30px;
            box-shadow: var(--shadow-dark);
            animation: fadeInUp 0.8s ease-out;
            animation-fill-mode: both;
        }

        .content-section:nth-child(2) { animation-delay: 0.1s; }
        .content-section:nth-child(3) { animation-delay: 0.2s; }
        .content-section:nth-child(4) { animation-delay: 0.3s; }

        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            color: var(--text-primary);
            margin-top: 30px;
            margin-bottom: 15px;
            font-weight: 700;
        }

        h1 {
            font-size: 36px;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            border-bottom: 2px solid var(--gold-primary);
            padding-bottom: 15px;
        }

        h2 {
            font-size: 28px;
            color: var(--gold-light);
            border-left: 4px solid var(--gold-primary);
            padding-left: 20px;
        }

        h3 {
            font-size: 22px;
            color: var(--gold-light);
        }

        p {
            margin-bottom: 20px;
            color: var(--text-secondary);
            font-size: 16px;
        }

        strong {
            color: var(--text-primary);
            font-weight: 600;
        }

        em {
            color: var(--gold-light);
            font-style: italic;
        }

        /* Lists */
        ul, ol {
            margin: 20px 0;
            padding-left: 30px;
        }

        li {
            margin-bottom: 12px;
            color: var(--text-secondary);
            line-height: 1.8;
        }

        li::marker {
            color: var(--gold-primary);
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 10px;
            overflow: hidden;
        }

        th {
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
            color: var(--navy-primary);
            padding: 15px;
            text-align: left;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 1px;
        }

        td {
            padding: 15px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.1);
            color: var(--text-secondary);
        }

        tr:hover {
            background: rgba(212, 175, 55, 0.05);
        }

        /* Code blocks */
        code {
            background: rgba(212, 175, 55, 0.1);
            color: var(--gold-light);
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }

        pre {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            padding: 20px;
            overflow-x: auto;
            margin: 20px 0;
        }

        pre code {
            background: none;
            padding: 0;
        }

        /* Blockquotes */
        blockquote {
            border-left: 4px solid var(--gold-primary);
            padding: 20px 30px;
            margin: 30px 0;
            background: rgba(212, 175, 55, 0.05);
            border-radius: 0 10px 10px 0;
            font-style: italic;
            color: var(--text-primary);
        }

        /* Links */
        a {
            color: var(--gold-light);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: all 0.3s ease;
        }

        a:hover {
            color: var(--gold-primary);
            border-bottom-color: var(--gold-primary);
        }

        /* ===================================================================
           FOOTER
           =================================================================== */
        .report-footer {
            margin-top: 60px;
            padding: 30px;
            text-align: center;
            border-top: 1px solid var(--glass-border);
            color: var(--text-secondary);
            font-size: 14px;
        }

        .footer-logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 15px;
            position: relative;
        }

        .footer-logo::before {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--gold-primary);
            border-radius: 12px;
            filter: blur(16px);
            opacity: 0.5;
            animation: glow-pulse 2s ease-in-out infinite;
        }

        .footer-logo-inner {
            position: relative;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 900;
            color: var(--navy-primary);
            box-shadow: 0 4px 16px rgba(212, 175, 55, 0.4);
            animation: logo-pulse 3s ease-in-out infinite;
        }

        .confidentiality-notice {
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid var(--gold-primary);
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
            text-align: center;
            color: var(--gold-light);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Print styles */
        @media print {
            body {
                background: white;
                color: black;
            }
            
            .letterhead, .content-section {
                break-inside: avoid;
                box-shadow: none;
            }

            @page {
                margin: 2cm;
            }
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .container {
                padding: 20px 15px;
            }

            .letterhead {
                padding: 30px 25px;
            }

            .report-title {
                font-size: 28px;
            }

            .content-section {
                padding: 25px 20px;
            }

            .metadata {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Premium Letterhead Header -->
        <div class="letterhead">
            <div class="logo-container">
                <div class="logo">
                    <div class="logo-inner">
                        <div class="logo-fallback">AHK</div>
                    </div>
                </div>
                <div class="brand-text">
                    <div class="brand-name">AHK STRATEGIES</div>
                    <div class="brand-tagline">Strategic Dashboard</div>
                </div>
            </div>

            <h1 class="report-title">${title}</h1>
            <p class="report-subtitle">${subtitle}</p>

            <div class="metadata">
                <div class="metadata-item">
                    <div class="metadata-label">Report Type</div>
                    <div class="metadata-value">${reportType}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Date</div>
                    <div class="metadata-value">${date}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Author</div>
                    <div class="metadata-value">${author}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Version</div>
                    <div class="metadata-value">${version}</div>
                </div>
            </div>
        </div>

        <!-- Report Content -->
        <div class="content-section">
            ${bodyHTML}
        </div>

        <!-- Footer -->
        <div class="report-footer">
            <div class="footer-logo">
                <div class="footer-logo-inner">AHK</div>
            </div>
            <p><strong>AHK Strategies</strong> - Strategic Dashboard</p>
            <p>Managing Director: ${author}</p>
            <p>Contact: ashraf.kahoush@gmail.com | +201040787571 | Cairo, Egypt</p>
            
            <div class="confidentiality-notice">
                ${confidentiality}
            </div>
        </div>
    </div>
</body>
</html>`;

  return html;
}

/**
 * Save HTML report to file
 * @param {string} html - Complete HTML document
 * @param {string} outputPath - Where to save the file
 */
export function saveHTMLReport(html, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

/**
 * Generate and save HTML report in one step
 * @param {string} markdownContent - Raw markdown
 * @param {string} outputPath - Where to save
 * @param {Object} options - Report metadata
 * @returns {string} Path to saved HTML file
 */
export function createHTMLReport(markdownContent, outputPath, options = {}) {
  const html = generateBrandedHTML(markdownContent, options);
  return saveHTMLReport(html, outputPath);
}

export default {
  generateBrandedHTML,
  saveHTMLReport,
  createHTMLReport
};
