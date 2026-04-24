import type { z } from 'zod';
import { validateFields } from '@/lib/action-validator';
import type { ActionResult } from '@/lib/actions/types';
import {
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/permissions/errors';

class ActionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionValidationError';
  }
}

export function parseOrFail<T>(schema: z.ZodSchema<T>, values: unknown): T {
  const { data, error } = validateFields<T>(values, schema);

  if (error !== null) {
    throw new ActionValidationError(error);
  }

  return data;
}

export function ensureId(id: string | null | undefined, label: string): string {
  if (!id) {
    throw new ActionValidationError(`${label} is required.`);
  }

  return id;
}

export async function runAction<T>(
  name: string,
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (
      error instanceof ActionValidationError ||
      error instanceof ForbiddenError ||
      error instanceof UnauthorizedError
    ) {
      return {
        error: true,
        message: error.message,
      };
    }

    console.error(`Error running action "${name}":`, error);
    return {
      error: true,
      message: 'Something went wrong. Please try again.',
    };
  }
}
