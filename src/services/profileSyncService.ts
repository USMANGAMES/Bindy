import { API_ENABLED, API_URL } from '../config/env'
import type { RedeemedCoupon, SharedReport, Submission, UserProfile, ServerUserProfile } from '../types'
import { isServerOnline } from './serverHealth'
import { publishReport } from './reportsService'
import { authHeaders } from './authHeaders'

export async function syncProfileToServer(
  username: string,
  profile: Pick<UserProfile, 'points' | 'binsReported' | 'streak' | 'submissions' | 'redeemedCoupons'>,
): Promise<ServerUserProfile | null> {
  if (!API_ENABLED || !isServerOnline()) return null
  try {
    const res = await fetch(`${API_URL || ''}/api/v1/users/profile`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        points: profile.points,
        binsReported: profile.binsReported,
        streak: profile.streak,
        submissions: profile.submissions,
        redeemedCoupons: profile.redeemedCoupons,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { profile: ServerUserProfile }
    return data.profile ?? null
  } catch {
    return null
  }
}

export async function pushPendingReports(
  username: string,
  submissions: Submission[],
  serverReports: SharedReport[],
  hiddenIds: Set<string>,
): Promise<{ reports: SharedReport[]; idMap: Map<string, string> }> {
  const serverIds = new Set(serverReports.map((r) => r.id))
  const pending = submissions.filter(
    (s) =>
      s.lat != null &&
      s.lng != null &&
      !serverIds.has(s.id) &&
      !hiddenIds.has(s.id),
  )

  const pushed: SharedReport[] = []
  const idMap = new Map<string, string>()

  for (const s of pending) {
    const published = await publishReport({
      lat: s.lat!,
      lng: s.lng!,
      category: s.category,
      type: s.type,
      label: s.label ?? (s.category === 'trash' ? 'Noqonuniy musor' : 'Recycling bin'),
      photoUrl: s.photoUrl,
      userName: username,
      points: s.points,
    })
    if (published) {
      pushed.push(published.report)
      idMap.set(s.id, published.report.id)
    }
  }

  return { reports: [...pushed, ...serverReports], idMap }
}

export function mergeUserProfile(
  local: UserProfile,
  server: ServerUserProfile | null | undefined,
): UserProfile {
  if (!server) return local

  const submissionMap = new Map<string, Submission>()
  for (const s of server.submissions ?? []) {
    if (s.id) submissionMap.set(s.id, s)
  }
  for (const s of local.submissions) {
    if (s.id) submissionMap.set(s.id, s)
  }
  const submissions = [...submissionMap.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50)

  const couponMap = new Map<string, RedeemedCoupon>()
  for (const c of server.redeemedCoupons ?? []) {
    if (c.productId) couponMap.set(c.productId, c)
  }
  for (const c of local.redeemedCoupons) {
    if (c.productId) couponMap.set(c.productId, c)
  }

  return {
    ...local,
    points: typeof server.points === 'number' ? server.points : local.points,
    binsReported:
      typeof server.binsReported === 'number'
        ? server.binsReported
        : typeof server.reports === 'number'
          ? server.reports
          : local.binsReported,
    streak: typeof server.streak === 'number' ? server.streak : local.streak,
    submissions,
    redeemedCoupons: [...couponMap.values()],
  }
}
