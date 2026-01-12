import z from 'zod';
import {
  requiredNumberSchemaEntry,
  requiredStringSchemaEntry,
} from '@/lib/schema-rules';

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'User name is required'),
  contact: z
    .string()
    .min(1, 'Contact is required')
    .max(10, 'Contact cannot exceed 10 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  userType: z.enum(['ADMIN', 'STANDARD USER', 'SUPER ADMIN'], {
    required_error: 'User type is required',
    invalid_type_error: 'Invalid user type',
  }),
  active: z.boolean(),
});

export const userRightsFormSchema = z.object({
  userId: requiredStringSchemaEntry('User is required'),
  rights: z.array(
    z.object({
      formId: requiredNumberSchemaEntry('Form is required'),
      hasAccess: z.boolean(),
    })
  ),
});

export const cloneUserRightsFormSchema = z
  .object({
    cloningFrom: requiredStringSchemaEntry('Cloning from user is required'),
    cloningTo: requiredStringSchemaEntry('Cloning to user is required'),
  })
  .superRefine((data, ctx) => {
    if (data.cloningFrom === data.cloningTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cloning from and to users must be different',
        path: ['cloningTo'],
      });
    }
  });

  export const resetPasswordFormSchema = z
	.object({
		userId: z.string().min(1, { message: "User is required" }),
		resetMethod: z.enum(["automatic", "manual"], {
			message: "Reset method is required",
		}),
		password: z.string().nullish(),
	})
	.superRefine((data, ctx) => {
		if (data.resetMethod === "manual") {
			if (!data.password || data.password.length < 8) {
				ctx.addIssue({
					code: "custom",
					message: "Password must be at least 8 characters long",
					path: ["password"],
				});
			}
		}
	});