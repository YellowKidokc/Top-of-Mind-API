import { loadTodayHubActivity } from './hubCapture'

function buildLocalPreviewAnswer(today) {
  if (!today || !today.totals || today.totals.totalEvents === 0) {
    return 'No hub activity has been captured today yet. Capture a few updates and this panel will start answering from real context.'
  }

  const lines = [
    `Today so far: ${today.totals.totalEvents} events across ${today.totals.activePeople} people and ${today.totals.activeChannels} channels.`
  ]

  const topPeople = (today.byActor || [])
    .slice(0, 3)
    .map(actor => `${actor.actor_name} (${actor.event_count})`)

  if (topPeople.length > 0) {
    lines.push(`Most active people: ${topPeople.join(', ')}.`)
  }

  const latestItems = (today.events || [])
    .slice(0, 5)
    .map(event => {
      const actor = event.actor?.name || 'Unassigned'
      const channel = event.channel?.name || 'General'
      const headline = event.title || event.summary || event.eventType
      return `- ${actor} in ${channel}: ${headline}`
    })

  if (latestItems.length > 0) {
    lines.push(`Recent activity:\n${latestItems.join('\n')}`)
  }

  lines.push(
    'This is a local preview because the Cloudflare AI route is not available in the current environment.'
  )

  return lines.join('\n\n')
}

export async function loadHubAiStatus() {
  try {
    const response = await fetch('/api/health')
    if (!response.ok) {
      throw new Error(`Health API returned ${response.status}`)
    }

    const result = await response.json()
    return {
      mode: 'cloudflare',
      ok: true,
      ai: result.ai || null
    }
  } catch (_error) {
    return {
      mode: 'local',
      ok: true,
      ai: {
        hasAnyProvider: false,
        availableProviders: [],
        defaultProvider: 'auto',
        providers: {
          openai: {
            configured: false,
            model: 'gpt-4.1'
          },
          anthropic: {
            configured: false,
            model: 'claude-sonnet-4-20250514'
          }
        }
      }
    }
  }
}

export async function askHubQuestion(payload) {
  async function buildFallbackResult() {
    const activity = await loadTodayHubActivity()
    return {
      ok: true,
      mode: 'local',
      provider: 'local-preview',
      model: 'rules-preview',
      answer: buildLocalPreviewAnswer(activity.today),
      context: {
        totals: activity.today?.totals || null,
        eventCount: activity.today?.events?.length || 0
      }
    }
  }

  try {
    const response = await fetch('/api/hub/ask', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      if (response.status === 404) {
        return buildFallbackResult()
      }

      const error = new Error(result?.error || `Hub AI returned ${response.status}`)
      error.status = response.status
      throw error
    }

    return {
      mode: 'cloudflare',
      ...result
    }
  } catch (error) {
    if (error?.status) {
      throw error
    }

    return buildFallbackResult()
  }
}
