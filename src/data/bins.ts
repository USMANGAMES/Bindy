import type { RecyclingBin } from '../types'

/** Seed bins — productionda 0 ta (xarita faqat real foydalanuvchilar reportlaridan iborat) */
export const SEED_BINS: RecyclingBin[] = []

export const DEFAULT_CENTER: [number, number] = [41.2995, 69.2401]

export const BIN_TYPE_LABELS: Record<string, string> = {
  plastic: 'Plastic & PET',
  glass: 'Glass',
  paper: 'Paper & Cardboard',
  mixed: 'Mixed Recycling',
  organic: 'Organic Waste',
}

export const BIN_TYPE_EMOJI: Record<string, string> = {
  plastic: '♻️',
  glass: '🫙',
  paper: '📄',
  mixed: '🗑️',
  organic: '🌿',
}
