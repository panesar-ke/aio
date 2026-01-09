import type { z } from 'zod';
import type {
  jobTrackerSchema,
  reportFilterSchema,
} from '@/features/production/cnc/utils/schema';

export type JobTrackerFormValues = z.infer<typeof jobTrackerSchema>;

export type CNCCacheTag = 'job-tracking';

export type ReportFilterSchema = z.infer<typeof reportFilterSchema>;
