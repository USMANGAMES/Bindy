import type { AppState } from '../types'

const STORAGE_KEY = 'bindy-app-state'
const VERSION_KEY = 'bindy-storage-version'
const CURRENT_VERSION = '2.0.0-prod'

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
    const version = localStorage.getItem(VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      // Clean slate migration: clear stale mock points and users
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('bindy-users')
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
      return { ...DEFAULT_STATE }
    }

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
