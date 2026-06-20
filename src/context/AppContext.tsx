import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, BinAnalysis, Submission } from '../types'
import { loadState, markSplashSeen, saveState } from '../services/storage'

type AppContextValue = {
  state: AppState
  completeSplash: () => void
  recordSubmission: (analysis: BinAnalysis, photoUrl?: string) => void
  updateName: (name: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)

  const completeSplash = useCallback(() => {
    setState((s) => markSplashSeen(s))
  }, [])

  const recordSubmission = useCallback((analysis: BinAnalysis, photoUrl?: string) => {
    setState((prev) => {
      const submission: Submission = {
        id: crypto.randomUUID(),
        type: analysis.type,
        points: analysis.points,
        createdAt: new Date().toISOString(),
        photoUrl,
      }

      const next: AppState = {
        ...prev,
        globalBinCount: prev.globalBinCount + 1,
        profile: {
          ...prev.profile,
          points: prev.profile.points + analysis.points,
          binsReported: prev.profile.binsReported + 1,
          streak: prev.profile.streak + 1,
          submissions: [submission, ...prev.profile.submissions].slice(0, 20),
        },
      }
      saveState(next)
      return next
    })
  }, [])

  const updateName = useCallback((name: string) => {
    setState((prev) => {
      const next = { ...prev, profile: { ...prev.profile, name } }
      saveState(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ state, completeSplash, recordSubmission, updateName }),
    [state, completeSplash, recordSubmission, updateName],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
