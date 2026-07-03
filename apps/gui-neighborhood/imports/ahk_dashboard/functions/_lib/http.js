export function json(data, init = {}) {
  const headers = new Headers(init.headers || {})
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8')
  }
  headers.set('cache-control', 'no-store')

  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers
  })
}

export function errorResponse(status, error, details) {
  return json(
    {
      ok: false,
      error,
      ...(details ? { details } : {})
    },
    { status }
  )
}

export function ensureMethod(request, allowed) {
  if (!allowed.includes(request.method)) {
    return json(
      {
        ok: false,
        error: `Method ${request.method} not allowed`
      },
      {
        status: 405,
        headers: {
          allow: allowed.join(', ')
        }
      }
    )
  }

  return null
}

export function parseJsonField(value, fallback) {
  if (value == null || value === '') {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch (_error) {
    return fallback
  }
}
