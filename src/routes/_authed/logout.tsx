import { createFileRoute } from '@tanstack/react-router'
import { logoutFn } from '@/features/auth/server-functions'

export const Route = createFileRoute('/_authed/logout')({
  preload: false,
  loader: () => logoutFn(),
})
