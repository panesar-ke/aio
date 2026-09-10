import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

import { env } from '@/env/server';

const url = process.env.NEON_DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'Database URL is not defined. Please set the NEON_DATABASE_URL_UNPOOLED or DATABASE_URL environment variable.',
  );
}

export default defineConfig({
  out: './src/drizzle/migrations',
  schema: './src/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
});
