import { drizzle } from 'drizzle-orm/node-postgres';
import 'dotenv/config';

import * as schema from '@/drizzle/schema';
import { env } from '@/env/server';

const db = drizzle(env.DATABASE_URL, { schema });
export default db;
