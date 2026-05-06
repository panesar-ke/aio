import { jsx } from 'react/jsx-runtime';
import { Resend } from 'resend';

import { SubscriptionExpirationReminder } from '@/emails/subscription-reminder';
import { env } from '@/env/server';

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
