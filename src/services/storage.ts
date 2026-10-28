import type { AppState } from '../types'

const VERSION_KEY = 'bindy-storage-version'
const CURRENT_VERSION = '2.3.0-ssot'

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

export function getUserStorageKey(username?: string): string {
  const clean = username?.trim().toLowerCase()
  return clean ? `bindy-app-state-${clean}` : 'bindy-app-state'
}

export function loadState(username?: string): AppState {
  try {
    const version = localStorage.getItem(VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      // Clean slate migration: clear cached user states, notifications, and hidden items
      const preserveKeys = new Set([
        'bindy-auth-token',
        'bindy-auth-user',
        'bindy-user',
        'bindy-map-style',
        'bindy-install-dismissed',
      ])
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith('bindy-') && k !== VERSION_KEY && !preserveKeys.has(k)) {
          localStorage.removeItem(k)
        }
      }
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
    }

    const key = getUserStorageKey(username)
    const raw = localStorage.getItem(key)
    const fallbackName = username?.trim() || DEFAULT_STATE.profile.name

    if (!raw) {
      return {
        ...DEFAULT_STATE,
        profile: {
          ...DEFAULT_STATE.profile,
          name: fallbackName,
        },
      }
    }

    const parsed = JSON.parse(raw) as AppState
    return {
      ...DEFAULT_STATE,
      ...parsed,
      profile: {
        ...DEFAULT_STATE.profile,
        ...parsed.profile,
        name: fallbackName,
        submissions: (parsed.profile?.submissions ?? []).map((s) => ({
          ...s,
          category: s.category ?? 'bin',
        })),
        redeemedCoupons: parsed.profile?.redeemedCoupons ?? [],
      },
    }
  } catch {
    return {
      ...DEFAULT_STATE,
      profile: {
        ...DEFAULT_STATE.profile,
        name: username?.trim() || DEFAULT_STATE.profile.name,
      },
    }
  }
}

export function saveState(state: AppState, username?: string): void {
  const key = getUserStorageKey(username || state.profile.name)
  localStorage.setItem(key, JSON.stringify(state))
}

export function markSplashSeen(state: AppState, username?: string): AppState {
  const next = { ...state, hasSeenSplash: true }
  saveState(next, username)
  return next
}
