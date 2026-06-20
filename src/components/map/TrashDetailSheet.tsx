import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Navigation, X } from 'lucide-react'
import type { UserTrashReport } from '../../hooks/useUserTrashReports'

type TrashDetailSheetProps = {
  trash: UserTrashReport | null
  onClose: () => void
  onNavigate: () => void
  navigating?: boolean
}

export function TrashDetailSheet({ trash, onClose, onNavigate, navigating }: TrashDetailSheetProps) {
  return (
    <AnimatePresence>
      {trash && (
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
                  <span className="text-2xl">🗑️</span>
                  <h2 className="text-lg font-bold text-bindy-text">{trash.name}</h2>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-bindy-accent">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Siz qo‘shgan trash
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {trash.photoUrl && (
              <div className="mt-4 overflow-hidden rounded-3xl">
                <img src={trash.photoUrl} alt="" className="aspect-video w-full object-cover" />
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-bindy-bg p-4">
                <p className="text-xs font-medium text-gray-500">Masofa</p>
                <p className="mt-1 text-xl font-bold text-bindy-text">{trash.distanceM} m</p>
              </div>
              <div className="rounded-3xl bg-bindy-bg p-4">
                <p className="text-xs font-medium text-gray-500">Ball</p>
                <p className="mt-1 text-xl font-bold text-bindy-mint">+{trash.points}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigate}
              disabled={navigating}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-3xl bg-bindy-charcoal py-4 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              <Navigation className="h-4 w-4" />
              {navigating ? 'Yo‘l chizilmoqda...' : 'Yo‘nalish olish'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
