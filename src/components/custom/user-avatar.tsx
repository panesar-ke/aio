import { initials } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import type { User } from '@/types/index.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/helpers/formatters'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  className?: string
  user: User
}

export function UserAvatar({ className, user }: UserAvatarProps) {
  const avatar = createAvatar(initials, {
    seed: user.name,
    fontFamily: ['Classico'],
    fontWeight: 500,
    fontSize: 32,
  })

  const dataUri = avatar.toDataUri()

  return (
    <Avatar
      className={cn({ 'size-10 shrink-0': open, 'size-8': !open, className })}
    >
      <AvatarImage src={user.image ?? dataUri} alt={user.name} />
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  )
}
