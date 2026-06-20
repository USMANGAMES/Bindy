export const POINTS_TRASH = 5
export const POINTS_BIN = 6

export function pointsForCategory(category: 'bin' | 'trash'): number {
  return category === 'bin' ? POINTS_BIN : POINTS_TRASH
}
