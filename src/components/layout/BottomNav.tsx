import { Map, Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AppTab } from '../../types'

const TABS: { id: AppTab; label: string; icon: typeof Map }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'leaderboard', label: 'Rank', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: User },
]

type BottomNavProps = {
  active: AppTab
  onChange: (tab: AppTab) => void
  hidden?: boolean
}

export function BottomNav({ active, onChange, hidden }: BottomNavProps) {
  if (hidden) return null

  return (
    <nav className="absolute inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="relative flex items-center justify-around rounded-3xl bg-white/95 px-2 py-2 shadow-[0_-4px_32px_rgba(31,41,55,0.1)] backdrop-blur-xl">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-2 inset-y-1 rounded-2xl bg-bindy-mint/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`relative z-10 h-5 w-5 transition-colors ${isActive ? 'text-bindy-mint' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`relative z-10 text-[11px] font-semibold ${isActive ? 'text-bindy-mint' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
