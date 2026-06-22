/**
 * Dev: Vite proxy → /api (CORS yo‘q)
 * Prod: .env da VITE_API_URL=http://your-server:8000
 */
const raw = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export const API_URL = import.meta.env.DEV ? '' : raw
export const API_ENABLED = import.meta.env.DEV || Boolean(raw)
