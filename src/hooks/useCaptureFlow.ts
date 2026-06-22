import { useCallback, useRef, useState } from 'react'
import type { BinAnalysis, CaptureView } from '../types'
import { analyzeBinPhoto } from '../services/aiService'
import { useApp } from '../context/AppContext'
import { fileToDataUrl } from '../utils/file'

export function useCaptureFlow(userPosition: [number, number]) {
  const { recordSubmission } = useApp()
  const [view, setView] = useState<CaptureView>('idle')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<BinAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const positionRef = useRef(userPosition)
  positionRef.current = userPosition

  const revokePhoto = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }, [])

  const openCamera = useCallback(() => {
    setView('camera')
  }, [])

  const setPhoto = useCallback(
    (file: File) => {
      revokePhoto(photoUrl)
      setPhotoFile(file)
      setPhotoUrl(URL.createObjectURL(file))
      setView('preview')
    },
    [photoUrl, revokePhoto],
  )

  const closeCamera = useCallback(() => {
    setView('idle')
  }, [])

  const retake = useCallback(() => {
    revokePhoto(photoUrl)
    setPhotoUrl(null)
    setPhotoFile(null)
    setAnalysis(null)
    setErrorMessage(undefined)
    setView('camera')
  }, [photoUrl, revokePhoto])

  const send = useCallback(async () => {
    if (!photoFile) return
    setView('processing')

    const result = await analyzeBinPhoto(photoFile)

    if (result.ok) {
      setAnalysis(result.data)
      setErrorMessage(undefined)
      const persistedPhoto = await fileToDataUrl(photoFile)
      await recordSubmission(result.data, {
        photoUrl: persistedPhoto,
        position: positionRef.current,
      })
      setView('success')
    } else {
      setErrorMessage(result.error)
      setView('error')
    }
  }, [photoFile, recordSubmission])

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
    setErrorMessage(undefined)
    setView('camera')
  }, [photoUrl, revokePhoto])

  return {
    view,
    photoUrl,
    analysis,
    errorMessage,
    openCamera,
    setPhoto,
    closeCamera,
    retake,
    send,
    backToMap,
    tryAgain,
    isActive: view !== 'idle',
  }
}
