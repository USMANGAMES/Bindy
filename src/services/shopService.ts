import { apiFetch } from './apiClient'
import type { RedeemedCoupon, ServerUserProfile } from '../types'

export type RedeemShopResponse = {
  ok: boolean
  code?: string
  coupon?: RedeemedCoupon
  profile?: ServerUserProfile
  userStats?: {
    username: string
    points: number
    reports: number
    streak: number
  }
  reason?: string
}

export async function redeemShopProduct(
  username: string,
  productId: string,
  cost: number,
  code?: string,
): Promise<RedeemShopResponse> {
  try {
    return await apiFetch<RedeemShopResponse>('/api/v1/shop/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        cost,
        code,
        username,
      }),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server bilan aloqa yo‘q'
    return { ok: false, reason: message }
  }
}
