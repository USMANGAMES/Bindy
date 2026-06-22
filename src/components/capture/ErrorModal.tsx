import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

type ErrorModalProps = {
  message?: string
  onTryAgain: () => void
}

export function ErrorModal({ message, onTryAgain }: ErrorModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-lg rounded-t-[2rem] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-8px_40px_rgba(0,0,0,0.15)] sm:rounded-3xl sm:pb-8"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-bindy-accent/10">
          <AlertTriangle className="h-10 w-10 text-bindy-accent" strokeWidth={2} />
        </div>

        <h2 className="text-center text-xl font-bold text-bindy-text">
          Tanib bo‘lmadi
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-gray-500">
          {message ??
            'Faqat ko‘cha qutisi, katta konteyner yoki katta musor to‘plami. Ofis/uy ichidagi qutilar va 1 ta parcha musor qabul qilinmaydi.'}
        </p>

        <button
          type="button"
          onClick={onTryAgain}
          className="mt-8 w-full rounded-3xl bg-bindy-charcoal py-4 text-sm font-semibold text-white transition-all active:scale-[0.98]"
        >
          Qayta urinish
        </button>
      </motion.div>
    </motion.div>
  )
}
