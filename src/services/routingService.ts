import type { RouteResult } from '../types'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot'

export async function fetchWalkingRoute(
  from: [number, number],
  to: [number, number],
): Promise<RouteResult | null> {
  const [fromLat, fromLng] = from
  const [toLat, toLng] = to
  const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`

  try {
    const res = await fetch(url)
    if (!res.ok) return fallbackRoute(from, to)

    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return fallbackRoute(from, to)

    const coordinates: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng],
    )

    return {
      coordinates,
      distanceM: Math.round(route.distance),
      durationMin: Math.max(1, Math.round(route.duration / 60)),
    }
  } catch {
    return fallbackRoute(from, to)
  }
}

function fallbackRoute(from: [number, number], to: [number, number]): RouteResult {
  const distM = Math.round(
    haversineFallback(from[0], from[1], to[0], to[1]) * 1000,
  )
  return {
    coordinates: [from, to],
    distanceM: distM,
    durationMin: Math.max(1, Math.round(distM / 80)),
  }
}

function haversineFallback(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
