import { API_URL } from '../config/env'

export type AuthUser = {
  id: number
  username: string
  isAdmin?: boolean
}

const TOKEN_KEY = 'bindy-auth-token'
const USER_KEY = 'bindy-auth-user'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function registerUser(
  username: string,
  password: string,
): Promise<{ ok: true; token: string; user: AuthUser } | { ok: false; error: string }> {
  const name = username.trim()
  if (name.length < 3) {
    return { ok: false, error: 'Username kamida 3 ta belgi bo‘lishi kerak' }
  }
  if (password.length < 4) {
    return { ok: false, error: 'Parol kamida 4 ta belgi bo‘lishi kerak' }
  }

  try {
    const base = API_URL || ''
    const res = await fetch(`${base}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username: name, password }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = data.detail || 'Ro‘yxatdan o‘tib bo‘lmadi'
      return { ok: false, error: typeof err === 'string' ? err : 'Xatolik yuz berdi' }
    }

    return { ok: true, token: data.token, user: data.user }
  } catch (e) {
    console.warn('[bindy] auth register failed:', e)
    return { ok: false, error: 'Server bilan aloqa yo‘q, keyinroq urinib ko‘ring' }
  }
}

export async function loginUser(
  username: string,
  password: string,
): Promise<{ ok: true; token: string; user: AuthUser } | { ok: false; error: string }> {
  const name = username.trim()
  try {
    const base = API_URL || ''
    const res = await fetch(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username: name, password }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = data.detail || 'Username yoki parol noto‘g‘ri'
      return { ok: false, error: typeof err === 'string' ? err : 'Username yoki parol noto‘g‘ri' }
    }

    return { ok: true, token: data.token, user: data.user }
  } catch (e) {
    console.warn('[bindy] auth login failed:', e)
    return { ok: false, error: 'Server bilan aloqa yo‘q, keyinroq urinib ko‘ring' }
  }
}

export function verifySession(): AuthUser | null {
  const token = getStoredToken()
  const user = getStoredUser()
  if (!token || !user) {
    clearAuth()
    return null
  }
  return user
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken()
  if (!token) return null

  try {
    const base = API_URL || ''
    const res = await fetch(`${base}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      clearAuth()
      return null
    }
    const data = await res.json()
    if (data.ok && data.user) {
      saveAuth(token, data.user)
      return data.user
    }
    return null
  } catch {
    return getStoredUser()
  }
}
