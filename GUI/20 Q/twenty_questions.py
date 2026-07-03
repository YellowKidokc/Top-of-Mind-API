"""
THE 20 QUESTIONS + STATISTICAL PROFILER + NAMING ENGINE
=========================================================
The intelligence core of the File Intelligence product.

This is one script that does three things:
  1. THE 20 QUESTIONS — diagnose any folder (what's in it, what's wrong)
  2. THE STATISTICAL PROFILER — derive the user's habits (how they name,
     where they move, when they organize)
  3. THE NAMING/MOVING VARIABLE ENGINE — compute proposed names and
     destinations for every file based on the profile

USAGE:
    # Full scan + profile + naming proposals
    python twenty_questions.py D:\\Downloads

    # Scan + profile, output JSON
    python twenty_questions.py D:\\Downloads --json --output scan.json

    # Scan multiple folders (builds a cross-folder profile)
    python twenty_questions.py D:\\Downloads D:\\Documents D:\\Desktop

    # Profile only (no proposals, just learn)
    python twenty_questions.py D:\\Downloads --profile-only

    # Connect to the hub API
    python twenty_questions.py D:\\Downloads --api http://localhost:10000

OUTPUT:
    For each folder:
      - 20 diagnostic answers (symptom detection)
      - Folder health grade (A-F)
      - Statistical profile of the user's habits
      - For every file: proposed standardized name + destination
      - Summary: what to do next, how many actions, estimated time

CONNECTS TO:
    tom_fis_api at localhost:10000 (optional)
    Writes to SQLite cache for instant repeat scans
    Pushes profile to /memory/items for cross-AI access

REQUIREMENTS:
    pip install chardet httpx  (both optional — degrades gracefully)
"""

import os
import sys
import re
import json
import math
import hashlib
import sqlite3
import datetime
import argparse
import uuid
from pathlib import Path
from collections import Counter, defaultdict
from dataclasses import dataclass, field, asdict
from typing import Optional


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


# ═══════════════════════════════════════════════════════════
# PART 0: CONFIGURATION
# ═══════════════════════════════════════════════════════════

KNOWN_EXTENSIONS = {
    ".md", ".txt", ".py", ".js", ".ts", ".html", ".htm", ".css", ".json",
    ".yml", ".yaml", ".toml", ".csv", ".xml", ".pdf", ".docx", ".doc",
    ".xlsx", ".xls", ".pptx", ".jpg", ".jpeg", ".png", ".gif", ".svg",
    ".mp3", ".mp4", ".wav", ".mov", ".avi", ".zip", ".tar", ".gz", ".7z",
    ".rar", ".exe", ".msi", ".bat", ".sh", ".ps1", ".lean", ".rs", ".go",
    ".c", ".cpp", ".h", ".java", ".rb", ".php", ".r", ".sql", ".db",
    ".sqlite", ".log", ".ini", ".cfg", ".env", ".gitignore", ".bak",
    ".webp", ".ico", ".ttf", ".woff", ".woff2", ".eot", ".otf",
}

AUTO_NAME_PATTERNS = re.compile(
    r'^(IMG_|DSC_|Screenshot[_ ]|VID_|MOV_|Photo_|WP_|DCIM|'
    r'Untitled|New Document|Document\s?\(|Copy of |Clipboard)',
    re.IGNORECASE
)

VERSION_PATTERNS = re.compile(
    r'[_\-\s](v\d+|final|copy|backup|old|draft|\(\d+\))',
    re.IGNORECASE
)

DATE_PATTERNS = [
    (re.compile(r'\d{4}-\d{2}-\d{2}'), "YYYY-MM-DD"),
    (re.compile(r'\d{4}_\d{2}_\d{2}'), "YYYY_MM_DD"),
    (re.compile(r'\d{8}'), "YYYYMMDD"),
    (re.compile(r'\d{2}-\d{2}-\d{4}'), "MM-DD-YYYY"),
]

PROGRAM_ROOT_MARKERS = {
    "package.json", "pyproject.toml", "setup.py", "cargo.toml",
    "go.mod", "requirements.txt", ".git", "makefile", "cmakelists.txt",
}

DANGEROUS_NAMES = {".env", ".env.local", ".env.production"}

KEY_PATTERNS = re.compile(
    r'(api[_-]?key|secret|token|password|credential)\s*[:=]',
    re.IGNORECASE
)

SIDECAR_EXTENSIONS = {".chi", ".fmeta", ".srt", ".meta.json", ".bak"}

# Abbreviation map for Smart Compact naming
ABBREVIATIONS = {
    "invoice": "inv", "screenshot": "ss", "meeting": "mtg",
    "project": "proj", "proposal": "prop", "document": "doc",
    "report": "rpt", "presentation": "pres", "download": "dl",
    "configuration": "cfg", "application": "app", "database": "db",
    "template": "tmpl", "analysis": "anl", "research": "rsch",
    "conversation": "conv", "transcript": "trns", "summary": "sum",
}

# Dictionary for spell check (top 200 common words in filenames)
SPELL_DICT = {
    "recieved": "received", "seperate": "separate", "occured": "occurred",
    "recieve": "receive", "calender": "calendar", "definately": "definitely",
    "occurence": "occurrence", "accomodate": "accommodate",
    "reciept": "receipt", "recomend": "recommend", "enviroment": "environment",
    "managment": "management", "developement": "development",
    "maintainence": "maintenance", "indepedent": "independent",
    "refrence": "reference", "preformance": "performance",
    "theophyscs": "theophysics", "convrsation": "conversation",
}


# ═══════════════════════════════════════════════════════════
# PART 1: DATA STRUCTURES
# ═══════════════════════════════════════════════════════════

@dataclass
class FileInfo:
    """Everything we know about one file."""
    path: str
    name: str
    stem: str
    ext: str
    size: int
    mtime: float
    atime: float
    dir: str
    depth: int
    # Computed
    is_auto_named: bool = False
    is_versioned: bool = False
    has_date: bool = False
    date_format: str = ""
    separator: str = ""
    quick_hash: str = ""
    # Proposals
    proposed_name: str = ""
    proposed_destination: str = ""
    naming_schema: str = ""
    confidence: float = 0.0


@dataclass
class QuestionResult:
    """Answer to one of the 20 questions."""
    question_id: str
    question: str
    answer: str
    value: any = None
    severity: str = "info"  # info, low, medium, high, critical
    affected_count: int = 0
    affected_paths: list = field(default_factory=list)
    action_needed: bool = False


@dataclass
class UserProfile:
    """Statistical fingerprint of how this user organizes files."""
    # Derived preferences
    separator: str = "_"
    separator_confidence: float = 0.0
    case_style: str = "lowercase"
    case_confidence: float = 0.0
    uses_dates: bool = False
    date_position: str = "none"  # prefix, suffix, none
    date_format: str = "YYYY_MM_DD"
    date_confidence: float = 0.0
    avg_name_length: float = 0.0
    name_length_range: tuple = (0, 0)
    # Destination habits
    destination_map: dict = field(default_factory=dict)
    # Temporal
    active_hours: list = field(default_factory=list)
    # Vocabulary
    common_prefixes: list = field(default_factory=list)
    common_suffixes: list = field(default_factory=list)
    domain_words: list = field(default_factory=list)
    # Counts
    total_files_observed: int = 0
    total_renames_observed: int = 0
    profile_version: int = 1


@dataclass
class FolderProfile:
    """Complete profile of a scanned folder."""
    path: str
    scanned_at: str
    total_files: int = 0
    total_dirs: int = 0
    total_size_bytes: int = 0
    grade: str = "?"
    score: float = 0.0
    questions: list = field(default_factory=list)
    user_profile: UserProfile = field(default_factory=UserProfile)
    file_proposals: list = field(default_factory=list)
    extensions_breakdown: dict = field(default_factory=dict)
    dominant_type: str = ""


# ═══════════════════════════════════════════════════════════
# PART 2: FILE WALKER
# ═══════════════════════════════════════════════════════════

def walk_folder(root: str) -> tuple[list[FileInfo], list[str]]:
    """Walk a directory, return file info list and dir list."""
    files = []
    dirs = []
    root = os.path.abspath(root)

    for dirpath, dirnames, filenames in os.walk(root):
        dirs.append(dirpath)
        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            try:
                stat = os.stat(fpath)
                p = Path(fname)
                stem = p.stem
                ext = p.suffix.lower()

                fi = FileInfo(
                    path=fpath,
                    name=fname,
                    stem=stem,
                    ext=ext,
                    size=stat.st_size,
                    mtime=stat.st_mtime,
                    atime=stat.st_atime,
                    dir=dirpath,
                    depth=dirpath.replace(root, "").count(os.sep),
                )

                # Quick classifications
                fi.is_auto_named = bool(AUTO_NAME_PATTERNS.match(stem))
                fi.is_versioned = bool(VERSION_PATTERNS.search(stem))

                # Date detection
                for pat, fmt in DATE_PATTERNS:
                    if pat.search(stem):
                        fi.has_date = True
                        fi.date_format = fmt
                        break

                # Separator detection
                if "_" in stem:
                    fi.separator = "_"
                elif "-" in stem:
                    fi.separator = "-"
                elif "." in stem and ext:
                    fi.separator = "."
                elif " " in stem:
                    fi.separator = " "

                files.append(fi)
            except (OSError, PermissionError):
                pass

    return files, dirs


def quick_hash(path: str) -> str:
    """MD5 of first 8KB."""
    h = hashlib.md5()
    try:
        with open(path, "rb") as f:
            h.update(f.read(8192))
    except (OSError, PermissionError):
        return ""
    return h.hexdigest()


# ═══════════════════════════════════════════════════════════
# PART 3: THE 20 QUESTIONS
# ═══════════════════════════════════════════════════════════

def ask_20_questions(files: list[FileInfo], dirs: list[str], root: str) -> list[QuestionResult]:
    """Ask 20 diagnostic questions about a folder. Each returns a structured answer."""
    results = []
    now = datetime.datetime.now().timestamp()

    # ── Q1: What file types are here? ──
    ext_counts = Counter(f.ext for f in files if f.ext)
    unique_exts = len(ext_counts)
    top_exts = ext_counts.most_common(5)
    q1 = QuestionResult("Q01", "What file types are here?",
        f"{unique_exts} unique extensions. Top: {', '.join(f'{e}({c})' for e, c in top_exts)}",
        value=dict(ext_counts))
    if unique_exts > 8:
        by_dir = defaultdict(set)
        for f in files:
            by_dir[f.dir].add(f.ext)
        swamped = [d for d, exts in by_dir.items() if len(exts) > 8]
        if swamped:
            q1.severity = "medium"
            q1.action_needed = True
            q1.affected_count = len(swamped)
            q1.affected_paths = swamped[:5]
            q1.answer += f" — {len(swamped)} dirs are extension swamps"
    results.append(q1)

    # ── Q2: Are there duplicate versions? ──
    versioned = [f for f in files if f.is_versioned]
    q2 = QuestionResult("Q02", "Are there duplicate versions?",
        f"{len(versioned)} files with version/copy suffixes",
        value=len(versioned), affected_count=len(versioned),
        affected_paths=[f.path for f in versioned[:5]])
    if len(versioned) > 5:
        q2.severity = "medium"
        q2.action_needed = True
    results.append(q2)

    # ── Q3: How deep is the tree? ──
    max_depth = max((f.depth for f in files), default=0)
    deep_files = [f for f in files if f.depth > 5]
    q3 = QuestionResult("Q03", "How deep is the tree?",
        f"Max depth: {max_depth}. {len(deep_files)} files deeper than 5 levels",
        value=max_depth, affected_count=len(deep_files))
    if deep_files:
        q3.severity = "low"
        q3.action_needed = True
        q3.affected_paths = [f.path for f in deep_files[:5]]
    results.append(q3)

    # ── Q4: How wide is each directory? ──
    by_dir = Counter(f.dir for f in files)
    overloaded = [(d, c) for d, c in by_dir.items() if c > 200]
    q4 = QuestionResult("Q04", "How wide is each directory?",
        f"{len(overloaded)} dirs with 200+ files" if overloaded else "No overloaded directories",
        value=dict(overloaded) if overloaded else {},
        severity="medium" if overloaded else "info",
        action_needed=bool(overloaded),
        affected_count=len(overloaded),
        affected_paths=[d for d, _ in overloaded[:5]])
    results.append(q4)

    # ── Q5: Are there orphan sidecars? ──
    all_stems = {(f.dir, f.stem) for f in files}
    orphans = [f for f in files if f.ext in SIDECAR_EXTENSIONS
               and (f.dir, f.stem.replace(".meta", "")) not in all_stems]
    q5 = QuestionResult("Q05", "Are there orphan sidecars?",
        f"{len(orphans)} orphan sidecar files",
        value=len(orphans), affected_count=len(orphans),
        affected_paths=[f.path for f in orphans[:5]],
        severity="low" if orphans else "info",
        action_needed=bool(orphans))
    results.append(q5)

    # ── Q6: Are names colliding? ──
    collisions = 0
    collision_paths = []
    for d, flist in defaultdict(list, {}).items() or []:
        pass
    by_dir_names = defaultdict(list)
    for f in files:
        by_dir_names[(f.dir, f.name.lower())].append(f.path)
    collision_groups = {k: v for k, v in by_dir_names.items() if len(v) > 1}
    collisions = len(collision_groups)
    for paths in list(collision_groups.values())[:3]:
        collision_paths.extend(paths)
    q6 = QuestionResult("Q06", "Are names colliding?",
        f"{collisions} name collision groups" if collisions else "No collisions",
        value=collisions, affected_count=collisions,
        affected_paths=collision_paths[:5],
        severity="high" if collisions else "info",
        action_needed=bool(collisions))
    results.append(q6)

    # ── Q7: Is one project scattered? ──
    project_markers = defaultdict(list)
    for f in files:
        if f.stem.lower() in PROGRAM_ROOT_MARKERS:
            project_name = os.path.basename(f.dir)
            project_markers[project_name].append(f.dir)
    scattered = {p: list(set(locs)) for p, locs in project_markers.items() if len(set(locs)) > 2}
    q7 = QuestionResult("Q07", "Is one project scattered?",
        f"{len(scattered)} projects scattered across folders" if scattered else "No scatter detected",
        value=scattered, affected_count=len(scattered),
        severity="high" if scattered else "info",
        action_needed=bool(scattered))
    results.append(q7)

    # ── Q8: Are there broken links? ──
    link_pat = re.compile(r'\[\[([^\]]+)\]\]|\[.*?\]\(([^)]+)\)')
    md_files = [f for f in files if f.ext in {".md", ".html", ".htm"}]
    broken_count = 0
    broken_paths = []
    all_file_stems = {f.stem.lower() for f in files}
    for f in md_files[:200]:
        try:
            content = open(f.path, "r", encoding="utf-8", errors="ignore").read(50000)
            for m in link_pat.finditer(content):
                target = (m.group(1) or m.group(2) or "").strip()
                if target.startswith("http") or target.startswith("#"):
                    continue
                target_stem = Path(target).stem.lower()
                if target_stem and target_stem not in all_file_stems:
                    broken_count += 1
                    broken_paths.append(f.path)
                    break
        except (OSError, PermissionError):
            pass
    q8 = QuestionResult("Q08", "Are there broken links?",
        f"{broken_count} files with broken internal links" if broken_count else "No broken links",
        value=broken_count, affected_count=broken_count,
        affected_paths=broken_paths[:5],
        severity="medium" if broken_count else "info",
        action_needed=bool(broken_count))
    results.append(q8)

    # ── Q9: Are files duplicated? ──
    size_groups = defaultdict(list)
    for f in files:
        if f.size > 100:
            size_groups[f.size].append(f)
    dup_clusters = 0
    dup_paths = []
    for size, group in size_groups.items():
        if len(group) < 2:
            continue
        hashes = defaultdict(list)
        for f in group[:20]:
            h = quick_hash(f.path)
            if h:
                hashes[h].append(f.path)
        for h, paths in hashes.items():
            if len(paths) > 1:
                dup_clusters += 1
                dup_paths.extend(paths[:2])
    q9 = QuestionResult("Q09", "Are files duplicated?",
        f"{dup_clusters} duplicate clusters found" if dup_clusters else "No duplicates",
        value=dup_clusters, affected_count=dup_clusters,
        affected_paths=dup_paths[:10],
        severity="medium" if dup_clusters else "info",
        action_needed=bool(dup_clusters))
    results.append(q9)

    # ── Q10: Same content, different formats? ──
    format_redundancy = 0
    by_stem_dir = defaultdict(list)
    for f in files:
        by_stem_dir[(f.dir, f.stem)].append(f.ext)
    doc_exts = {".md", ".html", ".htm", ".pdf", ".docx", ".doc", ".txt", ".rtf"}
    for (d, stem), exts in by_stem_dir.items():
        doc_matches = {e for e in exts if e in doc_exts}
        if len(doc_matches) > 1:
            format_redundancy += 1
    q10 = QuestionResult("Q10", "Same content, different formats?",
        f"{format_redundancy} files exist in multiple formats" if format_redundancy else "No format redundancy",
        value=format_redundancy, affected_count=format_redundancy,
        severity="low" if format_redundancy else "info",
        action_needed=bool(format_redundancy))
    results.append(q10)

    # ── Q11: Are there abandoned drafts? ──
    draft_pat = re.compile(r'(draft|wip|old|temp|scratch|notes|brainstorm|rough)', re.IGNORECASE)
    old_drafts = [f for f in files if draft_pat.search(f.stem)
                  and (now - f.mtime) > 30 * 86400]
    q11 = QuestionResult("Q11", "Are there abandoned drafts?",
        f"{len(old_drafts)} drafts older than 30 days" if old_drafts else "No abandoned drafts",
        value=len(old_drafts), affected_count=len(old_drafts),
        affected_paths=[f.path for f in old_drafts[:5]],
        severity="low" if old_drafts else "info",
        action_needed=bool(old_drafts))
    results.append(q11)

    # ── Q12: Are doc types mixed randomly? ──
    mixed_dirs = 0
    doc_type_exts = {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx"}
    dir_doc_types = defaultdict(set)
    for f in files:
        if f.ext in doc_type_exts:
            dir_doc_types[f.dir].add(f.ext)
    mixed_dirs = sum(1 for exts in dir_doc_types.values() if len(exts) >= 3)
    q12 = QuestionResult("Q12", "Are doc types mixed randomly?",
        f"{mixed_dirs} dirs with 3+ doc types mixed" if mixed_dirs else "No document chaos",
        value=mixed_dirs, affected_count=mixed_dirs,
        severity="medium" if mixed_dirs else "info",
        action_needed=bool(mixed_dirs))
    results.append(q12)

    # ── Q13: Are media files auto-named? ──
    auto_media = [f for f in files if f.is_auto_named
                  and f.ext in {".jpg", ".jpeg", ".png", ".gif", ".mp4", ".mov", ".webp"}]
    q13 = QuestionResult("Q13", "Are media files auto-named?",
        f"{len(auto_media)} media files with auto-generated names" if auto_media else "No auto-named media",
        value=len(auto_media), affected_count=len(auto_media),
        affected_paths=[f.path for f in auto_media[:5]],
        severity="low" if auto_media else "info",
        action_needed=bool(auto_media))
    results.append(q13)

    # ── Q14: Are there unknown file types? ──
    unknown = [f for f in files if f.ext and f.ext not in KNOWN_EXTENSIONS]
    no_ext = [f for f in files if not f.ext]
    unknown_total = len(unknown) + len(no_ext)
    q14 = QuestionResult("Q14", "Are there unknown file types?",
        f"{unknown_total} files with unknown or missing extensions",
        value=unknown_total, affected_count=unknown_total,
        affected_paths=[f.path for f in (unknown + no_ext)[:5]],
        severity="medium" if unknown_total > 10 else "info",
        action_needed=unknown_total > 10)
    results.append(q14)

    # ── Q15: How old are the files? ──
    six_months = 180 * 86400
    stale_in_active = 0
    dir_activity = defaultdict(list)
    for f in files:
        dir_activity[f.dir].append(f.mtime)
    for d, mtimes in dir_activity.items():
        newest = max(mtimes)
        if now - newest < 30 * 86400:  # active dir
            stale = sum(1 for m in mtimes if now - m > six_months)
            if stale > 0 and stale < len(mtimes):
                stale_in_active += stale
    q15 = QuestionResult("Q15", "How old are the files?",
        f"{stale_in_active} stale files in active directories" if stale_in_active else "No stale files in active dirs",
        value=stale_in_active, affected_count=stale_in_active,
        severity="low" if stale_in_active else "info",
        action_needed=bool(stale_in_active))
    results.append(q15)

    # ── Q16: Is this a program root? ──
    program_roots = []
    for d in dirs:
        contents = {f.name.lower() for f in files if f.dir == d}
        subdirs = {os.path.basename(sd).lower() for sd in dirs if os.path.dirname(sd) == d}
        if (contents | subdirs) & PROGRAM_ROOT_MARKERS:
            program_roots.append(d)
    q16 = QuestionResult("Q16", "Is this a program root?",
        f"{len(program_roots)} program/project roots detected — PROTECT" if program_roots else "No program roots",
        value=len(program_roots), affected_count=len(program_roots),
        affected_paths=program_roots[:5],
        severity="critical" if program_roots else "info",
        action_needed=bool(program_roots))
    results.append(q16)

    # ── Q17: Are credentials exposed? ──
    cred_files = []
    for f in files:
        if f.name.lower() in DANGEROUS_NAMES:
            cred_files.append(f.path)
        elif f.ext in {".txt", ".md", ".json", ".yml", ".yaml", ".cfg", ".ini", ".toml"}:
            if f.size < 50000:
                try:
                    content = open(f.path, "r", encoding="utf-8", errors="ignore").read(10000)
                    if KEY_PATTERNS.search(content):
                        if any(marker in content for marker in ["sk-", "ghp_", "AKIA"]):
                            cred_files.append(f.path)
                except (OSError, PermissionError):
                    pass
    q17 = QuestionResult("Q17", "Are credentials exposed?",
        f"⚠ {len(cred_files)} files with potential credentials — SECURE NOW" if cred_files
        else "No exposed credentials detected",
        value=len(cred_files), affected_count=len(cred_files),
        affected_paths=cred_files[:5],
        severity="critical" if cred_files else "info",
        action_needed=bool(cred_files))
    results.append(q17)

    # ── Q18: Are sync conflicts present? ──
    conflict_pat = re.compile(r'(sync-conflict|conflicted copy|\(conflict\))', re.IGNORECASE)
    conflicts = [f for f in files if conflict_pat.search(f.name)]
    q18 = QuestionResult("Q18", "Are sync conflicts present?",
        f"{len(conflicts)} sync conflict files" if conflicts else "No sync conflicts",
        value=len(conflicts), affected_count=len(conflicts),
        affected_paths=[f.path for f in conflicts[:5]],
        severity="high" if conflicts else "info",
        action_needed=bool(conflicts))
    results.append(q18)

    # ── Q19: Are research files tagged? ──
    chi_stems = {f.stem.replace(".chi", "") for f in files if f.ext == ".chi"}
    canonical_untagged = [f for f in files
                         if f.ext in {".md", ".lean", ".pdf", ".html"}
                         and f.size > 1000
                         and f.stem not in chi_stems]
    q19 = QuestionResult("Q19", "Are research files tagged?",
        f"{len(canonical_untagged)} canonical files missing chi classification"
        if canonical_untagged else "All canonical files are tagged",
        value=len(canonical_untagged), affected_count=len(canonical_untagged),
        affected_paths=[f.path for f in canonical_untagged[:5]],
        severity="high" if len(canonical_untagged) > 20 else "info",
        action_needed=len(canonical_untagged) > 20)
    results.append(q19)

    # ── Q20: What are the naming habits? ──
    # This is the statistical profile question — answered in Part 4
    sep_counts = Counter(f.separator for f in files if f.separator)
    case_counts = {"lower": 0, "upper": 0, "mixed": 0, "title": 0}
    for f in files:
        s = f.stem
        if s == s.lower():
            case_counts["lower"] += 1
        elif s == s.upper():
            case_counts["upper"] += 1
        elif s == s.title() or s[0].isupper():
            case_counts["title"] += 1
        else:
            case_counts["mixed"] += 1

    date_count = sum(1 for f in files if f.has_date)
    dominant_sep = sep_counts.most_common(1)[0] if sep_counts else ("_", 0)
    dominant_case = max(case_counts, key=case_counts.get)

    q20 = QuestionResult("Q20", "What are the naming habits?",
        f"Separator: '{dominant_sep[0]}' ({dominant_sep[1]} files). "
        f"Case: {dominant_case} ({case_counts[dominant_case]} files). "
        f"Dates in names: {date_count} files. "
        f"Auto-named: {sum(1 for f in files if f.is_auto_named)}",
        value={
            "separator": dict(sep_counts),
            "case": case_counts,
            "dates_in_names": date_count,
            "auto_named": sum(1 for f in files if f.is_auto_named),
        })
    results.append(q20)

    return results


# ═══════════════════════════════════════════════════════════
# PART 4: STATISTICAL PROFILER
# ═══════════════════════════════════════════════════════════

def derive_profile(files: list[FileInfo], questions: list[QuestionResult]) -> UserProfile:
    """Derive the user's statistical profile from file system evidence."""
    profile = UserProfile()
    profile.total_files_observed = len(files)

    # Separator
    sep_counts = Counter(f.separator for f in files if f.separator)
    total_sep = sum(sep_counts.values())
    if total_sep > 0:
        top_sep, top_count = sep_counts.most_common(1)[0]
        profile.separator = top_sep
        profile.separator_confidence = top_count / total_sep

    # Case
    case_lower = sum(1 for f in files if f.stem == f.stem.lower())
    case_total = len([f for f in files if f.stem])
    if case_total > 0:
        lower_ratio = case_lower / case_total
        if lower_ratio > 0.7:
            profile.case_style = "lowercase"
            profile.case_confidence = lower_ratio
        elif lower_ratio < 0.3:
            profile.case_style = "Title_Case"
            profile.case_confidence = 1 - lower_ratio
        else:
            profile.case_style = "mixed"
            profile.case_confidence = 0.5

    # Dates
    date_files = [f for f in files if f.has_date]
    if len(date_files) > 3:
        profile.uses_dates = True
        date_fmts = Counter(f.date_format for f in date_files)
        profile.date_format = date_fmts.most_common(1)[0][0]
        profile.date_confidence = len(date_files) / max(len(files), 1)

        # Position: prefix or suffix
        prefix_count = 0
        for f in date_files:
            for pat, _ in DATE_PATTERNS:
                m = pat.search(f.stem)
                if m and m.start() < 4:
                    prefix_count += 1
                    break
        profile.date_position = "prefix" if prefix_count > len(date_files) * 0.6 else "suffix"

    # Name length
    lengths = [len(f.stem) for f in files if f.stem]
    if lengths:
        profile.avg_name_length = sum(lengths) / len(lengths)
        profile.name_length_range = (min(lengths), max(lengths))

    # Destination map (by extension, which dirs do files of this type live in?)
    ext_dirs = defaultdict(lambda: Counter())
    for f in files:
        if f.ext:
            ext_dirs[f.ext][f.dir] += 1
    for ext, dir_counts in ext_dirs.items():
        top_dir, top_count = dir_counts.most_common(1)[0]
        total = sum(dir_counts.values())
        profile.destination_map[ext] = {
            "primary": top_dir,
            "confidence": top_count / total,
            "count": total,
        }
        if len(dir_counts) > 1:
            second_dir, second_count = dir_counts.most_common(2)[1]
            profile.destination_map[ext]["secondary"] = second_dir

    # Active hours
    hour_counts = Counter()
    for f in files:
        hour = datetime.datetime.fromtimestamp(f.mtime).hour
        hour_counts[hour] += 1
    profile.active_hours = [h for h, _ in hour_counts.most_common(6)]

    # Vocabulary — common words in filenames
    word_counts = Counter()
    for f in files:
        words = re.split(r'[_\-\.\s]+', f.stem.lower())
        for w in words:
            if len(w) > 2 and not w.isdigit():
                word_counts[w] += 1
    profile.common_prefixes = [w for w, c in word_counts.most_common(10) if c > 3]
    profile.domain_words = [w for w, c in word_counts.most_common(20)
                            if c > 2 and w not in {"the", "and", "for", "new", "old", "copy", "final"}]

    return profile


# ═══════════════════════════════════════════════════════════
# PART 5: NAMING / MOVING VARIABLE ENGINE
# ═══════════════════════════════════════════════════════════

def compute_naming_variables(f: FileInfo, profile: UserProfile, schema: str = "clean_professional") -> dict:
    """
    Compute all naming and moving variables for a single file.
    Returns a dict with every variable needed to rename, move, or classify.
    """
    now = datetime.datetime.now()
    file_date = datetime.datetime.fromtimestamp(f.mtime)

    # ── Raw variables ──
    raw_stem = f.stem
    raw_ext = f.ext
    raw_dir = f.dir
    raw_name = f.name

    # ── Strip junk ──
    cleaned = AUTO_NAME_PATTERNS.sub("", raw_stem)
    cleaned = VERSION_PATTERNS.sub("", cleaned)
    cleaned = cleaned.strip("_- .")
    if not cleaned:
        cleaned = raw_stem

    # ── Spell correct ──
    words = re.split(r'[_\-\.\s]+', cleaned)
    corrected_words = []
    for w in words:
        lower_w = w.lower()
        if lower_w in SPELL_DICT:
            corrected_words.append(SPELL_DICT[lower_w])
        else:
            corrected_words.append(w)

    # ── Apply schema ──
    sep = profile.separator or "_"
    if schema == "clean_professional":
        sep = "_"
        final_words = [w.lower() for w in corrected_words if w]
        final_stem = sep.join(final_words)
        # Add date suffix if user uses dates
        if profile.uses_dates:
            date_str = file_date.strftime("%Y" + sep + "%m" + sep + "%d")
            if date_str not in final_stem:
                final_stem = final_stem + sep + date_str
        max_len = 60

    elif schema == "date_first":
        sep = "-"
        final_words = [w.lower() for w in corrected_words if w]
        date_str = file_date.strftime("%Y-%m-%d")
        final_stem = date_str + "_" + sep.join(final_words)
        max_len = 60

    elif schema == "smart_compact":
        sep = "."
        final_words = []
        for w in corrected_words:
            lower_w = w.lower()
            final_words.append(ABBREVIATIONS.get(lower_w, lower_w))
        final_stem = sep.join(final_words)
        date_str = file_date.strftime("%m%d")
        final_stem = final_stem + sep + date_str
        max_len = 35

    else:
        final_words = [w.lower() for w in corrected_words if w]
        final_stem = sep.join(final_words)
        max_len = 60

    # ── Length cap ──
    if len(final_stem) > max_len:
        parts = final_stem.split(sep)
        if len(parts) > 3:
            final_stem = sep.join(parts[:2]) + sep + parts[-1]
        else:
            final_stem = final_stem[:max_len]

    # ── Collision suffix (placeholder) ──
    proposed_name = final_stem + raw_ext

    # ── Destination prediction ──
    dest_info = profile.destination_map.get(raw_ext, {})
    proposed_dest = dest_info.get("primary", raw_dir)
    dest_confidence = dest_info.get("confidence", 0.0)

    return {
        # Input variables
        "original_path": f.path,
        "original_name": f.name,
        "original_stem": f.stem,
        "original_ext": f.ext,
        "original_dir": f.dir,
        "file_size": f.size,
        "file_mtime": file_date.isoformat(),
        "file_depth": f.depth,
        # Classification variables
        "is_auto_named": f.is_auto_named,
        "is_versioned": f.is_versioned,
        "has_date_in_name": f.has_date,
        "detected_separator": f.separator,
        "detected_date_format": f.date_format,
        # Profile variables
        "profile_separator": profile.separator,
        "profile_case": profile.case_style,
        "profile_uses_dates": profile.uses_dates,
        "profile_date_format": profile.date_format,
        "profile_date_position": profile.date_position,
        # Naming output
        "schema_used": schema,
        "cleaned_stem": sep.join(corrected_words),
        "proposed_name": proposed_name,
        "proposed_stem": final_stem,
        "name_changed": proposed_name != f.name,
        # Moving output
        "proposed_destination": proposed_dest,
        "destination_confidence": dest_confidence,
        "destination_changed": proposed_dest != f.dir,
        "destination_secondary": dest_info.get("secondary"),
        # Action flags
        "needs_rename": proposed_name != f.name,
        "needs_move": proposed_dest != f.dir and dest_confidence > 0.5,
        "needs_dedup": False,  # set by dedup pass
        "is_protected": False,  # set by Q16 results
        "action_confidence": min(
            profile.separator_confidence,
            profile.case_confidence,
            dest_confidence if dest_confidence > 0 else 0.5,
        ),
    }


# ═══════════════════════════════════════════════════════════
# PART 6: GRADING + REPORT
# ═══════════════════════════════════════════════════════════

def compute_grade(questions: list[QuestionResult]) -> tuple[str, float]:
    """Compute A-F grade from question results."""
    severity_weights = {"info": 0, "low": 1, "medium": 3, "high": 8, "critical": 20}
    penalty = 0
    for q in questions:
        if q.action_needed:
            w = severity_weights.get(q.severity, 0)
            penalty += min(w * max(q.affected_count, 1), w * 10)

    score = max(0, 100 - penalty)
    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"

    return grade, score


def print_report(folder_profile: FolderProfile):
    """Print a human-readable report."""
    fp = folder_profile

    print(f"\n{'='*70}")
    print(f"  FOLDER INTELLIGENCE REPORT")
    print(f"  Target:  {fp.path}")
    print(f"  Scanned: {fp.scanned_at}")
    print(f"  Files:   {fp.total_files:,}  |  Dirs: {fp.total_dirs}  |  Size: {fp.total_size_bytes / 1024 / 1024:.1f} MB")
    print(f"  Grade:   {fp.grade}  ({fp.score:.0f}/100)")
    print(f"{'='*70}")

    # 20 Questions
    print(f"\n  {'─'*50}")
    print(f"  THE 20 QUESTIONS")
    print(f"  {'─'*50}")
    for q in fp.questions:
        severity = q["severity"] if isinstance(q, dict) else q.severity
        question_id = q["question_id"] if isinstance(q, dict) else q.question_id
        answer = q["answer"] if isinstance(q, dict) else q.answer
        action_needed = q["action_needed"] if isinstance(q, dict) else q.action_needed
        icon = {"info": "·", "low": "·", "medium": "▪", "high": "▲", "critical": "⚠"}[severity]
        marker = " ← ACTION" if action_needed else ""
        print(f"  {icon} {question_id}: {answer}{marker}")

    # Profile
    p = fp.user_profile
    print(f"\n  {'─'*50}")
    print(f"  USER PROFILE (derived from {p.total_files_observed} files)")
    print(f"  {'─'*50}")
    print(f"  Separator:    '{p.separator}' (confidence: {p.separator_confidence:.0%})")
    print(f"  Case:         {p.case_style} (confidence: {p.case_confidence:.0%})")
    print(f"  Uses dates:   {'Yes' if p.uses_dates else 'No'} — {p.date_position} — {p.date_format}")
    print(f"  Avg name len: {p.avg_name_length:.0f} chars")
    print(f"  Active hours: {p.active_hours[:5]}")
    print(f"  Domain words: {', '.join(p.domain_words[:8])}")

    # Extension breakdown
    print(f"\n  {'─'*50}")
    print(f"  EXTENSION BREAKDOWN")
    print(f"  {'─'*50}")
    for ext, count in sorted(fp.extensions_breakdown.items(), key=lambda x: -x[1])[:10]:
        dest = p.destination_map.get(ext, {})
        dest_str = f" → {Path(dest.get('primary', '')).name}/ ({dest.get('confidence', 0):.0%})" if dest.get('primary') else ""
        print(f"  {ext:8s} {count:6d} files{dest_str}")

    # Proposals summary
    if fp.file_proposals:
        rename_count = sum(1 for p in fp.file_proposals if p.get("needs_rename"))
        move_count = sum(1 for p in fp.file_proposals if p.get("needs_move"))
        print(f"\n  {'─'*50}")
        print(f"  PROPOSALS ({len(fp.file_proposals)} files analyzed)")
        print(f"  {'─'*50}")
        print(f"  Need rename:  {rename_count}")
        print(f"  Need move:    {move_count}")
        print(f"  No change:    {len(fp.file_proposals) - rename_count - move_count}")

        # Show 5 example renames
        renames = [p for p in fp.file_proposals if p.get("needs_rename")][:5]
        if renames:
            print(f"\n  Example renames:")
            for r in renames:
                print(f"    {r['original_name']}")
                print(f"    → {r['proposed_name']}")
                print()


# ═══════════════════════════════════════════════════════════
# PART 7: MAIN PIPELINE
# ═══════════════════════════════════════════════════════════

def scan_folder(root: str, schema: str = "clean_professional",
                max_proposals: int = 500, profile_only: bool = False) -> FolderProfile:
    """
    Full pipeline: walk → 20 questions → profile → naming proposals → grade.
    """
    root = os.path.abspath(root)
    print(f"\n  Scanning: {root}")

    # Walk
    files, dirs = walk_folder(root)
    print(f"  Found {len(files):,} files in {len(dirs)} directories")

    # 20 Questions
    print(f"  Asking 20 questions...")
    questions = ask_20_questions(files, dirs, root)
    action_count = sum(1 for q in questions if q.action_needed)
    print(f"  {action_count} questions need action")

    # Profile
    print(f"  Deriving user profile...")
    profile = derive_profile(files, questions)

    # Grade
    grade, score = compute_grade(questions)
    print(f"  Grade: {grade} ({score:.0f}/100)")

    # Extensions breakdown
    ext_counts = Counter(f.ext for f in files if f.ext)

    # Proposals
    proposals = []
    if not profile_only:
        print(f"  Computing naming proposals (max {max_proposals})...")
        # Mark protected files
        protected_dirs = set()
        for q in questions:
            if q.question_id == "Q16" and q.affected_paths:
                protected_dirs.update(q.affected_paths)

        sample = files[:max_proposals]
        for f in sample:
            variables = compute_naming_variables(f, profile, schema)
            # Mark protected
            if any(f.dir.startswith(pd) for pd in protected_dirs):
                variables["is_protected"] = True
                variables["needs_rename"] = False
                variables["needs_move"] = False
            proposals.append(variables)

        rename_count = sum(1 for p in proposals if p["needs_rename"])
        move_count = sum(1 for p in proposals if p["needs_move"])
        print(f"  Proposals: {rename_count} renames, {move_count} moves, "
              f"{len(proposals) - rename_count - move_count} no change")

    # Build result
    folder_profile = FolderProfile(
        path=root,
        scanned_at=datetime.datetime.now().isoformat(),
        total_files=len(files),
        total_dirs=len(dirs),
        total_size_bytes=sum(f.size for f in files),
        grade=grade,
        score=score,
        questions=[asdict(q) for q in questions],
        user_profile=profile,
        file_proposals=proposals,
        extensions_breakdown=dict(ext_counts),
        dominant_type=ext_counts.most_common(1)[0][0] if ext_counts else "",
    )

    return folder_profile


# ═══════════════════════════════════════════════════════════
# PART 8: CLI
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="20 Questions + Statistical Profiler + Naming Engine",
        epilog="The intelligence core of the File Intelligence product."
    )
    parser.add_argument("targets", nargs="+", help="Folders to scan")
    parser.add_argument("--schema", choices=["clean_professional", "date_first", "smart_compact"],
                        default="clean_professional", help="Naming schema")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--output", "-o", help="Save JSON to file")
    parser.add_argument("--profile-only", action="store_true", help="Skip proposals, just profile")
    parser.add_argument("--max-proposals", type=int, default=500, help="Max files to generate proposals for")
    parser.add_argument("--api", help="Hub API URL (e.g. http://localhost:10000)")
    args = parser.parse_args()

    all_results = []

    for target in args.targets:
        if not os.path.isdir(target):
            print(f"  ✗ Not a directory: {target}")
            continue

        result = scan_folder(target, schema=args.schema,
                             max_proposals=args.max_proposals,
                             profile_only=args.profile_only)

        if args.json:
            # Serialize
            data = {
                "path": result.path,
                "scanned_at": result.scanned_at,
                "total_files": result.total_files,
                "total_dirs": result.total_dirs,
                "total_size_bytes": result.total_size_bytes,
                "grade": result.grade,
                "score": result.score,
                "questions": result.questions,
                "user_profile": asdict(result.user_profile),
                "file_proposals": result.file_proposals,
                "extensions_breakdown": result.extensions_breakdown,
                "dominant_type": result.dominant_type,
            }
            if args.output:
                with open(args.output, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, default=str)
                print(f"  → Saved to {args.output}")
            else:
                print(json.dumps(data, indent=2, default=str))
            all_results.append(data)
        else:
            print_report(result)

        # Push to API
        if args.api:
            try:
                import httpx
                # Push profile to memory
                httpx.post(f"{args.api}/memory/items", json={
                    "title": f"Folder profile: {Path(target).name}",
                    "body": json.dumps({
                        "grade": result.grade,
                        "score": result.score,
                        "total_files": result.total_files,
                        "separator": result.user_profile.separator,
                        "case": result.user_profile.case_style,
                        "uses_dates": result.user_profile.uses_dates,
                        "dominant_type": result.dominant_type,
                    }, default=str),
                    "source": "twenty-questions",
                    "folder": "Scans",
                    "tags_json": json.dumps(["scan", "profile", Path(target).name]),
                }, timeout=5)
                print(f"  → Profile pushed to API")
            except Exception as e:
                print(f"  → API push failed: {e}")


if __name__ == "__main__":
    main()
