import { useEffect, useState } from 'react'
import { AlertTriangle, Navigation, Recycle, Shield, Trash2, X } from 'lucide-react'
import type { CommunityReport } from '../../hooks/useCommunityReports'
import { countWords } from '../../config/admins'
import { adminDeleteMapItem } from '../../services/adminService'
import { SwipeableBottomSheet } from './SwipeableBottomSheet'

type CommunityReportSheetProps = {
  report: CommunityReport | null
  onClose: () => void
  onNavigate: () => void
  onDeleted?: () => void
  adminUser?: string
  navigating?: boolean
}

type Step = 'view' | 'confirm' | 'reason'

export function CommunityReportSheet({
  report,
  onClose,
  onNavigate,
  onDeleted,
  adminUser,
  navigating,
}: CommunityReportSheetProps) {
  const [step, setStep] = useState<Step>('view')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isAdmin = Boolean(adminUser)
  const isTrash = report?.category === 'trash'

  useEffect(() => {
    setStep('view')
    setReason('')
    setError(null)
  }, [report?.id])

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
    if (!report || !adminUser) return
    if (countWords(reason) < 5) {
      setError('Sabab kamida 5 ta so‘z bo‘lishi kerak')
      return
    }
    setLoading(true)
    setError(null)
    const result = await adminDeleteMapItem(report.id, adminUser, reason.trim())
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    reset()
    onDeleted?.()
  }

  return (
    <SwipeableBottomSheet
      open={Boolean(report)}
      onClose={handleClose}
      draggable={step !== 'reason'}
    >
      {report && (
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
                      <span className="text-2xl">{isTrash ? '🗑️' : '♻️'}</span>
                      <h2 className="text-lg font-bold text-bindy-text">{report.label}</h2>
                    </div>
                    <p
                      className={`mt-1 flex items-center gap-1 text-sm font-semibold ${isTrash ? 'text-bindy-accent' : 'text-bindy-mint'}`}
                    >
                      {isTrash ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <Recycle className="h-3.5 w-3.5" />
                      )}
                      {isTrash ? 'Trash' : 'Bin'} · {report.userName}
                      {!isAdmin && ' qo‘shgan'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {report.photoUrl && (
                  <div className="mt-4 overflow-hidden rounded-3xl">
                    <img src={report.photoUrl} alt="" className="aspect-video w-full object-cover" />
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-bindy-bg p-4">
                    <p className="text-xs font-medium text-gray-500">Masofa</p>
                    <p className="mt-1 text-xl font-bold text-bindy-text">{report.distanceM} m</p>
                  </div>
                  <div className="rounded-3xl bg-bindy-bg p-4">
                    <p className="text-xs font-medium text-gray-500">Ball</p>
                    <p className="mt-1 text-xl font-bold text-bindy-mint">+{report.points}</p>
                  </div>
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
                  Bu {isTrash ? 'trash' : 'bin'} xaritadan o‘chiriladi va foydalanuvchiga{' '}
                  <strong>-{report.points} ball</strong> qo‘llanadi.
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
                <p className="mt-1 text-sm text-gray-500">Kamida 5 ta so‘z yozing — user ko‘radi</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Masalan: Rasm noto‘g‘ri, bu ofis qutisi hisoblanmaydi..."
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
