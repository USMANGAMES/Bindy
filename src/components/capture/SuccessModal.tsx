import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import type { BinAnalysis } from '../../types'
import { BIN_TYPE_EMOJI } from '../../data/bins'

type SuccessModalProps = {
  analysis: BinAnalysis
  onBackToMap: () => void
}

const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  left: 5 + ((i * 6.5) % 90),
  delay: i * 0.12,
  color: i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#F59E0B' : '#ffffff',
}))

export function SuccessModal({ analysis, onBackToMap }: SuccessModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1300] flex flex-col items-center justify-center bg-gradient-to-b from-[#0d9668] via-bindy-mint to-[#34d399] px-6"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <motion.div
            key={i}
            className="absolute top-[15%] h-2 w-2 rounded-sm"
            style={{ left: `${c.left}%`, backgroundColor: c.color }}
            animate={{ y: [0, 120], rotate: [0, 180], opacity: [1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: c.delay, ease: 'easeOut' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative flex w-full max-w-sm flex-col items-center text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
          className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
        >
          <Check className="h-14 w-14 text-bindy-mint" strokeWidth={3} />
        </motion.div>

        <h2 className="text-2xl font-bold text-white">Bin recognized!</h2>
        <p className="mt-2 text-white/85">+{analysis.points} eco points earned</p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 w-full rounded-3xl bg-white/15 p-5 backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">{BIN_TYPE_EMOJI[analysis.type]}</span>
            <div className="text-left">
              <p className="font-bold text-white">{analysis.label}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                {analysis.confidence}% confidence
              </p>
            </div>
          </div>
        </motion.div>

        <motion.button
          type="button"
          onClick={onBackToMap}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          className="mt-10 w-full rounded-3xl bg-white py-4 text-sm font-semibold text-bindy-mint shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          Back to map
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
