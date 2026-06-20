import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function ProcessingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-bindy-bg/95 backdrop-blur-md"
    >
      <div className="flex flex-col items-center px-8 text-center">
        <div className="relative mb-8 h-24 w-24">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-bindy-mint/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-4 border-transparent border-t-bindy-mint"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-bindy-mint" strokeWidth={2} />
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-semibold text-bindy-text"
        >
          Bindy AI rasmni tahlil qilmoqda...
        </motion.h2>
        <p className="mt-2 max-w-xs text-sm text-gray-500">
          Bin yoki trash ekanini aniqlash
        </p>

        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-bindy-mint"
              animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
