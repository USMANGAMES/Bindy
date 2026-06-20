import { useCallback, useRef, useState } from 'react'
import type { BinAnalysis, CaptureView } from '../types'
import { analyzeBinPhoto } from '../services/aiService'
import { useApp } from '../context/AppContext'

export function useCaptureFlow() {
  const { recordSubmission } = useApp()
  const [view, setView] = useState<CaptureView>('idle')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<BinAnalysis | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const revokePhoto = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }, [])

  const openCamera = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return

      revokePhoto(photoUrl)
      setPhotoFile(file)
      setPhotoUrl(URL.createObjectURL(file))
      setView('preview')
    },
    [photoUrl, revokePhoto],
  )

  const retake = useCallback(() => {
    revokePhoto(photoUrl)
    setPhotoUrl(null)
    setPhotoFile(null)
    setAnalysis(null)
    setView('idle')
    setTimeout(() => fileInputRef.current?.click(), 200)
  }, [photoUrl, revokePhoto])

  const send = useCallback(async () => {
    if (!photoFile) return
    setView('processing')

    const result = await analyzeBinPhoto(photoFile)

    if (result.ok) {
      setAnalysis(result.data)
      recordSubmission(result.data, photoUrl ?? undefined)
      setView('success')
    } else {
      setView('error')
    }
  }, [photoFile, photoUrl, recordSubmission])

  const backToMap = useCallback(() => {
    revokePhoto(photoUrl)
    setPhotoUrl(null)
    setPhotoFile(null)
    setAnalysis(null)
    setView('idle')
  }, [photoUrl, revokePhoto])

  const tryAgain = useCallback(() => {
    revokePhoto(photoUrl)
    setPhotoUrl(null)
    setPhotoFile(null)
    setAnalysis(null)
    setView('idle')
    setTimeout(() => fileInputRef.current?.click(), 300)
  }, [photoUrl, revokePhoto])

  return {
    view,
    photoUrl,
    analysis,
    fileInputRef,
    openCamera,
    handleFileChange,
    retake,
    send,
    backToMap,
    tryAgain,
    isActive: view !== 'idle',
  }
}
