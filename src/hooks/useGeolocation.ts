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
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>(() => ({
    position: getInitialPosition(),
    accuracy: null,
    loading: true,
    error: null,
    isCoarse: false,
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
      }))
      return
    }

    stopWatch()
    setState((s) => ({ ...s, loading: true }))

    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords
      const roundedAcc = Math.round(accuracy)

      // 1. ФИЛЬТР СОТОВЫХ ВЫШЕК (Cell-ID / Coarse Network)
      // Если точность хуже 200 метров — это сотовая вышка оператора.
      if (roundedAcc > MAX_ACCEPTABLE_ACCURACY_METERS) {
        // Если у нас уже есть точная позиция (дом по Wi-Fi или GPS),
        // мы КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕМ переносить маркер на вышку связи в 1 км!
        if (hasAccurateFixRef.current) {
          return
        }

        // Если это первый запуск в помещении:
        // фиксируем как приблизительную, но не выдаем за точный уличный GPS
        setState((s) => ({
          ...s,
          position: [latitude, longitude],
          accuracy: roundedAcc,
          loading: false,
          error: null,
          isCoarse: true,
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
      })
    }

    const handleError = (err: GeolocationPositionError) => {
      // Пользователь запретил доступ к геопозиции
      if (err.code === 1) {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Geolokatsiyaga ruxsat berilmadi. Sozlamalardan ruxsat bering.',
        }))
        stopWatch()
        return
      }

      // При таймауте спутников (код 3) или временной недоступности (код 2)
      // НИ В КОЕМ СЛУЧАЕ НЕ ВЫЗЫВАЕМ enableHighAccuracy: false!
      // watchPosition продолжает слушать датчики в фоне и поймает спутники/Wi-Fi
      if (!hasAccurateFixRef.current) {
        setState((s) => ({
          ...s,
          loading: false,
          error: null,
        }))
      }
    }

    // Профессиональная конфигурация навигатора (Google Maps / Leaflet standard):
    // - enableHighAccuracy: ВСЕГДА true (включает аппаратный GPS на улице + Wi-Fi WPS сканирование дома)
    // - timeout: 30000 (30 секунд на холодный старт чипа)
    // - maximumAge: 0 (запрет отдавать старые вышки связи из кэша)
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
