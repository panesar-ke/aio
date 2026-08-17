'use client';

import { Progress } from '@/components/ui/progress';
import {
  MIN_PASSWORD_LENGTH,
  passwordStrength,
} from '@/features/auth/utils/password-policy';
import { cn } from '@/lib/utils';

const LEVELS = {
  weak: { value: 25, label: 'Weak', className: 'text-destructive' },
  fair: { value: 50, label: 'Fair', className: 'text-amber-600' },
  good: { value: 75, label: 'Good', className: 'text-blue-600' },
  strong: { value: 100, label: 'Strong', className: 'text-emerald-600' },
} as const;

export function PasswordStrength({ value }: { value: string }) {
  if (!value) {
    return null;
  }

  const level = LEVELS[passwordStrength(value)];

  return (
    <div className='space-y-1'>
      <Progress value={level.value} className='h-1.5' />
      <p className={cn('text-xs', level.className)}>
        {level.label} — at least {MIN_PASSWORD_LENGTH} characters, and not your
        name, email or phone number.
      </p>
    </div>
  );
}
