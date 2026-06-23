import type { BinAnalysis, ReportCategory, BinSizeClass } from '../types'
import { BIN_TYPE_LABELS } from '../data/bins'
import { calcBinPoints, calcTrashPoints } from '../constants/points'
import { API_ENABLED, API_URL } from '../config/env'
import { isServerOnline, pingServer } from './serverHealth'

const TYPES = ['plastic', 'glass', 'paper', 'mixed', 'organic'] as const
const BIN_SIZES = ['street', 'wheel', 'large'] as const
const LOG = '[bindy AI]'

export type AiStatus = {
  configured: boolean
  provider: string
  model: string
  endpoint: string
}

export async function fetchAiStatus(): Promise<AiStatus | null> {
  if (!API_ENABLED) {
    console.warn(`${LOG} Server ulanmagan — mock rejim`)
    return null
  }
  if (!isServerOnline() && !(await pingServer())) {
    console.warn(`${LOG} Server ishlamayapti — mock rejim`)
    return null
  }
  try {
    const res = await fetch(`${API_URL}/api/v1/ai/status`)
    if (!res.ok) return null
    const status = (await res.json()) as AiStatus
    if (status.configured) {
      console.info(`${LOG} Gemma4 yoqilgan — ${status.model} (${status.provider})`)
    } else {
      console.warn(`${LOG} Gemma4 o'chiq — server/.env da GEMMA_API_KEY yo'q`)
    }
    return status
  } catch {
    console.error(`${LOG} Serverga ulanib bo'lmadi — ${API_URL}`)
    return null
  }
}

export async function analyzeBinPhoto(
  file: File,
): Promise<{ ok: true; data: BinAnalysis } | { ok: false; error?: string }> {
  if (API_ENABLED && isServerOnline()) {
    console.info(`${LOG} Serverga yuborilmoqda (${(file.size / 1024).toFixed(1)} KB)...`)
    return analyzeViaBackend(file)
  }
  console.warn(`${LOG} Mock rejim — VITE_API_URL yo'q`)
  return analyzeMock(file)
}

async function analyzeViaBackend(
  file: File,
): Promise<{ ok: true; data: BinAnalysis } | { ok: false; error?: string }> {
  const started = performance.now()
  try {
    const form = new FormData()
    form.append('image', file)

    const res = await fetch(`${API_URL}/api/v1/analyze`, {
      method: 'POST',
      body: form,
    })

    const elapsed = ((performance.now() - started) / 1000).toFixed(1)
    const body = (await res.json()) as {
      ok: boolean
      category?: ReportCategory
      type?: string
      binSize?: BinSizeClass
      confidence?: number
      label?: string
      points?: number
      error?: string
    }

    console.info(`${LOG} Server javob (${elapsed}s, HTTP ${res.status}):`, body)

    if (!res.ok || !body.ok || !body.category) {
      const err = body.error ?? 'Bin yoki musor topilmadi'
      console.error(`${LOG} Rad etildi:`, err)
      return { ok: false, error: err }
    }

    const category = body.category
    const type = (TYPES.includes(body.type as (typeof TYPES)[number])
      ? body.type
      : 'mixed') as BinAnalysis['type']

    const binSize =
      body.binSize && BIN_SIZES.includes(body.binSize) ? body.binSize : undefined

    const points =
      body.points ??
      (category === 'trash'
        ? calcTrashPoints()
        : calcBinPoints(binSize ?? 'street', body.confidence ?? 78))

    const data: BinAnalysis = {
      type,
      confidence: body.confidence ?? 90,
      points,
      label:
        body.label ??
        (category === 'trash' ? 'Noqonuniy musor to‘plami' : BIN_TYPE_LABELS[type]),
      category,
      ...(binSize ? { binSize } : {}),
    }

    console.info(
      `${LOG} MUVAFFAQIYAT — ${category}, +${data.points} ball${binSize ? ` (${binSize})` : ''}`,
    )
    return { ok: true, data }
  } catch (e) {
    const elapsed = ((performance.now() - started) / 1000).toFixed(1)
    console.error(`${LOG} Ulanish xato (${elapsed}s):`, e)
    return { ok: false, error: 'Serverga ulanib bo\'lmadi' }
  }
}

function hashFile(file: File): number {
  return file.size + file.lastModified + file.name.length
}

async function analyzeMock(
  file: File,
): Promise<{ ok: true; data: BinAnalysis } | { ok: false; error?: string }> {
  console.info(`${LOG} Mock tahlil boshlandi...`)
  await delay(2400 + Math.random() * 800)

  const hash = hashFile(file)
  const roll = hash % 10

  if (file.size < 8_000 && Math.random() > 0.15) {
    return fail()
  }
  if (Math.random() > 0.15) {
    if (roll === 0) return buildTrashResult(hash)
    return buildBinResult(hash, roll)
  }
  return fail()
}

function buildTrashResult(seed: number): { ok: true; data: BinAnalysis } {
  return {
    ok: true,
    data: {
      type: 'mixed',
      confidence: 82 + (seed % 14),
      points: calcTrashPoints(),
      label: 'Noqonuniy musor to‘plami',
      category: 'trash',
    },
  }
}

function buildBinResult(
  seed: number,
  roll: number,
): { ok: true; data: BinAnalysis } {
  const binSize: BinSizeClass = roll <= 5 ? 'street' : roll <= 8 ? 'wheel' : 'large'
  const type = TYPES[seed % TYPES.length]
  const confidence = 78 + (seed % 18)
  return {
    ok: true,
    data: {
      type,
      binSize,
      confidence,
      points: calcBinPoints(binSize, confidence),
      label: BIN_TYPE_LABELS[type],
      category: 'bin',
    },
  }
}

function fail(msg?: string): { ok: false; error?: string } {
  console.warn(`${LOG} Mock: tahlil muvaffaqiyatsiz`)
  return { ok: false, error: msg }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
