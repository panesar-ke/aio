import { defineConfig } from 'drizzle-kit'
import { env } from '@/env/server'
import 'dotenv/config'

export default defineConfig({
  out: './src/drizzle/migrations',
  schema: './src/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
