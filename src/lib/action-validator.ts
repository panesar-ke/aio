import type z from 'zod';
import type {
  SchemaValidationFailure,
  SchemaValidationSuccess,
} from '@/types/index.types';

export const validateFields = <T>(
  values: unknown,
  schema: z.ZodSchema<T>
): SchemaValidationFailure | SchemaValidationSuccess<T> => {
  const { success, data, error } = schema.safeParse(values);
  if (!success) {
    console.log(error);
    return {
      data: null,
      error: 'Validation failed. Ensure all required fields are set',
    } satisfies SchemaValidationFailure;
  }

  return {
    error: null,
    data,
  } satisfies SchemaValidationSuccess<T>;
};
