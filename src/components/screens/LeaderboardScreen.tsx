import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, Medal, Shield, Trophy, Users, Wifi } from 'lucide-react'
import { LEADERBOARD } from '../../data/leaderboard'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import type { LeaderboardUser } from '../../types'

const RANK_ICONS = [Crown, Medal, Trophy]

function buildEntries(
  serverTop: LeaderboardUser[] | null,
  profileName: string,
  profilePoints: number,
  profileReports: number,
  currentUsername?: string,
) {
  if (serverTop && serverTop.length > 0) {
    return serverTop.map((u, i) => ({
      rank: i + 1,
      name: u.username,
      points: u.points,
      bins: u.reports,
      avatar: u.username.slice(0, 2).toUpperCase(),
      isYou: currentUsername === u.username,
    }))
  }
  const you = {
    rank: 9,
    name: profileName,
    points: profilePoints,
    bins: profileReports,
    avatar: profileName.slice(0, 2).toUpperCase(),
    isYou: true,
  }
  return [...LEADERBOARD, you].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }))
}

export function LeaderboardScreen() {
  const { state, leaderboard, realtimeConnected } = useApp()
  const { isAdmin, user } = useAuth()

  const entries = useMemo(
    () =>
      buildEntries(
        leaderboard?.top ?? null,
        state.profile.name,
        state.profile.points,
        state.profile.binsReported,
        user?.username,
      ),
    [leaderboard, state.profile, user?.username],
  )

  const totalUsers = leaderboard?.totalUsers

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bindy-bg">
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-2">
          {isAdmin && <Shield className="h-5 w-5 text-red-500" />}
          <h1 className="text-2xl font-bold text-bindy-text">
            {isAdmin ? 'Admin Rank' : 'Leaderboard'}
          </h1>
          {realtimeConnected && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-600">
              <Wifi className="h-3 w-3" /> Live
            </span>
          )}
        </div>
        {totalUsers != null ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-soft">
            <Users className="h-5 w-5 text-bindy-mint" />
            <span className="text-sm font-semibold text-bindy-text">
              Jami foydalanuvchilar:{' '}
              <span className="text-bindy-mint">{totalUsers}</span>
            </span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-500">Top eco heroes this week</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {isAdmin && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Top 10
          </p>
        )}

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
                <p className="text-xs text-gray-500">{entry.bins} report</p>
              </div>
              <span className="text-sm font-bold text-bindy-mint">{entry.points.toLocaleString()}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
