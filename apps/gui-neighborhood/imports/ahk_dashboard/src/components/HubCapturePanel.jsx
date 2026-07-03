import { useState } from 'react'
import { Inbox, Send, Sparkles } from 'lucide-react'
import { submitHubCapture } from '../utils/hubCapture'

const EVENT_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' },
  { value: 'link', label: 'Link' },
  { value: 'update', label: 'Update' }
]

export default function HubCapturePanel({ onCaptured }) {
  const [eventType, setEventType] = useState('note')
  const [actorName, setActorName] = useState('Ashraf')
  const [channelName, setChannelName] = useState('general')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim() && !content.trim()) {
      setStatus({
        tone: 'error',
        text: 'Add a title or some content before capturing.'
      })
      return
    }

    setSubmitting(true)
    setStatus(null)

    const result = await submitHubCapture({
      eventType,
      sourceType: 'manual',
      sourceApp: 'dashboard',
      title: title.trim(),
      content: content.trim(),
      actor: actorName.trim()
        ? {
            name: actorName.trim(),
            handle: actorName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
          }
        : null,
      channel: channelName.trim()
        ? {
            name: channelName.trim(),
            type: 'team'
          }
        : null,
      tags: tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
      importance: eventType === 'task' ? 3 : 1
    })

    setSubmitting(false)
    setTitle('')
    setContent('')
    setTags('')
    setStatus({
      tone: result.mode === 'cloudflare' ? 'success' : 'warning',
      text:
        result.mode === 'cloudflare'
          ? 'Captured into the shared hub.'
          : 'Captured locally. Cloudflare bindings are not attached yet.'
    })

    onCaptured?.(result)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ahk-navy-600/60 to-ahk-navy-700/60 backdrop-blur-xl border border-ahk-gold-500/30 shadow-2xl p-6">
      <div className="absolute top-0 right-0 w-48 h-48 bg-ahk-gold-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-gradient-to-br from-ahk-gold-500/70 to-ahk-gold-400/70 rounded-xl p-3 border border-ahk-gold-500/50 shadow-gold-md">
            <Inbox className="w-5 h-5 text-ahk-navy-900" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-black text-gradient-gold">
              Hub Intake
            </h3>
            <p className="text-sm text-ahk-slate-300">
              Capture what happened so the system can remember it for everyone.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEventType(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-display font-bold transition-all ${
                  eventType === option.value
                    ? 'bg-ahk-gold-500 text-ahk-navy-900 shadow-gold-md'
                    : 'bg-ahk-navy-500/50 text-ahk-slate-200 border border-ahk-gold-500/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={actorName}
              onChange={event => setActorName(event.target.value)}
              placeholder="Who did this?"
              className="bg-ahk-navy-700/60 text-white rounded-xl px-4 py-3 border border-ahk-gold-500/20 focus:outline-none focus:ring-2 focus:ring-ahk-gold-500"
            />
            <input
              value={channelName}
              onChange={event => setChannelName(event.target.value)}
              placeholder="Channel or team"
              className="bg-ahk-navy-700/60 text-white rounded-xl px-4 py-3 border border-ahk-gold-500/20 focus:outline-none focus:ring-2 focus:ring-ahk-gold-500"
            />
          </div>

          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full bg-ahk-navy-700/60 text-white rounded-xl px-4 py-3 border border-ahk-gold-500/20 focus:outline-none focus:ring-2 focus:ring-ahk-gold-500"
          />

          <textarea
            value={content}
            onChange={event => setContent(event.target.value)}
            placeholder="Paste the update, link, note, copied text, or quick context."
            rows={5}
            className="w-full bg-ahk-navy-700/60 text-white rounded-xl px-4 py-3 border border-ahk-gold-500/20 focus:outline-none focus:ring-2 focus:ring-ahk-gold-500 resize-none"
          />

          <input
            value={tags}
            onChange={event => setTags(event.target.value)}
            placeholder="Tags, comma-separated"
            className="w-full bg-ahk-navy-700/60 text-white rounded-xl px-4 py-3 border border-ahk-gold-500/20 focus:outline-none focus:ring-2 focus:ring-ahk-gold-500"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-ahk-slate-300">
              <Sparkles className="w-4 h-4 text-ahk-gold-400" />
              Shared memory starts with consistent captures.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Capturing...' : 'Capture to Hub'}</span>
            </button>
          </div>

          {status && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                status.tone === 'success'
                  ? 'bg-ahk-green-500/15 text-ahk-green-300 border border-ahk-green-500/30'
                  : status.tone === 'warning'
                  ? 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/30'
                  : 'bg-red-500/15 text-red-200 border border-red-500/30'
              }`}
            >
              {status.text}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
