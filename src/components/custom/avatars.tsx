import initials from '@dicebear/styles/initials.json' with { type: 'json' };
import { Avatar as DiceBearAvatar, Style } from '@dicebear/core';

import type { User } from '@/types/index.types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User;
  className?: string;
}

const style = new Style(initials);
export function UserAvatar({ user, className }: UserAvatarProps) {
  const avatar = new DiceBearAvatar(style, {
    seed: user.name,
    fontFamily: ['Open Sans'],
    fontWeight: 500,
  });

  const dataUri = avatar.toDataUri();

  return (
    <Avatar className={cn('size-10 shrink-0', className)}>
      <AvatarImage src={user.image ?? dataUri} alt={user.name} />
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

export function CreatorAvatar({
  userName,
  image,
  className,
}: {
  className?: string;
  userName: string;
  image?: string;
}) {
  const avatar = new DiceBearAvatar(style, {
    seed: userName,
    fontFamily: ['Open Sans'],
    fontWeight: 500,
  });

  const dataUri = avatar.toDataUri();

  return (
    <Avatar className={cn('size-8 shrink-0', className)}>
      <AvatarImage src={image ?? dataUri} alt={userName} />
      <AvatarFallback>{getInitials(userName)}</AvatarFallback>
    </Avatar>
  );
}
