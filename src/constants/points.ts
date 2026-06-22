export type BinSizeClass = 'street' | 'wheel' | 'large'

/** Ball diapazonlari — nadirlik bo‘yicha */
export const POINTS_RANGE = {
  street: [3, 4] as const,
  wheel: [4, 5] as const,
  large: [5, 6] as const,
  trash: 8,
} as const

export const BIN_SIZE_LABELS: Record<BinSizeClass, string> = {
  street: 'Ko‘cha qutisi',
  wheel: 'G‘ildirakli konteyner',
  large: 'Katta konteyner',
}

export function calcBinPoints(binSize: BinSizeClass, confidence: number): number {
  const [lo, hi] = POINTS_RANGE[binSize]
  if (confidence >= 92) return hi
  if (confidence >= 85) return hi
  if (confidence >= 78) return lo + 1 <= hi ? lo + 1 : lo
  return lo
}

export function calcTrashPoints(): number {
  return POINTS_RANGE.trash
}

/** @deprecated — server points qaytaradi */
export function pointsForCategory(category: 'bin' | 'trash'): number {
  return category === 'bin' ? 3 : 8
}
