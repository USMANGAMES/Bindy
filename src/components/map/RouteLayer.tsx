import { useEffect } from 'react'
import { Polyline, useMap } from 'react-leaflet'
import type { RouteResult } from '../../types'

export function RouteLayer({ route }: { route: RouteResult | null }) {
  if (!route || route.coordinates.length < 2) return null

  return (
    <Polyline
      positions={route.coordinates}
      pathOptions={{
        color: '#10B981',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  )
}

export function RouteFitBounds({ route }: { route: RouteResult | null }) {
  const map = useMap()

  useEffect(() => {
    if (!route || route.coordinates.length < 2) return
    map.fitBounds(route.coordinates, { padding: [100, 40], animate: true, maxZoom: 17 })
  }, [route, map])

  return null
}

export function NavigationFollow({ userPosition, active }: { userPosition: [number, number]; active: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (!active) return
    map.panTo(userPosition, { animate: true, duration: 0.8 })
  }, [userPosition, active, map])

  return null
}
