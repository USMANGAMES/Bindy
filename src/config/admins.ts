/** Bosh admin username ro‘yxati — server/admin_config.py bilan bir xil */
export const ADMIN_USERNAMES = ['Khafizov', 'zxsad1212'] as const

export function isAdminUsername(username: string): boolean {
  const q = username.trim().toLowerCase()
  return ADMIN_USERNAMES.some((a) => a.toLowerCase() === q)
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
