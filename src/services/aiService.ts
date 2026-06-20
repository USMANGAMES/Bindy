import type { BinAnalysis, BinType } from '../types'
import { BIN_TYPE_LABELS } from '../data/bins'

const TYPES: BinType[] = ['plastic', 'glass', 'paper', 'mixed', 'organic']

function hashFile(file: File): number {
  return file.size + file.lastModified + file.name.length
}

export async function analyzeBinPhoto(file: File): Promise<{ ok: true; data: BinAnalysis } | { ok: false }> {
  await delay(2400 + Math.random() * 800)

  const hash = hashFile(file)

  // Small or corrupt images fail more often
  if (file.size < 8_000) {
    return Math.random() > 0.15 ? fail() : succeed(hash)
  }

  return Math.random() > 0.18 ? succeed(hash) : fail()
}

function succeed(seed: number): { ok: true; data: BinAnalysis } {
  const type = TYPES[seed % TYPES.length]
  const confidence = 88 + (seed % 11)
  const points = 8 + (seed % 7)

  return {
    ok: true,
    data: {
      type,
      confidence,
      points,
      label: BIN_TYPE_LABELS[type],
    },
  }
}

function fail(): { ok: false } {
  return { ok: false }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
