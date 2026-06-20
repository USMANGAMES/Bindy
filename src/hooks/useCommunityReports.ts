import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { haversineMeters } from '../utils/geo'
import type { SharedReport } from '../types'

export function useCommunityReports(userPosition: [number, number]) {
  const { state, sharedReports } = useApp()

  return useMemo(() => {
    const localReports: SharedReport[] = state.profile.submissions
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({
        id: s.id,
        lat: s.lat!,
        lng: s.lng!,
        category: s.category,
        type: s.type,
        label: s.label ?? (s.category === 'trash' ? 'Noqonuniy musor' : 'Recycling bin'),
        photoUrl: s.photoUrl,
        userName: state.profile.name,
        createdAt: s.createdAt,
        points: s.points,
      }))

    const byId = new Map<string, SharedReport>()
    for (const r of [...sharedReports, ...localReports]) {
      byId.set(r.id, r)
    }

    const all = [...byId.values()]
      .map((r) => ({
        ...r,
        distanceM: haversineMeters(userPosition, [r.lat, r.lng]),
      }))
      .sort((a, b) => a.distanceM - b.distanceM)

    return {
      all,
      trash: all.filter((r) => r.category === 'trash'),
      bins: all.filter((r) => r.category === 'bin'),
    }
  }, [sharedReports, state.profile.submissions, state.profile.name, userPosition])
}

export type CommunityReport = ReturnType<typeof useCommunityReports>['all'][number]

export function toMapTarget(report: CommunityReport) {
  return {
    id: report.id,
    lat: report.lat,
    lng: report.lng,
    name: report.label,
    distanceM: report.distanceM,
  }
}
