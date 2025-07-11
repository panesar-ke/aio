import type { JWTPayload } from 'jose'

export type ColorVariant = 'success' | 'warning' | 'error' | 'info'

export interface User {
  id: string
  name: string
  email: string
  image: string | null
  hasAdminPriviledges: boolean
}

export interface SessionPayload extends JWTPayload {
  userId: string
  sessionId: string
  expiresAt: Date
}

export interface Session {
  id: string
  userId: string
  expiresAt: Date
  createdAt: Date
  ipAddress?: string
  userAgent?: string
}

export interface SessionWithUser extends Session {
  user: User
}
