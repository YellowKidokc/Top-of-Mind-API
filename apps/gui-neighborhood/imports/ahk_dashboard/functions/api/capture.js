import { createCapture } from '../_lib/hub.js'
import { ensureMethod, errorResponse, json } from '../_lib/http.js'

export async function onRequest(context) {
  const methodError = ensureMethod(context.request, ['POST'])
  if (methodError) {
    return methodError
  }

  try {
    const result = await createCapture(context.env, context.request)
    return json(result, {
      status: result.duplicate ? 200 : 201
    })
  } catch (error) {
    return errorResponse(400, error.message || 'Failed to capture event')
  }
}
