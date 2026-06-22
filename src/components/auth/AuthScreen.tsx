import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { BindyLogoMark } from '../brand/BindyLogo'
import { BRANDING } from '../../config/branding'
import { useAuth } from '../../context/AuthContext'

type Mode = 'login' | 'register'

export function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [notBot, setNotBot] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (honeypot) return

    if (!notBot) {
      setError('Davom etish uchun "Men robot emasman" ni belgilang')
      return
    }

    const name = username.trim()
    if (name.length < 3) {
      setError('Username kamida 3 ta belgi')
      return
    }
    if (password.length < 4) {
      setError('Parol kamida 4 ta belgi')
      return
    }
    if (mode === 'register' && password !== confirm) {
      setError('Parollar mos emas')
      return
    }

    setLoading(true)
    const err =
      mode === 'login' ? await login(name, password) : await register(name, password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-bindy-bg px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <BindyLogoMark className="h-24 w-24" />
          <h1 className="mt-5 text-3xl font-bold text-bindy-text">
            {BRANDING.appName}
            <span className="text-bindy-mint">.</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {mode === 'login' ? 'Hisobingizga kiring' : 'Yangi hisob oching'}
          </p>
        </div>

        <div className="mb-6 flex rounded-2xl bg-gray-100 p-1">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setError(null)
                setNotBot(false)
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                mode === m ? 'bg-white text-bindy-text shadow-sm' : 'text-gray-500'
              }`}
            >
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
          {/* Botlar to‘ldiradigan yashirin maydon — odamlar ko‘rmaydi */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-2xl border border-gray-200 bg-bindy-bg px-4 py-3 text-bindy-text outline-none focus:border-bindy-mint"
              placeholder="unique_username"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Parol
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full rounded-2xl border border-gray-200 bg-bindy-bg px-4 py-3 text-bindy-text outline-none focus:border-bindy-mint"
              placeholder="••••••••"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Confirm parol
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-2xl border border-gray-200 bg-bindy-bg px-4 py-3 text-bindy-text outline-none focus:border-bindy-mint"
                placeholder="••••••••"
              />
            </div>
          )}

          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
              notBot
                ? 'border-bindy-mint/40 bg-bindy-mint/5'
                : 'border-gray-200 bg-bindy-bg hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={notBot}
              onChange={(e) => setNotBot(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-bindy-mint focus:ring-bindy-mint"
            />
            <ShieldCheck
              className={`h-5 w-5 shrink-0 ${notBot ? 'text-bindy-mint' : 'text-gray-400'}`}
            />
            <span className="text-sm font-medium text-bindy-text">
              Men robot emasman
              <span className="mt-0.5 block text-xs font-normal text-gray-500">
                Haqiqiy {BRANDING.appName} ilovasidasiz
              </span>
            </span>
          </label>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !notBot}
            className="w-full rounded-3xl bg-bindy-mint py-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] disabled:opacity-60"
          >
            {loading ? 'Kutilmoqda...' : mode === 'login' ? 'Kirish' : 'Ro‘yxatdan o‘tish'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
