import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    SMS_API_KEY: z.string().min(1),
    SMS_USER_NAME: z.string().min(1),
    SMS_SENDER_ID: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().optional(),
    IT_MANAGER_EMAIL: z.email().optional(),
    CRON_SECRET: z.string().min(1).optional(),
    BCRYPT_ROUNDS: z.string().min(1),
    SESSION_SECRET: z.string().min(1),
    SECONDARY_API_URL: z.string().min(1),
    ARCJET_KEY: z.string().min(1),
    EXCHANGE_RATE_API_KEY: z.string().min(1),
    APP_URL: z.url(),
    SUPPORT_EMAIL: z.email().default('support@panesar.co.ke'),
    PASSWORD_POLICY_DEADLINE: z.iso.datetime().optional(),
    // VERCEL_URL: z.string().min(1),
  },
  runtimeEnv: process.env,
});
