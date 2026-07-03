import { getTodayActivity } from '../../_lib/hub.js'
import { ensureMethod, errorResponse, json } from '../../_lib/http.js'

export async function onRequest(context) {
  const methodError = ensureMethod(context.request, ['GET'])
  if (methodError) {
    return methodError
  }

  try {
    const url = new URL(context.request.url)
    const result = await getTodayActivity(context.env, {
      actor: url.searchParams.get('actor'),
      channel: url.searchParams.get('channel'),
      limit: url.searchParams.get('limit')
    })

    return json(result)
  } catch (error) {
    return errorResponse(400, error.message || 'Failed to load today activity')
  }
}
