# File Intelligence Hub Memory

Last updated: 2026-07-02

This is the working memory for the File Intelligence Hub. It captures the current decisions so Codex, Claude, Gemini, Cursor, Kimmy, and future tools do not have to rediscover the same architecture.

## Core Decision

Build one central File Intelligence Hub, not a pile of scripts copied into every folder.

The hub owns:

- folder scanning
- symptom detection
- tagging
- file conversion
- SQLite records
- API routing
- clipboard/API-call history
- memory/vector search
- approval gates
- audit logs

Folder tools and AutoHotkey are workers/hands. The API is the brain.

## Active Target Repo

Primary implementation target:

`D:\GitHub\Top-of-Mind-API`

Legacy/source folders to merge from:

- `D:\DONT TOUCH BOOT UP\file-intelligence-hub`
- `D:\DONT TOUCH BOOT UP\filetagger`
- `D:\DONT TOUCH BOOT UP\FastAPI-application`
- `D:\DONT TOUCH BOOT UP\file-integrity-monitor`
- `D:\DONT TOUCH BOOT UP\organize`
- `D:\DONT TOUCH BOOT UP\chi_qi_v5_statistical_audit_package`

Reference only:

- `D:\DONT TOUCH BOOT UP\Python-master`

## Symptom Registry

Opus 4.8 registry file:

`D:\DONT TOUCH BOOT UP\PICS\Opus 4.8\folder_symptom_registry.xlsx`

It contains:

- `Symptom Registry`
- `Detection Functions`
- `Severity Scale`

This is the rulebook for folder intelligence. It already includes symptoms such as extension swamp, duplicate cluster, format redundancy, media dump, encoding chaos, stale pipeline, program-root danger, config leak, sync ghost, mirror drift, AI session debris, archive pile, and chi classification gap.

## Conversion Lane

File conversion must become a first-class hub lane.

Do not put converter scripts inside every folder. Use one central converter service with API tools.

Suggested conversion API:

- `POST /convert/scan`
- `POST /convert/plan`
- `POST /convert/run`
- `GET /convert/jobs`
- `GET /convert/jobs/{id}`
- `POST /convert/jobs/{id}/approve`
- `POST /convert/jobs/{id}/rollback`

Conversion categories to add to the registry:

- `V01` oversized media format
- `V02` web-unfriendly image
- `V03` PDF page extraction needed
- `V04` audio needs web/archive format
- `V05` video needs web/archive format
- `V06` legacy document format
- `V07` bad encoding/text normalization

Possible tools:

- FFmpeg for audio/video
- ImageMagick for images
- LibreOffice for office documents
- Pandoc for markdown/html/doc transforms
- Poppler for PDF extraction

Policy:

- never delete originals on first pass
- never auto-convert protected/program folders
- never overwrite outputs
- log every conversion to SQLite
- require approval for risky or destructive operations

## Marker Files

Use weird marker extensions, not `.json`.

Preferred folder marker:

`.folder.fihubmark`

Possible file-level marker:

`filename.ext.fihubmark`

Possible conversion marker:

`.convert.fihubmark`

Reason:

- easy to isolate in search
- deletion tools can detect them
- the hub can import them into SQLite before any cleanup
- they are not confused with normal project files

Marker content can be structured text, not executable code.

Example:

```text
FIHUB-MARK v1
type: folder
folder_id:
path:
first_seen:
last_scan:
risk:
tags:
status:
delete_policy: import_to_sqlite_before_delete
notes:
```

## SQLite

SQLite is the local durable record for the active hub.

Important rule:

Do not give every AI/app its own disconnected SQLite brain.

Preferred pattern:

- one active hub database
- all clients talk to it through API
- remote clients queue locally only when the hub is offline
- queued data syncs back when the hub returns

SQLite should store:

- files
- folders
- folder markers
- symptoms
- conversion plans
- conversion jobs
- clipboard entries
- API call history
- agent messages
- approvals/reviews
- audit logs
- vector/memory references

## API Brain

Minimum AI-useful tools:

- `files.search`
- `files.read`
- `files.write`
- `folders.scan`
- `folders.evaluate`
- `folders.tag`
- `convert.scan`
- `convert.plan`
- `convert.run`
- `memory.search`
- `memory.upsert`
- `commands.run`
- `agents.send`
- `clipboard.save`
- `audit.log`

AutoHotkey should call the API. It should not become the brain.

## Clipboard/API History

The clipboard gap is important.

Every sent message/API call should be saved centrally like clipboard history.

Need:

- saved prompts/messages
- API call templates
- API call run history
- copy/rerun buttons in the web UI
- routing metadata: source, target agent, conversation, frequency, status

This should live in the hub, not only in local browser storage.

## NLP For Files And Folders

Use lightweight file/folder intelligence, not an 8 GB model.

Recommended base:

- FastEmbed
- `BAAI/bge-small-en-v1.5` or `sentence-transformers/all-MiniLM-L6-v2`
- SQLite/vector index
- human correction loop

Use embeddings on:

- filename
- path
- parent folder names
- extension
- nearby files
- extracted text when safe
- marker content
- user corrections

Later training:

- use corrected examples to train a small classifier/preference engine
- possible tool: SetFit

## Backup / Multi-Machine Shape

This is not meant to be three separate brains.

Preferred failover:

1. Synology NAS hub primary
2. Desktop fallback
3. Laptop fallback

If Synology is offline, desktop catches it. If desktop is offline, laptop catches it. When the primary returns, local outboxes sync back.

## Security

Token-protect LAN API.

Use:

- `X-FIHUB-Token`
- or `Authorization: Bearer <token>`

Never expose file-action endpoints directly to the public internet.

For Cloudflare later:

- use Cloudflare Tunnel/Worker as relay
- keep local file actions private
- only expose safe message/clipboard/agent endpoints first

## Current Direction

Next useful implementation steps:

1. Import the symptom registry into hub docs/config.
2. Add conversion symptoms and conversion API plan.
3. Make folder agent write `.folder.fihubmark`, not `.folderagent.json`.
4. Store markers/symptoms/conversion jobs in SQLite.
5. Add `/agents/send` if missing.
6. Reconcile `/commands/run` vs `/commands`.
7. Verify clipboard save route and API-call history route.
8. Build small FastEmbed-based folder grouping prototype.

