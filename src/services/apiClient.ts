import { API_URL } from '../config/env'

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
  if (!API_URL) throw new ApiError('VITE_API_URL sozlanmagan', 0)

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(text || `HTTP ${res.status}`, res.status)
  }

  return res.json() as Promise<T>
}
