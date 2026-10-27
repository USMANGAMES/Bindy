import { API_ENABLED, API_URL } from '../config/env'
import { isServerOnline } from './serverHealth'
import { authHeaders } from './authHeaders'

const LOCAL_KEY = 'bindy-hidden-items'

export function loadLocalHiddenIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function hideMapItemLocal(id: string) {
  const ids = new Set(loadLocalHiddenIds())
  ids.add(id)
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...ids]))
}

export function setLocalHiddenIds(ids: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids))
}

export async function fetchHiddenIds(): Promise<string[]> {
  const local = loadLocalHiddenIds()
  if (!API_ENABLED || !isServerOnline()) return local
  try {
    const res = await fetch(`${API_URL}/api/v1/hidden-items`)
    if (!res.ok) return local
    const data = (await res.json()) as { ids: string[] }
    return [...new Set([...(data.ids ?? []), ...local])]
  } catch {
    return local
  }
}

export async function hideMapItemOnServer(
  itemId: string,
  _adminUser: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!API_ENABLED || !isServerOnline()) {
    hideMapItemLocal(itemId)
    return { ok: true }
  }
  try {
    const res = await fetch(`${API_URL}/api/v1/hidden-items`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, reason }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: (data as { detail?: string }).detail ?? 'Yashirish muvaffaqiyatsiz' }
    }
    hideMapItemLocal(itemId)
    return { ok: true }
  } catch {
    hideMapItemLocal(itemId)
    return { ok: true }
  }
}
