import { env } from '@/env/server'
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '@/drizzle/schema'

const db = drizzle(env.DATABASE_URL, { schema })
export default db
