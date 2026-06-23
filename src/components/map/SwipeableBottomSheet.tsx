import type { ReactNode } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'

const DISMISS_OFFSET = 100
const DISMISS_VELOCITY = 400

type SwipeableBottomSheetProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  draggable?: boolean
}

export function SwipeableBottomSheet({
  open,
  onClose,
  children,
  draggable = true,
}: SwipeableBottomSheetProps) {
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
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
            drag={draggable ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={draggable ? handleDragEnd : undefined}
            className="fixed inset-x-0 bottom-0 z-[900] mx-auto max-w-lg touch-pan-y rounded-t-[2rem] bg-white px-5 pb-[max(6.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_48px_rgba(0,0,0,0.12)]"
          >
            <div className="mx-auto mb-4 flex h-6 w-full cursor-grab items-center justify-center active:cursor-grabbing">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
