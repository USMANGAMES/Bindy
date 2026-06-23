export type AppTab = 'map' | 'shop' | 'leaderboard' | 'profile'

export type CaptureView =
  | 'idle'
  | 'camera'
  | 'preview'
  | 'processing'
  | 'success'
  | 'error'

export type ReportCategory = 'bin' | 'trash'

export type BinSizeClass = 'street' | 'wheel' | 'large'

export type BinType = 'plastic' | 'glass' | 'paper' | 'mixed' | 'organic'

export type RecyclingBin = {
  id: string
  lat: number
  lng: number
  name: string
  type: BinType
  fillLevel: number
  verified: boolean
  distance?: number
  distanceM?: number
}

export type BinAnalysis = {
  type: BinType
  confidence: number
  points: number
  label: string
  category: ReportCategory
  binSize?: BinSizeClass
}

export type Submission = {
  id: string
  type: BinType
  category: ReportCategory
  points: number
  createdAt: string
  photoUrl?: string
  lat?: number
  lng?: number
  label?: string
}

/** Map marker target — bin or user report */
export type MapTarget = {
  id: string
  lat: number
  lng: number
  name: string
  distanceM?: number
}

export type RouteResult = {
  coordinates: [number, number][]
  distanceM: number
  durationMin: number
}

export type LeaderboardEntry = {
  rank: number
  name: string
  points: number
  bins: number
  avatar: string
  isYou?: boolean
}

export type SharedReport = {
  id: string
  lat: number
  lng: number
  category: ReportCategory
  type: BinType
  label: string
  photoUrl?: string
  userName: string
  createdAt: string
  points: number
  distanceM?: number
}

export type ShopProduct = {
  id: string
  brand: string
  name: string
  description: string
  discountPercent: number
  pointsCost: number
  emoji: string
  color: string
}

export type RedeemedCoupon = {
  productId: string
  code: string
  redeemedAt: string
}

export type UserProfile = {
  name: string
  points: number
  binsReported: number
  streak: number
  submissions: Submission[]
  redeemedCoupons: RedeemedCoupon[]
}

export type AppState = {
  globalBinCount: number
  hasSeenSplash: boolean
  profile: UserProfile
}

export type BindyNotification = {
  id: string
  type: 'report_deleted' | string
  title: string
  message: string
  reason?: string
  pointsDelta: number
  reportLabel?: string
  category?: ReportCategory
  adminUser?: string
  createdAt: string
  read: boolean
}

export type LeaderboardUser = {
  username: string
  points: number
  reports: number
}

export type MapStats = {
  totalBins: number
  seedBins: number
  communityBins: number
  trashReports: number
  totalReports: number
  totalUsers: number
}

export type LiveSnapshot = {
  stats: MapStats
  reports: SharedReport[]
  hiddenIds: string[]
  leaderboard: { totalUsers: number; top: LeaderboardUser[] }
  notifications: BindyNotification[]
  userStats?: { username: string; points: number; reports: number } | null
  userProfile?: ServerUserProfile | null
}

export type ServerUserProfile = {
  username: string
  points: number
  reports: number
  binsReported?: number
  streak?: number
  submissions?: Submission[]
  redeemedCoupons?: RedeemedCoupon[]
}
