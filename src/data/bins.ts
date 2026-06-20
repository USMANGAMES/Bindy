import type { RecyclingBin } from '../types'

/** Seed bins around central Tashkent — demo data for the map */
export const SEED_BINS: RecyclingBin[] = [
  { id: 'b1', lat: 41.3111, lng: 69.2797, name: 'Amir Timur Square', type: 'mixed', fillLevel: 42, verified: true },
  { id: 'b2', lat: 41.2985, lng: 69.2541, name: 'Chorsu Bazaar', type: 'plastic', fillLevel: 67, verified: true },
  { id: 'b3', lat: 41.3058, lng: 69.2689, name: 'Navoi Park', type: 'glass', fillLevel: 23, verified: true },
  { id: 'b4', lat: 41.2923, lng: 69.2432, name: 'Tashkent City Mall', type: 'mixed', fillLevel: 55, verified: true },
  { id: 'b5', lat: 41.3187, lng: 69.2512, name: 'Minor Mosque', type: 'paper', fillLevel: 18, verified: false },
  { id: 'b6', lat: 41.2864, lng: 69.2718, name: 'Magic City', type: 'plastic', fillLevel: 78, verified: true },
  { id: 'b7', lat: 41.3142, lng: 69.2356, name: 'Yunusabad Park', type: 'organic', fillLevel: 31, verified: true },
  { id: 'b8', lat: 41.3012, lng: 69.2891, name: 'Broadway Alley', type: 'glass', fillLevel: 44, verified: true },
  { id: 'b9', lat: 41.2956, lng: 69.2623, name: 'Independence Square', type: 'mixed', fillLevel: 52, verified: true },
  { id: 'b10', lat: 41.3089, lng: 69.2487, name: 'Alisher Navoi Theatre', type: 'paper', fillLevel: 12, verified: true },
]

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
