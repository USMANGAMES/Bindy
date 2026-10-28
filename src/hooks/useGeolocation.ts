import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_CENTER } from '../data/bins'

// Вышки сотовой связи (Cell-ID) дают погрешность 800м - 2500м.
// Домашние Wi-Fi роутеры дают погрешность 15м - 40м.
// Спутники GPS дают погрешность 3м - 15м.
const MAX_ACCEPTABLE_ACCURACY_METERS = 200
const LAST_POS_KEY = 'bindy-last-pos'

function getInitialPosition(): [number, number] {
  try {
    const raw = localStorage.getItem(LAST_POS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as [number, number]
      if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[0] === 'number') {
        return parsed
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CENTER
}

type GeoState = {
  position: [number, number]
  accuracy: number | null
  loading: boolean
  error: string | null
  isCoarse: boolean
  hasAccurateFix: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>(() => ({
    position: getInitialPosition(),
    accuracy: null,
    loading: true,
    error: null,
    isCoarse: false,
    hasAccurateFix: false,
  }))

  const watchIdRef = useRef<number | null>(null)
  const hasAccurateFixRef = useRef<boolean>(false)

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const startWatch = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Geolokatsiya brauzer tomonidan qo‘llab-quvvatlanmaydi',
        isCoarse: false,
        hasAccurateFix: false,
      }))
      return
    }

    stopWatch()
    setState((s) => ({ ...s, loading: true }))

    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords
      const roundedAcc = Math.round(accuracy)

      // 1. ФИЛЬТР СОТОВЫХ ВЫШЕК (Cell-ID / Coarse Network)
      // Если точность хуже 200 метров — это сотовая вышка оператора или режим "Приблизительно".
      if (roundedAcc > MAX_ACCEPTABLE_ACCURACY_METERS) {
        // Если у нас уже есть точная позиция (дом по Wi-Fi или GPS),
        // мы категорически запрещаем сбивать её на вышку связи в 1 км!
        if (hasAccurateFixRef.current) {
          return
        }

        // Если режим приближенный:
        // НЕ обновляем position сотовой вышкой, чтобы не показывать ложную точку на карте!
        setState((s) => ({
          ...s,
          accuracy: roundedAcc,
          loading: false,
          error: null,
          isCoarse: true,
          hasAccurateFix: false,
        }))
        return
      }

      // 2. ВЫСОКОТОЧНЫЙ СИГНАЛ (Домашний Wi-Fi или спутники GPS)
      hasAccurateFixRef.current = true

      try {
        localStorage.setItem(LAST_POS_KEY, JSON.stringify([latitude, longitude]))
      } catch {
        /* ignore */
      }

      setState({
        position: [latitude, longitude],
        accuracy: roundedAcc,
        loading: false,
        error: null,
        isCoarse: false,
        hasAccurateFix: true,
      })
    }

    const handleError = (err: GeolocationPositionError) => {
      // Пользователь запретил доступ к геопозиции
      if (err.code === 1) {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Geolokatsiyaga ruxsat berilmadi. Sozlamalardan ruxsat bering.',
          hasAccurateFix: false,
        }))
        stopWatch()
        return
      }

      // При таймауте спутников (код 3) или временной недоступности (код 2)
      // watchPosition продолжает слушать датчики в фоне и поймает спутники/Wi-Fi
      if (!hasAccurateFixRef.current) {
        setState((s) => ({
          ...s,
          loading: false,
          error: null,
          hasAccurateFix: false,
        }))
      }
    }

    // 1. Немедленный разогрев чипа GPS (активирует значок локации в статус-баре Android/iOS)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    )

    // 2. Непрерывный слушатель обновлений высокой точности
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      },
    )
  }, [stopWatch])

  const refresh = useCallback(() => {
    hasAccurateFixRef.current = false
    startWatch()
  }, [startWatch])

  useEffect(() => {
    startWatch()
    return () => {
      stopWatch()
    }
  }, [startWatch, stopWatch])

  return { ...state, refresh }
}
