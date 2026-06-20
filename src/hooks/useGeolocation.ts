import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_CENTER } from '../data/bins'

type GeoState = {
  position: [number, number]
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: DEFAULT_CENTER,
    loading: true,
    error: null,
  })

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ position: DEFAULT_CENTER, loading: false, error: 'Geolocation unavailable' })
      return
    }

    setState((s) => ({ ...s, loading: true }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: [pos.coords.latitude, pos.coords.longitude],
          loading: false,
          error: null,
        })
      },
      () => {
        setState({ position: DEFAULT_CENTER, loading: false, error: 'Location denied' })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, refresh }
}
