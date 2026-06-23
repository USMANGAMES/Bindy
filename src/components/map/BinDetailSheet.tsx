import { useEffect, useState } from 'react'
import { Navigation, Shield, ShieldCheck, Trash2, X } from 'lucide-react'
import type { RecyclingBin } from '../../types'
import { BIN_TYPE_EMOJI, BIN_TYPE_LABELS } from '../../data/bins'
import { countWords } from '../../config/admins'
import { adminDeleteMapItem } from '../../services/adminService'
import { SwipeableBottomSheet } from './SwipeableBottomSheet'

type BinDetailSheetProps = {
  bin: RecyclingBin | null
  onClose: () => void
  onNavigate: () => void
  onDeleted?: () => void
  adminUser?: string
  navigating?: boolean
}

type Step = 'view' | 'confirm' | 'reason'

export function BinDetailSheet({
  bin,
  onClose,
  onNavigate,
  onDeleted,
  adminUser,
  navigating,
}: BinDetailSheetProps) {
  const [step, setStep] = useState<Step>('view')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isAdmin = Boolean(adminUser)

  useEffect(() => {
    setStep('view')
    setReason('')
    setError(null)
  }, [bin?.id])

  const reset = () => {
    setStep('view')
    setReason('')
    setError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const submitDelete = async () => {
    if (!bin || !adminUser) return
    if (countWords(reason) < 5) {
      setError('Sabab kamida 5 ta so‘z bo‘lishi kerak')
      return
    }
    setLoading(true)
    setError(null)
    const result = await adminDeleteMapItem(bin.id, adminUser, reason.trim())
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    reset()
    onDeleted?.()
  }

  return (
    <SwipeableBottomSheet open={Boolean(bin)} onClose={handleClose} draggable={step !== 'reason'}>
      {bin && (
        <>
          {isAdmin && adminUser && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              <Shield className="h-4 w-4" />
              Admin panel — {adminUser}
            </div>
          )}

          {step === 'view' && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{BIN_TYPE_EMOJI[bin.type]}</span>
                    <h2 className="text-lg font-bold text-bindy-text">{bin.name}</h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{BIN_TYPE_LABELS[bin.type]}</p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 rounded-3xl bg-bindy-bg p-4">
                <p className="text-xs font-medium text-gray-500">Masofa</p>
                <p className="mt-1 text-xl font-bold text-bindy-text">
                  {bin.distanceM != null
                    ? `${bin.distanceM} m`
                    : bin.distance != null
                      ? `${Math.round(bin.distance * 1000)} m`
                      : '—'}
                </p>
                {bin.verified && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-bindy-mint">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </p>
                )}
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-3xl bg-red-600 py-4 text-sm font-semibold text-white transition active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigate}
                  disabled={navigating}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-3xl bg-bindy-charcoal py-4 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  <Navigation className="h-4 w-4" />
                  {navigating ? 'Yo‘l chizilmoqda...' : 'Yo‘nalish olish'}
                </button>
              )}
            </>
          )}

          {step === 'confirm' && isAdmin && (
            <div className="py-2">
              <h3 className="text-lg font-bold text-bindy-text">Rostdan ham o‘chirmoqchimisiz?</h3>
              <p className="mt-2 text-sm text-gray-500">
                <strong>{bin.name}</strong> xaritadan o‘chiriladi.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('view')}
                  className="flex-1 rounded-3xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-600"
                >
                  Bekor
                </button>
                <button
                  type="button"
                  onClick={() => setStep('reason')}
                  className="flex-1 rounded-3xl bg-red-600 py-3.5 text-sm font-semibold text-white"
                >
                  Ha, davom etish
                </button>
              </div>
            </div>
          )}

          {step === 'reason' && isAdmin && (
            <div className="py-2">
              <h3 className="text-lg font-bold text-bindy-text">O‘chirish sababi</h3>
              <p className="mt-1 text-sm text-gray-500">Kamida 5 ta so‘z yozing</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Masalan: Bu bin noto‘g‘ri joyda ko‘rsatilgan..."
                className="mt-4 w-full resize-none rounded-2xl border border-gray-200 bg-bindy-bg px-4 py-3 text-sm outline-none focus:border-red-400"
              />
              <p className="mt-1 text-xs text-gray-400">{countWords(reason)} / 5 so‘z</p>
              {error && (
                <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <button
                type="button"
                onClick={submitDelete}
                disabled={loading || countWords(reason) < 5}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-3xl bg-red-600 py-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {loading ? 'O‘chirilmoqda...' : 'Delete'}
              </button>
            </div>
          )}
        </>
      )}
    </SwipeableBottomSheet>
  )
}
