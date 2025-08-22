/** biome-ignore-all lint/suspicious/noExplicitAny: <none> */
import type { Path, UseFormReturn } from 'react-hook-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setFormErrors<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  errors: Record<string, string[]>
) {
  Object.entries(errors).forEach(([fieldName, messages]) => {
    if (messages && messages.length > 0) {
      form.setError(fieldName as Path<T>, {
        type: 'validation',
        message: messages[0], // Or messages.join(', ') to show all messages
      });
    }
  });
}
