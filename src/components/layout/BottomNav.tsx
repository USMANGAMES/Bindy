import { Map, ShoppingBag, Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AppTab } from '../../types'
import { CameraNavButton } from '../capture/CameraFab'

const LEFT_TABS: { id: AppTab; label: string; icon: typeof Map }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
]

const RIGHT_TABS: { id: AppTab; label: string; icon: typeof Map }[] = [
  { id: 'leaderboard', label: 'Rank', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: User },
]

type BottomNavProps = {
  active: AppTab
  onChange: (tab: AppTab) => void
  onCapture: () => void
  captureDisabled?: boolean
  hidden?: boolean
}

function NavTab({
  id,
  label,
  icon: Icon,
  isActive,
  onChange,
}: {
  id: AppTab
  label: string
  icon: typeof Map
  isActive: boolean
  onChange: (tab: AppTab) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      className="relative flex flex-1 flex-col items-center gap-0.5 py-2"
    >
      {isActive && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-x-1 inset-y-0.5 rounded-2xl bg-bindy-mint/10"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <Icon
        className={`relative z-10 h-5 w-5 transition-colors ${isActive ? 'text-bindy-mint' : 'text-gray-400'}`}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span
        className={`relative z-10 text-[10px] font-semibold ${isActive ? 'text-bindy-mint' : 'text-gray-400'}`}
      >
        {label}
      </span>
    </button>
  )
}

export function BottomNav({
  active,
  onChange,
  onCapture,
  captureDisabled,
  hidden,
}: BottomNavProps) {
  if (hidden) return null

  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto relative mx-auto max-w-lg">
        {/* Markazdagi kamera — nav ustida fixed */}
        <div className="absolute left-1/2 top-0 z-40 -translate-x-1/2 -translate-y-[42%]">
          <CameraNavButton onClick={onCapture} disabled={captureDisabled} />
        </div>

        <div className="flex items-end rounded-3xl bg-white/95 px-1 pb-2 pt-3 shadow-[0_-4px_32px_rgba(31,41,55,0.12)] backdrop-blur-xl">
          <div className="flex flex-1 justify-around pr-6">
            {LEFT_TABS.map((tab) => (
              <NavTab key={tab.id} {...tab} isActive={active === tab.id} onChange={onChange} />
            ))}
          </div>

          {/* Markaz bo‘shliq — kamera uchun */}
          <div className="w-[4.5rem] shrink-0" aria-hidden="true" />

          <div className="flex flex-1 justify-around pl-6">
            {RIGHT_TABS.map((tab) => (
              <NavTab key={tab.id} {...tab} isActive={active === tab.id} onChange={onChange} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
