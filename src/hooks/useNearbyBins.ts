import { useMemo } from 'react'
import { SEED_BINS } from '../data/bins'
import { haversineKm } from '../utils/geo'
import type { RecyclingBin } from '../types'

export function useNearbyBins(userPosition: [number, number], radiusKm = 1) {
  return useMemo(() => {
    return SEED_BINS.map((bin) => ({
      ...bin,
      distanceKm: haversineKm(userPosition[0], userPosition[1], bin.lat, bin.lng),
    }))
      .map((bin) => ({
        ...bin,
        distanceM: Math.round(bin.distanceKm * 1000),
      }))
      .filter((bin) => bin.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceM - b.distanceM)
  }, [userPosition, radiusKm])
}

export type NearbyBin = RecyclingBin & { distanceM: number; distanceKm: number }
