'use server';

import { validateFields } from '@/lib/action-validator';
import {
  SchemaValidationFailure,
  SchemaValidationSuccess,
} from '@/types/index.types';
import { jobTrackerSchema } from '@/features/production/cnc/utils/schema';
import type { JobTrackerFormValues } from '@/features/production/cnc/utils/cnc.types';
import { getCurrentUser } from '@/lib/session';
import db from '@/drizzle/db';
import { cncJobTracker } from '@/drizzle/schema';
import { dateFormat } from '@/lib/helpers/formatters';
import { revalidateJobTrackingTag } from '../utils/cache';
import { eq } from 'drizzle-orm';

const validateJobTrackerEntry = async (values: unknown) => {
  const { data, error } = validateFields<JobTrackerFormValues>(
    values,
    jobTrackerSchema
  );
  if (error !== null) {
    return {
      error: 'Invalid GRN data',
      data: null,
    } satisfies SchemaValidationFailure;
  }
  return {
    error: null,
    data,
  } satisfies SchemaValidationSuccess<JobTrackerFormValues>;
};

export const upsertJobTrackerEntry = async (values: JobTrackerFormValues) => {
  const { error, data } = await validateJobTrackerEntry(values);

  if (error !== null) {
    return { error: true, message: error };
  }

  const {
    dateReceived,
    jobCardNo,
    jobDescription,
    jobType,
    startDate,
    endDate,
    timeTaken,
    id,
  } = data;
  const isEdit = !!id;

  try {
    const user = await getCurrentUser();

    if (!user) return { error: true, message: 'Unauthorized' };

    const [{ id: returnedId }] = await db
      .insert(cncJobTracker)
      .values({
        id: id ?? undefined,
        dateReceived: dateFormat(dateReceived),
        jobCardNo,
        jobDescription,
        jobType,
        startDate,
        endDate,
        timeSpent: timeTaken ? timeTaken.toString() : '0',
        createdBy: user.id,
      })
      .onConflictDoUpdate({
        target: cncJobTracker.id,
        set: {
          dateReceived: dateFormat(dateReceived),
          jobCardNo,
          jobDescription,
          jobType,
          startDate,
          endDate,
          timeSpent: timeTaken ? timeTaken.toString() : '0',
        },
      })
      .returning({ id: cncJobTracker.id });

    revalidateJobTrackingTag(returnedId.toString());

    return { error: false, message: 'Job tracker entry saved successfully' };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: isEdit
        ? 'Failed to update job tracker entry'
        : 'Failed to create job tracker entry',
    };
  }
};

export const deleteJobTrackerEntry = async (id: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: true, message: 'Unauthorized' };

    await db.delete(cncJobTracker).where(eq(cncJobTracker.id, id));
    revalidateJobTrackingTag(id);
    return { error: false, message: 'Entry deleted successfully' };
  } catch (error) {
    console.error(error);
    return { error: true, message: 'Failed to delete entry' };
  }
};
