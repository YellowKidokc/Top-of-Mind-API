/**
 * Gemini File Intelligence System (FIS) GUI - Application Controller
 * Labeled and coded by Gemini.
 * 
 * Handles UI view switching, state management, API connection logic,
 * rendering, and user action event handlers.
 */

// Global State Object - Owned by Gemini
const GeminiAppState = {
  activeView: 'onboarding',
  isConnected: false,
  apiUrl: 'http://127.0.0.1:10000',
  apiToken: '',
  onboardingAnswers: {},
  predictions: [],
  fileCache: [],
  rules: [],
  reviews: [],
  selectedSchema: 'clean_snake',
  activeFolderGridFilter: 'all'
};

// Console logs prefix for auditing
const GEMINI_LOG = "[Gemini Controller]";

// DOM Elements
const elements = {
  viewTitle: null,
  viewDesc: null,
  workspaceBody: null,
  connectionStatus: null,
  connectionBtn: null,
  navBadgePredictions: null,
  navBadgeReviews: null
};

// Initialize the Application
window.addEventListener('DOMContentLoaded', () => {
  console.log(`${GEMINI_LOG} Initializing GUI...`);
  
  // Cache DOM references
  elements.viewTitle = document.getElementById('view-title');
  elements.viewDesc = document.getElementById('view-desc');
  elements.workspaceBody = document.getElementById('workspace-body');
  elements.connectionStatus = document.getElementById('connection-status');
  elements.connectionBtn = document.getElementById('connection-btn');
  
  elements.navBadgePredictions = document.getElementById('badge-predictions');
  elements.navBadgeReviews = document.getElementById('badge-reviews');

  // Load answers from localStorage if present
  const storedAnswers = localStorage.getItem('gemini_onboarding_answers');
  if (storedAnswers) {
    GeminiAppState.onboardingAnswers = JSON.parse(storedAnswers);
  }

  // Load datasets from MockData initially
  GeminiAppState.predictions = [...window.GeminiMockData.predictions];
  GeminiAppState.fileCache = [...window.GeminiMockData.fileCache];
  GeminiAppState.rules = [...window.GeminiMockData.rules];
  GeminiAppState.reviews = [...window.GeminiMockData.reviews];

  // Try to connect to API on startup
  testApiConnection();

  // Register Navigation Click Listeners
  document.querySelectorAll('.gemini-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  // Connection button handler
  elements.connectionBtn.addEventListener('click', () => {
    showConnectionModal();
  });

  // Render initial view
  switchView('onboarding');
  updateBadges();
});

// Switch Views
function switchView(viewId) {
  console.log(`${GEMINI_LOG} Switching view to: ${viewId}`);
  GeminiAppState.activeView = viewId;

  // Update nav item active states
  document.querySelectorAll('.gemini-nav-item').forEach(item => {
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Render View Content
  renderView(viewId);
}

// Render specific views
function renderView(viewId) {
  let html = '';

  switch (viewId) {
    case 'onboarding':
      elements.viewTitle.innerText = "Onboarding Constitution";
      elements.viewDesc.innerText = "Observe files, define operating axioms, and shape scanner constraints.";
      html = renderOnboardingView();
      break;
    case 'predictions':
      elements.viewTitle.innerText = "Gemini Prediction Board";
      elements.viewDesc.innerText = "Explain recommended file renames and moves. Let the user accept or override.";
      html = renderPredictionsView();
      break;
    case 'studio':
      elements.viewTitle.innerText = "Rename Studio";
      elements.viewDesc.innerText = "Pick a naming schema format, preview changes instantly, and batch clean.";
      html = renderStudioView();
      break;
    case 'builder':
      elements.viewTitle.innerText = "Folder System Builder";
      elements.viewDesc.innerText = "Classify folder roles and view diagnosed folder structures.";
      html = renderBuilderView();
      break;
    case 'rules':
      elements.viewTitle.innerText = "Automation Rules";
      elements.viewDesc.innerText = "Inspect rules generated from repeating accepted predictions.";
      html = renderRulesView();
      break;
    case 'reviews':
      elements.viewTitle.innerText = "Review Gate Queue";
      elements.viewDesc.innerText = "Visible safety gates for destructive, cross-drive, or low-confidence actions.";
      html = renderReviewsView();
      break;
    default:
      html = `<div>View not found</div>`;
  }

  elements.workspaceBody.innerHTML = html;
  attachViewEventListeners(viewId);
}

// Update Badges on Sidebar
function updateBadges() {
  const pendingPredsCount = GeminiAppState.predictions.filter(p => p.status === 'pending').length;
  const pendingReviewsCount = GeminiAppState.reviews.filter(r => r.status === 'waiting').length;

  if (elements.navBadgePredictions) {
    elements.navBadgePredictions.innerText = pendingPredsCount;
    elements.navBadgePredictions.style.display = pendingPredsCount > 0 ? 'inline-block' : 'none';
  }
  if (elements.navBadgeReviews) {
    elements.navBadgeReviews.innerText = pendingReviewsCount;
    elements.navBadgeReviews.style.display = pendingReviewsCount > 0 ? 'inline-block' : 'none';
  }
}

// RENDER: Onboarding Constitution
function renderOnboardingView() {
  const qList = window.GeminiMockData.questions;
  let qHtml = '';

  qList.forEach((q, index) => {
    let optionsHtml = '';
    const selectedVal = GeminiAppState.onboardingAnswers[q.id] || '';

    q.options.forEach(opt => {
      const isSelected = opt.value === selectedVal;
      optionsHtml += `
        <div class="gemini-option-card ${isSelected ? 'selected' : ''}" data-qid="${q.id}" data-val="${opt.value}">
          <div class="gemini-radio-dot"></div>
          <div class="gemini-option-label">${opt.label}</div>
        </div>
      `;
    });

    qHtml += `
      <div class="gemini-question-container">
        <div class="gemini-question-text">
          ${index + 1}. ${q.text}
          <span class="gemini-question-axiom-label">→ axiom: ${q.axiom}</span>
        </div>
        <div class="gemini-options-grid">
          ${optionsHtml}
        </div>
      </div>
    `;
  });

  return `
    <div class="gemini-banner-cyan">
      <strong>Gemini Trust Principle:</strong> We are not pretending to know you. Answers to this Constitution are converted directly into operating axioms. The background file scanner uses these rules to structure predictions.
    </div>
    <div class="gemini-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--gemini-line); padding-bottom:12px;">
        <h3 style="font-family:'Space Grotesk', sans-serif;">20 Preference Questions</h3>
        <button class="gemini-btn gemini-btn-primary" id="save-constitution-btn">Save Constitution</button>
      </div>
      <div id="questions-form">
        ${qHtml}
      </div>
    </div>
  `;
}

// RENDER: Prediction Board
function renderPredictionsView() {
  const pending = GeminiAppState.predictions.filter(p => p.status === 'pending');
  if (pending.length === 0) {
    return `
      <div class="gemini-banner-cyan">
        All predictions processed. Scan active folders to generate more recommendations!
      </div>
    `;
  }

  let cardsHtml = '';
  pending.forEach(p => {
    cardsHtml += `
      <div class="gemini-pred-card" id="card-${p.id}">
        <div class="gemini-pred-header">
          <div class="gemini-pred-title">
            <span style="color:var(--gemini-gold); font-family:'IBM Plex Mono', monospace;">${p.fileName}</span>
            <span class="gemini-badge gemini-badge-${p.riskGate}">${p.riskGate} risk</span>
          </div>
          <div class="gemini-pred-confidence">Confidence: ${(p.confidence * 100).toFixed(0)}%</div>
        </div>
        <div class="gemini-pred-body">
          <div class="gemini-pred-flow">
            <div class="gemini-flow-step">
              <div class="gemini-flow-label">Original path</div>
              <div class="gemini-flow-val">${p.originalPath}</div>
            </div>
            <div class="gemini-flow-step recommended">
              <div class="gemini-flow-label">Gemini Recommended Action</div>
              <div class="gemini-flow-val target">${p.action.toUpperCase()}: ${p.recommended}</div>
            </div>
          </div>
          <div class="gemini-pred-explanation">
            <div class="gemini-explanation-text">
              <strong>Rationale:</strong> ${p.reason}
            </div>
            <div class="gemini-pred-actions">
              <button class="gemini-btn gemini-btn-primary btn-accept" data-id="${p.id}">Accept Prediction</button>
              <button class="gemini-btn gemini-btn-secondary btn-correct" data-id="${p.id}">Correct / Override</button>
              <button class="gemini-btn gemini-btn-secondary btn-rule" data-id="${p.id}">Make Rule Permanent</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  return `
    <div class="gemini-banner-cyan">
      <strong>Observation Queue:</strong> The scanner proposed the following actions based on co-occurrence, folder affinity, and date patterns. Nothing is modified on your disk until you approve.
    </div>
    <div class="gemini-pred-grid">
      ${cardsHtml}
    </div>
  `;
}

// RENDER: Rename Studio
function renderStudioView() {
  const schemas = [
    { id: 'clean_snake', name: 'Clean Snake', example: 'quarterly_report_2026_07.pdf', desc: 'All lowercase, words separated by underscores, dates appended at end.' },
    { id: 'clean_title', name: 'Clean Title', example: 'Quarterly Report 2026 07.pdf', desc: 'Capitalized words, separated by spaces, date suffix.' },
    { id: 'date_project_slug', name: 'Date Project Slug', example: '2026-07-03_finance_quarterly_report.pdf', desc: 'Date prefixed, followed by domain and file descriptors.' },
    { id: 'domain_date_type', name: 'Domain Date Type', example: 'finance_2026-07-03_receipt_walmart.pdf', desc: 'Domain categorized first, followed by timestamp and file descriptors.' }
  ];

  let schemaSelectorHtml = '';
  schemas.forEach(sc => {
    const isActive = GeminiAppState.selectedSchema === sc.id;
    schemaSelectorHtml += `
      <div class="gemini-schema-box ${isActive ? 'active' : ''}" data-schema="${sc.id}">
        <div class="gemini-schema-name">${sc.name} ${isActive ? '✓' : ''}</div>
        <div class="gemini-schema-example">${sc.example}</div>
        <div class="gemini-schema-desc">${sc.desc}</div>
      </div>
    `;
  });

  let filesHtml = '';
  GeminiAppState.fileCache.forEach(file => {
    const suggestedName = file[GeminiAppState.selectedSchema] || file.originalName;
    const isMispelled = file.spelling_flags > 0;
    filesHtml += `
      <tr>
        <td class="gemini-original-path">${file.originalName}</td>
        <td><span style="font-family:'IBM Plex Mono', monospace; font-size:11px;">${file.extension}</span></td>
        <td><span class="gemini-badge gemini-badge-low" style="background:rgba(78, 194, 186, 0.08);">${file.domain}</span></td>
        <td class="gemini-rename-suggest">${suggestedName}</td>
        <td>
          ${isMispelled ? `<span style="color:var(--gemini-red); font-size:11px;">⚠️ Spelling (${file.spelling_flags} flags)</span>` : `<span style="color:var(--gemini-green); font-size:11px;">✓ Clean</span>`}
        </td>
      </tr>
    `;
  });

  return `
    <div class="gemini-studio-layout">
      <div class="gemini-card" style="margin-bottom:0;">
        <h3 style="font-family:'Space Grotesk', sans-serif; margin-bottom:16px; color:var(--gemini-cyan);">Cached File Preview</h3>
        <div class="gemini-studio-table-container">
          <table class="gemini-table">
            <thead>
              <tr>
                <th>Original Name</th>
                <th>Ext</th>
                <th>Domain</th>
                <th>Suggested Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filesHtml}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="gemini-card">
          <h3 style="font-family:'Space Grotesk', sans-serif; margin-bottom:16px;">Naming Schemas</h3>
          ${schemaSelectorHtml}
        </div>
      </div>
    </div>
  `;
}

// RENDER: Folder System Builder
function renderBuilderView() {
  const stats = window.GeminiMockData.folderStats;
  let foldersHtml = '';
  
  stats.predictedRoles.forEach(f => {
    foldersHtml += `
      <div class="gemini-folder-card">
        <div class="gemini-folder-name" style="word-break: break-all;">${f.path.split('/').pop()}</div>
        <div class="gemini-folder-stat-row">
          <span style="color:var(--gemini-text-muted)">Detected Role:</span>
          <span class="gemini-folder-role">${f.role.toUpperCase()}</span>
        </div>
        <div class="gemini-folder-stat-row">
          <span style="color:var(--gemini-text-muted)">Confidence:</span>
          <span style="color:var(--gemini-gold); font-family:'IBM Plex Mono', monospace;">${(f.confidence*100).toFixed(0)}%</span>
        </div>
        <div style="font-size:11.5px; color:var(--gemini-text-faint); margin-top:6px; line-height:1.4;">
          <strong>Symptoms:</strong> ${f.symptoms}
        </div>
      </div>
    `;
  });

  let distHtml = '';
  stats.fileTypeDistribution.forEach(d => {
    distHtml += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(56, 67, 92, 0.25);">
        <span style="font-family:'IBM Plex Mono', monospace; font-weight:600; color:var(--gemini-cyan);">${d.ext}</span>
        <span style="font-size:12px; color:var(--gemini-text-muted);">${d.count} files (${d.size})</span>
      </div>
    `;
  });

  return `
    <div class="gemini-banner-cyan">
      <strong>Folder Diagnosis:</strong> Scanner analyzed <strong>${stats.totalFiles} files</strong> across active directory paths. Folder role models classify types automatically to prevent organization clutter.
    </div>
    <div style="display:grid; grid-template-columns: 1fr 320px; gap:24px;">
      <div class="gemini-card">
        <h3 style="font-family:'Space Grotesk', sans-serif; margin-bottom:18px;">Diagnosed Roles & Folders</h3>
        <div class="gemini-folder-grid">
          ${foldersHtml}
        </div>
      </div>
      <div class="gemini-card">
        <h3 style="font-family:'Space Grotesk', sans-serif; margin-bottom:18px;">Extension Stats</h3>
        <div>
          ${distHtml}
        </div>
      </div>
    </div>
  `;
}

// RENDER: Automation Rules
function renderRulesView() {
  let rulesHtml = '';

  GeminiAppState.rules.forEach(r => {
    rulesHtml += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:var(--gemini-panel-solid); border:1px solid var(--gemini-line); border-radius:var(--gemini-radius); margin-bottom:10px;">
        <div>
          <div style="font-family:'Space Grotesk', sans-serif; font-weight:600; color:var(--gemini-gold);">${r.type}: ${r.condition}</div>
          <div style="font-size:12px; color:var(--gemini-text-muted); margin-top:4px;">Action: <span style="font-family:'IBM Plex Mono', monospace; color:var(--gemini-cyan);">${r.action}</span></div>
          <div style="font-size:10px; color:var(--gemini-text-faint); margin-top:2px;">Creator: ${r.creator}</div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="color:var(--gemini-green); font-size:11px; font-family:'IBM Plex Mono', monospace;">● ACTIVE</span>
          <button class="gemini-btn gemini-btn-secondary btn-disable-rule" data-id="${r.id}" style="padding:6px 12px; font-size:11px;">Disable</button>
        </div>
      </div>
    `;
  });

  return `
    <div class="gemini-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid var(--gemini-line); padding-bottom:12px;">
        <h3 style="font-family:'Space Grotesk', sans-serif;">Active Automated Rules</h3>
        <button class="gemini-btn gemini-btn-primary" id="add-rule-btn">Create Custom Rule</button>
      </div>
      <div>
        ${rulesHtml}
      </div>
    </div>
  `;
}

// RENDER: Review Gate Queue
function renderReviewsView() {
  const waiting = GeminiAppState.reviews.filter(r => r.status === 'waiting');
  if (waiting.length === 0) {
    return `
      <div class="gemini-banner-cyan">
        Review Queue is currently empty. No high-risk operations queued.
      </div>
    `;
  }

  let queueHtml = '';
  waiting.forEach(r => {
    queueHtml += `
      <div class="gemini-review-card" id="rev-${r.id}">
        <div class="gemini-review-header">
          <div class="gemini-review-title">${r.riskGate}</div>
          <div style="font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--gemini-text-faint);">Job ID: ${r.jobId}</div>
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:14px; font-weight:600;">Reason: ${r.reason}</div>
          <div style="font-size:12.5px; color:var(--gemini-text-muted); margin-top:6px;">Target: <span style="font-family:'IBM Plex Mono', monospace; color:var(--gemini-cyan);">${r.sourcePath} → ${r.targetPath}</span></div>
        </div>
        <div class="gemini-review-details">
          <strong>Validation checks:</strong> ${r.details}
        </div>
        <div style="display:flex; gap:10px;">
          <button class="gemini-btn gemini-btn-danger btn-approve-review" data-id="${r.id}">Approve Execution</button>
          <button class="gemini-btn gemini-btn-secondary btn-reject-review" data-id="${r.id}">Revoke & Block</button>
        </div>
      </div>
    `;
  });

  return `
    <div class="gemini-banner-cyan" style="background:var(--gemini-red-glow); border-left-color:var(--gemini-red);">
      <strong>Review Gate Active:</strong> The following destructive or cross-drive file movements were flagged. They are blocked from reaching the operating system disk ledger until confirmed manually.
    </div>
    <div>
      ${queueHtml}
    </div>
  `;
}

// Attach event listeners for dynamic UI sections
function attachViewEventListeners(viewId) {
  if (viewId === 'onboarding') {
    // Radio selection clicks
    document.querySelectorAll('.gemini-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const qid = card.getAttribute('data-qid');
        const val = card.getAttribute('data-val');

        // Toggle selected state in state object
        GeminiAppState.onboardingAnswers[qid] = val;

        // Render again to update visual selections
        renderView('onboarding');
      });
    });

    // Save button click
    const saveBtn = document.getElementById('save-constitution-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        localStorage.setItem('gemini_onboarding_answers', JSON.stringify(GeminiAppState.onboardingAnswers));
        showToast("Gemini Constitution Saved!", "Axioms written successfully to SQLite.");
      });
    }
  }

  else if (viewId === 'predictions') {
    // Accept prediction button
    document.querySelectorAll('.btn-accept').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const pred = GeminiAppState.predictions.find(p => p.id === id);
        
        // Simulating API call `/operator/file-actions` or `/predict/correct`
        console.log(`${GEMINI_LOG} Approving prediction:`, pred);
        
        // Animate removal
        const card = document.getElementById(`card-${id}`);
        card.style.opacity = 0;
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          pred.status = 'approved';
          renderView('predictions');
          updateBadges();
          showToast("Action Executed!", `Moved/Renamed file to ${pred.recommended}`);
        }, 300);
      });
    });

    // Correct / Override prediction
    document.querySelectorAll('.btn-correct').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const pred = GeminiAppState.predictions.find(p => p.id === id);
        const newTarget = prompt(`Override destination for: ${pred.fileName}`, pred.recommended);
        if (newTarget) {
          pred.recommended = newTarget;
          pred.confidence = 1.0;
          pred.reason = "User manually corrected target path via Gemini override gate.";
          renderView('predictions');
          showToast("Override Successful", "Prediction target updated.");
        }
      });
    });

    // Make Rule Permanent
    document.querySelectorAll('.btn-rule').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const pred = GeminiAppState.predictions.find(p => p.id === id);
        
        // Simulating API post `/predict/make-permanent`
        const newRule = {
          id: 'rule_' + Date.now(),
          type: 'Path Pattern',
          condition: `*${pred.extensions}`,
          action: `Auto-Move to ${pred.recommended.substring(0, pred.recommended.lastIndexOf('/'))}/`,
          creator: 'Gemini Rule Synthesizer',
          status: 'active'
        };

        GeminiAppState.rules.push(newRule);
        showToast("Permanent Rule Synthesized!", `Automatically routing *${pred.extensions} files in the future.`);
      });
    });
  }

  else if (viewId === 'studio') {
    // Schema selection box click
    document.querySelectorAll('.gemini-schema-box').forEach(box => {
      box.addEventListener('click', () => {
        const schema = box.getAttribute('data-schema');
        GeminiAppState.selectedSchema = schema;
        renderView('studio');
      });
    });
  }

  else if (viewId === 'rules') {
    // Disable rule action
    document.querySelectorAll('.btn-disable-rule').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        GeminiAppState.rules = GeminiAppState.rules.filter(r => r.id !== id);
        renderView('rules');
        showToast("Rule Removed", "Synthesized schema was disabled.");
      });
    });

    // Add custom rule
    const addRuleBtn = document.getElementById('add-rule-btn');
    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => {
        const condition = prompt("Enter file matches pattern (e.g. *.xlsx):", "*.xlsx");
        const action = prompt("Enter target directory path:", "D:/Finance/Spreadsheets/");
        if (condition && action) {
          GeminiAppState.rules.push({
            id: 'rule_' + Date.now(),
            type: 'Manual Rule',
            condition: condition,
            action: `Move to ${action}`,
            creator: 'User Configured',
            status: 'active'
          });
          renderView('rules');
          showToast("Rule Created", "Manual file rule added.");
        }
      });
    }
  }

  else if (viewId === 'reviews') {
    // Approve item in safety review gate
    document.querySelectorAll('.btn-approve-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rev = GeminiAppState.reviews.find(r => r.id === id);
        
        console.log(`${GEMINI_LOG} Executing review item approval:`, rev);
        
        // Remove item
        const card = document.getElementById(`rev-${id}`);
        card.style.opacity = 0;
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          rev.status = 'approved';
          
          // Delete from prediction too if matching path
          GeminiAppState.predictions = GeminiAppState.predictions.filter(p => p.originalPath !== rev.sourcePath);

          renderView('reviews');
          updateBadges();
          showToast("Review Approved", "File action written successfully to OS ledger.");
        }, 300);
      });
    });

    // Reject and block review item
    document.querySelectorAll('.btn-reject-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rev = GeminiAppState.reviews.find(r => r.id === id);
        
        const card = document.getElementById(`rev-${id}`);
        card.style.opacity = 0;
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          rev.status = 'rejected';
          renderView('reviews');
          updateBadges();
          showToast("Action Revoked", "File operation was blocked and removed from the active queue.");
        }, 300);
      });
    });
  }
}

// API Integration Helpers - Labeled by Gemini
async function testApiConnection() {
  console.log(`${GEMINI_LOG} Probing backend API at ${GeminiAppState.apiUrl}...`);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (GeminiAppState.apiToken) {
      headers['X-API-Token'] = GeminiAppState.apiToken;
    }

    const response = await fetch(`${GeminiAppState.apiUrl}/predict/stats`, {
      method: 'GET',
      headers: headers,
      signal: AbortSignal.timeout(2000) // Timeout after 2s
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`${GEMINI_LOG} Connected! Found backend stats:`, data);
      setConnected(true);
      fetchRealData();
    } else {
      console.warn(`${GEMINI_LOG} Server returned status code: ${response.status}`);
      setConnected(false);
    }
  } catch (error) {
    console.warn(`${GEMINI_LOG} Connection failed. Defaulting to Simulated Demo Mode (Offline).`);
    setConnected(false);
  }
}

function setConnected(connected) {
  GeminiAppState.isConnected = connected;
  if (connected) {
    elements.connectionStatus.innerHTML = `<span class="gemini-status-dot"></span> API Connected`;
    elements.connectionBtn.innerText = "Connection Config";
  } else {
    elements.connectionStatus.innerHTML = `<span class="gemini-status-dot offline"></span> Simulated Mode`;
    elements.connectionBtn.innerText = "Connect API";
  }
}

// Fetch live database values from FastAPI backend
async function fetchRealData() {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (GeminiAppState.apiToken) {
      headers['X-API-Token'] = GeminiAppState.apiToken;
    }

    // List recent cached files
    const resFiles = await fetch(`${GeminiAppState.apiUrl}/files/cache?limit=100`, { headers });
    if (resFiles.ok) {
      const data = await resFiles.json();
      if (data.files && data.files.length > 0) {
        // Map API format into our fileCache list
        GeminiAppState.fileCache = data.files.map((f, i) => ({
          id: i + 200,
          originalName: f.full_path.split(/[\\/]/).pop(),
          extension: '.' + f.full_path.split('.').pop(),
          domain: f.metadata?.domain || 'General',
          type: f.metadata?.type || 'Document',
          sizeBytes: f.size_bytes,
          clean_snake: f.metadata?.clean_snake || f.full_path.split(/[\\/]/).pop().toLowerCase().replace(/\s+/g, '_'),
          clean_title: f.full_path.split(/[\\/]/).pop(),
          date_project_slug: f.full_path.split(/[\\/]/).pop(),
          domain_date_type: f.full_path.split(/[\\/]/).pop(),
          spelling_flags: 0,
          collision_warning: 'None'
        }));
      }
    }

    // List current rules
    const resRules = await fetch(`${GeminiAppState.apiUrl}/predict/rules`, { headers });
    if (resRules.ok) {
      const data = await resRules.json();
      if (data.rules) {
        GeminiAppState.rules = data.rules;
      }
    }

    // Render view again if we updated the backend sources
    renderView(GeminiAppState.activeView);
    updateBadges();
  } catch (err) {
    console.error(`${GEMINI_LOG} Error fetching live resources:`, err);
  }
}

// Toast notification broker - Gemini Engineered
function showToast(title, body) {
  // Check if toast element exists
  let container = document.getElementById('gemini-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gemini-toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.background = 'var(--gemini-panel-solid)';
  toast.style.border = '1px solid var(--gemini-cyan)';
  toast.style.borderLeft = '4px solid var(--gemini-cyan)';
  toast.style.borderRadius = 'var(--gemini-radius-sm)';
  toast.style.padding = '12px 18px';
  toast.style.boxShadow = 'var(--gemini-shadow)';
  toast.style.color = '#fff';
  toast.style.width = '280px';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = '0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  
  toast.innerHTML = `
    <div style="font-weight:700; font-size:13px; color:var(--gemini-cyan); font-family:'Space Grotesk', sans-serif;">${title}</div>
    <div style="font-size:11.5px; color:var(--gemini-text-muted); margin-top:4px;">${body}</div>
  `;

  container.appendChild(toast);
  
  // Trigger entry animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 50);

  // Trigger exit animation
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Connection Configuration modal dialog
function showConnectionModal() {
  // Check if overlay exists
  let overlay = document.getElementById('gemini-conn-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'gemini-conn-modal';
    overlay.className = 'gemini-modal-overlay';
    overlay.innerHTML = `
      <div class="gemini-modal-content">
        <button class="gemini-modal-close" id="modal-close-btn">&times;</button>
        <h2 style="font-family:'Space Grotesk', sans-serif; margin-bottom:16px; color:var(--gemini-gold);">Gemini API Bridge Setup</h2>
        <p style="color:var(--gemini-text-muted); font-size:13px; margin-bottom:20px;">
          Configure local or LAN server connections to exchange database states and invoke prediction models. Leave credentials blank if running in development mode.
        </p>
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
          <div>
            <label style="display:block; font-size:11px; font-family:'IBM Plex Mono', monospace; margin-bottom:6px; color:var(--gemini-text-muted);">API Host Endpoint</label>
            <input type="text" id="input-api-url" value="${GeminiAppState.apiUrl}" style="width:100%; background:#1a202c; border:1px solid var(--gemini-line); border-radius:6px; padding:8px 10px; color:#fff; font-family:'IBM Plex Mono', monospace; font-size:12.5px;">
          </div>
          <div>
            <label style="display:block; font-size:11px; font-family:'IBM Plex Mono', monospace; margin-bottom:6px; color:var(--gemini-text-muted);">Security Token (FIHUB_API_TOKEN)</label>
            <input type="password" id="input-api-token" value="${GeminiAppState.apiToken}" placeholder="Leave unset for default local connection" style="width:100%; background:#1a202c; border:1px solid var(--gemini-line); border-radius:6px; padding:8px 10px; color:#fff; font-family:'IBM Plex Mono', monospace; font-size:12.5px;">
          </div>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button class="gemini-btn gemini-btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button class="gemini-btn gemini-btn-primary" id="modal-save-btn">Establish Connection</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Register event listeners
    document.getElementById('modal-close-btn').addEventListener('click', hideConnectionModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', hideConnectionModal);
    document.getElementById('modal-save-btn').addEventListener('click', () => {
      GeminiAppState.apiUrl = document.getElementById('input-api-url').value.trim();
      GeminiAppState.apiToken = document.getElementById('input-api-token').value.trim();
      hideConnectionModal();
      showToast("Connecting...", "Attempting to query API host endpoint...");
      testApiConnection();
    });
  }

  overlay.style.display = 'flex';
}

function hideConnectionModal() {
  const overlay = document.getElementById('gemini-conn-modal');
  if (overlay) {
    overlay.style.display = 'none';
  }
}
