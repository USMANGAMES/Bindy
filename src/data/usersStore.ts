/** Bindy foydalanuvchilari — brauzer localStorage da saqlanadi (JS obyekt) */

export type UserRecord = {
  id: number
  username: string
  password: string
}

const USERS_KEY = 'bindy-users'

export function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as UserRecord[]) : []
  } catch {
    return []
  }
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function findUserByUsername(username: string): UserRecord | undefined {
  const q = username.trim().toLowerCase()
  return loadUsers().find((u) => u.username.toLowerCase() === q)
}

export function usernameTaken(username: string): boolean {
  return !!findUserByUsername(username)
}

export function addUser(username: string, password: string): UserRecord {
  const users = loadUsers()
  const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1
  const user: UserRecord = { id: nextId, username: username.trim(), password }
  users.push(user)
  saveUsers(users)
  return user
}

export function checkLogin(username: string, password: string): UserRecord | null {
  const user = findUserByUsername(username)
  if (!user || user.password !== password) return null
  return user
}
