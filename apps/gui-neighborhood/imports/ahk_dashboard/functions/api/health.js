import { getAiProviderStatus } from '../_lib/ai.js'
import { json } from '../_lib/http.js'

export async function onRequestGet(context) {
  return json({
    ok: true,
    service: 'ahk-hub-phase1',
    hasDatabase: Boolean(context.env?.HUB_DB),
    hasFilesBucket: Boolean(context.env?.HUB_FILES),
    ai: getAiProviderStatus(context.env),
    now: new Date().toISOString()
  })
}
