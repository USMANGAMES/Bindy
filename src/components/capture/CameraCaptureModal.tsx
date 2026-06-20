import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, SwitchCamera, X } from 'lucide-react'

type CameraCaptureModalProps = {
  onCapture: (file: File) => void
  onClose: () => void
}

export function CameraCaptureModal({ onCapture, onClose }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      setReady(false)
      setError(null)
      streamRef.current?.getTracks().forEach((t) => t.stop())

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch {
        setError('Kameraga ruxsat bering va qayta urinib ko‘ring')
      }
    }

    startCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [facingMode])

  const capture = () => {
    const video = videoRef.current
    if (!video || !ready) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        streamRef.current?.getTracks().forEach((t) => t.stop())
        onCapture(new File([blob], `bindy-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1100] flex flex-col bg-black"
    >
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-white">Rasmga olish</p>
        <button
          type="button"
          onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm"
        >
          <SwitchCamera className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-white/80">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-3xl bg-white px-6 py-3 text-sm font-semibold text-bindy-text"
            >
              Orqaga
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-white/30" />
          </>
        )}
      </div>

      <div className="flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <button
          type="button"
          onClick={capture}
          disabled={!ready}
          aria-label="Rasmga olish"
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-white bg-bindy-mint text-white shadow-fab disabled:opacity-40"
        >
          <Camera className="h-7 w-7" />
        </button>
      </div>
    </motion.div>
  )
}
