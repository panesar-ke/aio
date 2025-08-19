import { z } from 'zod';
import { requiredStringSchemaEntry } from '@/lib/schema-rules';

export const loginSchema = z.object({
  userName: requiredStringSchemaEntry('Email/contact is required'),
  password: requiredStringSchemaEntry('Password is required').min(
    6,
    'Password must be at least 8 characters long'
  ),
});
