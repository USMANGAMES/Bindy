import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Shield, X } from 'lucide-react'
import type { BindyNotification } from '../../types'
import { markNotificationsRead } from '../../services/notificationsService'

type MapAlertsSheetProps = {
  open: boolean
  notifications: BindyNotification[]
  username: string
  onClose: () => void
  onRefresh: () => void
}

export function MapAlertsSheet({
  open,
  notifications,
  username,
  onClose,
  onRefresh,
}: MapAlertsSheetProps) {
  const handleClose = async () => {
    await markNotificationsRead(username)
    onRefresh()
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[850] bg-black/30 backdrop-blur-[2px]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[860] mx-auto max-h-[70vh] max-w-lg overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-12px_48px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-bindy-mint" />
                <h2 className="text-lg font-bold text-bindy-text">Alerts</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
              {notifications.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">Bildirishnoma yo‘q</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-3xl bg-bindy-bg p-4 ${!n.read ? 'ring-2 ring-bindy-mint/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-bindy-text">{n.title}</p>
                          <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                          {n.reason && (
                            <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-gray-500">
                              Sabab: {n.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      {n.pointsDelta < 0 && (
                        <p className="mt-3 text-center text-3xl font-black text-red-500">
                          {n.pointsDelta} ball
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
