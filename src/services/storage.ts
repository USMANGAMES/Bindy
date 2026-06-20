import type { AppState } from '../types'

const STORAGE_KEY = 'bindy-app-state'

const DEFAULT_STATE: AppState = {
  globalBinCount: 1245,
  hasSeenSplash: false,
  profile: {
    name: 'Eco Hero',
    points: 340,
    binsReported: 17,
    streak: 5,
    submissions: [],
  },
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
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
