export type DrawingTool = 'pen' | 'marker' | 'eraser'

export type StrokeData = {
  id: string
  tool: DrawingTool
  color: string
  size: number
  points: { x: number; y: number }[]
  userId: string
  timestamp: number
}

export type User = {
  id: string
  email?: string
  display_name?: string
  avatar_url?: string
}

export type PresenceUser = {
  userId: string
  metadata?: {
    name?: string
    avatar?: string
    tool?: string
    color?: string
  }
  joinedAt: number
  lastSeen: number
}