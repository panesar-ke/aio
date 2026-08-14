import { z } from 'zod';

import {
  requiredStringSchemaEntry,
  requiredTrimmedStringSchemaEntry,
} from '@/lib/schema-rules';

export const loginSchema = z.object({
  userName: requiredStringSchemaEntry('Email/contact is required'),
  password: requiredTrimmedStringSchemaEntry('Password is required').min(
    6,
    'Password must be at least 6 characters long'
  ),
});
