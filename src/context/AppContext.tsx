import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppState,
  BinAnalysis,
  BindyNotification,
  LeaderboardUser,
  LiveSnapshot,
  MapStats,
  SharedReport,
  Submission,
} from '../types'
import { loadState, markSplashSeen, saveState } from '../services/storage'
import { fetchSharedReports, publishReport } from '../services/reportsService'
import { fetchNotifications } from '../services/notificationsService'
import { pingServer, setServerOnline } from '../services/serverHealth'
import { fetchHiddenIds, hideMapItemLocal, loadLocalHiddenIds, setLocalHiddenIds } from '../services/hiddenItemsService'
import { subscribeRealtime } from '../services/realtimeService'
import {
  mergeUserProfile,
  syncProfileToServer,
} from '../services/profileSyncService'
import { SHOP_PRODUCTS } from '../data/shop'

type AppContextValue = {
  state: AppState
  sharedReports: SharedReport[]
  notifications: BindyNotification[]
  unreadCount: number
  hiddenItemIds: Set<string>
  mapStats: MapStats | null
  leaderboard: { totalUsers: number; top: LeaderboardUser[] } | null
  realtimeConnected: boolean
  refreshSharedReports: () => Promise<void>
  refreshNotifications: () => Promise<void>
  refreshHiddenItems: () => Promise<void>
  applyHiddenItem: (id: string) => void
  completeSplash: () => void
  recordSubmission: (
    analysis: BinAnalysis,
    options?: { photoUrl?: string; position?: [number, number] },
  ) => Promise<void>
  updateName: (name: string) => void
  syncPointsFromServer: () => Promise<void>
  redeemProduct: (productId: string) => { ok: true; code: string } | { ok: false; reason: string }
}

const AppContext = createContext<AppContextValue | null>(null)

function makeCouponCode(productId: string): string {
  const part = productId.split('-')[0].toUpperCase().slice(0, 4)
  const num = Math.floor(1000 + Math.random() * 9000)
  return `BINDY-${part}-${num}`
}

export function AppProvider({
  children,
  username,
}: {
  children: ReactNode
  username: string
}) {
  const [state, setState] = useState<AppState>(() => loadState(username))
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([])
  const [notifications, setNotifications] = useState<BindyNotification[]>([])
  const [hiddenItemIds, setHiddenItemIds] = useState<Set<string>>(
    () => new Set(loadLocalHiddenIds()),
  )
  const [mapStats, setMapStats] = useState<MapStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<{
    totalUsers: number
    top: LeaderboardUser[]
  } | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  const refreshHiddenItems = useCallback(async () => {
    const ids = await fetchHiddenIds()
    setHiddenItemIds(new Set(ids))
  }, [])

  const applyHiddenItem = useCallback((id: string) => {
    hideMapItemLocal(id)
    setHiddenItemIds((prev) => new Set([...prev, id]))
    setSharedReports((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const persistProfile = useCallback(
    async (profile = loadState(username).profile) => {
      await syncProfileToServer(username, profile)
    },
    [username],
  )

  const handleServerSnapshot = useCallback(
    async (snapshot: LiveSnapshot) => {
      setLocalHiddenIds(snapshot.hiddenIds)
      setHiddenItemIds(new Set(snapshot.hiddenIds))
      setMapStats(snapshot.stats)
      setNotifications(snapshot.notifications)
      setLeaderboard(snapshot.leaderboard)

      // Adopt userProfile from server as single source of truth
      const current = loadState(username)
      const mergedProfile = mergeUserProfile(current.profile, snapshot.userProfile)

      const nextState: AppState = { ...current, profile: mergedProfile }
      saveState(nextState, username)
      setState(nextState)
      setSharedReports(snapshot.reports)
    },
    [username],
  )

  useEffect(() => {
    setState(loadState(username))
  }, [username])

  const refreshSharedReports = useCallback(async () => {
    const reports = await fetchSharedReports()
    setSharedReports(reports)
  }, [])

  const syncPointsFromServer = useCallback(async () => {
    /* points sync via realtime user.stats_updated */
  }, [])

  const refreshNotifications = useCallback(async () => {
    const list = await fetchNotifications(username)
    setNotifications(list)
  }, [username])

  const applySnapshotToState = useCallback(
    (snapshot: LiveSnapshot) => {
      void handleServerSnapshot(snapshot)
    },
    [handleServerSnapshot],
  )

  useEffect(() => {
    let cancelled = false

    async function bootOffline() {
      await pingServer()
      if (cancelled) return
      refreshSharedReports()
      refreshNotifications()
      refreshHiddenItems()
    }

    bootOffline()

    const unsub = subscribeRealtime(username, {
      onConnected: () => {
        setServerOnline(true)
        setRealtimeConnected(true)
      },
      onDisconnected: () => {
        setRealtimeConnected(false)
        pingServer()
      },
      onSnapshot: applySnapshotToState,
      onStatsUpdated: setMapStats,
      onReportCreated: (report) => {
        setSharedReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)])
      },
      onReportDeleted: (id) => {
        applyHiddenItem(id)
      },
      onHiddenItemAdded: (itemId) => {
        applyHiddenItem(itemId)
      },
      onNotificationCreated: (note) => {
        setNotifications((prev) => [note, ...prev.filter((n) => n.id !== note.id)])
      },
      onNotificationsRead: () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      },
      onUserStatsUpdated: (stats) => {
        setState((prev) => {
          const points = Math.max(prev.profile.points, stats.points)
          if (prev.profile.points === points) return prev
          const next = { ...prev, profile: { ...prev.profile, points } }
          saveState(next, username)
          return next
        })
      },
      onUserProfileUpdated: (profile) => {
        setState((prev) => {
          const merged = mergeUserProfile(prev.profile, profile)
          const next = { ...prev, profile: merged }
          saveState(next, username)
          return next
        })
      },
      onLeaderboardUpdated: setLeaderboard,
    })

    return () => {
      cancelled = true
      unsub()
      setRealtimeConnected(false)
    }
  }, [
    username,
    applySnapshotToState,
    applyHiddenItem,
    refreshSharedReports,
    refreshNotifications,
    refreshHiddenItems,
  ])

  const completeSplash = useCallback(() => {
    setState((s) => markSplashSeen(s, username))
  }, [username])

  const recordSubmission = useCallback(
    async (
      analysis: BinAnalysis,
      options?: { photoUrl?: string; position?: [number, number] },
    ) => {
      const [lat, lng] = options?.position ?? []
      const submissionId = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      let published: SharedReport | null = null

      if (lat != null && lng != null) {
        published = await publishReport({
          id: submissionId,
          lat,
          lng,
          category: analysis.category,
          type: analysis.type,
          label: analysis.label,
          photoUrl: options?.photoUrl,
          userName: username,
          points: analysis.points,
        })
      }

      const pointsAwarded = published?.points ?? analysis.points
      const finalId = published?.id ?? submissionId

      const submission: Submission = {
        id: finalId,
        type: analysis.type,
        category: analysis.category,
        points: pointsAwarded,
        createdAt,
        photoUrl: options?.photoUrl,
        label: analysis.label,
        ...(lat != null && lng != null ? { lat, lng } : {}),
      }

      setState((prev) => {
        const next: AppState = {
          ...prev,
          globalBinCount: prev.globalBinCount + (analysis.category === 'bin' ? 1 : 0),
          profile: {
            ...prev.profile,
            points: prev.profile.points + pointsAwarded,
            binsReported: prev.profile.binsReported + 1,
            streak: prev.profile.streak + 1,
            submissions: [submission, ...prev.profile.submissions].slice(0, 50),
          },
        }
        saveState(next, username)
        void syncProfileToServer(username, next.profile)
        return next
      })

      if (published && !realtimeConnected) {
        setSharedReports((prev) => [published!, ...prev.filter((r) => r.id !== published!.id)])
      }
    },
    [realtimeConnected, username],
  )

  useEffect(() => {
    void persistProfile()
  }, [username, persistProfile])

  const updateName = useCallback((name: string) => {
    setState((prev) => {
      const next = { ...prev, profile: { ...prev.profile, name } }
      saveState(next, username)
      return next
    })
  }, [username])

  const redeemProduct = useCallback(
    (productId: string): { ok: true; code: string } | { ok: false; reason: string } => {
      const product = SHOP_PRODUCTS.find((p) => p.id === productId)
      if (!product) return { ok: false, reason: 'Mahsulot topilmadi' }

      let result: { ok: true; code: string } | { ok: false; reason: string } = {
        ok: false,
        reason: 'Ball yetarli emas',
      }

      setState((prev) => {
        if (prev.profile.points < product.pointsCost) {
          result = { ok: false, reason: 'Ball yetarli emas' }
          return prev
        }
        const already = prev.profile.redeemedCoupons.some((c) => c.productId === productId)
        if (already) {
          result = { ok: false, reason: 'Bu kupon allaqachon olingan' }
          return prev
        }

        const code = makeCouponCode(productId)
        const next: AppState = {
          ...prev,
          profile: {
            ...prev.profile,
            points: prev.profile.points - product.pointsCost,
            redeemedCoupons: [
              { productId, code, redeemedAt: new Date().toISOString() },
              ...prev.profile.redeemedCoupons,
            ],
          },
        }
        saveState(next, username)
        result = { ok: true, code }
        void syncProfileToServer(username, next.profile)
        return next
      })

      return result
    },
    [username],
  )

  const value = useMemo(
    () => ({
      state,
      sharedReports,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      hiddenItemIds,
      mapStats,
      leaderboard,
      realtimeConnected,
      refreshSharedReports,
      refreshNotifications,
      refreshHiddenItems,
      applyHiddenItem,
      completeSplash,
      recordSubmission,
      updateName,
      syncPointsFromServer,
      redeemProduct,
    }),
    [
      state,
      sharedReports,
      notifications,
      hiddenItemIds,
      mapStats,
      leaderboard,
      realtimeConnected,
      refreshSharedReports,
      refreshNotifications,
      refreshHiddenItems,
      applyHiddenItem,
      completeSplash,
      recordSubmission,
      updateName,
      syncPointsFromServer,
      redeemProduct,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
