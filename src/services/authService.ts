import {
  addUser,
  checkLogin,
  findUserByUsername,
  usernameTaken,
} from '../data/usersStore'

export type AuthUser = {
  id: number
  username: string
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

function makeToken(user: AuthUser): string {
  return `bindy-${user.id}-${user.username}`
}

export async function registerUser(
  username: string,
  password: string,
): Promise<{ ok: true; token: string; user: AuthUser } | { ok: false; error: string }> {
  const name = username.trim()
  if (name.length < 3) {
    return { ok: false, error: 'Username kamida 3 ta belgi' }
  }
  if (password.length < 4) {
    return { ok: false, error: 'Parol kamida 4 ta belgi' }
  }
  if (usernameTaken(name)) {
    return { ok: false, error: 'Bu username band' }
  }

  const record = addUser(name, password)
  const user: AuthUser = { id: record.id, username: record.username }
  return { ok: true, token: makeToken(user), user }
}

export async function loginUser(
  username: string,
  password: string,
): Promise<{ ok: true; token: string; user: AuthUser } | { ok: false; error: string }> {
  const record = checkLogin(username, password)
  if (!record) {
    return { ok: false, error: 'Username yoki parol noto‘g‘ri' }
  }
  const user: AuthUser = { id: record.id, username: record.username }
  return { ok: true, token: makeToken(user), user }
}

export function verifySession(): AuthUser | null {
  const token = getStoredToken()
  const user = getStoredUser()
  if (!token || !user) {
    clearAuth()
    return null
  }
  const record = findUserByUsername(user.username)
  if (!record || record.id !== user.id) {
    clearAuth()
    return null
  }
  return user
}
