import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, MapPin, Users, X } from 'lucide-react'
import { formatDistanceMeters } from '../../utils/geo'
import { BIN_TYPE_EMOJI } from '../../data/bins'
import type { NearbyBin } from '../../hooks/useNearbyBins'
import type { CommunityReport } from '../../hooks/useCommunityReports'

const DISMISS_KEY = 'bindy-nearby-panel-dismissed'

type NearbyBinsPanelProps = {
  bins: NearbyBin[]
  communityTrash: CommunityReport[]
  communityBins: CommunityReport[]
  selectedBinId: string | null
  selectedReportId: string | null
  onSelectBin: (bin: NearbyBin) => void
  onSelectReport: (report: CommunityReport) => void
}

export function NearbyBinsPanel({
  bins,
  communityTrash,
  communityBins,
  selectedBinId,
  selectedReportId,
  onSelectBin,
  onSelectReport,
}: NearbyBinsPanelProps) {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1',
  )

  const community = [...communityTrash, ...communityBins].slice(0, 8)
  const totalCount = community.length + bins.length

  const dismiss = () => {
    setDismissed(true)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }

  const reopen = () => {
    setDismissed(false)
    sessionStorage.removeItem(DISMISS_KEY)
  }

  if (dismissed) {
    return (
      <div className="pointer-events-none absolute bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 z-[500]">
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={reopen}
          className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-bindy-text shadow-soft backdrop-blur-md"
        >
          <MapPin className="h-4 w-4 text-bindy-mint" />
          Yaqin joylar
          {totalCount > 0 && (
            <span className="rounded-full bg-bindy-mint/10 px-2 py-0.5 text-xs font-bold text-bindy-mint">
              {totalCount}
            </span>
          )}
        </motion.button>
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-[500]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="pointer-events-auto relative max-h-64 overflow-y-auto rounded-3xl bg-white/92 shadow-soft backdrop-blur-md"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Yopish"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100/90 text-gray-500 shadow-sm transition hover:bg-gray-200 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>

          {community.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 pb-3 pt-3 pr-12">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-bindy-accent">
                  <Users className="h-3.5 w-3.5" />
                  Jamoa reportlari
                </p>
                <p className="mt-0.5 text-sm font-bold text-bindy-text">
                  {communityTrash.length} trash · {communityBins.length} bin
                </p>
              </div>
              <ul className="px-2 pb-2">
                {community.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectReport(item)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                        selectedReportId === item.id ? 'bg-bindy-accent/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{item.category === 'trash' ? '🗑️' : '♻️'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-bindy-text">{item.label}</p>
                        <p className="truncate text-xs text-gray-400">{item.userName}</p>
                      </div>
                      <span
                        className={`flex shrink-0 items-center gap-0.5 text-sm font-bold ${item.category === 'trash' ? 'text-bindy-accent' : 'text-bindy-mint'}`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {formatDistanceMeters(item.distanceM)}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="px-4 py-3 pr-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-bindy-mint">Yaqin binlar</p>
            <p className="mt-0.5 text-sm font-bold text-bindy-text">
              {bins.length > 0
                ? `${bins.length} ta · eng yaqini ${formatDistanceMeters(bins[0].distanceM)}`
                : '1 km ichida bin yo‘q'}
            </p>
          </div>

          {bins.length > 0 && (
            <ul className="max-h-36 overflow-y-auto px-2 pb-2">
              {bins.slice(0, 5).map((bin) => (
                <li key={bin.id}>
                  <button
                    type="button"
                    onClick={() => onSelectBin(bin)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                      selectedBinId === bin.id ? 'bg-bindy-mint/10' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{BIN_TYPE_EMOJI[bin.type]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-bindy-text">{bin.name}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-bindy-mint">
                      <MapPin className="h-3.5 w-3.5" />
                      {formatDistanceMeters(bin.distanceM)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {community.length === 0 && bins.length === 0 && (
            <p className="px-4 pb-4 text-sm text-gray-500">Hozircha yaqin atrofda joy yo‘q</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
