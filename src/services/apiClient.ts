import { API_URL } from '../config/env'
import { authHeaders } from './authHeaders'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const base = API_URL || ''
  const defaultHeaders = authHeaders() as Record<string, string>
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(text || `HTTP ${res.status}`, res.status)
  }

  return res.json() as Promise<T>
}
