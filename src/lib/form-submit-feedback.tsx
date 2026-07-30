"use client";

import { ToastContent } from "@/components/custom/toast";
import toast from "react-hot-toast";
import type { ActionResult } from "./actions/types";

type HandleSubmitFeedbackParams<T> = {
  action: () => Promise<ActionResult<T>>;
  errorTitle: string;
  successTitle: string;
  fallbackMessage: string;
  onSuccess: (data?: T) => void;
};

export async function handleSubmitFeedback<T>({
  action,
  errorTitle,
  successTitle,
  fallbackMessage,
  onSuccess,
}: HandleSubmitFeedbackParams<T>) {
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
    onSuccess(res.data);
  } catch {
    toast.error(() => (
      <ToastContent title={errorTitle} message={fallbackMessage} />
    ));
  }
}
