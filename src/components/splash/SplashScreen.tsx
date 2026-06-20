import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

type SplashScreenProps = {
  onStart: () => void
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-[#0d9668] via-bindy-mint to-[#34d399] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        >
          <Leaf className="h-12 w-12 text-bindy-mint" strokeWidth={2.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-5xl font-bold tracking-tight text-white"
        >
          bindy<span className="opacity-80">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 max-w-xs text-lg text-white/90"
        >
          Snap a bin. Map the city. Earn eco points.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex gap-3"
        >
          {['♻️', '🌍', '✨'].map((emoji, i) => (
            <div
              key={i}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl backdrop-blur-sm"
            >
              {emoji}
            </div>
          ))}
        </motion.div>
      </div>

      <motion.button
        type="button"
        onClick={onStart}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-sm rounded-3xl bg-white py-4.5 py-4 text-base font-semibold text-bindy-mint shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
      >
        Get started
      </motion.button>
    </motion.div>
  )
}
