'use client';

import { ToastContent } from '@/components/custom/toast';
import toast from 'react-hot-toast';

type SubmitResult = {
  error: boolean;
  message: string;
};

type HandleSubmitFeedbackParams = {
  action: () => Promise<SubmitResult>;
  errorTitle: string;
  successTitle: string;
  fallbackMessage: string;
  onSuccess: () => void;
};

export async function handleSubmitFeedback({
  action,
  errorTitle,
  successTitle,
  fallbackMessage,
  onSuccess,
}: HandleSubmitFeedbackParams) {
  try {
    const res = await action();

    if (res.error) {
      toast.error(() => (
        <ToastContent title={errorTitle} message={res.message} />
      ));
      return;
    }

    toast.success(() => (
      <ToastContent title={successTitle} message={res.message} />
    ));
    onSuccess();
  } catch {
    toast.error(() => (
      <ToastContent title={errorTitle} message={fallbackMessage} />
    ));
  }
}
