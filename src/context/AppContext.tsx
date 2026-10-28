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
import { redeemShopProduct } from '../services/shopService'
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
  redeemProduct: (productId: string) => Promise<{ ok: true; code: string } | { ok: false; reason: string }>
}

const AppContext = createContext<AppContextValue | null>(null)

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
          if (
            prev.profile.points === stats.points &&
            prev.profile.binsReported === stats.reports
          ) {
            return prev
          }
          const next = {
            ...prev,
            profile: {
              ...prev.profile,
              points: stats.points,
              binsReported: stats.reports,
              streak: typeof stats.streak === 'number' ? stats.streak : prev.profile.streak,
            },
          }
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

      const published =
        lat != null && lng != null
          ? await publishReport({
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
          : null

      const report = published?.report
      const userStats = published?.userStats
      const pointsAwarded = report?.points ?? analysis.points
      const finalId = report?.id ?? submissionId

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
        // Points: Server is Single Source of Truth.
        // If server returned userStats, take server's exact points; otherwise retain current state (updated via SSE).
        const nextPoints = userStats ? userStats.points : prev.profile.points
        const nextBins = userStats ? userStats.reports : prev.profile.binsReported + 1
        const nextStreak =
          userStats && typeof userStats.streak === 'number'
            ? userStats.streak
            : prev.profile.streak

        const next: AppState = {
          ...prev,
          globalBinCount: prev.globalBinCount + (analysis.category === 'bin' ? 1 : 0),
          profile: {
            ...prev.profile,
            points: nextPoints,
            binsReported: nextBins,
            streak: nextStreak,
            submissions: [
              submission,
              ...prev.profile.submissions.filter((s) => s.id !== finalId),
            ].slice(0, 50),
          },
        }
        saveState(next, username)
        void syncProfileToServer(username, next.profile)
        return next
      })

      if (report && !realtimeConnected) {
        setSharedReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)])
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
    async (
      productId: string,
    ): Promise<{ ok: true; code: string } | { ok: false; reason: string }> => {
      const product = SHOP_PRODUCTS.find((p) => p.id === productId)
      if (!product) return { ok: false, reason: 'Mahsulot topilmadi' }

      if (state.profile.points < product.pointsCost) {
        return { ok: false, reason: 'Ball yetarli emas' }
      }
      const already = state.profile.redeemedCoupons.some((c) => c.productId === productId)
      if (already) {
        return { ok: false, reason: 'Bu kupon allaqachon olingan' }
      }

      const res = await redeemShopProduct(username, productId, product.pointsCost)
      if (!res.ok || !res.code) {
        return { ok: false, reason: res.reason || 'Kuponni xarid qilib bo‘lmadi' }
      }

      if (res.profile) {
        setState((prev) => {
          const merged = mergeUserProfile(prev.profile, res.profile!)
          const next = { ...prev, profile: merged }
          saveState(next, username)
          return next
        })
      }

      return { ok: true, code: res.code }
    },
    [state.profile.points, state.profile.redeemedCoupons, username],
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
