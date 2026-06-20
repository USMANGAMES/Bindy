import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, ShieldCheck, X } from 'lucide-react'
import type { RecyclingBin } from '../../types'
import { BIN_TYPE_EMOJI, BIN_TYPE_LABELS } from '../../data/bins'

type BinDetailSheetProps = {
  bin: RecyclingBin | null
  onClose: () => void
  onNavigate: () => void
}

export function BinDetailSheet({ bin, onClose, onNavigate }: BinDetailSheetProps) {
  return (
    <AnimatePresence>
      {bin && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[900] mx-auto max-w-lg rounded-t-[2rem] bg-white px-5 pb-[max(6.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-12px_48px_rgba(0,0,0,0.12)]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{BIN_TYPE_EMOJI[bin.type]}</span>
                  <h2 className="text-lg font-bold text-bindy-text">{bin.name}</h2>
                </div>
                <p className="mt-1 text-sm text-gray-500">{BIN_TYPE_LABELS[bin.type]}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-bindy-bg p-4">
                <p className="text-xs font-medium text-gray-500">Fill level</p>
                <p className="mt-1 text-xl font-bold text-bindy-text">{bin.fillLevel}%</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-bindy-mint transition-all"
                    style={{ width: `${bin.fillLevel}%` }}
                  />
                </div>
              </div>
              <div className="rounded-3xl bg-bindy-bg p-4">
                <p className="text-xs font-medium text-gray-500">Distance</p>
                <p className="mt-1 text-xl font-bold text-bindy-text">
                  {bin.distance != null ? `${Math.round(bin.distance * 1000)}m` : '—'}
                </p>
                {bin.verified && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-bindy-mint">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigate}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-3xl bg-bindy-charcoal py-4 text-sm font-semibold text-white transition active:scale-[0.98]"
            >
              <Navigation className="h-4 w-4" />
              Get directions
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
