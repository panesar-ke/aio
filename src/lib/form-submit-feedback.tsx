"use client";

import { notify } from "@/components/custom/toast";

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
      notify.error(errorTitle, res.message);
      return;
    }

    notify.success(successTitle, res.message);
    onSuccess(res.data);
  } catch {
    notify.error(errorTitle, fallbackMessage);
  }
}
