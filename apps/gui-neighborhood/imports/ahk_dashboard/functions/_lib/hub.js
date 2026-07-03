const encoder = new TextEncoder()

function nowIso() {
  return new Date().toISOString()
}

function startOfTodayIso() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

function normalizeHandle(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeTag(tag = '') {
  return normalizeHandle(tag)
}

function clampImportance(value) {
  const numeric = Number(value || 0)
  if (Number.isNaN(numeric)) {
    return 0
  }
  return Math.max(0, Math.min(5, Math.round(numeric)))
}

function toArray(value) {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value
  }
  return [value]
}

function excerpt(text = '', max = 220) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }
  if (trimmed.length <= max) {
    return trimmed
  }
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`
}

async function sha1Hex(value) {
  const digest = await crypto.subtle.digest('SHA-1', encoder.encode(value))
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function readCapturePayload(request) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const files = formData
      .getAll('files')
      .filter(value => typeof value === 'object' && typeof value.arrayBuffer === 'function')

    return {
      payload: {
        eventType: formData.get('eventType') || 'note',
        sourceType: formData.get('sourceType') || 'manual',
        sourceApp: formData.get('sourceApp') || '',
        title: formData.get('title') || '',
        content: formData.get('content') || '',
        visibility: formData.get('visibility') || 'team',
        status: formData.get('status') || 'captured',
        importance: formData.get('importance') || 0,
        occurredAt: formData.get('occurredAt') || '',
        dedupeKey: formData.get('dedupeKey') || '',
        actor: formData.get('actor')
          ? {
              handle: formData.get('actorHandle') || '',
              name: formData.get('actor')
            }
          : null,
        channel: formData.get('channel')
          ? {
              name: formData.get('channel'),
              type: formData.get('channelType') || 'team'
            }
          : null,
        tags: parseCsvList(formData.get('tags')),
        metadata: safeJsonParse(formData.get('metadata'), {})
      },
      files
    }
  }

  const payload = await request.json()
  return {
    payload,
    files: []
  }
}

function parseCsvList(raw) {
  if (!raw) {
    return []
  }

  return raw
    .toString()
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch (_error) {
    return fallback
  }
}

function normalizeActor(actor) {
  if (!actor) {
    return null
  }

  if (typeof actor === 'string') {
    const clean = actor.trim()
    if (!clean) {
      return null
    }
    return {
      handle: normalizeHandle(clean),
      name: clean,
      role: null
    }
  }

  const name = (actor.name || actor.displayName || actor.display_name || '').trim()
  const handle = normalizeHandle(actor.handle || name)

  if (!name && !handle) {
    return null
  }

  return {
    handle: handle || makeId('actor'),
    name: name || actor.handle,
    role: actor.role || null
  }
}

function normalizeChannel(channel) {
  if (!channel) {
    return null
  }

  if (typeof channel === 'string') {
    const clean = channel.trim()
    if (!clean) {
      return null
    }
    return {
      name: clean,
      normalizedName: normalizeHandle(clean),
      type: 'team',
      description: null
    }
  }

  const name = (channel.name || '').trim()
  if (!name) {
    return null
  }

  return {
    name,
    normalizedName: normalizeHandle(channel.normalizedName || name),
    type: channel.type || 'team',
    description: channel.description || null
  }
}

async function upsertActor(db, actorInput) {
  const actor = normalizeActor(actorInput)
  if (!actor) {
    return null
  }

  const existing = await db
    .prepare('SELECT id FROM hub_actors WHERE handle = ?')
    .bind(actor.handle)
    .first()

  const timestamp = nowIso()

  if (existing?.id) {
    await db
      .prepare(
        'UPDATE hub_actors SET display_name = ?, role = ?, updated_at = ? WHERE id = ?'
      )
      .bind(actor.name, actor.role, timestamp, existing.id)
      .run()
    return existing.id
  }

  const actorId = makeId('actor')
  await db
    .prepare(
      `INSERT INTO hub_actors (id, handle, display_name, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(actorId, actor.handle, actor.name, actor.role, timestamp, timestamp)
    .run()

  return actorId
}

async function upsertChannel(db, channelInput) {
  const channel = normalizeChannel(channelInput)
  if (!channel) {
    return null
  }

  const existing = await db
    .prepare('SELECT id FROM hub_channels WHERE normalized_name = ?')
    .bind(channel.normalizedName)
    .first()

  const timestamp = nowIso()

  if (existing?.id) {
    await db
      .prepare(
        'UPDATE hub_channels SET name = ?, channel_type = ?, description = ?, updated_at = ? WHERE id = ?'
      )
      .bind(channel.name, channel.type, channel.description, timestamp, existing.id)
      .run()
    return existing.id
  }

  const channelId = makeId('chn')
  await db
    .prepare(
      `INSERT INTO hub_channels (id, name, normalized_name, channel_type, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      channelId,
      channel.name,
      channel.normalizedName,
      channel.type,
      channel.description,
      timestamp,
      timestamp
    )
    .run()

  return channelId
}

async function saveTags(db, eventId, tags) {
  const cleanTags = toArray(tags)
    .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)

  for (const tag of cleanTags) {
    const normalized = normalizeTag(tag)
    if (!normalized) {
      continue
    }

    await db
      .prepare(
        `INSERT OR IGNORE INTO hub_event_tags (event_id, tag, normalized_tag, created_at)
         VALUES (?, ?, ?, ?)`
      )
      .bind(eventId, tag, normalized, nowIso())
      .run()
  }
}

async function saveFiles(db, bucket, eventId, files) {
  const saved = []

  for (const file of files) {
    const attachmentId = makeId('att')
    const storageKey = `captures/${eventId}/${attachmentId}-${file.name}`

    if (bucket) {
      await bucket.put(storageKey, await file.arrayBuffer(), {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream'
        }
      })
    }

    await db
      .prepare(
        `INSERT INTO hub_event_attachments
         (id, event_id, storage_provider, storage_key, file_name, mime_type, size_bytes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        attachmentId,
        eventId,
        bucket ? 'r2' : 'pending',
        bucket ? storageKey : null,
        file.name,
        file.type || 'application/octet-stream',
        file.size || 0,
        nowIso()
      )
      .run()

    saved.push({
      id: attachmentId,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size || 0,
      storageKey: bucket ? storageKey : null
    })
  }

  return saved
}

export async function createCapture(env, request) {
  if (!env?.HUB_DB) {
    throw new Error('HUB_DB binding is not configured')
  }

  const { payload, files } = await readCapturePayload(request)
  const content = (payload.content || payload.text || '').trim()
  const title = (payload.title || '').trim()

  if (!content && !title && files.length === 0) {
    throw new Error('A capture needs text, a title, or at least one file')
  }

  const actorId = await upsertActor(env.HUB_DB, payload.actor)
  const channelId = await upsertChannel(env.HUB_DB, payload.channel)
  const eventType = (payload.eventType || payload.type || 'note').toString().trim()
  const sourceType = (payload.sourceType || 'manual').toString().trim()
  const sourceApp = (payload.sourceApp || payload.source || '').toString().trim()
  const visibility = (payload.visibility || 'team').toString().trim()
  const status = (payload.status || 'captured').toString().trim()
  const occurredAt = payload.occurredAt || nowIso()
  const metadata = payload.metadata || {}
  const tags = payload.tags || []
  const importance = clampImportance(payload.importance)
  const summary = excerpt(title || content || `${files.length} file capture`)

  let dedupeKey = (payload.dedupeKey || '').trim()
  if (!dedupeKey && (title || content)) {
    dedupeKey = await sha1Hex(
      JSON.stringify({
        eventType,
        actorId,
        channelId,
        title,
        content,
        occurredAt
      })
    )
  }

  if (dedupeKey) {
    const existing = await env.HUB_DB
      .prepare('SELECT id, created_at FROM hub_events WHERE dedupe_key = ?')
      .bind(dedupeKey)
      .first()

    if (existing?.id) {
      return {
        ok: true,
        duplicate: true,
        event: {
          id: existing.id,
          createdAt: existing.created_at
        }
      }
    }
  }

  const eventId = makeId('evt')
  const timestamp = nowIso()

  await env.HUB_DB
    .prepare(
      `INSERT INTO hub_events
       (id, event_type, source_type, source_app, actor_id, channel_id, title, content_text, summary,
        importance, visibility, status, dedupe_key, metadata_json, occurred_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      eventId,
      eventType,
      sourceType,
      sourceApp,
      actorId,
      channelId,
      title || null,
      content || null,
      summary || null,
      importance,
      visibility,
      status,
      dedupeKey || null,
      JSON.stringify(metadata),
      occurredAt,
      timestamp,
      timestamp
    )
    .run()

  await saveTags(env.HUB_DB, eventId, tags)
  const attachments = await saveFiles(env.HUB_DB, env.HUB_FILES, eventId, files)

  return {
    ok: true,
    duplicate: false,
    event: {
      id: eventId,
      eventType,
      sourceType,
      sourceApp,
      actorId,
      channelId,
      title,
      content,
      summary,
      importance,
      visibility,
      status,
      occurredAt,
      createdAt: timestamp,
      tags: toArray(tags),
      attachments
    }
  }
}

export async function getTodayActivity(env, options = {}) {
  if (!env?.HUB_DB) {
    throw new Error('HUB_DB binding is not configured')
  }

  const limit = Math.max(1, Math.min(100, Number(options.limit || 25)))
  const start = options.start || startOfTodayIso()
  const actorHandle = options.actor ? normalizeHandle(options.actor) : null
  const channelName = options.channel ? normalizeHandle(options.channel) : null

  const where = ['e.occurred_at >= ?']
  const bindings = [start]

  if (actorHandle) {
    where.push('a.handle = ?')
    bindings.push(actorHandle)
  }

  if (channelName) {
    where.push('c.normalized_name = ?')
    bindings.push(channelName)
  }

  const whereSql = where.join(' AND ')

  const eventsQuery = `
    SELECT
      e.id,
      e.event_type,
      e.source_type,
      e.source_app,
      e.title,
      e.content_text,
      e.summary,
      e.importance,
      e.visibility,
      e.status,
      e.occurred_at,
      e.created_at,
      a.handle AS actor_handle,
      a.display_name AS actor_name,
      c.name AS channel_name,
      c.channel_type AS channel_type,
      (
        SELECT GROUP_CONCAT(tag, ', ')
        FROM hub_event_tags t
        WHERE t.event_id = e.id
      ) AS tags_csv,
      (
        SELECT COUNT(*)
        FROM hub_event_attachments att
        WHERE att.event_id = e.id
      ) AS attachment_count
    FROM hub_events e
    LEFT JOIN hub_actors a ON a.id = e.actor_id
    LEFT JOIN hub_channels c ON c.id = e.channel_id
    WHERE ${whereSql}
    ORDER BY e.occurred_at DESC
    LIMIT ?
  `

  const eventsResult = await env.HUB_DB
    .prepare(eventsQuery)
    .bind(...bindings, limit)
    .all()

  const totalsQuery = `
    SELECT
      COUNT(*) AS total_events,
      COUNT(DISTINCT e.actor_id) AS active_people,
      COUNT(DISTINCT e.channel_id) AS active_channels,
      COALESCE(SUM(e.importance), 0) AS importance_sum
    FROM hub_events e
    LEFT JOIN hub_actors a ON a.id = e.actor_id
    LEFT JOIN hub_channels c ON c.id = e.channel_id
    WHERE ${whereSql}
  `

  const totals = await env.HUB_DB
    .prepare(totalsQuery)
    .bind(...bindings)
    .first()

  const actorSummaryQuery = `
    SELECT
      COALESCE(a.display_name, 'Unassigned') AS actor_name,
      COALESCE(a.handle, 'unassigned') AS actor_handle,
      COUNT(*) AS event_count,
      MAX(e.occurred_at) AS latest_at
    FROM hub_events e
    LEFT JOIN hub_actors a ON a.id = e.actor_id
    LEFT JOIN hub_channels c ON c.id = e.channel_id
    WHERE ${whereSql}
    GROUP BY actor_handle, actor_name
    ORDER BY event_count DESC, latest_at DESC
    LIMIT 10
  `

  const actorSummary = await env.HUB_DB
    .prepare(actorSummaryQuery)
    .bind(...bindings)
    .all()

  const channelSummaryQuery = `
    SELECT
      COALESCE(c.name, 'General') AS channel_name,
      COUNT(*) AS event_count,
      MAX(e.occurred_at) AS latest_at
    FROM hub_events e
    LEFT JOIN hub_actors a ON a.id = e.actor_id
    LEFT JOIN hub_channels c ON c.id = e.channel_id
    WHERE ${whereSql}
    GROUP BY channel_name
    ORDER BY event_count DESC, latest_at DESC
    LIMIT 10
  `

  const channelSummary = await env.HUB_DB
    .prepare(channelSummaryQuery)
    .bind(...bindings)
    .all()

  return {
    ok: true,
    today: {
      start,
      totals: {
        totalEvents: Number(totals?.total_events || 0),
        activePeople: Number(totals?.active_people || 0),
        activeChannels: Number(totals?.active_channels || 0),
        importanceSum: Number(totals?.importance_sum || 0)
      },
      byActor: actorSummary.results || [],
      byChannel: channelSummary.results || [],
      events: (eventsResult.results || []).map(event => ({
        id: event.id,
        eventType: event.event_type,
        sourceType: event.source_type,
        sourceApp: event.source_app,
        title: event.title,
        content: event.content_text,
        summary: event.summary,
        importance: event.importance,
        visibility: event.visibility,
        status: event.status,
        occurredAt: event.occurred_at,
        createdAt: event.created_at,
        actor: event.actor_handle
          ? {
              handle: event.actor_handle,
              name: event.actor_name
            }
          : null,
        channel: event.channel_name
          ? {
              name: event.channel_name,
              type: event.channel_type
            }
          : null,
        tags: event.tags_csv ? event.tags_csv.split(', ').filter(Boolean) : [],
        attachmentCount: Number(event.attachment_count || 0)
      }))
    }
  }
}
