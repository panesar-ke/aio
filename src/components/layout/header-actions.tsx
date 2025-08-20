'use client';
import Link from 'next/link';
import { BellDot, Lock, LogOutIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { logoutAction } from '@/features/auth/actions/auth';

export function NavbarActions() {
  return (
    <div className="ml-auto flex items-center gap-2 px-4">
      <HeaderNavItem
        toolTipContent="Change Password"
        linkPath="/"
        Icon={Lock}
      />
      <HeaderNavItem
        toolTipContent="Notifications"
        linkPath="/"
        Icon={BellDot}
      />
      <HeaderNavItem
        toolTipContent="Logout"
        asButton
        buttonAction={async () => {
          await logoutAction();
        }}
        Icon={LogOutIcon}
      />
    </div>
  );
}

interface HeaderNavItemProps {
  linkPath?: string;
  toolTipContent?: string;
  Icon: LucideIcon;
  asButton?: boolean;
  buttonAction?: () => void;
}

function HeaderNavItem({
  linkPath,
  toolTipContent,
  Icon,
  asButton,
  buttonAction,
}: HeaderNavItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        {!asButton ? (
          <Link
            href={linkPath as string}
            className="size-8 rounded-full border grid place-content-center"
          >
            <Icon className="size-4 text-muted-foreground" />
          </Link>
        ) : (
          <div
            role="button"
            onClick={buttonAction}
            className="size-8 rounded-full border grid place-content-center"
          >
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </TooltipTrigger>
      <TooltipContent className="rounded-full">
        <p>{toolTipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}
