import type { BinType, ReportCategory, SharedReport } from '../types'
import { API_ENABLED } from '../config/env'
import { isServerOnline } from './serverHealth'
import { apiFetch } from './apiClient'

/** GET /api/v1/reports — barcha foydalanuvchilar reportlari */
export async function fetchSharedReports(): Promise<SharedReport[]> {
  if (!API_ENABLED || !isServerOnline()) return []
  try {
    const data = await apiFetch<{ reports: SharedReport[] }>('/api/v1/reports')
    return data.reports ?? []
  } catch (e) {
    console.warn('[bindy] shared reports fetch failed', e)
    return []
  }
}

export type CreateReportPayload = {
  lat: number
  lng: number
  category: ReportCategory
  type: BinType
  label: string
  photoUrl?: string
  userName: string
  points: number
}

/** POST /api/v1/reports — boshqalarga ko‘rinsin */
export async function publishReport(payload: CreateReportPayload): Promise<SharedReport | null> {
  if (!API_ENABLED || !isServerOnline()) return null
  try {
    const data = await apiFetch<{ report: SharedReport }>('/api/v1/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return data.report ?? null
  } catch (e) {
    console.warn('[bindy] publish report failed', e)
    return null
  }
}
