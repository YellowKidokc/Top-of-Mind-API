const LOCAL_EVENTS_KEY = 'ahk-hub-local-events'

function nowIso() {
  return new Date().toISOString()
}

function readLocalEvents() {
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (_error) {
    return []
  }
}

function writeLocalEvents(events) {
  localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events.slice(0, 200)))
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function buildLocalSummary(events) {
  const todayStart = startOfToday()
  const todaysEvents = events
    .filter(event => new Date(event.occurredAt || event.createdAt) >= todayStart)
    .sort(
      (a, b) =>
        new Date(b.occurredAt || b.createdAt).getTime() -
        new Date(a.occurredAt || a.createdAt).getTime()
    )

  const actorMap = new Map()
  const channelMap = new Map()

  for (const event of todaysEvents) {
    const actorName = event.actor?.name || 'Unassigned'
    const actorHandle = event.actor?.handle || 'unassigned'
    const channelName = event.channel?.name || 'General'

    if (!actorMap.has(actorHandle)) {
      actorMap.set(actorHandle, {
        actor_name: actorName,
        actor_handle: actorHandle,
        event_count: 0,
        latest_at: event.occurredAt || event.createdAt
      })
    }

    if (!channelMap.has(channelName)) {
      channelMap.set(channelName, {
        channel_name: channelName,
        event_count: 0,
        latest_at: event.occurredAt || event.createdAt
      })
    }

    actorMap.get(actorHandle).event_count += 1
    channelMap.get(channelName).event_count += 1
  }

  return {
    ok: true,
    today: {
      start: todayStart.toISOString(),
      totals: {
        totalEvents: todaysEvents.length,
        activePeople: actorMap.size,
        activeChannels: channelMap.size,
        importanceSum: todaysEvents.reduce(
          (sum, event) => sum + Number(event.importance || 0),
          0
        )
      },
      byActor: Array.from(actorMap.values()).sort(
        (a, b) => b.event_count - a.event_count
      ),
      byChannel: Array.from(channelMap.values()).sort(
        (a, b) => b.event_count - a.event_count
      ),
      events: todaysEvents
    }
  }
}

export async function submitHubCapture(payload) {
  try {
    const response = await fetch('/api/capture', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Capture API returned ${response.status}`)
    }

    const result = await response.json()
    return {
      mode: 'cloudflare',
      ...result
    }
  } catch (_error) {
    const fallbackEvent = {
      id: `local_${Date.now()}`,
      eventType: payload.eventType || 'note',
      sourceType: payload.sourceType || 'manual',
      sourceApp: payload.sourceApp || 'dashboard',
      title: payload.title || '',
      content: payload.content || '',
      summary: payload.title || payload.content?.slice(0, 160) || 'Local capture',
      importance: Number(payload.importance || 0),
      visibility: payload.visibility || 'team',
      status: payload.status || 'captured',
      occurredAt: payload.occurredAt || nowIso(),
      createdAt: nowIso(),
      actor: payload.actor || null,
      channel: payload.channel || null,
      tags: Array.isArray(payload.tags) ? payload.tags : []
    }

    const events = [fallbackEvent, ...readLocalEvents()]
    writeLocalEvents(events)

    return {
      ok: true,
      mode: 'local',
      duplicate: false,
      event: fallbackEvent
    }
  }
}

export async function loadTodayHubActivity() {
  try {
    const response = await fetch('/api/activity/today?limit=12')
    if (!response.ok) {
      throw new Error(`Activity API returned ${response.status}`)
    }

    const result = await response.json()
    return {
      mode: 'cloudflare',
      ...result
    }
  } catch (_error) {
    return {
      mode: 'local',
      ...buildLocalSummary(readLocalEvents())
    }
  }
}
