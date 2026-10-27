import { API_ENABLED, API_URL } from '../config/env'
import { isAdminUsername } from '../config/admins'
import { hideMapItemOnServer } from './hiddenItemsService'
import { isServerOnline } from './serverHealth'
import { authHeaders } from './authHeaders'

export async function adminDeleteReport(
  reportId: string,
  _adminUser: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!API_ENABLED || !isServerOnline()) {
    return { ok: false, error: 'Report topilmadi' }
  }
  try {
    const res = await fetch(`${API_URL}/api/v1/reports/${reportId}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: (data as { detail?: string }).detail ?? 'O‘chirib bo‘lmadi' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Serverga ulanib bo‘lmadi' }
  }
}

/** Server report yoki seed bin — admin istalgan xarita obyektini o‘chiradi */
export async function adminDeleteMapItem(
  itemId: string,
  adminUser: string,
  reason: string,
): Promise<{ ok: true; kind: 'report' | 'hidden' } | { ok: false; error: string }> {
  const reportResult = await adminDeleteReport(itemId, adminUser, reason)
  if (reportResult.ok) return { ok: true, kind: 'report' }

  const err = reportResult.error.toLowerCase()
  const notFound =
    err.includes('topilmadi') || err.includes('not found') || err.includes('ulanmagan')

  if (!notFound && API_ENABLED && isServerOnline()) {
    return { ok: false, error: reportResult.error }
  }

  const hideResult = await hideMapItemOnServer(itemId, adminUser, reason)
  if (!hideResult.ok) return hideResult
  return { ok: true, kind: 'hidden' }
}

export async function checkAdminRemote(username: string): Promise<boolean> {
  if (isAdminUsername(username)) return true
  if (!API_ENABLED || !isServerOnline()) return false
  try {
    const res = await fetch(
      `${API_URL}/api/v1/admin/check?user=${encodeURIComponent(username)}`,
    )
    if (!res.ok) return false
    const data = (await res.json()) as { isAdmin: boolean }
    return !!data.isAdmin
  } catch {
    return false
  }
}
