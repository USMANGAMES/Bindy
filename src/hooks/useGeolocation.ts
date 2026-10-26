import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_CENTER } from '../data/bins'

type GeoState = {
  position: [number, number]
  accuracy: number | null
  loading: boolean
  error: string | null
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0, // Force fresh hardware GPS lock, do not accept stale cell tower cache
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

    // Quick initial high-accuracy query
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        })
      },
      () => {
        // Non-blocking: watchPosition will follow up
      },
      GEO_OPTIONS,
    )

    // Continuous watch so satellite lock refines accuracy down to 3-10 meters
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: err.code === 1 ? 'Location denied' : err.message,
        }))
      },
      GEO_OPTIONS,
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
