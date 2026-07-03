/**
 * Gemini File Intelligence System (FIS) GUI - Mock Data Engine
 * Built and labeled by Gemini.
 * 
 * Provides mock data simulating the SQLite backend database for instant
 * offline execution and testing.
 */

window.GeminiMockData = {
  // 20 Onboarding questions matching config/preferences/onboarding_questions.v1.json
  questions: [
    {
      id: "q01_primary_recall",
      text: "When you look for a file later, what do you usually remember first?",
      options: [
        { value: "project_or_client", label: "Project or Client (e.g. Acme Co)" },
        { value: "date_or_time", label: "Date or Time (e.g. March 2026)" },
        { value: "topic_or_domain", label: "Topic or Domain (e.g. Finance)" },
        { value: "file_type_or_app", label: "File Type or App (e.g. PDF, Python)" }
      ],
      behavior: "Sets the first organizing axis for folder plans and prediction tie-breaks.",
      axiom: "primary_navigation_axis"
    },
    {
      id: "q02_personal_business_split",
      text: "Should personal and business files stay in separate trees?",
      options: [
        { value: "always_separate", label: "Always separate (Strict firewall)" },
        { value: "usually_separate", label: "Usually separate (Try to isolate)" },
        { value: "can_mix_by_project", label: "Can mix by project (Context matters)" },
        { value: "no_preference", label: "No preference (Keep it simple)" }
      ],
      behavior: "Controls whether the folder builder may mix personal/business domains.",
      axiom: "separate_business_personal"
    },
    {
      id: "q03_project_vs_domain",
      text: "When project and topic disagree, which should win?",
      options: [
        { value: "project_wins", label: "Project wins (e.g. Acme/Finance)" },
        { value: "domain_wins", label: "Domain wins (e.g. Finance/Acme)" },
        { value: "date_wins", label: "Date wins (e.g. 2026/Acme)" },
        { value: "ask_each_time", label: "Ask me each time" }
      ],
      behavior: "Resolves destination conflicts such as ProjectA/Finance vs Finance/ProjectA.",
      axiom: "project_domain_priority"
    },
    {
      id: "q04_date_importance",
      text: "How important are dates in your file and folder names?",
      options: [
        { value: "always_include_date", label: "Always include date in filename" },
        { value: "include_for_records", label: "Include only for record-keeping types (Invoices, Logs)" },
        { value: "archive_only", label: "Only use dates for archiving old work" },
        { value: "rarely_include_date", label: "Rarely include dates in filename" }
      ],
      behavior: "Controls date use in naming suggestions and archive structures.",
      axiom: "date_in_name_policy"
    },
    {
      id: "q05_default_naming_schema",
      text: "Which naming style should be the first default?",
      options: [
        { value: "clean_snake", label: "clean_snake (quarterly_report_2026_07.pdf)" },
        { value: "clean_title", label: "clean_title (Quarterly Report 2026 07.pdf)" },
        { value: "date_project_slug", label: "date_project_slug (2026-07-03_finance_quarterly_report.pdf)" },
        { value: "domain_date_type", label: "domain_date_type (finance_2026-07-03_receipt_walmart.pdf)" }
      ],
      behavior: "Sets the first visible suggestion in Rename Studio.",
      axiom: "rename_schema_default"
    },
    {
      id: "q06_case_style",
      text: "How should normal file names be cased?",
      options: [
        { value: "all_lowercase", label: "All lowercase (quarterly_report.pdf)" },
        { value: "title_case", label: "Title Case (Quarterly_Report.pdf)" },
        { value: "preserve_original", label: "Preserve original file casing" },
        { value: "ask_by_folder", label: "Ask by folder type" }
      ],
      behavior: "Controls deterministic name normalization.",
      axiom: "case_style"
    },
    {
      id: "q07_separator_style",
      text: "What separator should cleaned names use?",
      options: [
        { value: "underscore", label: "Underscore (quarterly_report.pdf)" },
        { value: "hyphen", label: "Hyphen (quarterly-report.pdf)" },
        { value: "space", label: "Space (quarterly report.pdf)" },
        { value: "preserve_original", label: "Preserve original separator" }
      ],
      behavior: "Controls generated clean names.",
      axiom: "separator_style"
    },
    {
      id: "q08_spelling_cleanup",
      text: "Should the system suggest spelling cleanup in filenames?",
      options: [
        { value: "yes_auto_suggest", label: "Yes, automatically suggest (e.g. inbux -> inbox)" },
        { value: "yes_review_only", label: "Yes, but put in review queue first" },
        { value: "flag_only", label: "Flag spelling errors but don't auto-correct" },
        { value: "never", label: "Never clean spelling" }
      ],
      behavior: "Controls whether spelling corrections appear as suggestions or warnings.",
      axiom: "spellcheck_policy"
    },
    {
      id: "q09_folder_depth",
      text: "How deep should normal folders get?",
      options: [
        { value: "flat_1_to_2", label: "Flat (1-2 levels deep max)" },
        { value: "moderate_3_to_4", label: "Moderate (3-4 levels deep)" },
        { value: "deep_allowed", label: "Deep is allowed (5+ levels deep)" },
        { value: "mirror_existing", label: "Mirror whatever is currently there" }
      ],
      behavior: "Prevents the folder builder from creating structures the user hates.",
      axiom: "folder_depth_limit"
    },
    {
      id: "q10_archive_style",
      text: "How should old material be archived?",
      options: [
        { value: "by_year", label: "By Year (e.g. Archive/2025/)" },
        { value: "by_project", label: "By Project (e.g. Archive/AcmeCo/)" },
        { value: "by_domain", label: "By Domain (e.g. Archive/Finance/)" },
        { value: "do_not_archive_without_approval", label: "Do not archive automatically" }
      ],
      behavior: "Controls archive destination proposals and review gates.",
      axiom: "archive_policy"
    },
    {
      id: "q11_downloads_handling",
      text: "What should happen to messy inbox folders like Downloads?",
      options: [
        { value: "aggressive_triage", label: "Aggressive triage (Propose renaming/moving everything)" },
        { value: "suggest_batches", label: "Suggest in batches of 10" },
        { value: "rename_only_first", label: "Rename in place first, don't move" },
        { value: "observe_only", label: "Observe only (Quiet mode)" }
      ],
      behavior: "Controls how strongly the system proposes cleanup from inbox folders.",
      axiom: "inbox_aggression_level"
    },
    {
      id: "q12_duplicate_policy",
      text: "When duplicates are found, what should happen first?",
      options: [
        { value: "keep_newest", label: "Keep newest version and archive old ones" },
        { value: "keep_largest", label: "Keep largest size version" },
        { value: "keep_all_flag_only", label: "Keep all, flag naming only" },
        { value: "ask_every_time", label: "Ask for every duplicate" }
      ],
      behavior: "Controls duplicate recommendations while keeping destructive actions gated.",
      axiom: "duplicate_policy"
    },
    {
      id: "q13_unknown_extensions",
      text: "How should unknown or weird extensions be treated?",
      options: [
        { value: "protect_and_label", label: "Protect from action and label as Unknown" },
        { value: "quarantine_review", label: "Send to review gate before any action" },
        { value: "classify_by_content", label: "Attempt content classification" },
        { value: "ignore", label: "Ignore completely" }
      ],
      behavior: "Controls scanner labels and blocks unsafe cleanup.",
      axiom: "unknown_extension_policy"
    },
    {
      id: "q14_program_folders",
      text: "What should the system do with program/code/app folders?",
      options: [
        { value: "never_touch", label: "Never touch (Protected paths like .git, node_modules)" },
        { value: "scan_only", label: "Scan only for indexing, never propose edits" },
        { value: "allow_rename_docs_only", label: "Allow renaming documentation files inside them" },
        { value: "ask_by_project", label: "Ask on a per-project basis" }
      ],
      behavior: "Controls hard blocks around source code, apps, package roots, and scripts.",
      axiom: "program_root_policy"
    },
    {
      id: "q15_sensitive_domains",
      text: "Which domains need extra caution?",
      options: [
        { value: "legal_finance_medical", label: "Legal, Finance, and Medical records" },
        { value: "family_personal", label: "Family and Personal photos/journals" },
        { value: "business_clients", label: "Core business client contracts" },
        { value: "all_private", label: "All domains (Extremely strict review)" }
      ],
      behavior: "Adds review pressure and visibility limits to sensitive domains.",
      axiom: "protected_domains"
    },
    {
      id: "q16_media_handling",
      text: "How should photos, videos, and audio be organized?",
      options: [
        { value: "date_first", label: "Date-first (e.g. Media/2026-07/)" },
        { value: "event_project_first", label: "Event/Project first (e.g. Media/SummerTrip/)" },
        { value: "media_type_first", label: "Media type first (e.g. Video/Raw/)" },
        { value: "leave_in_place", label: "Leave in place" }
      ],
      behavior: "Controls media folder proposals and later conversion queues.",
      axiom: "media_folder_axis"
    },
    {
      id: "q17_sync_priority",
      text: "What matters most for synced devices?",
      options: [
        { value: "same_structure_everywhere", label: "Exact same folder layout replicated everywhere" },
        { value: "backup_only", label: "Treat other nodes as cold backups only" },
        { value: "desktop_primary", label: "This desktop is primary; push changes out" },
        { value: "nas_primary", label: "Synology NAS is primary; pull changes" }
      ],
      behavior: "Controls whether desktop, laptop, or NAS is authoritative for moves.",
      axiom: "sync_topology"
    },
    {
      id: "q18_automation_comfort",
      text: "When predictions are confident, what can the system do?",
      options: [
        { value: "suggest_only", label: "Suggest only (Never touch disk without click)" },
        { value: "apply_after_confirm", label: "Apply changes automatically after 5-second countdown" },
        { value: "auto_low_risk_log", label: "Auto-apply low-risk moves, log to file" },
        { value: "auto_common_rules", label: "Auto-apply matching permanent rules instantly" }
      ],
      behavior: "Sets trust level ceiling for non-destructive automation.",
      axiom: "automation_level"
    },
    {
      id: "q19_bulk_threshold",
      text: "How many files can be changed before you must review first?",
      options: [
        { value: "any_bulk_needs_review", label: "Any batch needs review (No limits)" },
        { value: "over_10", label: "More than 10 files" },
        { value: "over_50", label: "More than 50 files" },
        { value: "over_200", label: "More than 200 files" }
      ],
      behavior: "Sets review gate thresholds for batch rename/move/archive.",
      axiom: "bulk_review_threshold"
    },
    {
      id: "q20_undo_expectation",
      text: "How important is one-click undo for file changes?",
      options: [
        { value: "required_for_all_changes", label: "Strictly required for all actions (Undo snapshot)" },
        { value: "required_for_bulk", label: "Only required for batch actions" },
        { value: "log_is_enough", label: "A standard action log is enough" },
        { value: "not_important", label: "Not important at all" }
      ],
      behavior: "Controls whether jobs require reversible ledgers before execution.",
      axiom: "undo_policy"
    }
  ],

  // 10 Mock predictions for the Prediction Board
  predictions: [
    {
      id: "pred_gemini_001",
      fileName: "inbox_march_temp.docx",
      originalPath: "C:/Users/David/Downloads/inbox_march_temp.docx",
      action: "move",
      confidence: 0.94,
      userLikely: "Move to D:/Finance/Invoices/2026/",
      recommended: "D:/Finance/Invoices/2026/invoice_march_2026.docx",
      reason: "Document contains keywords 'invoice', 'payable', and date 'March 2026'. Preserves separator preference '_'.",
      riskGate: "low",
      status: "pending",
      domain: "Finance",
      extensions: ".docx"
    },
    {
      id: "pred_gemini_002",
      fileName: "Screenshot (142).png",
      originalPath: "C:/Users/David/Pictures/Screenshots/Screenshot (142).png",
      action: "rename",
      confidence: 0.88,
      userLikely: "Rename in place to include context.",
      recommended: "C:/Users/David/Pictures/Screenshots/screenshot_pof_hub_architecture.png",
      reason: "OCR detected 'Top of Mind API' and 'FastAPI Routing Schema' in image text. Suggesting 'clean_snake' schema format.",
      riskGate: "low",
      status: "pending",
      domain: "Development",
      extensions: ".png"
    },
    {
      id: "pred_gemini_003",
      fileName: "AcmeProposalDraft.docx",
      originalPath: "C:/Users/David/Documents/AcmeProposalDraft.docx",
      action: "move",
      confidence: 0.76,
      userLikely: "Move to D:/Projects/AcmeCo/Proposals/",
      recommended: "D:/Projects/AcmeCo/Proposals/project_proposal_acme_v2.docx",
      reason: "Matches title tokens with Acme client folder and resembles proposal draft template formatting.",
      riskGate: "low",
      status: "pending",
      domain: "Business",
      extensions: ".docx"
    },
    {
      id: "pred_gemini_004",
      fileName: "legal_lease_backup_final.pdf",
      originalPath: "C:/Users/David/Downloads/legal_lease_backup_final.pdf",
      action: "archive",
      confidence: 0.91,
      userLikely: "Archive to Z:/Legal/Contracts/Expired/",
      recommended: "Z:/Legal/Contracts/Expired/lease_agreement_expired_2024.pdf",
      reason: "Date analysis of content shows contract lease expired in August 2024. Placing behind sensitive domain safety review.",
      riskGate: "medium",
      status: "pending",
      domain: "Legal",
      extensions: ".pdf"
    },
    {
      id: "pred_gemini_005",
      fileName: "config_production_db.yaml",
      originalPath: "C:/Users/David/Downloads/config_production_db.yaml",
      action: "move",
      confidence: 0.98,
      userLikely: "Do not touch / ignore.",
      recommended: "d:/GitHub/tom_fis_api/config/config_production_db.yaml",
      reason: "Yaml configuration files belong in project config root. Cross-drive move risk triggered.",
      riskGate: "high",
      status: "pending",
      domain: "System",
      extensions: ".yaml"
    },
    {
      id: "pred_gemini_006",
      fileName: "MeetingNotes2026-07-03.md",
      originalPath: "C:/Users/David/Desktop/MeetingNotes2026-07-03.md",
      action: "move",
      confidence: 0.85,
      userLikely: "Move to O:/_Theophysics/Meetings/",
      recommended: "O:/_Theophysics/Meetings/meeting_notes_2026_07_03.md",
      reason: "Title contains 'MeetingNotes' and fits pattern of project documents. Subject includes 'Nexus Sync'.",
      riskGate: "low",
      status: "pending",
      domain: "Research",
      extensions: ".md"
    },
    {
      id: "pred_gemini_007",
      fileName: "vacation_IMG_3892.JPG",
      originalPath: "C:/Users/David/Downloads/vacation_IMG_3892.JPG",
      action: "move",
      confidence: 0.68,
      userLikely: "Move to C:/Users/David/Pictures/Vacation2025/",
      recommended: "C:/Users/David/Pictures/Vacation2025/vacation_beach_sunset.jpg",
      reason: "Image metadata indicates captured in Maui, Hawaii. Co-occurrence analysis group suggests placing near vacation album.",
      riskGate: "low",
      status: "pending",
      domain: "Personal",
      extensions: ".JPG"
    },
    {
      id: "pred_gemini_008",
      fileName: "duplicate_invoice_copy.pdf",
      originalPath: "C:/Users/David/Downloads/duplicate_invoice_copy.pdf",
      action: "delete",
      confidence: 0.99,
      userLikely: "Delete duplicate file.",
      recommended: "TRASH (Delete file duplicate)",
      reason: "Exact hash matching indicates this file is identical to D:/Finance/Invoices/2026/invoice_march_2026.pdf.",
      riskGate: "high",
      status: "pending",
      domain: "System",
      extensions: ".pdf"
    }
  ],

  // Mock list of files in cache for Rename Studio
  fileCache: [
    { id: 101, originalName: "invoice_march_temp.docx", extension: ".docx", domain: "Finance", type: "Invoice", sizeBytes: 24500, clean_snake: "invoice_march_2026.docx", clean_title: "Invoice March 2026.docx", date_project_slug: "2026-03-01_finance_invoice_march.docx", domain_date_type: "finance_2026-03-01_invoice_march.docx", spelling_flags: 0, collision_warning: "None" },
    { id: 102, originalName: "Screenshot (142).png", extension: ".png", domain: "Development", type: "Screenshot", sizeBytes: 312000, clean_snake: "screenshot_pof_hub_architecture.png", clean_title: "Screenshot Pof Hub Architecture.png", date_project_slug: "2026-07-03_dev_screenshot_pof_hub.png", domain_date_type: "dev_2026-07-03_screenshot_pof_hub.png", spelling_flags: 0, collision_warning: "None" },
    { id: 103, originalName: "AcmeProposalDraft.docx", extension: ".docx", domain: "Business", type: "Proposal", sizeBytes: 45000, clean_snake: "project_proposal_acme_v2.docx", clean_title: "Project Proposal Acme V2.docx", date_project_slug: "2026-07-01_acme_proposal_draft.docx", domain_date_type: "business_2026-07-01_proposal_acme.docx", spelling_flags: 0, collision_warning: "None" },
    { id: 104, originalName: "legal_lease_backup_final.pdf", extension: ".pdf", domain: "Legal", type: "Lease", sizeBytes: 1205000, clean_snake: "lease_agreement_expired_2024.pdf", clean_title: "Lease Agreement Expired 2024.pdf", date_project_slug: "2024-08-31_legal_lease_backup.pdf", domain_date_type: "legal_2024-08-31_lease_agreement.pdf", spelling_flags: 0, collision_warning: "None" },
    { id: 105, originalName: "inbox_mispelled_reciept.xlsx", extension: ".xlsx", domain: "Finance", type: "Receipt", sizeBytes: 15400, clean_snake: "inbox_misspelled_receipt.xlsx", clean_title: "Inbox Misspelled Receipt.xlsx", date_project_slug: "2026-07-03_finance_inbox_receipt.xlsx", domain_date_type: "finance_2026-07-03_receipt_inbox.xlsx", spelling_flags: 2, collision_warning: "None" },
    { id: 106, originalName: "meetingnotes_nexus_sync.md", extension: ".md", domain: "Research", type: "Notes", sizeBytes: 1200, clean_snake: "meeting_notes_nexus_sync.md", clean_title: "Meeting Notes Nexus Sync.md", date_project_slug: "2026-07-03_nexus_meeting_notes.md", domain_date_type: "research_2026-07-03_notes_nexus.md", spelling_flags: 0, collision_warning: "None" }
  ],

  // Mock folder statistics
  folderStats: {
    scannedPaths: "C:/Users/David/Downloads, C:/Users/David/Desktop",
    totalFiles: 248,
    fileTypeDistribution: [
      { ext: ".pdf", count: 86, size: "128.4 MB" },
      { ext: ".docx", count: 42, size: "14.2 MB" },
      { ext: ".png", count: 58, size: "48.1 MB" },
      { ext: ".md", count: 32, size: "0.8 MB" },
      { ext: ".xlsx", count: 20, size: "8.5 MB" },
      { ext: ".zip", count: 10, size: "235.0 MB" }
    ],
    predictedRoles: [
      { path: "C:/Users/David/Downloads", role: "inbox", confidence: 0.98, symptoms: "mixed extensions, stale downloads, temporal bursts" },
      { path: "d:/GitHub/tom_fis_api", role: "project", confidence: 0.95, symptoms: "git repository, code/config structures, high file frequency" },
      { path: "O:/_Theophysics", role: "research", confidence: 0.88, symptoms: "markdown logs, deep nested references, custom naming formats" },
      { path: "C:/Users/David/Pictures", role: "media_dump", confidence: 0.92, symptoms: "majority JPG/PNG files, lack of sub-directories" }
    ]
  },

  // Mock automation rules
  rules: [
    { id: "rule_01", type: "Extension", condition: "*.pdf", action: "Move to D:/Finance/Invoices/", creator: "User (Accepted Prediction)", status: "active" },
    { id: "rule_02", type: "Folder & Prefix", condition: "Downloads/screenshot_*", action: "Rename clean_snake + Move to C:/Pictures/Screenshots/", creator: "Gemini Auto-Synthesizer", status: "active" },
    { id: "rule_03", type: "Integrity Gate", condition: "D:/GitHub/tom_fis_api/.*", action: "Block auto-delete, force Review Gate Queue", creator: "Gemini Guardrails", status: "active" }
  ],

  // Mock items in the Review Queue
  reviews: [
    {
      id: "rev_001",
      jobId: "job_983",
      action: "delete",
      reason: "Triggered file delete action on exact duplicate invoice",
      sourcePath: "C:/Users/David/Downloads/duplicate_invoice_copy.pdf",
      targetPath: "Trash",
      riskGate: "High Risk (Delete Action)",
      details: "This will delete the duplicate copy of 'invoice_march_2026.pdf'. Original is safely located in D:/Finance/Invoices/2026/.",
      status: "waiting"
    },
    {
      id: "rev_002",
      jobId: "job_984",
      action: "move",
      reason: "Triggered cross-drive move (C:\\ to D:\\)",
      sourcePath: "C:/Users/David/Downloads/config_production_db.yaml",
      targetPath: "d:/GitHub/tom_fis_api/config/config_production_db.yaml",
      riskGate: "Medium Risk (Cross-Drive Move / Project Root)",
      details: "This moves a configuration yaml file from your Downloads folder directly into the repository configuration folder.",
      status: "waiting"
    }
  ]
};
