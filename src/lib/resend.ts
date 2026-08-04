import { jsx } from 'react/jsx-runtime';
import { Resend } from 'resend';

import { ProductImportCompletedEmail } from '@/emails/product-import-completed';
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

type SendProductImportCompletedEmailParams = {
  to: string;
  idempotencyKey: string;
  fileName: string;
  status: 'completed' | 'completed_with_errors' | 'failed';
  successRows: number;
  failedRows: number;
};

export async function sendProductImportCompletedEmail(
  params: SendProductImportCompletedEmailParams,
) {
  return resend.emails.send(
    {
      from: env.RESEND_FROM_EMAIL!,
      to: params.to,
      subject: `Product import ${params.status === 'failed' ? 'failed' : 'complete'}: ${params.fileName}`,
      react: jsx(ProductImportCompletedEmail, {
        fileName: params.fileName,
        status: params.status,
        successRows: params.successRows,
        failedRows: params.failedRows,
      }),
    },
    { idempotencyKey: params.idempotencyKey },
  );
}
