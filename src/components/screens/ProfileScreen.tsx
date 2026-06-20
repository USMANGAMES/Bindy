import { motion } from 'framer-motion'
import { Flame, Leaf, LogOut, Recycle, Star } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { BIN_TYPE_EMOJI, BIN_TYPE_LABELS } from '../../data/bins'

export function ProfileScreen() {
  const { state } = useApp()
  const { user, logout } = useAuth()
  const { profile } = state

  const stats = [
    { label: 'Eco points', value: profile.points, icon: Star, color: 'text-bindy-accent' },
    { label: 'Bins reported', value: profile.binsReported, icon: Recycle, color: 'text-bindy-mint' },
    { label: 'Day streak', value: profile.streak, icon: Flame, color: 'text-orange-500' },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bindy-bg">
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-2xl font-bold text-bindy-text">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-bindy-mint to-[#059669] p-6 text-white shadow-soft"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-xl font-bold backdrop-blur-sm">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-sm text-white/70">@{user?.username ?? profile.name}</p>
            </div>
            <Leaf className="h-8 w-8 text-white/40" />
          </div>
        </motion.div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-3xl bg-white p-4 shadow-soft"
            >
              <Icon className={`h-5 w-5 ${color}`} />
              <p className="mt-2 text-xl font-bold text-bindy-text">{value}</p>
              <p className="text-[11px] font-medium text-gray-500">{label}</p>
            </motion.div>
          ))}
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-3xl border border-red-200 bg-white py-3.5 text-sm font-semibold text-red-600 shadow-soft"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Recent activity
          </h3>
          {profile.submissions.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
              <Recycle className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No submissions yet. Snap your first bin!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.submissions.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-soft"
                >
                  <span className="text-2xl">
                    {sub.category === 'trash' ? '🗑️' : BIN_TYPE_EMOJI[sub.type]}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-bindy-text">
                      {sub.category === 'trash' ? 'Noqonuniy musor' : BIN_TYPE_LABELS[sub.type]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sub.category === 'bin' ? 'Bin' : 'Trash'} ·{' '}
                      {new Date(sub.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-bindy-mint/10 px-2.5 py-1 text-xs font-bold text-bindy-mint">
                    +{sub.points}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
