import { useEffect, useState } from 'react'
import { Activity, RefreshCw, Users, Radio } from 'lucide-react'
import { loadTodayHubActivity } from '../utils/hubCapture'

function formatWhen(value) {
  if (!value) {
    return 'Unknown time'
  }

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function HubActivityPanel({ refreshKey = 0 }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const result = await loadTodayHubActivity()
    setData(result.today)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [refreshKey])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ahk-navy-600/60 to-ahk-navy-700/60 backdrop-blur-xl border border-ahk-blue-500/30 shadow-2xl p-6">
      <div className="absolute top-0 right-0 w-48 h-48 bg-ahk-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-ahk-blue-500/70 to-ahk-blue-400/70 rounded-xl p-3 border border-ahk-blue-500/50">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-black text-gradient-electric">
                Today in the Hub
              </h3>
              <p className="text-sm text-ahk-slate-300">
                A quick answer to what everyone has been doing today.
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            className="p-3 rounded-xl bg-ahk-navy-500/60 border border-ahk-gold-500/20 text-ahk-slate-200 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && !data ? (
          <div className="text-ahk-slate-300 text-sm">Loading activity…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl bg-ahk-navy-700/60 border border-ahk-gold-500/20 p-4">
                <div className="text-3xl font-display font-black text-ahk-gold-300">
                  {data?.totals?.totalEvents || 0}
                </div>
                <div className="text-xs uppercase tracking-wider text-ahk-slate-300">
                  Events Today
                </div>
              </div>
              <div className="rounded-xl bg-ahk-navy-700/60 border border-ahk-blue-500/20 p-4">
                <div className="text-3xl font-display font-black text-ahk-blue-300">
                  {data?.totals?.activePeople || 0}
                </div>
                <div className="text-xs uppercase tracking-wider text-ahk-slate-300">
                  Active People
                </div>
              </div>
              <div className="rounded-xl bg-ahk-navy-700/60 border border-ahk-green-500/20 p-4">
                <div className="text-3xl font-display font-black text-ahk-green-300">
                  {data?.totals?.activeChannels || 0}
                </div>
                <div className="text-xs uppercase tracking-wider text-ahk-slate-300">
                  Active Channels
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-xl bg-ahk-navy-700/50 border border-ahk-gold-500/20 p-4">
                <div className="flex items-center gap-2 mb-3 text-ahk-gold-300 font-display font-bold">
                  <Users className="w-4 h-4" />
                  <span>Most Active People</span>
                </div>
                <div className="space-y-3">
                  {(data?.byActor || []).slice(0, 5).map(actor => (
                    <div
                      key={actor.actor_handle}
                      className="flex items-center justify-between rounded-lg bg-ahk-navy-600/50 px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {actor.actor_name}
                        </div>
                        <div className="text-xs text-ahk-slate-400">
                          Last activity {formatWhen(actor.latest_at)}
                        </div>
                      </div>
                      <div className="text-ahk-gold-300 font-display font-black">
                        {actor.event_count}
                      </div>
                    </div>
                  ))}
                  {(!data?.byActor || data.byActor.length === 0) && (
                    <div className="text-sm text-ahk-slate-400">
                      No captured activity yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-ahk-navy-700/50 border border-ahk-blue-500/20 p-4">
                <div className="flex items-center gap-2 mb-3 text-ahk-blue-300 font-display font-bold">
                  <Radio className="w-4 h-4" />
                  <span>Latest Activity</span>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(data?.events || []).slice(0, 8).map(event => (
                    <div
                      key={event.id}
                      className="rounded-lg bg-ahk-navy-600/50 px-3 py-3 border border-ahk-gold-500/10"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="text-sm font-semibold text-white">
                          {event.title || event.summary || event.eventType}
                        </div>
                        <div className="text-xs text-ahk-slate-400 whitespace-nowrap">
                          {formatWhen(event.occurredAt)}
                        </div>
                      </div>
                      <div className="text-xs text-ahk-slate-300 mb-2">
                        {(event.actor?.name || 'Unassigned')} in{' '}
                        {event.channel?.name || 'General'}
                      </div>
                      <div className="text-sm text-ahk-slate-200 line-clamp-3">
                        {event.content || event.summary}
                      </div>
                    </div>
                  ))}
                  {(!data?.events || data.events.length === 0) && (
                    <div className="text-sm text-ahk-slate-400">
                      Capture the first event and the hub will start building the day.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
