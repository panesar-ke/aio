'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useTransition } from 'react';
import toast from 'react-hot-toast';

import { ToastContent } from '@/components/custom/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LoadingSwap } from '@/components/ui/loading-swap';

export function ActionButton({
  action,
  requireAreYouSure = false,
  onSuccess,
  areYouSureDescription = 'This action cannot be undone.',
  ...props
}: ComponentProps<typeof Button> & {
  action: () => Promise<{ error: boolean; message?: string }>;
  onSuccess?: () => void;
  requireAreYouSure?: boolean;
  areYouSureDescription?: ReactNode;
}) {
  const [isLoading, startTransition] = useTransition();

  function performAction() {
    startTransition(async () => {
      const data = await action();
      if (data.error) {
        toast.error(() => (
          <ToastContent
            title="Something went wrong"
            message={data.message ?? 'Error'}
          />
        ));
        return;
      }

      onSuccess?.();
    });
  }

  if (requireAreYouSure) {
    return (
      <AlertDialog open={isLoading ? true : undefined}>
        <AlertDialogTrigger asChild>
          <Button {...props} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {areYouSureDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={performAction}>
              <LoadingSwap isLoading={isLoading}>Yes</LoadingSwap>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Button
      {...props}
      disabled={props.disabled ?? isLoading}
      onClick={e => {
        performAction();
        props.onClick?.(e);
      }}
    >
      <LoadingSwap
        isLoading={isLoading}
        className="inline-flex items-center gap-2"
      >
        {props.children}
      </LoadingSwap>
    </Button>
  );
}
