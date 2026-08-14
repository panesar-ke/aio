import { jsx } from "react/jsx-runtime";
import { Resend } from "resend";

import { PasswordResetEmail } from "@/emails/password-reset";
import { SubscriptionExpirationReminder } from "@/emails/subscription-reminder";
import { env } from "@/env/server";
import { RESET_TOKEN_TTL_MINUTES } from "@/features/auth/utils/reset-token";

const resend = new Resend(env.RESEND_API_KEY);

type SendSubscriptionReminderEmailParams = {
  to: string;
  subject: string;
  idempotencyKey: string;
  subscriptionName: string;
  expiryDays: number;
  expiryDate: string;
};

export async function sendSubscriptionReminderEmail(
  params: SendSubscriptionReminderEmailParams,
) {
  return resend.emails.send(
    {
      from: env.RESEND_FROM_EMAIL!,
      to: params.to,
      subject: params.subject,
      react: jsx(SubscriptionExpirationReminder, {
        subscriptionName: params.subscriptionName,
        expiryDays: params.expiryDays,
        expiryDate: params.expiryDate,
      }),
    },
    { idempotencyKey: params.idempotencyKey },
  );
}

type SendPasswordResetEmailParams = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams,
) {
  if (!env.RESEND_FROM_EMAIL) {
    // Configuration error, not a user error — surfacing it beats sending
    // password mail from a placeholder address.
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: params.to,
    subject: "Reset your password",
    react: jsx(PasswordResetEmail, {
      name: params.name,
      resetUrl: params.resetUrl,
      // SVG is stripped by Gmail and Outlook; the PNG is the only safe choice.
      logoUrl: `${env.APP_URL}/logos/logo-black.png`,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      supportEmail: env.SUPPORT_EMAIL,
    }),
  });

  if (error) {
    throw new Error(error.message);
  }
}
