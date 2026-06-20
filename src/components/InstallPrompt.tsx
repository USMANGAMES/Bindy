import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<{ prompt: () => Promise<void> } | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('bindy-install-dismissed') === '1')

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred({ prompt: () => (e as BeforeInstallPromptEvent).prompt() })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    setDeferred(null)
  }

  const dismiss = () => {
    localStorage.setItem('bindy-install-dismissed', '1')
    setDismissed(true)
    setDeferred(null)
  }

  if (dismissed || !deferred) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[600] mx-auto max-w-lg"
      >
        <div className="flex items-center gap-3 rounded-3xl bg-bindy-charcoal p-4 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bindy-mint">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install Bindy</p>
            <p className="text-xs text-white/70">Add to home screen for the best experience</p>
          </div>
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-2xl bg-bindy-mint px-3 py-2 text-xs font-semibold"
          >
            Install
          </button>
          <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}
