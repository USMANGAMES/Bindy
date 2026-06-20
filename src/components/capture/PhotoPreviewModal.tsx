import { motion } from 'framer-motion'

type PhotoPreviewModalProps = {
  photoUrl: string
  onRetake: () => void
  onSend: () => void
}

export function PhotoPreviewModal({ photoUrl, onRetake, onSend }: PhotoPreviewModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1100] flex flex-col justify-end bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="mx-auto w-full max-w-lg rounded-t-[2rem] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />

        <div className="overflow-hidden rounded-3xl bg-bindy-bg shadow-soft">
          <img src={photoUrl} alt="Captured bin preview" className="aspect-[4/3] w-full object-cover" />
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Does this look good? Bindy AI will identify the bin type.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="flex-1 rounded-3xl border-2 border-gray-200 bg-white py-4 text-sm font-semibold text-bindy-text transition-colors hover:border-gray-300 active:scale-[0.98]"
          >
            Retake
          </button>
          <button
            type="button"
            onClick={onSend}
            className="flex-1 rounded-3xl bg-bindy-mint py-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:bg-[#0ea572] active:scale-[0.98]"
          >
            Send to Bindy
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
