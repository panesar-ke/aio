import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

import { env } from '@/env/server';

export default defineConfig({
  out: './src/drizzle/migrations',
  schema: './src/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
