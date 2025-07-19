import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SMS_API_KEY: z.string().min(1),
    SMS_USER_NAME: z.string().min(1),
    SMS_SENDER_ID: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    UPLOADTHING_SECRET: z.string().min(1),
    UPLOADTHING_APP_ID: z.string().min(1),
    BCRYPT_ROUNDS: z.string().min(1),
    SESSION_SECRET: z.string().min(1),
    PORT: z.string().min(1),
    SENTRY_AUTH_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
})
