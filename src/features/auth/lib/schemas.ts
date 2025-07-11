import z from 'zod'
import { requiredStringSchemaEntry } from '@/lib/schema-rules'

export const loginSchema = z.object({
  userName: requiredStringSchemaEntry('Provide email or contact'),
  password: requiredStringSchemaEntry('Provide password'),
})
