# Legacy Intelligence Component Map

## Purpose

These older scripts and packages are not random leftovers. They contain pieces of the intelligence layer that the hub still needs. The right move is not to drop them wholesale into the new repo, and it is not to ignore them. The right move is to classify them by role and decide whether each one should become a direct module, a mined logic source, or a reference-only artifact.

This document maps the currently identified legacy components into the new hub architecture.

## Group 1: Lexicon and Metric Engine

### `D:\DONT TOUCH BOOT UP\build_lexicon.py`

This is a lexicon builder, not a runtime watcher component. It builds a cross-domain coherence/discoherence vocabulary using hand-mapped seed terms, WordNet expansion, and workbook output. That makes it a **build-time intelligence asset**.

It belongs in the hub as:

- `tools/` or `scripts/` build utility
- source for taxonomy/term generation
- support input for the classifier, NLP, and metric engine

It should not be called on every file event. It is too heavy and too structural for that. Instead, it should produce versioned lexicon artifacts that the rest of the hub can load.

### `D:\DONT TOUCH BOOT UP\chi_qi_v5_metric_engine.py`

This is much more important than it looks. It already contains a full pattern for:

- lexical term stores
- text normalization
- sentence/paragraph splitting
- evidence spans
- scoring
- sidecar writing
- SQLite memory

In the new hub, this should not be imported untouched, but it should be treated as a **major donor** for:

- file content scoring
- evidence span storage
- deterministic excerpting
- sidecar/report generation
- scoring provenance

Its best architectural role is:

- `workers/metrics_worker.py`
- `core/evidence.py`
- `storage/metric_repo.py`

It is also the best source we currently have for the rule:

> every label must have a score, every score must have evidence spans, every evidence span must have weight

That should become a hub standard.

## Group 2: Corpus Engine Core

### `classifier.py`

This is a usable content-type classifier with explicit rule ordering and recognizable path/content signals. It belongs directly in the hub’s deterministic classification lane.

Best destination:

- `file_intelligence_hub/workers/classify_worker.py`
- `file_intelligence_hub/rules/classifier_rules.py`

Use it for:

- file type classification
- intent classification
- anomaly classification
- first-pass domain assignment

This is not legacy fluff. This is live logic worth porting.

### `clusterer.py`

This is a clustering engine using TF-IDF plus topic signatures. That makes it a **folder- and corpus-level summarization asset**, not a hot-path watcher asset.

Best destination:

- `workers/folder_summary_worker.py`
- `workers/cluster_worker.py`

Use it for:

- grouping related files
- building folder themes
- top project detection
- representative sample selection

This is especially useful for the folder-size tiers we were just discussing. It belongs in the summary layer.

### `folder_scanner.py`

This one matters a lot. It already has a `FolderProfile` shape, text-safe reading, folder type classification, folder tree scanning, and search. This is very close to what the hub needs for compressed folder intelligence.

Best destination:

- `workers/folder_summary_worker.py`
- `core/folder_profile_builder.py`
- `api/routes_folders.py`

Use it for:

- scan-time folder summaries
- folder role detection
- top signal vectors
- folder tree traversal policies

This should be mined aggressively.

### `namer.py`

This is directly useful. It has slugging, version extraction, naming preferences, learned correction storage, suggested names, and suggested folders.

Best destination:

- `workers/rename_worker.py`
- `core/naming.py`
- `storage/preference_repo.py`

Use it for:

- rename suggestion
- version cleanup
- folder destination suggestion
- learning from corrections

This belongs in the first serious implementation wave.

### `paired_assets.py`

This is one of the easiest wins. It detects paired assets by stem across HTML, audio, transcript, PDF, and related types. That fits perfectly with website and media workflows.

Best destination:

- `workers/asset_pair_worker.py`
- `api/routes_assets.py`

Use it for:

- website package validation
- podcast/article bundle checking
- missing transcript/audio/html detection
- outbox completeness checks

This is high value and low controversy.

### `preference_store.py`

This is an older SQLite-backed memory for files, clusters, aliases, corrections, actions, and paired assets. It should not become the new hub schema directly, but it is an important **schema donor**.

Best destination:

- `storage/` schema refinement source
- preference-learning schema input
- correction-memory model

Mine it for:

- learned naming alias storage
- user correction tables
- cluster/file relationship ideas
- paired asset persistence

Do not copy it one-to-one. Use it to improve the new hub’s SQLite plan.

## Group 3: FastAPI Application Services

### `domain_classifier.py`
### `markov.py`
### `nlp.py`
### `simple.py`

These are thin service wrappers around named channels and ports. They are not the intelligence itself, but they show a useful service model:

- named service
- known port
- known channel
- health surface

That means they are best treated as **service registry / adapter pattern donors**.

Best destination:

- `services/registry.py`
- `services/base.py`
- `services/adapters/`

Use them for:

- registering local side services
- health checks
- capability reporting
- channel naming conventions

They are useful structurally, even if they are currently thin.

### `synology.py`

This one is directly relevant. It already knows how to:

- check Synology credentials
- perform a health check
- talk to Synology FileStation
- produce status payloads

That means it belongs in the node and self-healing story.

Best destination:

- `services/synology_adapter.py`
- `workers/node_health_worker.py`
- `api/routes_nodes.py`

Use it for:

- NAS health visibility
- hub-node capability checks
- self-healing peer source validation
- remote file operations where approved

This should be part of the multi-node recovery model, not a detached side utility.

## Best Integration Decision By Component

### Port Soon

These should be actively ported into the hub design:

- `classifier.py`
- `folder_scanner.py`
- `namer.py`
- `paired_assets.py`
- `synology.py`

### Mine For Logic

These should be used as donors, then rewritten cleanly:

- `chi_qi_v5_metric_engine.py`
- `clusterer.py`
- `preference_store.py`
- `build_lexicon.py`

### Structural Reference

These are mainly service-pattern references:

- `domain_classifier.py`
- `markov.py`
- `nlp.py`
- `simple.py`

## Missing Workbook/Architecture Buckets These Should Influence

These legacy components mean the architecture workbook should explicitly include or expand:

- Lexicon / taxonomy build lane
- Metric / evidence-span lane
- Folder summary and clustering lane
- Naming preference and correction-memory lane
- Paired asset completeness lane
- Service registry / health adapter lane
- Synology / NAS integration lane

## Bottom Line

The hub is not starting from nothing. These files prove we already have building blocks for:

- deterministic classification
- folder summarization
- naming intelligence
- pairing detection
- scoring with evidence spans
- learned preferences
- service health adapters

So the right posture is not “new system versus old scripts.” The right posture is:

> promote the good old logic into the new hub, and retire the rest with dignity.
