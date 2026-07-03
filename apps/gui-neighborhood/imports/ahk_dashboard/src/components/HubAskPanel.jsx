import { useEffect, useState } from 'react'
import { Bot, Brain, LoaderCircle, Send, Sparkles } from 'lucide-react'
import { askHubQuestion, loadHubAiStatus } from '../utils/hubAI'

const PROVIDERS = [
  { id: 'auto', label: 'Auto' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Claude' }
]

const QUICK_QUESTIONS = [
  'What happened today across the team?',
  'What was comms working on today?',
  'What looks most important right now?'
]

function providerMeta(aiStatus, providerId) {
  if (!aiStatus?.providers || providerId === 'auto') {
    return null
  }

  return aiStatus.providers[providerId] || null
}

function formatProviderLabel(value) {
  if (value === 'anthropic') {
    return 'Claude'
  }
  if (value === 'openai') {
    return 'OpenAI'
  }
  if (value === 'local-preview') {
    return 'Local Preview'
  }
  return value || 'unknown'
}

export default function HubAskPanel({ refreshKey = 0 }) {
  const [provider, setProvider] = useState('auto')
  const [question, setQuestion] = useState(QUICK_QUESTIONS[0])
  const [answer, setAnswer] = useState('')
  const [answerMeta, setAnswerMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiStatus, setAiStatus] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      const result = await loadHubAiStatus()
      if (cancelled) {
        return
      }
      setAiStatus(result.ai)
    }

    loadStatus()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const handleAsk = async event => {
    event.preventDefault()
    if (!question.trim()) {
      setError('Ask a question before sending it to the hub.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await askHubQuestion({
        provider,
        question: question.trim()
      })

      setAnswer(result.answer || '')
      setAnswerMeta({
        mode: result.mode,
        provider: result.provider,
        model: result.model
      })
    } catch (requestError) {
      setError(requestError.message || 'The hub could not answer that question.')
      setAnswer('')
      setAnswerMeta(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ahk-navy-600/60 to-ahk-navy-700/60 backdrop-blur-xl border border-ahk-green-500/30 shadow-2xl p-6">
      <div className="absolute top-0 right-0 w-56 h-56 bg-ahk-green-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-gradient-to-br from-ahk-green-500/70 to-emerald-400/70 rounded-xl p-3 border border-ahk-green-500/50 shadow-xl">
            <Bot className="w-5 h-5 text-ahk-navy-900" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-black text-ahk-green-300">
              Ask the Hub
            </h3>
            <p className="text-sm text-ahk-slate-300">
              Route questions through Cloudflare using OpenAI or Claude.
            </p>
          </div>
        </div>

        <form onSubmit={handleAsk} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map(option => {
              const meta = providerMeta(aiStatus, option.id)
              const configured = option.id === 'auto' ? aiStatus?.hasAnyProvider : meta?.configured

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setProvider(option.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-display font-bold transition-all ${
                    provider === option.id
                      ? 'bg-ahk-green-500 text-ahk-navy-900 shadow-xl'
                      : 'bg-ahk-navy-500/50 text-ahk-slate-200 border border-ahk-green-500/20'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.id !== 'auto' && (
                    <span className={`ml-2 text-[0.65rem] ${configured ? 'text-ahk-navy-900/80' : 'text-ahk-slate-400'}`}>
                      {configured ? 'ready' : 'not set'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setQuestion(item)}
                className="px-3 py-2 rounded-lg bg-ahk-navy-700/50 border border-ahk-gold-500/20 text-xs text-ahk-slate-200 hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>

          <textarea
            value={question}
            onChange={event => setQuestion(event.target.value)}
            rows={4}
            placeholder="Ask what happened today, what comms worked on, what matters most, or what changed."
            className="w-full bg-ahk-navy-700/60 text-white rounded-xl px-4 py-3 border border-ahk-green-500/20 focus:outline-none focus:ring-2 focus:ring-ahk-green-500 resize-none"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-ahk-slate-300">
              <Sparkles className="w-4 h-4 text-ahk-green-300" />
              Keys stay in Cloudflare. The browser only talks to your Worker.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{loading ? 'Thinking...' : 'Ask the Hub'}</span>
            </button>
          </div>

          {aiStatus && (
            <div className="rounded-xl bg-ahk-navy-700/40 border border-ahk-green-500/15 px-4 py-3 text-xs text-ahk-slate-300">
              <div className="flex items-center gap-2 mb-2 text-ahk-green-300 font-display font-bold">
                <Brain className="w-4 h-4" />
                <span>Worker AI Status</span>
              </div>
              <div>
                Default route: <span className="text-white">{aiStatus.defaultProvider || 'auto'}</span>
              </div>
              <div>
                OpenAI model: <span className="text-white">{aiStatus.providers?.openai?.model}</span>
              </div>
              <div>
                Claude model: <span className="text-white">{aiStatus.providers?.anthropic?.model}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-semibold bg-red-500/15 text-red-200 border border-red-500/30">
              {error}
            </div>
          )}

          {answer && (
            <div className="rounded-xl bg-ahk-navy-700/55 border border-ahk-green-500/25 p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <span className="px-2 py-1 rounded-full bg-ahk-green-500/20 text-ahk-green-200 border border-ahk-green-500/30">
                  {formatProviderLabel(answerMeta?.provider)}
                </span>
                <span className="px-2 py-1 rounded-full bg-ahk-blue-500/15 text-ahk-blue-200 border border-ahk-blue-500/30">
                  {answerMeta?.model || 'unknown-model'}
                </span>
                <span className="px-2 py-1 rounded-full bg-ahk-gold-500/15 text-ahk-gold-200 border border-ahk-gold-500/30">
                  {answerMeta?.mode === 'local' ? 'local preview' : 'cloudflare worker'}
                </span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-ahk-slate-100 font-sans leading-relaxed">
                {answer}
              </pre>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
