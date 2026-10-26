import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_CENTER } from '../data/bins'

type GeoState = {
  position: [number, number]
  accuracy: number | null
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: DEFAULT_CENTER,
    accuracy: null,
    loading: true,
    error: null,
  })

  const watchIdRef = useRef<number | null>(null)

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const startWatch = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ position: DEFAULT_CENTER, accuracy: null, loading: false, error: 'Geolocation unavailable' })
      return
    }

    stopWatch()
    setState((s) => ({ ...s, loading: true }))

    const handleSuccess = (pos: GeolocationPosition) => {
      setState({
        position: [pos.coords.latitude, pos.coords.longitude],
        accuracy: Math.round(pos.coords.accuracy),
        loading: false,
        error: null,
      })
    }

    const handleError = (err: GeolocationPositionError) => {
      // If high accuracy times out (e.g. indoors), try standard location
      if (err.code !== 1) {
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (fallbackErr) => {
            setState((s) => ({
              ...s,
              loading: false,
              error: fallbackErr.code === 1 ? 'Location denied' : fallbackErr.message,
            }))
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 },
        )
      } else {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Location denied',
        }))
      }
    }

    // Try high accuracy first (hardware GPS satellites)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 },
    )

    // And watch continuously so position refines live
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    )
  }, [stopWatch])

  const refresh = useCallback(() => {
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
