/**
 * Frontend env — `.env` faylida sozlang (qarang `.env.example`)
 */
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
export const API_ENABLED = Boolean(API_URL)
