"use client";

import type { Route } from "next";

import { BellDot } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useMarkNotificationAsRead,
  useRecentNotifications,
} from "@/features/global/hooks/use-notifications";

export function NotificationDropdown() {
  const { data, isLoading } = useRecentNotifications();
  const { mutate: markAsRead } = useMarkNotificationAsRead();

  const totalCount = data?.totalCount ?? 0;
  const notificationsList = data?.notifications ?? [];

  const formatBadgeCount = (count: number) => {
    if (count > 99) return "99+";
    if (count > 9) return "9+";
    return count.toString();
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id);
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative size-8 rounded-full border grid place-content-center cursor-pointer hover:bg-accent focus:outline-none"
              aria-label="Notifications"
            >
              <BellDot className="size-4 text-muted-foreground" />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {formatBadgeCount(totalCount)}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent className="rounded-full">
          <p>Notifications</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between font-semibold">
          <span>Notifications</span>
          {totalCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {totalCount} unread
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notificationsList.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notificationsList.map((item) => (
            <DropdownMenuItem key={item.id} asChild className="cursor-pointer">
              <Link
                href={item.path as Route}
                prefetch={false}
                onClick={() => handleNotificationClick(item.id, item.isRead)}
                className="flex flex-col items-start gap-1 p-2 relative"
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span
                    className={`font-medium text-sm leading-tight ${
                      !item.isRead ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item.title}
                  </span>
                  {!item.isRead && (
                    <span className="size-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {item.message}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="cursor-pointer justify-center font-medium text-primary"
        >
          <Link href={"/notifications" as Route} prefetch={false}>
            See all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
