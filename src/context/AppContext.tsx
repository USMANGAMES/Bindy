import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, BinAnalysis, SharedReport, Submission } from '../types'
import { loadState, markSplashSeen, saveState } from '../services/storage'
import { fetchSharedReports, publishReport } from '../services/reportsService'
import { SHOP_PRODUCTS } from '../data/shop'

type AppContextValue = {
  state: AppState
  sharedReports: SharedReport[]
  refreshSharedReports: () => Promise<void>
  completeSplash: () => void
  recordSubmission: (
    analysis: BinAnalysis,
    options?: { photoUrl?: string; position?: [number, number] },
  ) => Promise<void>
  updateName: (name: string) => void
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
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState()
    if (loaded.profile.name !== username) {
      const next = { ...loaded, profile: { ...loaded.profile, name: username } }
      saveState(next)
      return next
    }
    return loaded
  })
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([])

  useEffect(() => {
    setState((prev) => {
      if (prev.profile.name === username) return prev
      const next = { ...prev, profile: { ...prev.profile, name: username } }
      saveState(next)
      return next
    })
  }, [username])

  const refreshSharedReports = useCallback(async () => {
    const reports = await fetchSharedReports()
    setSharedReports(reports)
  }, [])

  useEffect(() => {
    refreshSharedReports()
    const id = setInterval(refreshSharedReports, 30_000)
    return () => clearInterval(id)
  }, [refreshSharedReports])

  const completeSplash = useCallback(() => {
    setState((s) => markSplashSeen(s))
  }, [])

  const recordSubmission = useCallback(
    async (
      analysis: BinAnalysis,
      options?: { photoUrl?: string; position?: [number, number] },
    ) => {
      const [lat, lng] = options?.position ?? []
      const submissionId = crypto.randomUUID()
      let userName = 'Eco Hero'

      setState((prev) => {
        userName = prev.profile.name
        const submission: Submission = {
          id: submissionId,
          type: analysis.type,
          category: analysis.category,
          points: analysis.points,
          createdAt: new Date().toISOString(),
          photoUrl: options?.photoUrl,
          label: analysis.label,
          ...(lat != null && lng != null ? { lat, lng } : {}),
        }

        const next: AppState = {
          ...prev,
          globalBinCount: prev.globalBinCount + (analysis.category === 'bin' ? 1 : 0),
          profile: {
            ...prev.profile,
            points: prev.profile.points + analysis.points,
            binsReported: prev.profile.binsReported + 1,
            streak: prev.profile.streak + 1,
            submissions: [submission, ...prev.profile.submissions].slice(0, 50),
          },
        }
        saveState(next)
        return next
      })

      if (lat != null && lng != null) {
        const published = await publishReport({
          lat,
          lng,
          category: analysis.category,
          type: analysis.type,
          label: analysis.label,
          photoUrl: options?.photoUrl,
          userName,
          points: analysis.points,
        })
        if (published) {
          setSharedReports((prev) => [published, ...prev.filter((r) => r.id !== published.id)])
        }
        await refreshSharedReports()
      }
    },
    [refreshSharedReports],
  )

  const updateName = useCallback((name: string) => {
    setState((prev) => {
      const next = { ...prev, profile: { ...prev.profile, name } }
      saveState(next)
      return next
    })
  }, [])

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
        saveState(next)
        result = { ok: true, code }
        return next
      })

      return result
    },
    [],
  )

  const value = useMemo(
    () => ({
      state,
      sharedReports,
      refreshSharedReports,
      completeSplash,
      recordSubmission,
      updateName,
      redeemProduct,
    }),
    [
      state,
      sharedReports,
      refreshSharedReports,
      completeSplash,
      recordSubmission,
      updateName,
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
