import initials from '@dicebear/styles/initials.json' with { type: 'json' };
import { Avatar as DiceBearAvatar, Style } from '@dicebear/core';

import type { User } from '@/types/index.types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helpers/formatters';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  className?: string;
  user: User;
}

export function UserAvatar({ className, user }: UserAvatarProps) {
  const style = new Style(initials);
  const avatar = new DiceBearAvatar(style, {
    seed: user.name,
    fontFamily: ['Classico'],
    fontWeight: 500,
  });

  const dataUri = avatar.toDataUri();

  return (
    <Avatar
      className={cn({ 'size-10 shrink-0': open, 'size-8': !open, className })}
    >
      <AvatarImage src={user.image ?? dataUri} alt={user.name} />
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
