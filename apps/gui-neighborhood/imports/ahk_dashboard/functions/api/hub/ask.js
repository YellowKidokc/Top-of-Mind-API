import { generateHubAnswer } from '../../_lib/ai.js'
import { getTodayActivity } from '../../_lib/hub.js'
import { ensureMethod, errorResponse, json } from '../../_lib/http.js'

const HUB_SYSTEM_PROMPT = `You are the AI memory layer for a shared operations hub.

Answer the user's question using only the supplied hub context.
If the context is incomplete, say that directly.
Focus on what happened, who did it, which channel or team it involved, and what matters next.
Keep the answer operational, concrete, and easy to scan.`

function clip(value = '', max = 280) {
  const text = value.toString().trim()
  if (!text) {
    return ''
  }
  if (text.length <= max) {
    return text
  }
  return `${text.slice(0, max - 1).trimEnd()}…`
}

function buildHubContext(today) {
  const lines = [
    `Hub day start: ${today.start}`,
    `Totals: ${today.totals.totalEvents} events, ${today.totals.activePeople} active people, ${today.totals.activeChannels} active channels, importance sum ${today.totals.importanceSum}.`
  ]

  const topPeople = (today.byActor || [])
    .slice(0, 5)
    .map(actor => `${actor.actor_name} (${actor.event_count})`)

  if (topPeople.length > 0) {
    lines.push(`Top people: ${topPeople.join(', ')}.`)
  }

  const topChannels = (today.byChannel || [])
    .slice(0, 5)
    .map(channel => `${channel.channel_name} (${channel.event_count})`)

  if (topChannels.length > 0) {
    lines.push(`Top channels: ${topChannels.join(', ')}.`)
  }

  lines.push('Recent events:')

  for (const event of (today.events || []).slice(0, 15)) {
    const actor = event.actor?.name || 'Unassigned'
    const channel = event.channel?.name || 'General'
    const headline = event.title || event.summary || event.eventType
    const detail = clip(event.content || event.summary || '')
    const tagText = event.tags?.length ? ` | tags: ${event.tags.join(', ')}` : ''

    lines.push(
      `- ${event.occurredAt} | ${actor} | ${channel} | ${headline}${detail ? ` | ${detail}` : ''}${tagText}`
    )
  }

  return lines.join('\n')
}

export async function onRequest(context) {
  const methodError = ensureMethod(context.request, ['POST'])
  if (methodError) {
    return methodError
  }

  try {
    if (!context.env?.HUB_DB) {
      return errorResponse(503, 'HUB_DB binding is not configured.')
    }

    const body = await context.request.json()
    const question = (body?.question || '').trim()

    if (!question) {
      return errorResponse(400, 'Question is required.')
    }

    const activity = await getTodayActivity(context.env, {
      limit: Math.max(5, Math.min(40, Number(body?.limit || 20))),
      actor: body?.actor,
      channel: body?.channel
    })

    const prompt = `User question: ${question}

Hub context:
${buildHubContext(activity.today)}`

    const result = await generateHubAnswer(context.env, {
      provider: body?.provider || 'auto',
      model: body?.model || null,
      maxTokens: Math.max(200, Math.min(1600, Number(body?.maxTokens || 700))),
      systemPrompt: HUB_SYSTEM_PROMPT,
      prompt
    })

    return json({
      ok: true,
      provider: result.provider,
      model: result.model,
      answer: result.text,
      context: {
        totals: activity.today.totals,
        eventCount: activity.today.events.length
      }
    })
  } catch (error) {
    const message = error?.message || 'Failed to answer from hub context.'
    const status = /not configured/i.test(message) ? 503 : 400
    return errorResponse(status, message)
  }
}
