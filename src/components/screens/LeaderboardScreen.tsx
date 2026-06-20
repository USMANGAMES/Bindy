import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, Medal, Trophy } from 'lucide-react'
import { LEADERBOARD } from '../../data/leaderboard'
import { useApp } from '../../context/AppContext'

const RANK_ICONS = [Crown, Medal, Trophy]

export function LeaderboardScreen() {
  const { state } = useApp()

  const entries = useMemo(() => {
    const you = {
      rank: 9,
      name: state.profile.name,
      points: state.profile.points,
      bins: state.profile.binsReported,
      avatar: state.profile.name.slice(0, 2).toUpperCase(),
      isYou: true,
    }
    return [...LEADERBOARD, you].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }))
  }, [state.profile])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bindy-bg">
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-2xl font-bold text-bindy-text">Leaderboard</h1>
        <p className="mt-1 text-sm text-gray-500">Top eco heroes this week</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 grid grid-cols-3 gap-2"
        >
          {entries.slice(0, 3).map((entry, i) => {
            const Icon = RANK_ICONS[i]
            return (
              <div
                key={entry.name}
                className={`flex flex-col items-center rounded-3xl p-4 shadow-soft ${
                  i === 0 ? 'bg-gradient-to-b from-bindy-accent/20 to-white' : 'bg-white'
                }`}
              >
                <Icon className={`mb-2 h-5 w-5 ${i === 0 ? 'text-bindy-accent' : 'text-gray-400'}`} />
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bindy-mint/10 text-xs font-bold text-bindy-mint">
                  {entry.avatar}
                </div>
                <p className="mt-2 truncate text-xs font-semibold text-bindy-text">{entry.name}</p>
                <p className="text-sm font-bold text-bindy-mint">{entry.points.toLocaleString()}</p>
              </div>
            )
          })}
        </motion.div>

        <div className="space-y-2">
          {entries.map((entry, i) => (
            <motion.div
              key={`${entry.name}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 rounded-3xl p-4 shadow-soft ${
                entry.isYou ? 'bg-bindy-mint/10 ring-2 ring-bindy-mint/30' : 'bg-white'
              }`}
            >
              <span className="w-6 text-center text-sm font-bold text-gray-400">#{entry.rank}</span>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bindy-bg text-sm font-bold text-bindy-text">
                {entry.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-bindy-text">
                  {entry.name}
                  {entry.isYou && (
                    <span className="ml-2 text-xs font-medium text-bindy-mint">You</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{entry.bins} bins reported</p>
              </div>
              <span className="text-sm font-bold text-bindy-mint">{entry.points.toLocaleString()}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
