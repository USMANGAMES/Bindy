import { useState } from 'react'
import { Compass, Lock, RefreshCw, X, ShieldAlert } from 'lucide-react'
import { SwipeableBottomSheet } from './SwipeableBottomSheet'

type CoarseLocationPromptProps = {
  open: boolean
  onClose: () => void
  onRefresh: () => void
}

export function CoarseLocationPrompt({
  open,
  onClose,
  onRefresh,
}: CoarseLocationPromptProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshClick = () => {
    setRefreshing(true)
    onRefresh()
    setTimeout(() => {
      setRefreshing(false)
    }, 1500)
  }

  return (
    <SwipeableBottomSheet open={open} onClose={onClose}>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-bindy-text">Aniq joylashuv yoqilmagan</h2>
            <p className="text-xs font-medium text-amber-700">Taxminiy hudud ko‘rsatilmoqda (~1 km)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 active:scale-95"
          aria-label="Yopish"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 p-3.5 text-xs leading-relaxed text-amber-900">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Sizni adashtirmaslik uchun xaritada <strong>noto‘g‘ri nuqta yashirildi</strong>. Chiqindi qutilari va masofani 1-ga-1 aniq ko‘rish uchun brauzerda aniq joylashuvni yoqing.
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-700">
          <p className="font-semibold text-bindy-text">Qanday yoqish mumkin (2 ta qadam):</p>

          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              1
            </span>
            <div className="leading-snug">
              Brauzer manzil qatori tepasidagi{' '}
              <strong className="inline-flex items-center gap-0.5 rounded bg-gray-200 px-1 py-0.5 text-gray-800">
                <Lock className="inline h-3 w-3" /> qulf
              </strong>{' '}
              yoki sozlamalar belgisini bosing.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              2
            </span>
            <div className="leading-snug">
              <strong>«Geolokatsiya»</strong> bo‘limida{' '}
              <strong>«Aniq joylashuv» (Точное местоположение)</strong> parametrini yoqing.
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-bindy-mint py-3 text-xs font-semibold text-white shadow-soft transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Tekshirilmoqda...' : 'Qayta tekshirish'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-gray-100 py-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-[0.98]"
          >
            Tushunarli
          </button>
        </div>
      </div>
    </SwipeableBottomSheet>
  )
}
