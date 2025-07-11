import { useSession } from '@tanstack/react-start/server'
import type { User } from '@/types/index.types'
import { env } from '@/env/server'

export function useAppSession() {
  return useSession<User>({
    password: env.SESSION_SECRET,
  })
}
