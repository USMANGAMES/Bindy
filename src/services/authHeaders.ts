import { getStoredToken } from './authService'

export function authHeaders(): HeadersInit {
  const token = getStoredToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}
