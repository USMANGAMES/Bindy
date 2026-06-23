import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Shield } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { markNotificationsRead } from '../../services/notificationsService'
import { useAuth } from '../../context/AuthContext'

export function NotificationsScreen() {
  const { notifications, unreadCount, refreshNotifications } = useApp()
  const { user } = useAuth()

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  useEffect(() => {
    if (!user) return
    const t = setTimeout(async () => {
      await markNotificationsRead(user.username)
      refreshNotifications()
    }, 800)
    return () => clearTimeout(t)
  }, [user, refreshNotifications])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bindy-bg">
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-bindy-mint" />
          <h1 className="text-2xl font-bold text-bindy-text">Bildirishnomalar</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {notifications.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
            <Bell className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">Hozircha bildirishnoma yo‘q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-3xl bg-white p-5 shadow-soft ${!n.read ? 'ring-2 ring-bindy-mint/20' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${n.type === 'report_deleted' ? 'bg-red-50 text-red-500' : 'bg-bindy-mint/10 text-bindy-mint'}`}
                  >
                    {n.type === 'report_deleted' ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-bindy-text">{n.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                    {n.reason && (
                      <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        Sabab: {n.reason}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {n.pointsDelta < 0 && (
                  <p className="mt-4 text-center text-3xl font-black text-red-500">
                    {n.pointsDelta} ball
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
