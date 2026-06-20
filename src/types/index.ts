export type AppTab = 'map' | 'leaderboard' | 'profile'

export type CaptureView = 'idle' | 'preview' | 'processing' | 'success' | 'error'

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
}

export type BinAnalysis = {
  type: BinType
  confidence: number
  points: number
  label: string
}

export type Submission = {
  id: string
  type: BinType
  points: number
  createdAt: string
  photoUrl?: string
}

export type LeaderboardEntry = {
  rank: number
  name: string
  points: number
  bins: number
  avatar: string
  isYou?: boolean
}

export type UserProfile = {
  name: string
  points: number
  binsReported: number
  streak: number
  submissions: Submission[]
}

export type AppState = {
  globalBinCount: number
  hasSeenSplash: boolean
  profile: UserProfile
}
