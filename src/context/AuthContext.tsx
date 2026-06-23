import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../services/authService'
import { isAdminUsername } from '../config/admins'
import {
  clearAuth,
  getStoredUser,
  loginUser,
  registerUser,
  saveAuth,
  verifySession,
} from '../services/authService'

type AuthContextValue = {
  user: AuthUser | null
  isAdmin: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<string | null>
  register: (username: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)
  const [loading, setLoading] = useState(true)

  const isAdmin = useMemo(
    () => (user ? isAdminUsername(user.username) : false),
    [user],
  )

  useEffect(() => {
    setUser(verifySession())
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginUser(username, password)
    if (!result.ok) return result.error
    saveAuth(result.token, result.user)
    setUser(result.user)
    return null
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const result = await registerUser(username, password)
    if (!result.ok) return result.error
    saveAuth(result.token, result.user)
    setUser(result.user)
    return null
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAdmin, loading, login, register, logout }),
    [user, isAdmin, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
