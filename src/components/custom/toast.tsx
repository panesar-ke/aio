'use client';

import type { Toast, ToastPosition } from 'react-hot-toast';

import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';

import type { ColorVariant } from '@/types/index.types';

import { cn } from '@/lib/utils';

const ICONS = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
} as const;

const TOKENS: Record<
  ColorVariant,
  { card: string; icon: string; title: string; message: string; bar: string }
> = {
  success: {
    card: 'bg-emerald-50 border-emerald-200/80',
    icon: 'text-emerald-600',
    title: 'text-emerald-900',
    message: 'text-emerald-800/70',
    bar: 'bg-emerald-500/60',
  },
  error: {
    card: 'bg-rose-50 border-rose-200/80',
    icon: 'text-rose-600',
    title: 'text-rose-900',
    message: 'text-rose-800/70',
    bar: 'bg-rose-500/60',
  },
  warning: {
    card: 'bg-amber-50 border-amber-200/80',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    message: 'text-amber-800/70',
    bar: 'bg-amber-500/60',
  },
  info: {
    card: 'bg-blue-50 border-blue-200/80',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-800/70',
    bar: 'bg-blue-500/60',
  },
};

/**
 * The exit has to hold its final frame (`fill-mode-forwards`): tw-animate-css
 * defaults `animation-fill-mode` to `none`, so the card would otherwise snap
 * back to fully visible the instant the animation ends. EXIT_MS is handed to
 * react-hot-toast as `removeDelay` so the node unmounts as the animation lands
 * rather than lingering.
 */
const EXIT_MS = 180;

function animation(visible: boolean) {
  return visible
    ? 'animate-in fade-in-0 zoom-in-95 slide-in-from-top-3 duration-200 ease-out'
    : 'animate-out fade-out-0 zoom-out-95 slide-out-to-top-2 fill-mode-forwards duration-[180ms] ease-in';
}

interface ToastCardProps {
  t: Toast;
  variant: ColorVariant;
  title: string;
  message?: string;
  duration: number;
}

function ToastCard({ t, variant, title, message, duration }: ToastCardProps) {
  const Icon = ICONS[variant];
  const tokens = TOKENS[variant];

  return (
    <div
      className={cn(
        'pointer-events-auto w-[380px] max-w-[calc(100vw-2rem)] font-body-alt',
        animation(t.visible),
        'group relative overflow-hidden rounded-lg border px-4 py-3 shadow-sm',
        tokens.card
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn('mt-0.5 size-[18px] shrink-0', tokens.icon)}
          strokeWidth={2.25}
        />
        <div className="min-w-0 flex-1">
          <p className={cn('text-[13px] leading-5 font-semibold', tokens.title)}>
            {title}
          </p>
          {message && (
            <p
              className={cn(
                'mt-0.5 text-[13px] leading-5 break-words',
                tokens.message
              )}
            >
              {message}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => toast.dismiss(t.id)}
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-md transition-colors hover:bg-black/5',
            tokens.icon
          )}
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>
      <span
        className={cn(
          'absolute inset-x-0 bottom-0 h-[3px] origin-left group-hover:[animation-play-state:paused]',
          tokens.bar
        )}
        style={{ animation: `toast-progress ${duration}ms linear forwards` }}
      />
    </div>
  );
}

interface NotifyOptions {
  /** Defaults to the `<Toaster>` position (top-center). */
  position?: ToastPosition;
}

function show(
  variant: ColorVariant,
  title: string,
  message?: string,
  options?: NotifyOptions
) {
  const duration = variant === 'error' ? 6000 : 4000;

  return toast.custom(
    t => (
      <ToastCard
        t={t}
        variant={variant}
        title={title}
        message={message}
        duration={duration}
      />
    ),
    { duration, removeDelay: EXIT_MS, position: options?.position }
  );
}

export const notify = {
  success: (title: string, message?: string, options?: NotifyOptions) =>
    show('success', title, message, options),
  error: (title: string, message?: string, options?: NotifyOptions) =>
    show('error', title, message, options),
  warning: (title: string, message?: string, options?: NotifyOptions) =>
    show('warning', title, message, options),
  info: (title: string, message?: string, options?: NotifyOptions) =>
    show('info', title, message, options),
};
