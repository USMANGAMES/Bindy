import { motion } from 'framer-motion'
import { Loader2, Navigation, X } from 'lucide-react'
import { formatDistanceMeters } from '../../utils/geo'
import type { MapTarget, RouteResult } from '../../types'

type NavigationPanelProps = {
  destination: MapTarget
  route: RouteResult | null
  remainingM: number
  loading: boolean
  onStop: () => void
}

export function NavigationPanel({
  destination,
  route,
  remainingM,
  loading,
  onStop,
}: NavigationPanelProps) {
  const etaMin = route?.durationMin ?? Math.max(1, Math.round(remainingM / 80))

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      className="absolute inset-x-4 top-[calc(max(0.75rem,env(safe-area-inset-top))+4.5rem)] z-[600]"
    >
      <div className="rounded-3xl bg-bindy-charcoal p-4 text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bindy-mint">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{destination.name}</p>
            <p className="mt-0.5 text-sm text-white/70">
              {loading
                ? 'Yo‘l chizilmoqda...'
                : `${formatDistanceMeters(remainingM)} · ~${etaMin} daqiqa yurish`}
            </p>
          </div>
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!loading && route && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full rounded-full bg-bindy-mint"
              initial={{ width: '100%' }}
              animate={{
                width: `${Math.max(8, Math.min(100, (remainingM / route.distanceM) * 100))}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
