'use client';

import type { Route } from 'next';

import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  useAllNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
} from '@/features/global/hooks/use-notifications';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading } = useAllNotifications(filter);
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } =
    useMarkAllNotificationsAsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your system notifications
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll}
            className="self-start sm:self-auto gap-2"
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
          className="gap-2"
        >
          Unread
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Loading notifications...
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Bell className="size-12 text-muted-foreground/50 mb-4" />
            <CardTitle className="text-lg font-medium">
              No notifications
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'unread'
                ? "You don't have any unread notifications."
                : "You don't have any notifications at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(item => (
            <Card
              key={item.id}
              className={`transition-colors ${
                !item.isRead
                  ? 'border-l-4 border-l-blue-600 bg-accent/30'
                  : 'opacity-80'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(item.createdOn).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      {item.path && (
                        <Link
                          href={item.path as Route}
                          prefetch={false}
                          onClick={() =>
                            handleNotificationClick(item.id, item.isRead)
                          }
                          className="font-medium text-primary hover:underline"
                        >
                          View details &rarr;
                        </Link>
                      )}
                    </div>
                  </div>

                  {!item.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Mark as read"
                      onClick={() => markAsRead(item.id)}
                      className="size-8 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <CheckCheck className="size-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
