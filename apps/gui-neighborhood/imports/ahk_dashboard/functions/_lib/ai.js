const OPENAI_DEFAULT_MODEL = 'gpt-4.1'
const ANTHROPIC_DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const ANTHROPIC_VERSION = '2023-06-01'

function normalizeProvider(value = 'auto') {
  const provider = value.toString().trim().toLowerCase()
  if (provider === 'claude') {
    return 'anthropic'
  }
  if (provider === 'openai' || provider === 'anthropic' || provider === 'auto') {
    return provider
  }
  return 'auto'
}

function hasOpenAI(env) {
  return Boolean(env?.OPENAI_API_KEY)
}

function hasAnthropic(env) {
  return Boolean(env?.ANTHROPIC_API_KEY)
}

export function getAiProviderStatus(env) {
  const requestedDefault = normalizeProvider(env?.AI_PROVIDER_DEFAULT || 'auto')
  const configuredProviders = []

  if (hasOpenAI(env)) {
    configuredProviders.push('openai')
  }
  if (hasAnthropic(env)) {
    configuredProviders.push('anthropic')
  }

  let defaultProvider = requestedDefault
  if (
    defaultProvider === 'auto' ||
    (defaultProvider === 'openai' && !hasOpenAI(env)) ||
    (defaultProvider === 'anthropic' && !hasAnthropic(env))
  ) {
    defaultProvider = configuredProviders[0] || 'auto'
  }

  return {
    hasAnyProvider: configuredProviders.length > 0,
    availableProviders: configuredProviders,
    defaultProvider,
    providers: {
      openai: {
        configured: hasOpenAI(env),
        model: env?.OPENAI_MODEL || OPENAI_DEFAULT_MODEL
      },
      anthropic: {
        configured: hasAnthropic(env),
        model: env?.ANTHROPIC_MODEL || ANTHROPIC_DEFAULT_MODEL
      }
    }
  }
}

function resolveProvider(env, requestedProvider) {
  const requested = normalizeProvider(requestedProvider)
  const status = getAiProviderStatus(env)

  if (!status.hasAnyProvider) {
    throw new Error(
      'No AI provider is configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY in Cloudflare.'
    )
  }

  if (requested === 'auto') {
    return status.defaultProvider
  }

  if (!status.availableProviders.includes(requested)) {
    const providerName = requested === 'anthropic' ? 'Claude' : 'OpenAI'
    throw new Error(`${providerName} is not configured in this Cloudflare environment.`)
  }

  return requested
}

async function readResponseJson(response) {
  try {
    return await response.json()
  } catch (_error) {
    return null
  }
}

function extractOpenAIText(payload) {
  const chunks = []

  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  for (const item of payload?.output || []) {
    if (!Array.isArray(item?.content)) {
      continue
    }

    for (const block of item.content) {
      if (
        (block?.type === 'output_text' || block?.type === 'text') &&
        typeof block.text === 'string' &&
        block.text.trim()
      ) {
        chunks.push(block.text.trim())
      }
    }
  }

  return chunks.join('\n\n').trim()
}

function extractAnthropicText(payload) {
  return (payload?.content || [])
    .filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text.trim())
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

async function callOpenAI(env, { prompt, systemPrompt, model, maxTokens }) {
  const selectedModel = model || env?.OPENAI_MODEL || OPENAI_DEFAULT_MODEL
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: selectedModel,
      instructions: systemPrompt,
      input: prompt,
      max_output_tokens: maxTokens
    })
  })

  const payload = await readResponseJson(response)

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        `OpenAI request failed with status ${response.status}`
    )
  }

  const text = extractOpenAIText(payload)
  if (!text) {
    throw new Error('OpenAI returned an empty answer.')
  }

  return {
    provider: 'openai',
    model: selectedModel,
    text
  }
}

async function callAnthropic(env, { prompt, systemPrompt, model, maxTokens }) {
  const selectedModel = model || env?.ANTHROPIC_MODEL || ANTHROPIC_DEFAULT_MODEL
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION
    },
    body: JSON.stringify({
      model: selectedModel,
      system: systemPrompt,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  const payload = await readResponseJson(response)

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        `Anthropic request failed with status ${response.status}`
    )
  }

  const text = extractAnthropicText(payload)
  if (!text) {
    throw new Error('Claude returned an empty answer.')
  }

  return {
    provider: 'anthropic',
    model: selectedModel,
    text
  }
}

export async function generateHubAnswer(env, options) {
  const provider = resolveProvider(env, options.provider)

  if (provider === 'openai') {
    return callOpenAI(env, options)
  }

  return callAnthropic(env, options)
}
