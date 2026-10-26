import type { AppState } from '../types'

const STORAGE_KEY = 'bindy-app-state'

const DEFAULT_STATE: AppState = {
  globalBinCount: 0,
  hasSeenSplash: false,
  profile: {
    name: 'Eco Hero',
    points: 0,
    binsReported: 0,
    streak: 0,
    submissions: [],
    redeemedCoupons: [],
  },
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw) as AppState
    return {
      ...DEFAULT_STATE,
      ...parsed,
      profile: {
        ...DEFAULT_STATE.profile,
        ...parsed.profile,
        submissions: (parsed.profile?.submissions ?? []).map((s) => ({
          ...s,
          category: s.category ?? 'bin',
        })),
        redeemedCoupons: parsed.profile?.redeemedCoupons ?? [],
      },
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function markSplashSeen(state: AppState): AppState {
  const next = { ...state, hasSeenSplash: true }
  saveState(next)
  return next
}
