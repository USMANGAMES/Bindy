import type { BindyNotification, LeaderboardUser } from '../types'
import { API_ENABLED, API_URL } from '../config/env'
import { isServerOnline } from './serverHealth'

export async function fetchNotifications(username: string): Promise<BindyNotification[]> {
  if (!isServerOnline()) return loadLocalNotifications(username)
  try {
    const res = await fetch(`${API_URL}/api/v1/notifications/${encodeURIComponent(username)}`)
    if (!res.ok) return loadLocalNotifications(username)
    const data = (await res.json()) as { notifications: BindyNotification[] }
    return data.notifications ?? []
  } catch {
    return loadLocalNotifications(username)
  }
}

export async function markNotificationsRead(username: string): Promise<void> {
  if (API_ENABLED && isServerOnline()) {
    try {
      await fetch(`${API_URL}/api/v1/notifications/${encodeURIComponent(username)}/read`, {
        method: 'POST',
      })
    } catch {
      /* ignore */
    }
  }
  markLocalRead(username)
}

export async function fetchLeaderboard(): Promise<{ totalUsers: number; top: LeaderboardUser[] }> {
  if (!API_ENABLED || !isServerOnline()) return { totalUsers: 0, top: [] }
  try {
    const res = await fetch(`${API_URL}/api/v1/leaderboard`)
    if (!res.ok) return { totalUsers: 0, top: [] }
    return (await res.json()) as { totalUsers: number; top: LeaderboardUser[] }
  } catch {
    return { totalUsers: 0, top: [] }
  }
}

export async function syncUserStats(username: string, points?: number): Promise<number | null> {
  if (!API_ENABLED || !isServerOnline()) return null
  try {
    const res = await fetch(`${API_URL}/api/v1/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, points }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { user: { points: number } }
    return data.user?.points ?? null
  } catch {
    return null
  }
}

export async function fetchUserStats(username: string): Promise<number | null> {
  if (!API_ENABLED || !isServerOnline()) return null
  try {
    const res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(username)}/stats`)
    if (!res.ok) return null
    const data = (await res.json()) as { points: number }
    return data.points ?? null
  } catch {
    return null
  }
}

const LOCAL_KEY = 'bindy-notifications'

function loadLocalNotifications(username: string): BindyNotification[] {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}') as Record<
      string,
      BindyNotification[]
    >
    return all[username] ?? []
  } catch {
    return []
  }
}

function markLocalRead(username: string) {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}') as Record<
      string,
      BindyNotification[]
    >
    if (!all[username]) return
    all[username] = all[username].map((n) => ({ ...n, read: true }))
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}

export function saveLocalNotification(username: string, note: BindyNotification) {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}') as Record<
      string,
      BindyNotification[]
    >
    all[username] = [note, ...(all[username] ?? [])]
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}
