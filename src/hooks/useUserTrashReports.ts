import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { haversineMeters } from '../utils/geo'
import type { MapTarget, Submission } from '../types'

export function useUserTrashReports(userPosition: [number, number]) {
  const { state } = useApp()

  return useMemo(() => {
    return state.profile.submissions
      .filter((s): s is Submission & { lat: number; lng: number } =>
        s.category === 'trash' && s.lat != null && s.lng != null,
      )
      .map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        name: s.label ?? 'Noqonuniy musor',
        label: s.label ?? 'Noqonuniy musor',
        createdAt: s.createdAt,
        photoUrl: s.photoUrl,
        points: s.points,
        distanceM: haversineMeters(userPosition, [s.lat, s.lng]),
      }))
      .sort((a, b) => a.distanceM - b.distanceM)
  }, [state.profile.submissions, userPosition])
}

export type UserTrashReport = ReturnType<typeof useUserTrashReports>[number]

export function toMapTarget(report: UserTrashReport): MapTarget {
  return {
    id: report.id,
    lat: report.lat,
    lng: report.lng,
    name: report.name,
    distanceM: report.distanceM,
  }
}
