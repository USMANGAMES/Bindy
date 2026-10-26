/**
 * Dev: Vite proxy → /api
 * Prod: Same-origin relative path /api (if VITE_API_URL empty) or custom URL
 */
const raw = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export const API_URL = raw
export const API_ENABLED = true
