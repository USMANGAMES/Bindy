/** Bosh admin username ro‘yxati (asosiy tekshiruv server orqali user.isAdmin da bo'ladi) */
export const ADMIN_USERNAMES: readonly string[] = []

export function isAdminUsername(username: string): boolean {
  const q = username.trim().toLowerCase()
  return ADMIN_USERNAMES.some((a) => a.toLowerCase() === q)
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
