import { useCallback, useEffect, useState } from 'react'
import { fetchWalkingRoute } from '../services/routingService'
import { haversineMeters } from '../utils/geo'
import type { MapTarget, RouteResult } from '../types'

export function useNavigation(userPosition: [number, number]) {
  const [destination, setDestination] = useState<MapTarget | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [remainingM, setRemainingM] = useState(0)

  const stopNavigation = useCallback(() => {
    setDestination(null)
    setRoute(null)
    setRemainingM(0)
    setLoading(false)
  }, [])

  const startNavigation = useCallback(
    async (target: MapTarget) => {
      setDestination(target)
      setLoading(true)
      setRoute(null)

      const result = await fetchWalkingRoute(userPosition, [target.lat, target.lng])
      if (result) {
        setRoute(result)
        setRemainingM(result.distanceM)
      }
      setLoading(false)
    },
    [userPosition],
  )

  useEffect(() => {
    if (!destination) return
    setRemainingM(haversineMeters(userPosition, [destination.lat, destination.lng]))
  }, [userPosition, destination])

  return {
    destination,
    route,
    loading,
    remainingM,
    isNavigating: destination != null,
    startNavigation,
    stopNavigation,
  }
}
