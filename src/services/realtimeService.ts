import type {
  BindyNotification,
  LeaderboardUser,
  LiveSnapshot,
  MapStats,
  SharedReport,
  ServerUserProfile,
} from '../types'
import { API_ENABLED, API_URL } from '../config/env'
import { isServerOnline } from './serverHealth'

export async function fetchGlobalStats(): Promise<MapStats | null> {
  if (!API_ENABLED || !isServerOnline()) return null
  try {
    const res = await fetch(`${API_URL || ''}/api/v1/stats/global`)
    if (!res.ok) return null
    return (await res.json()) as MapStats
  } catch {
    return null
  }
}

export type RealtimeHandlers = {
  onConnected?: () => void
  onDisconnected?: () => void
  onSnapshot?: (snapshot: LiveSnapshot) => void
  onStatsUpdated?: (stats: MapStats) => void
  onReportCreated?: (report: SharedReport) => void
  onReportDeleted?: (id: string) => void
  onHiddenItemAdded?: (itemId: string) => void
  onNotificationCreated?: (notification: BindyNotification) => void
  onNotificationsRead?: () => void
  onUserStatsUpdated?: (stats: { username: string; points: number; reports: number }) => void
  onUserProfileUpdated?: (profile: ServerUserProfile) => void
  onLeaderboardUpdated?: (data: { totalUsers: number; top: LeaderboardUser[] }) => void
}

export function subscribeRealtime(username: string, handlers: RealtimeHandlers): () => void {
  if (!API_ENABLED) return () => {}

  let es: EventSource | null = null
  let closed = false
  let retryMs = 2000

  const connect = () => {
    if (closed) return
    const url = `${API_URL || ''}/api/v1/events/stream?username=${encodeURIComponent(username)}`
    es = new EventSource(url)

    es.onopen = () => {
      retryMs = 2000
      handlers.onConnected?.()
    }

    es.addEventListener('snapshot', (e) => {
      try {
        handlers.onSnapshot?.(JSON.parse(e.data) as LiveSnapshot)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('stats.updated', (e) => {
      try {
        handlers.onStatsUpdated?.(JSON.parse(e.data) as MapStats)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('report.created', (e) => {
      try {
        const data = JSON.parse(e.data) as { report: SharedReport }
        if (data.report) handlers.onReportCreated?.(data.report)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('report.deleted', (e) => {
      try {
        const data = JSON.parse(e.data) as { id: string }
        if (data.id) handlers.onReportDeleted?.(data.id)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('hidden_item.added', (e) => {
      try {
        const data = JSON.parse(e.data) as { itemId: string }
        if (data.itemId) handlers.onHiddenItemAdded?.(data.itemId)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('notification.created', (e) => {
      try {
        const data = JSON.parse(e.data) as { notification: BindyNotification }
        if (data.notification) handlers.onNotificationCreated?.(data.notification)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('notifications.read', () => {
      handlers.onNotificationsRead?.()
    })

    es.addEventListener('user.stats_updated', (e) => {
      try {
        const data = JSON.parse(e.data) as {
          username: string
          stats: { username: string; points: number; reports: number }
        }
        if (data.stats) handlers.onUserStatsUpdated?.(data.stats)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('user.profile_updated', (e) => {
      try {
        const data = JSON.parse(e.data) as { profile: ServerUserProfile }
        if (data.profile) handlers.onUserProfileUpdated?.(data.profile)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('leaderboard.updated', (e) => {
      try {
        handlers.onLeaderboardUpdated?.(JSON.parse(e.data) as {
          totalUsers: number
          top: LeaderboardUser[]
        })
      } catch {
        /* ignore */
      }
    })

    es.onerror = () => {
      handlers.onDisconnected?.()
      es?.close()
      es = null
      if (!closed) {
        setTimeout(connect, retryMs)
        retryMs = Math.min(retryMs * 1.5, 30_000)
      }
    }
  }

  connect()

  return () => {
    closed = true
    es?.close()
  }
}
