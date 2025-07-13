import { initials } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import type { User } from '@/types/index.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/helpers/formatters'

interface UserAvatarProps {
  user: User
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const avatar = createAvatar(initials, {
    seed: user.name,
    fontFamily: ['Open Sans'],
    fontWeight: 500,
    fontSize: 32,
  })

  const dataUri = avatar.toDataUri()

  return (
    <Avatar className={cn('size-10 shrink-0', className)}>
      <AvatarImage src={user.image ?? dataUri} alt={user.name} />
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  )
}

export function CreatorAvatar({
  userName,
  image,
  className,
}: {
  className?: string
  userName: string
  image?: string
}) {
  const avatar = createAvatar(initials, {
    seed: userName,
    fontFamily: ['Open Sans'],
    fontWeight: 500,
    fontSize: 32,
  })

  const dataUri = avatar.toDataUri()

  return (
    <Avatar className={cn('size-8 shrink-0', className)}>
      <AvatarImage src={image ?? dataUri} alt={userName} />
      <AvatarFallback>{getInitials(userName)}</AvatarFallback>
    </Avatar>
  )
}
