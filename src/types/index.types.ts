import type { FileRoutesByTo } from '@/routeTree.gen'
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

export interface WithId {
  id: string
}

export interface WithName {
  name: string
}

export interface WithCreatedAt {
  createdAt: string
}

export interface WithIdAndName extends WithId, WithName {}

export interface IsEdit {
  isEdit?: boolean
}

export type IsEditRequired = Required<IsEdit>

export interface IsPending {
  isPending: boolean
}

export interface Form {
  id: number
  formName: string
  module: string
  path: string
}

export interface Option {
  value: string
  label: string
}

export type TRoutes = keyof FileRoutesByTo
