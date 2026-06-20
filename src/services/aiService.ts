import type { BinAnalysis, ReportCategory } from '../types'
import { BIN_TYPE_LABELS } from '../data/bins'
import { pointsForCategory } from '../constants/points'
import { API_ENABLED } from '../config/env'
import { getStoredToken } from './authService'

const TYPES = ['plastic', 'glass', 'paper', 'mixed', 'organic'] as const

function hashFile(file: File): number {
  return file.size + file.lastModified + file.name.length
}

/** AI o‘zi bin yoki trash ekanini aniqlaydi */
export async function analyzeBinPhoto(
  file: File,
): Promise<{ ok: true; data: BinAnalysis } | { ok: false }> {
  if (API_ENABLED) {
    const remote = await analyzeViaBackend(file)
    if (remote) return remote
  }
  return analyzeMock(file)
}

/** POST /api/v1/analyze — Gemma category ni o‘zi qaytaradi */
async function analyzeViaBackend(
  file: File,
): Promise<{ ok: true; data: BinAnalysis } | { ok: false } | null> {
  try {
    const form = new FormData()
    form.append('image', file)

    const token = getStoredToken()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/analyze`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })

    if (!res.ok) return null

    const body = (await res.json()) as {
      ok: boolean
      category?: ReportCategory
      type?: string
      confidence?: number
      label?: string
    }

    if (!body.ok || !body.category) return { ok: false }

    const category = body.category
    const type = (TYPES.includes(body.type as (typeof TYPES)[number])
      ? body.type
      : 'mixed') as BinAnalysis['type']

    return {
      ok: true,
      data: {
        type,
        confidence: body.confidence ?? 90,
        points: pointsForCategory(category),
        label:
          body.label ??
          (category === 'trash' ? 'Noqonuniy musor joyi' : BIN_TYPE_LABELS[type]),
        category,
      },
    }
  } catch (e) {
    console.warn('[bindy] Gemma analyze failed, falling back to mock', e)
    return null
  }
}

async function analyzeMock(
  file: File,
): Promise<{ ok: true; data: BinAnalysis } | { ok: false }> {
  await delay(2400 + Math.random() * 800)

  const hash = hashFile(file)
  const category: ReportCategory = hash % 3 === 0 ? 'trash' : 'bin'
  const points = pointsForCategory(category)

  if (file.size < 8_000) {
    return Math.random() > 0.15 ? fail() : buildResult(hash, category, points)
  }

  return Math.random() > 0.15 ? buildResult(hash, category, points) : fail()
}

function buildResult(
  seed: number,
  category: ReportCategory,
  points: number,
): { ok: true; data: BinAnalysis } {
  if (category === 'trash') {
    return {
      ok: true,
      data: {
        type: 'mixed',
        confidence: 82 + (seed % 14),
        points,
        label: 'Noqonuniy musor joyi',
        category: 'trash',
      },
    }
  }

  const type = TYPES[seed % TYPES.length]
  return {
    ok: true,
    data: {
      type,
      confidence: 88 + (seed % 11),
      points,
      label: BIN_TYPE_LABELS[type],
      category: 'bin',
    },
  }
}

function fail(): { ok: false } {
  return { ok: false }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
